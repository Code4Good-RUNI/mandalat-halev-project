import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SalesforceService } from './salesforce.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [SalesforceService],
  exports: [SalesforceService],
})
export class SalesforceModule {}
