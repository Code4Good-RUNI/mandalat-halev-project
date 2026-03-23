import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CampaignsModule } from './campaigns/campaigns.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    CampaignsModule,
  ],
})
export class ClientAppModule {}