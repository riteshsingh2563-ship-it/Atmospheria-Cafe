import { useCallback, useEffect, useState } from 'react';
import { subscribeBooking, cancelBookingByGuest, getBooking } from '../lib/api.js';

/* ---------------------------------------------------------------------------
   useMyBookings — "your bookings" for a guest who has no account.

   Firestore rules let an anonymous visitor read a booking only by its exact
   document id (that id is the secret). So after each successful booking we keep
   the id in localStorage and keep a live listener on it — when the floor
   manager confirms it in the admin portal, this screen flips to "Confirmed"
   on its own.
--------------------------------------------------------------------------- */

const KEY = 'atmospheria.myBookings.v1';

function readIds() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function rememberBooking(id) {
  try {
    const ids = readIds().filter((x) => x !== id);
    localStorage.setItem(KEY, JSON.stringify([id, ...ids]));
  } catch {
    /* private mode — the confirmation screen still works */
  }
}

export function forgetBooking(id) {
  try {
    localStorage.setItem(KEY, JSON.stringify(readIds().filter((x) => x !== id)));
  } catch {
    /* ignore */
  }
}

export function useMyBookings() {
  const [ids, setIds] = useState(readIds);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(ids.length > 0);

  useEffect(() => {
    if (!ids.length) {
      setBookings([]);
      setLoading(false);
      return undefined;
    }
    let alive = true;
    const unsubs = ids.map((id) =>
      subscribeBooking(id, (doc) => {
        if (!alive) return;
        setBookings((prev) => {
          const rest = prev.filter((b) => b.id !== id);
          return doc ? [doc, ...rest] : rest;
        });
        setLoading(false);
      }),
    );
    return () => {
      alive = false;
      unsubs.forEach((u) => u?.());
    };
  }, [ids.join(',')]);

  const refresh = useCallback(async () => {
    const next = readIds();
    // Drop ids that no longer resolve (deleted in the admin portal).
    const resolved = await Promise.all(next.map((id) => getBooking(id)));
    const keep = next.filter((_, i) => resolved[i]);
    if (keep.length !== next.length) {
      try {
        localStorage.setItem(KEY, JSON.stringify(keep));
      } catch {
        /* ignore */
      }
      setIds(keep);
    }
    setLoading(false);
  }, []);

  const cancel = useCallback(async (id) => {
    await cancelBookingByGuest(id);
  }, []);

  return { bookings, loading, refresh, cancel };
}
