import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { NotificationsService, NotificationCategory } from './notifications.service';
import { NotificationTemplates } from './notification-copy';
import { SalesforceCampaignService } from '../../salesforce/campaign/salesforce-campaign.service';
import { SalesforceUserService } from '../../salesforce/user/salesforce-user.service';
import { ActivityReminderNotificationRow, } from '@mandalat-halev-project/api-interfaces';
import { getFirestore } from 'firebase-admin/firestore';

const ENABLE_NOTIFICATION_CRON = true;

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sfCampaignService: SalesforceCampaignService,
    private readonly sfUserService: SalesforceUserService,
  ) {}

  @Cron('0 19 * * *', {
    name: 'daily-salesforce-notifications',
    timeZone: 'Asia/Jerusalem',
  })
  async handleDailyNotifications() {
    if (!ENABLE_NOTIFICATION_CRON) {
      this.logger.log(
        'Daily notification cron is disabled via development plain flag.',
      );
      return;
    }

    this.logger.log('Starting daily Salesforce notification cron job...');

    try {
      const lockAcquired = await this.acquireFirestoreLock();
      if (!lockAcquired) {
        this.logger.warn(
          'Could not acquire Firestore lock. Skipping execution.',
        );
        return;
      }
      const activeUserIds =
        await this.sfUserService.getAllActiveSalesforceUserIds();
      await this.pollNewCampaigns(activeUserIds);
      await this.pollActivityReminders(activeUserIds);
      await this.pollRegistrationStatusChanges(activeUserIds);

      await this.releaseFirestoreLock();
      this.logger.log('Cron completed successfully.');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Cron job failed: ${err.message}`, err.stack);

      await this.releaseFirestoreLock().catch((e) => {
        const releaseErr = e as Error;
        this.logger.error(
          `Failed to release lock on error path: ${releaseErr.message}`,
        );
      });
    }
  }

  private async processInChunks<T, R>(
    items: T[],
    chunkSize: number,
    processor: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(processor));
      results.push(...chunkResults);
    }
    return results;
  }

  private async pollNewCampaigns(activeUserIds: string[]) {
    this.logger.log('Polling Phase 1: Global campaign diffing...');

    const availableCampaigns =
      await this.sfCampaignService.getAllAvailableCampaigns();
    this.logger.log(
      `Phase 1: Retrieved ${availableCampaigns.length} total available campaigns from Salesforce.`,
    );
    const currentCampaignIds = availableCampaigns.map((c) => c.campaignId);

    const db = getFirestore('mandalat-halev-app-db');
    const globalStateRef = db.collection('cronState').doc('global-campaigns');

    const shouldSend = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(globalStateRef);
      const previousCampaignIds: string[] = doc.data()?.campaignIds ?? [];

      const newCampaigns = availableCampaigns.filter(
        (c) => !previousCampaignIds.includes(c.campaignId),
      );

      transaction.set(globalStateRef, {
        campaignIds: currentCampaignIds,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return newCampaigns.length;
    });

    if (shouldSend > 0) {
      this.logger.log(
        `Found ${shouldSend} new campaigns. Sending notifications...`,
      );
      const payload = { type: 'new_campaign', screen: 'activities' };
      const copy = NotificationTemplates.newCampaign;

      await this.notificationsService.sendToUsers(
        activeUserIds,
        { title: copy.title, body: copy.body, data: payload },
        NotificationCategory.ORG_MESSAGES,
      );
    }
  }

  private async pollActivityReminders(activeUserIds: string[]) {
    this.logger.log('Polling Phase 2: Activity reminders (Family context)...');

    const remindersArrays = await this.processInChunks(
      activeUserIds,
      50,
      (id) => this.sfCampaignService.getUpcomingActivityRemindersForFamily(id),
    );

    const allReminders = remindersArrays.flat();


    const batchedReminders = new Map<
      string,
      {
        campaignName: string;
        daysUntil: number;
        reminders: ActivityReminderNotificationRow[];
      }
    >();
    for (const reminder of allReminders) {
      const key = `${reminder.campaignName}_${reminder.daysUntil}`;
      if (!batchedReminders.has(key)) {
        batchedReminders.set(key, {
          campaignName: reminder.campaignName,
          daysUntil: reminder.daysUntil,
          reminders: [],
        });
      }
      batchedReminders.get(key)!.reminders.push(reminder);
    }

    this.logger.log(
      `Phase 2: Processed ${allReminders.length} total reminder records for ${batchedReminders.size} unique campaign groups.`,
    );

    for (const batch of batchedReminders.values()) {
      const familyUserIds = Array.from(
        new Set(batch.reminders.map((r) => r.salesforceUserId)),
      );
      const copy = NotificationTemplates.reminder(
        batch.campaignName,
        batch.daysUntil,
      );

      await this.notificationsService.sendToUsers(
        familyUserIds,
        {
          title: copy.title,
          body: copy.body,
          data: { type: 'reminder', screen: 'my-activities/future' },
        },
        NotificationCategory.ACTIVITY_REMINDERS,
      );
    }
  }

  private async pollRegistrationStatusChanges(activeUserIds: string[]) {
    this.logger.log(
      'Polling Phase 3: Registration status changes (Family context)...',
    );

    for (const userId of activeUserIds) {
      const currentStatuses =
        await this.sfCampaignService.getUpcomingRegistrationStatusesForFamily(
          userId,
        );

      if (currentStatuses.length > 0) {
        this.logger.debug(
          `Phase 3: Found ${currentStatuses.length} status records for user ${userId}.`,
        );
      }

      const db = getFirestore('mandalat-halev-app-db');
      const stateCollection = db.collection('registrationNotificationState');

      for (const row of currentStatuses) {
        const docKey = `${row.salesforceUserId}_${row.campaignId}`;
        const docRef = stateCollection.doc(docKey);

        const shouldNotify = await db.runTransaction(async (transaction) => {
          const doc = await transaction.get(docRef);
          let notify = false;

          if (!doc.exists) {
            notify = row.registrationStatus !== 'pending';
          } else {
            const prevState = doc.data();
            if (
              prevState?.lastKnownStatus !== row.registrationStatus &&
              row.registrationStatus !== 'pending'
            ) {
              notify = true;
            }
          }

          transaction.set(
            docRef,
            {
              lastKnownStatus: row.registrationStatus,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );

          return notify;
        });

        if (shouldNotify) {
          const familyMembers = await this.sfUserService.getFamilyMembers(
            row.salesforceUserId,
          );
          const familyUserIds = familyMembers.map((m) => m.salesforceUserId);

          const copy = NotificationTemplates.statusChange(
            row.campaignName,
            row.registrationStatus,
            row.contact.firstName,
          );
          await this.notificationsService.sendToUsers(
            familyUserIds,
            {
              title: copy.title,
              body: copy.body,
              data: { type: 'status_change', screen: 'my-activities/future' },
            },
            NotificationCategory.ACTIVITY_UPDATES,
          );
        }
      }
    }
  }

  private async acquireFirestoreLock(): Promise<boolean> {
    const db = getFirestore('mandalat-halev-app-db');
    const lockRef = db.collection('cronLocks').doc('daily-notifications');

    try {
      return await db.runTransaction(async (transaction) => {
        const lockDoc = await transaction.get(lockRef);
        const now = new Date();

        if (lockDoc.exists) {
          const expiresAt = lockDoc.data()?.expiresAt?.toDate();
          if (expiresAt && expiresAt > now) {
            this.logger.warn(
              `Lock is already active. Current lease expires at: ${expiresAt}`,
            );
            return false;
          }
        }

        const leaseTime = new Date(now.getTime() + 30 * 60 * 1000);
        transaction.set(
          lockRef,
          {
            expiresAt: admin.firestore.Timestamp.fromDate(leaseTime),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        this.logger.log('Distributed lease lock secured for 30 minutes.');
        return true;
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Exception thrown while acquiring lease: ${err.message}`,
      );
      return false;
    }
  }

  private async releaseFirestoreLock(): Promise<void> {
    const db = getFirestore('mandalat-halev-app-db');
    try {
      await db
        .collection('cronLocks')
        .doc('daily-notifications')
        .set(
          {
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(0)),
          },
          { merge: true },
        );
      this.logger.log('Distributed lease lock released.');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to release lease lock cleanly: ${err.message}`);
    }
  }
}