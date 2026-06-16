import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { PUSH_TOKEN_REPOSITORY } from './push-token.repository';
import { NotificationsService, NotificationCategory } from './notifications.service';
import { NotificationTemplates } from './notification-copy';
import { SalesforceCampaignService } from '../../salesforce/campaign/salesforce-campaign.service';
import { SalesforceUserService } from '../../salesforce/user/salesforce-user.service';

const ENABLE_NOTIFICATION_CRON = true;

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @Inject(PUSH_TOKEN_REPOSITORY)
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

      await this.pollAvailableCampaignsDiff(activeUserIds);
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

  private async pollAvailableCampaignsDiff(activeUserIds: string[]) {
    this.logger.log(
      'Polling Phase 1: Available campaigns diffing (by Family)...',
    );
    const db = admin.firestore();
    const stateCollection = db.collection('availableCampaignsState');

    // Set to store processed family IDs to avoid redundant processing for multiple parents
    const processedFamilies = new Set<string>();

    for (const userId of activeUserIds) {
      try {
        // Fetch all family members and generate a unique family key
        const familyMembers = await this.sfUserService.getFamilyMembers(userId);
        const familyUserIds = familyMembers
          .map((m) => m.salesforceUserId)
          .sort();
        const familyKey = familyUserIds.join('_'); // e.g., id1_id2_id3

        // Skip if this family was already processed in this cron run
        if (processedFamilies.has(familyKey)) {
          continue;
        }
        processedFamilies.add(familyKey);

        // Fetch available campaigns from Salesforce (once per family)
        const availableCampaigns =
          await this.sfCampaignService.getAvailableCampaignsForFamily(userId);
        const currentCampaignIds = availableCampaigns.map((c) => c.campaignId);

        // The Firebase document is managed by the family key
        const docRef = stateCollection.doc(familyKey);

        await db.runTransaction(async (transaction) => {
          const doc = await transaction.get(docRef);
          const prevState = doc.data();
          const previousCampaignIds: string[] = prevState?.campaignIds || [];

          // Filter out the truly new campaigns
          const newCampaigns = availableCampaigns.filter(
            (c) => !previousCampaignIds.includes(c.campaignId),
          );

          // Overwrite the family state with today's updated campaign IDs
          transaction.set(docRef, {
            campaignIds: currentCampaignIds,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // If there are new campaigns, send a notification
          if (newCampaigns.length > 0) {
            const payload = { type: 'new_campaign', screen: 'activities' };
            const copy = NotificationTemplates.newCampaign;

            // Determine which family members actually have the app installed
            const familyMembersWithApp = familyUserIds.filter((id) =>
              activeUserIds.includes(id),
            );

            if (familyMembersWithApp.length > 0) {
              // Send to all relevant family members at once
              await this.notificationsService.sendToUsers(
                familyMembersWithApp,
                { title: copy.title, body: copy.body, data: payload },
                NotificationCategory.ORG_MESSAGES,
              );
            }
          }
        });
      } catch (error) {
        this.logger.error(
          `Error polling available campaigns for family of user ${userId}`,
          error,
        );
      }
    }
  }

  private async pollActivityReminders(activeUserIds: string[]) {
    this.logger.log('Polling Phase 2: Activity reminders (by Family)...');

    // Set to store processed family IDs to avoid redundant processing
    const processedFamilies = new Set<string>();

    for (const userId of activeUserIds) {
      try {
        // Fetch family members and generate unique family key
        const familyMembers = await this.sfUserService.getFamilyMembers(userId);
        const familyUserIds = familyMembers
          .map((m) => m.salesforceUserId)
          .sort();
        const familyKey = familyUserIds.join('_');

        // Skip if this family was already processed in this cron run
        if (processedFamilies.has(familyKey)) {
          continue;
        }
        processedFamilies.add(familyKey);

        // Fetch upcoming reminders for the entire family from Salesforce
        const reminders =
          await this.sfCampaignService.getUpcomingActivityRemindersForFamily(
            userId,
          );
        if (reminders.length === 0) continue;

        // Determine which family members actually have the app installed
        const familyMembersWithApp = familyUserIds.filter((id) =>
          activeUserIds.includes(id),
        );
        if (familyMembersWithApp.length === 0) continue;

        // Send notifications for each reminder to all relevant family members
        for (const reminder of reminders) {
          const payload = { type: 'reminder', screen: 'my-activities/future' };
          const copy = NotificationTemplates.reminder(
            reminder.campaignName,
            reminder.daysUntil,
            reminder.contact.firstName,
          );

          await this.notificationsService.sendToUsers(
            familyMembersWithApp,
            { title: copy.title, body: copy.body, data: payload },
            NotificationCategory.ACTIVITY_REMINDERS,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error polling reminders for family of user ${userId}`,
          error,
        );
      }
    }
  }

  private async pollRegistrationStatusChanges(activeUserIds: string[]) {
    this.logger.log(
      'Polling Phase 3: Registration status changes (by Family)...',
    );
    const db = admin.firestore();
    const stateCollection = db.collection('registrationNotificationState');
    const now = new Date();

    // Set to store processed family IDs to avoid redundant processing
    const processedFamilies = new Set<string>();

    for (const userId of activeUserIds) {
      try {
        // Fetch family members and generate unique family key
        const familyMembers = await this.sfUserService.getFamilyMembers(userId);
        const familyUserIds = familyMembers
          .map((m) => m.salesforceUserId)
          .sort();
        const familyKey = familyUserIds.join('_');

        // Skip if this family was already processed in this cron run
        if (processedFamilies.has(familyKey)) {
          continue;
        }
        processedFamilies.add(familyKey);

        // Fetch current registration statuses for the entire family
        const currentStatuses =
          await this.sfCampaignService.getUpcomingRegistrationStatusesForFamily(
            userId,
          );
        if (currentStatuses.length === 0) continue;

        // Determine which family members actually have the app installed
        const familyMembersWithApp = familyUserIds.filter((id) =>
          activeUserIds.includes(id),
        );
        if (familyMembersWithApp.length === 0) continue;

        for (const row of currentStatuses) {
          // Unique document key per specific contact and campaign
          const docKey = `${row.contact.salesforceUserId}_${row.campaignId}`;
          const docRef = stateCollection.doc(docKey);

          await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            let shouldNotify = false;

            if (!doc.exists) {
              // Do not notify on initial state sync
              shouldNotify = false;
            } else {
              const prevState = doc.data();
              const updatedAt = prevState?.updatedAt?.toDate();
              const twoDaysAgo = new Date(
                now.getTime() - 2 * 24 * 60 * 60 * 1000,
              );

              // Notify if status changed, is not pending, and the record isn't completely stale
              if (
                prevState?.lastKnownStatus !== row.registrationStatus &&
                row.registrationStatus !== 'pending' &&
                (!updatedAt || updatedAt >= twoDaysAgo)
              ) {
                shouldNotify = true;
              }
            }

            // Save the current state to Firebase
            transaction.set(
              docRef,
              {
                lastKnownStatus: row.registrationStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );

            if (shouldNotify) {
              const payload = {
                type: 'status_change',
                screen: 'my-activities/future',
              };
              const copy = NotificationTemplates.statusChange(
                row.campaignName,
                row.registrationStatus,
                row.contact.firstName,
              );

              // Send to all relevant family members at once
              await this.notificationsService.sendToUsers(
                familyMembersWithApp,
                { title: copy.title, body: copy.body, data: payload },
                NotificationCategory.ACTIVITY_UPDATES,
              );
            }
          });
        }
      } catch (error) {
        this.logger.error(
          `Error polling status changes for family of user ${userId}`,
          error,
        );
      }
    }

    // Cleanup historical states that are older than 2 days
    await this.cleanupOldStatusStates(stateCollection, now);
  }

  private async acquireFirestoreLock(): Promise<boolean> {
    const db = admin.firestore();
    const lockRef = db.collection('cronLocks').doc('daily-notifications');

    try {
      // We don't need a transaction for the initial check if we use set with merge
      const lockDoc = await lockRef.get();
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
      await lockRef.set(
        {
          expiresAt: admin.firestore.Timestamp.fromDate(leaseTime),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      this.logger.log('Distributed lease lock secured for 30 minutes.');
      return true;
    } catch (error) {
      this.logger.error(
        `Exception thrown while acquiring lease: ${(error as Error).message}`,
      );
      return false;
    }
  }

  private async releaseFirestoreLock(): Promise<void> {
    const db = admin.firestore();
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

  private async cleanupOldStatusStates(
    collection: admin.firestore.CollectionReference,
    now: Date,
  ) {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const expiredDocs = await collection
      .where('updatedAt', '<', admin.firestore.Timestamp.fromDate(twoDaysAgo))
      .get();

    if (expiredDocs.empty) return;

    const batch = collection.firestore.batch();
    expiredDocs.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    this.logger.log(
      `Cleaned up ${expiredDocs.size} expired historical state tracking documents.`,
    );
  }
}