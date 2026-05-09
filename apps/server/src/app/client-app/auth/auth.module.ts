import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { initializeFirebaseAdmin } from './firebase-admin.init';


@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAuthGuard, 
  ],
  exports: [
    AuthService,
    FirebaseAuthGuard,
  ],    
})
export class AuthModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    initializeFirebaseAdmin(this.configService);
    console.log('Firebase Admin initialized successfully');
  }
}