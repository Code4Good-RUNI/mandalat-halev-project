import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientAppModule } from './client-app/client-app.module';
import { SalesforceModule } from './salesforce/salesforce.module';
import { AuthModule } from './client-app/auth/auth.module';
import { TsRestModule } from '@ts-rest/nest';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SalesforceModule,
    ClientAppModule,
    AuthModule,
    TsRestModule.register({
      validateRequestBody: true,   
      validateRequestQuery: true, 
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

