import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// getReactNativePersistence ships in the RN build but is missing from the web
// type defs Metro/TS resolve here (firebase-js-sdk#7615).
// @ts-expect-error -- present at runtime in the React Native bundle
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// On native, back Firebase Auth with AsyncStorage so the session (refresh token)
// survives app restarts and Firebase can keep issuing fresh ID tokens; without
// it auth defaults to memory and the user is logged out ~1h after a cold start.
// On web the default getAuth persistence (IndexedDB) is used, and the web build
// has no getReactNativePersistence. initializeAuth throws if called twice (Fast
// Refresh), so fall back to getAuth.
function initAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = initAuth();
