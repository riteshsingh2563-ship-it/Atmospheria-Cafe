#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   seed-firestore.mjs — one-time bootstrap for a fresh Firebase project.

     1. Writes the starter menu_items / gallery / reviews documents
     2. Creates the first admin in Firebase Auth
     3. Writes admin_users/<uid> — the document firestore.rules checks

   Setup
     npm i -D firebase-admin
     # Firebase Console → Project settings → Service accounts → Generate key
     export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/serviceAccount.json
     export SEED_ADMIN_EMAIL=owner@atmospheria.in
     export SEED_ADMIN_PASSWORD='a-long-unique-password'
     npm run seed

   Service-account keys are git-ignored. Never commit them.
--------------------------------------------------------------------------- */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

async function loadSeedData() {
  // The seed module imports vite's `import.meta.env`, which Node cannot resolve,
  // so read the file and strip the two lines that use it.
  const src = readFileSync(resolve(root, 'src/data/seed.js'), 'utf8')
    .replace(/import\.meta\.env\.[A-Z_]+/g, 'undefined')
    .replace(/^import .*$/gm, '');
  const venueSrc = readFileSync(resolve(root, 'src/lib/venue.js'), 'utf8')
    .replace(/import\.meta\.env\.[A-Z_]+/g, 'undefined')
    .replace(/^export /gm, '');
  const mod = await import(`data:text/javascript,${encodeURIComponent(`${venueSrc}\n${src}\nexport { MENU_ITEMS, GALLERY_PHOTOS, REVIEWS };`)}`);
  return mod;
}

async function main() {
  let admin;
  try {
    admin = (await import('firebase-admin/app')).default ?? (await import('firebase-admin/app'));
  } catch {
    console.error('\n  firebase-admin is not installed.\n  Run:  npm i -D firebase-admin\n');
    process.exit(1);
  }

  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const { getAuth } = await import('firebase-admin/auth');

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath && existsSync(keyPath)) {
    if (!getApps().length) initializeApp({ credential: cert(keyPath) });
  } else if (!getApps().length) {
    // Falls back to the emulator / application-default credentials.
    initializeApp({ projectId: process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID });
  }

  const db = getFirestore();
  const auth = getAuth();
  const { MENU_ITEMS, GALLERY_PHOTOS, REVIEWS } = await loadSeedData();
  const now = FieldValue.serverTimestamp();

  const write = async (collection, rows) => {
    const batchChunks = [];
    for (let i = 0; i < rows.length; i += 400) batchChunks.push(rows.slice(i, i + 400));
    let count = 0;
    for (const chunk of batchChunks) {
      const batch = db.batch();
      for (const row of chunk) {
        const { id, ...rest } = row;
        batch.set(db.collection(collection).doc(id), { ...rest, createdAt: now, updatedAt: now }, { merge: true });
        count += 1;
      }
      await batch.commit();
    }
    console.log(`  ✓ ${collection.padEnd(12)} ${count} documents`);
  };

  console.log('\nSeeding Atmospheria Firestore…\n');
  await write('menu_items', MENU_ITEMS);
  await write('gallery', GALLERY_PHOTOS);
  await write('reviews', REVIEWS);

  /* ------------------------------------------------------------- admin */
  const email = process.env.SEED_ADMIN_EMAIL || process.env.VITE_SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD || process.env.VITE_SEED_ADMIN_PASSWORD;

  if (email && password) {
    let user;
    try {
      user = await auth.createUser({ email, password, displayName: 'Owner', emailVerified: true });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') user = await auth.getUserByEmail(email);
      else throw err;
    }
    await db.collection('admin_users').doc(user.uid).set(
      { email, name: 'Owner', role: 'owner', disabled: false, createdAt: now },
      { merge: true },
    );
    console.log(`  ✓ admin_users  ${email} (${user.uid})`);
  } else {
    console.log('  · skipped admin creation — set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD');
  }

  await db.collection('site_settings').doc('public').set({ notice: '', updatedAt: now }, { merge: true });
  console.log('\nDone. Sign in at /admin/login.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nSeeding failed:', err?.message || err);
  process.exit(1);
});
