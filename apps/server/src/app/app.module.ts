import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientAppModule } from './client-app/client-app.module';
import { SalesforceModule } from './salesforce/salesforce.module';
import { TsRestModule } from '@ts-rest/nest';

@Module({
  imports: [
    SalesforceModule,
    ClientAppModule,
    TsRestModule.register({
      validateRequestBody: true,   
      validateRequestQuery: true, 
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

