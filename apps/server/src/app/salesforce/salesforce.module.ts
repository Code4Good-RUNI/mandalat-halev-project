import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SalesforceCoreService } from './salesforce-core.service';
import { SalesforceUserService } from './salesforce-user.service';
import { SalesforceCampaignService } from './salesforce-campaign.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    SalesforceCoreService,
    SalesforceUserService,
    SalesforceCampaignService,
  ],
  exports: [SalesforceUserService, SalesforceCampaignService],
})
export class SalesforceModule {}
