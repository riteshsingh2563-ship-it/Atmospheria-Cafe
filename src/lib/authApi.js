/* ---------------------------------------------------------------------------
   authApi.js — Firebase Auth (email/password) for the admin portal.

   A Firebase user is not automatically an admin: the security rules also
   require a document at `admin_users/<uid>` with `disabled: false`. This module
   checks that too so the UI can explain *why* a login was refused.

   Demo mode uses localBackend's tiny credential store instead.
--------------------------------------------------------------------------- */
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db as fsdb, isDemo } from './firebase.js';
import { local, DEMO_ADMIN } from './localBackend.js';

export { isDemo, DEMO_ADMIN };

/** The admin_users/<uid> record, or null if this Firebase user is not an admin. */
export async function fetchAdminProfile(uid) {
  if (!uid) return null;
  if (isDemo) {
    const list = local.admins();
    return list.find((a) => a.uid === uid) ?? null;
  }
  const snap = await getDoc(doc(fsdb, 'admin_users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function signIn(email, password) {
  if (isDemo) {
    const session = local.signIn(email, password);
    return { uid: session.uid, email: session.email, name: session.name, role: session.role };
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await fetchAdminProfile(cred.user.uid);
  if (!profile || profile.disabled) {
    await fbSignOut(auth);
    const err = new Error('This account is not listed in admin_users.');
    err.code = 'not-admin';
    throw err;
  }
  return { uid: cred.user.uid, email: cred.user.email, name: profile.name || cred.user.email, role: profile.role || 'staff' };
}

export async function signOut() {
  if (isDemo) return local.signOut();
  return fbSignOut(auth);
}

/** Fires immediately with the current session, then on every change. */
export function onAdminChange(cb) {
  if (isDemo) {
    const session = local.session();
    queueMicrotask(() => cb(session ? { ...session } : null));
    return () => {};
  }
  return onAuthStateChanged(
    auth,
    async (user) => {
      if (!user) return cb(null);
      const profile = await fetchAdminProfile(user.uid);
      cb({ uid: user.uid, email: user.email, name: profile?.name || user.email, role: profile?.role || 'staff', disabled: Boolean(profile?.disabled) });
    },
    () => cb(null),
  );
}

export async function updateAdminName(name) {
  if (isDemo) return true;
  return updateProfile(auth.currentUser, { displayName: name });
}

export const friendlyAuthError = (err) => {
  const map = {
    'auth/invalid-email': 'That email address does not look right.',
    'auth/user-not-found': 'No admin account with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-disabled': 'This admin account has been disabled.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/network-request-failed': 'Network problem — check the connection and retry.',
    'not-admin': err?.message || 'This account is not an admin.',
  };
  return map[err?.code] || err?.message || 'Could not sign in.';
};
