import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PUSH_TOKEN_REPOSITORY } from './push-token.repository';
import type { IPushTokenRepository } from './push-token.repository';
import { NotificationsService, NotificationCategory } from './notifications.service';
import { NotificationTemplates } from './notification-copy';
import { SalesforceCampaignService } from '../../salesforce/campaign/salesforce-campaign.service';
import { SalesforceUserService } from '../../salesforce/user/salesforce-user.service';


@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(PUSH_TOKEN_REPOSITORY) private readonly tokenRepo: IPushTokenRepository,
    private readonly notificationsService: NotificationsService,
    private readonly sfCampaignService: SalesforceCampaignService,
    private readonly sfUserService: SalesforceUserService,
  ) {}

  @Cron('0 19 * * *', {
    name: 'daily-salesforce-notifications',
    timeZone: 'Asia/Jerusalem',
  })
  async handleDailyNotifications() {
    const isCronEnabled = this.configService.get<boolean>('ENABLE_NOTIFICATION_CRON', false);
    
    if (!isCronEnabled) {
      this.logger.log('Daily notification cron is disabled via ENABLE_NOTIFICATION_CRON.');
      return;
    }

    this.logger.log('Starting daily Salesforce notification cron job...');

    try {
      const lockAcquired = await this.acquireFirestoreLock();
      if (!lockAcquired) {
        this.logger.warn('Could not acquire Firestore lock. Skipping execution.');
        return;
      }

      await this.pollNewCampaigns();
      await this.pollActivityReminders();
      await this.pollRegistrationStatusChanges();

      await this.releaseFirestoreLock();
      this.logger.log('Cron completed successfully.');

    } catch (error) {
      const err = error as Error; 
      this.logger.error(`Cron job failed: ${err.message}`, err.stack);
      
      await this.releaseFirestoreLock().catch((e) => {
        const releaseErr = e as Error;
        this.logger.error(`Failed to release lock on error path: ${releaseErr.message}`);
      });
    }
  }

  private async pollNewCampaigns() {
    this.logger.log('Polling Phase 1: New campaigns today...');
    const newCampaigns = await this.sfCampaignService.getNewCampaignsToday();
    
    if (newCampaigns.length === 0) {
      this.logger.log('No new campaigns found today.');
      return;
    }

    const activeUserIds = await this.getAllActiveSalesforceUserIds();
    
    for (const userId of activeUserIds) {
      const familyMembers = await this.sfUserService.getFamilyMembers(userId);
      const familyUserIds = familyMembers.map(m => m.salesforceUserId);
      
      const payload = {
        type: 'new_campaign',
        screen: 'activities',
      };
      
      const copy = NotificationTemplates.newCampaign;
      await this.broadcastToHousehold(familyUserIds, copy.title, copy.body, payload, NotificationCategory.ORG_MESSAGES);
    }
  }

  private async pollActivityReminders() {
    this.logger.log('Polling Phase 2: Activity reminders...');
    const reminders = await this.sfCampaignService.getUpcomingActivityReminders();

    for (const reminder of reminders) {
      const familyMembers = await this.sfUserService.getFamilyMembers(reminder.contactId);
      const familyUserIds = familyMembers.map(m => m.salesforceUserId);

      const payload = {
        type: 'reminder',
        screen: 'my-activities/future',
      };

      const copy = NotificationTemplates.reminder(reminder.campaignName, reminder.daysUntil);
      await this.broadcastToHousehold(familyUserIds, copy.title, copy.body, payload, NotificationCategory.ACTIVITY_REMINDERS);
    }
  }

  private async pollRegistrationStatusChanges() {
    this.logger.log('Polling Phase 3: Registration status changes...');
    const currentStatuses = await this.sfCampaignService.getUpcomingRegistrationStatuses();
    const db = admin.firestore();
    const stateCollection = db.collection('registrationNotificationState');
    const now = new Date();

    for (const row of currentStatuses) {
      const docKey = `${row.salesforceUserId}_${row.campaignId}`;
      const docRef = stateCollection.doc(docKey);

      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        let shouldNotify = false;

        if (!doc.exists) {
          if (row.registrationStatus !== 'pending') {
            shouldNotify = false; 
          }
        } else {
          const prevState = doc.data();
          const updatedAt = prevState?.updatedAt?.toDate();
          const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

          if (
            prevState?.lastKnownStatus !== row.registrationStatus &&
            row.registrationStatus !== 'pending' &&
            (!updatedAt || updatedAt >= twoDaysAgo)
          ) {
            shouldNotify = true;
          }
        }

        transaction.set(docRef, {
          lastKnownStatus: row.registrationStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        if (shouldNotify) {
          const familyMembers = await this.sfUserService.getFamilyMembers(row.salesforceUserId);
          const familyUserIds = familyMembers.map(m => m.salesforceUserId);
          const payload = {
            type: 'status_change',
            screen: 'my-activities/future',
          };
          const copy = NotificationTemplates.statusChange(row.campaignName, row.registrationStatus);
          
          await this.broadcastToHousehold(familyUserIds, copy.title, copy.body, payload, NotificationCategory.ACTIVITY_UPDATES);
        }
      });
    }

    await this.cleanupOldStatusStates(stateCollection, now);
  }

  /**
   * Reuses your existing NotificationsService to send messages.
   * This guarantees preference validation, deduplication, chunking, and invalid token deletion.
   */
  private async broadcastToHousehold(
    userIds: string[], 
    title: string, 
    body: string, 
    payload: Record<string, string>, 
    category: NotificationCategory
  ) {
    // Deduplicate user IDs within the household run
    const uniqueUserIds = Array.from(new Set(userIds));
    
    for (const userId of uniqueUserIds) {
      // Calls your existing robust method from notifications.service.ts
      await this.notificationsService.sendToUser(userId, { title, body, data: payload }, category);
    }
  }

  private async acquireFirestoreLock(): Promise<boolean> {
    const db = admin.firestore();
    const lockRef = db.collection('cronLocks').doc('daily-notifications');
    
    try {
      return await db.runTransaction(async (transaction) => {
        const lockDoc = await transaction.get(lockRef);
        const now = new Date();

        if (lockDoc.exists) {
          const expiresAt = lockDoc.data()?.expiresAt?.toDate();
          if (expiresAt && expiresAt > now) {
            this.logger.warn(`Lock is already active. Current lease expires at: ${expiresAt}`);
            return false;
          }
        }

        const leaseTime = new Date(now.getTime() + 30 * 60 * 1000);
        transaction.set(lockRef, {
          expiresAt: admin.firestore.Timestamp.fromDate(leaseTime),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        this.logger.log('Distributed lease lock secured for 30 minutes.');
        return true;
      });
    } catch (error) {
      const err = error as Error; 
      this.logger.error(`Exception thrown while acquiring lease: ${err.message}`);
      return false;
}
  }

  private async releaseFirestoreLock(): Promise<void> {
    const db = admin.firestore();
    try {
      await db.collection('cronLocks').doc('daily-notifications').set({
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(0)),
      }, { merge: true });
      this.logger.log('Distributed lease lock released.');
   } catch (error) {
    const err = error as Error; 
    this.logger.error(`Failed to release lease lock cleanly: ${err.message}`);
  }
  }

  private async cleanupOldStatusStates(collection: admin.firestore.CollectionReference, now: Date) {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const expiredDocs = await collection.where('updatedAt', '<', admin.firestore.Timestamp.fromDate(twoDaysAgo)).get();
    
    if (expiredDocs.empty) return;
    
    const batch = collection.firestore.batch();
    expiredDocs.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    this.logger.log(`Cleaned up ${expiredDocs.size} expired historical state tracking documents.`);
  }

  private async getAllActiveSalesforceUserIds(): Promise<string[]> {
    return [];
  }
}