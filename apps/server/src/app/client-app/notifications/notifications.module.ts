import { Module } from '@nestjs/common';
import { PUSH_TOKEN_REPOSITORY } from './push-token.repository';
import { FirestorePushTokenRepository } from './push-token.repository.firestore';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController], 
  providers: [
    {
      provide: PUSH_TOKEN_REPOSITORY,
      useClass: FirestorePushTokenRepository, 
    },
    NotificationsService, 
  ],
  exports: [PUSH_TOKEN_REPOSITORY, NotificationsService],
})
export class NotificationsModule {}