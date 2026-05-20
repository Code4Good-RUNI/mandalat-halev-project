import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

// A service-account private key is a multi-line PEM. Stored in an env var it can
// arrive escaped (\n, \r\n) or wrapped in stray quotes/whitespace; any of these
// breaks OpenSSL with "DECODER routines::unsupported". Un-escape newlines, then
// extract just the PEM block so whatever surrounds it is discarded.
const normalizePrivateKey = (raw?: string): string | undefined => {
  if (!raw) return raw;
  const unescaped = raw
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '');
  const pem = unescaped.match(/-----BEGIN[^-]+-----[\s\S]+?-----END[^-]+-----/);
  return pem ? `${pem[0]}\n` : unescaped.trim();
};

export const initializeFirebaseAdmin = (configService: ConfigService) => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const privateKey = normalizePrivateKey(
    configService.get<string>('FIREBASE_PRIVATE_KEY'),
  );

  const serviceAccount = {
    projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
    clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    privateKey,
  };

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};
