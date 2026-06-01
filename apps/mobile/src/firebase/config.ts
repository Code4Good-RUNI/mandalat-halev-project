import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

// getAuth uses in-memory persistence on React Native (logs a one-time warning).
// That is fine for the SMS verification flow, which only needs a one-shot ID
// token; AsyncStorage-backed persistence can be added later if sessions need it.
export const auth = getAuth(app);
