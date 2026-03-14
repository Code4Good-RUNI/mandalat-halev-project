import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesforceModule } from './salesforce/salesforce.module';

@Module({
  imports: [SalesforceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
