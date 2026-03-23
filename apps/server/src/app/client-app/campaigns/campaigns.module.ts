import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';

@Module({
  controllers: [CampaignsController],
})
export class CampaignsModule {}
