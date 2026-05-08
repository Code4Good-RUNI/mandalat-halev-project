import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export const initializeFirebaseAdmin = (configService: ConfigService) => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = {
    projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
    clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    privateKey: configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
  };

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};