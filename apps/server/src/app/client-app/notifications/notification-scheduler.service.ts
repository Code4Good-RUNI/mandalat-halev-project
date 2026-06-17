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

import { getFirestore } from 'firebase-admin/firestore';

const ENABLE_NOTIFICATION_CRON = true;

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
    if (!ENABLE_NOTIFICATION_CRON) {
      this.logger.log('Daily notification cron is disabled via development plain flag.');
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

    const activeUserIds = await this.sfUserService.getAllActiveSalesforceUserIds();
    
    // Batch Fetching: Gather all family members for all active users concurrently
    const familyPromises = activeUserIds.map(userId => this.sfUserService.getFamilyMembers(userId));
    const familiesArrays = await Promise.all(familyPromises);
    
    const allUniqueTargetIds = new Set<string>();
    familiesArrays.flat().forEach(m => allUniqueTargetIds.add(m.salesforceUserId));

    if (allUniqueTargetIds.size > 0) {
      const payload = { type: 'new_campaign', screen: 'activities' };
      const copy = NotificationTemplates.newCampaign;
      
      // Send one massive batch to Firebase
      await this.notificationsService.sendToUsers(
        Array.from(allUniqueTargetIds), 
        { title: copy.title, body: copy.body, data: payload }, 
        NotificationCategory.ORG_MESSAGES
      );
    }
  }

  private async pollActivityReminders() {
    this.logger.log('Polling Phase 2: Activity reminders...');
    const reminders = await this.sfCampaignService.getUpcomingActivityReminders();

    // Group reminders by identical message (campaignName + daysUntil) to batch send
    const batchedReminders = new Map<string, { campaignName: string, daysUntil: number, contactIds: string[] }>();

    for (const reminder of reminders) {
      const key = `${reminder.campaignName}_${reminder.daysUntil}`;
      if (!batchedReminders.has(key)) {
        batchedReminders.set(key, { campaignName: reminder.campaignName, daysUntil: reminder.daysUntil, contactIds: [] });
      }
      batchedReminders.get(key)!.contactIds.push(reminder.contactId);
    }

    // Process each unique reminder batch
    for (const batch of batchedReminders.values()) {
      const familyPromises = batch.contactIds.map(id => this.sfUserService.getFamilyMembers(id));
      const familiesArrays = await Promise.all(familyPromises);

      const allUniqueTargetIds = new Set<string>();
      familiesArrays.flat().forEach(m => allUniqueTargetIds.add(m.salesforceUserId));

      if (allUniqueTargetIds.size > 0) {
        const payload = { type: 'reminder', screen: 'my-activities/future' };
        const copy = NotificationTemplates.reminder(batch.campaignName, batch.daysUntil);
        
        await this.notificationsService.sendToUsers(
          Array.from(allUniqueTargetIds), 
          { title: copy.title, body: copy.body, data: payload }, 
          NotificationCategory.ACTIVITY_REMINDERS
        );
      }
    }
  }

  private async pollRegistrationStatusChanges() {
    this.logger.log('Polling Phase 3: Registration status changes...');
    const currentStatuses = await this.sfCampaignService.getUpcomingRegistrationStatuses();
    const db = getFirestore('mandalat-halev-app-db');
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
          
          const payload = { type: 'status_change', screen: 'my-activities/future' };
          const copy = NotificationTemplates.statusChange(row.campaignName, row.registrationStatus);
          
          await this.notificationsService.sendToUsers(
            familyUserIds, 
            { title: copy.title, body: copy.body, data: payload }, 
            NotificationCategory.ACTIVITY_UPDATES
          );
        }
      });
    }

    await this.cleanupOldStatusStates(stateCollection, now);
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
    const db = getFirestore('mandalat-halev-app-db');
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
}