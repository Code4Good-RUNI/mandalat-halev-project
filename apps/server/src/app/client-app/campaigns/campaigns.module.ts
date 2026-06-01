import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { SalesforceModule } from '../../salesforce/salesforce.module';

@Module({
  imports: [SalesforceModule],
  controllers: [CampaignsController],
})
export class CampaignsModule {}
