import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientAppModule } from './client-app/client-app.module';

@Module({
  imports: [ClientAppModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
