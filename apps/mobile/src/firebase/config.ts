import { Platform } from 'react-native';
// Type-only: erased at build (isolatedModules), so @react-native-firebase/auth
// is never bundled for web. The runtime instance is loaded per-platform below.
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Your web app's Firebase configuration. Only used by the web (dev) branch
// below; native reads google-services.json via @react-native-firebase/app.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: 'AIzaSyAjMYuzz_-NXgFyP2XslePuyaRga25dYAs',
  authDomain: 'mandalat-halev-app.firebaseapp.com',
  projectId: 'mandalat-halev-app',
  storageBucket: 'mandalat-halev-app.firebasestorage.app',
  messagingSenderId: '742059784204',
  appId: '1:742059784204:web:52219444a2f9e5fead9629',
  measurementId: 'G-QBCBFW0JG3',
};

// Native (iOS/Android) uses @react-native-firebase/auth, which auto-initializes
// the default app from google-services.json, persists the session natively, and
// verifies phone numbers via Play Integrity (no reCAPTCHA modal).
//
// Web (dev only) keeps the Firebase JS SDK. The require() is lazy and only
// reached when Platform.OS === 'web', so the native module is never executed in
// the web bundle. Both the web Auth instance and the RNFB module expose the
// compatible currentUser.getIdToken(forceRefresh) surface used by api/session.ts.
function initAuth(): FirebaseAuthTypes.Module {
  if (Platform.OS === 'web') {
    const { initializeApp, getApps, getApp } = require('firebase/app');
    const { getAuth } = require('firebase/auth');
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return getAuth(app) as FirebaseAuthTypes.Module;
  }
  return require('@react-native-firebase/auth').default();
}

export const auth = initAuth();
