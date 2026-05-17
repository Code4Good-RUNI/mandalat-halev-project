import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SalesforceCoreService } from './core/salesforce-core.service';
import { SalesforceUserService } from './user/salesforce-user.service';
import { SalesforceCampaignService } from './campaign/salesforce-campaign.service';

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
