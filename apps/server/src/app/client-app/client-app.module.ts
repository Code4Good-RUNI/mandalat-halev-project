import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    CampaignsModule,
    NotificationsModule,
  ],
})
export class ClientAppModule {}