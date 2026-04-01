import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientAppModule } from './client-app/client-app.module';
import { TsRestModule } from '@ts-rest/nest';

@Module({
  imports: [
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
