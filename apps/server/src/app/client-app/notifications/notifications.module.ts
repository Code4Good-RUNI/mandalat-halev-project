import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SalesforceModule } from '../../salesforce/salesforce.module'; 
import { PUSH_TOKEN_REPOSITORY } from './push-token.repository';
import { FirestorePushTokenRepository } from './push-token.repository.firestore';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationCronController } from './notification-cron.controller'; 
import { NotificationSchedulerService } from './notification-scheduler.service';

@Module({
  imports: [
    ConfigModule,
    SalesforceModule,
  ],
  controllers: [
    NotificationsController, 
    NotificationCronController
  ], 
  providers: [
    {
      provide: PUSH_TOKEN_REPOSITORY,
      useClass: FirestorePushTokenRepository, 
    },
    NotificationsService, 
    NotificationSchedulerService,
  ],
  exports: [PUSH_TOKEN_REPOSITORY, NotificationsService],
})
export class NotificationsModule {}