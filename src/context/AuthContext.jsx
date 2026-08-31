import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { onAdminChange, signIn as doSignIn, signOut as doSignOut, friendlyAuthError, isDemo } from '../lib/authApi.js';
import { local } from '../lib/localBackend.js';

const AuthCtx = createContext({ user: null, loading: true, signIn: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }) {
  // Demo mode keeps the session in localStorage, so restore it before the first
  // paint — otherwise an admin refreshing the portal sees a loading flash.
  const [user, setUser] = useState(() => (isDemo ? local.session() : null));
  // In demo mode the session is read synchronously, so there is never anything
  // to wait for; in live mode we wait for Firebase's first auth callback.
  const [loading, setLoading] = useState(() => !isDemo);

  useEffect(() => {
    const unsub = onAdminChange((session) => {
      setUser(session);
      setLoading(false);
    });
    return () => unsub?.();
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const session = await doSignIn(email, password);
      setUser(session);
      return session;
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  }, []);

  const signOut = useCallback(async () => {
    await doSignOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
