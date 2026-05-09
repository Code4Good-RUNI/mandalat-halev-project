import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CampaignsController],
})
export class CampaignsModule {}
