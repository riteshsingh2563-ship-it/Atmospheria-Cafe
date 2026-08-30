/* ---------------------------------------------------------------------------
   firebase.js — one place where the SDK is initialised.

   If VITE_FIREBASE_API_KEY is missing the module exports `isDemo = true` and the
   rest of the app transparently uses `localBackend.js` (a browser-storage
   stand-in that mirrors the same API surface). Nothing is sent anywhere.

   Emulators: run `npm run emulators` and set VITE_USE_EMULATORS=true.
--------------------------------------------------------------------------- */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isConfigured = Boolean(config.apiKey && config.projectId && config.appId);
export const isDemo = !isConfigured;
export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

export const firebaseConfig = config;

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isConfigured) {
  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  if (useEmulators) {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, { host: '127.0.0.1', port: 8080 });
      connectStorageEmulator(storage, '127.0.0.1', 9199, false);
    } catch (err) {
      // Already connected (HMR) — safe to ignore.
      console.debug('[firebase] emulator already connected', err?.message);
    }
  }
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '%c[Atmospheria] DEMO MODE%c\nNo VITE_FIREBASE_API_KEY found — running on the local stand-in.\n' +
      'Copy .env.example to .env and fill in your Firebase project to go live.',
    'background:#c4622d;color:#faf5ec;padding:2px 6px;border-radius:3px;font-weight:600',
    'color:#6f4a2f',
  );
}

export { app, auth, db, storage };
