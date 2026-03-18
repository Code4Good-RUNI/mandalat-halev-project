import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SalesforceService } from './salesforce.service';

@Module({
  imports: [HttpModule],
  providers: [SalesforceService],
  exports: [SalesforceService],
})
export class SalesforceModule {}
