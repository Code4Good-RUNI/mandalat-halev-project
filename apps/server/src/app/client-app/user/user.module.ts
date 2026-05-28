import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { SalesforceModule } from '../../salesforce/salesforce.module';

@Module({
  imports: [SalesforceModule],
  controllers: [UserController],
})
export class UserModule {}
