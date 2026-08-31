/* ---------------------------------------------------------------------------
   localBackend.js — a browser-storage stand-in for Firestore / Auth / Storage.

   Used only when no Firebase project is configured (DEMO MODE). It mirrors the
   handful of operations the app actually performs so every screen — public and
   admin — behaves identically:

       get(id) · list(query) · add(doc) · update(id, patch) · remove(id)
       subscribe(collection, cb)   → live updates across tabs

   Swapping to real Firestore is a config change, not a code change: fill in
   .env and `api.js` routes every call to the SDK instead.
--------------------------------------------------------------------------- */
import { MENU_ITEMS, GALLERY_PHOTOS, REVIEWS } from '../data/seed.js';
import { todayISO } from './venue.js';

const DB_KEY = 'atmospheria.db.v1';
const SESSION_KEY = 'atmospheria.admin.session.v1';
const ADMINS_KEY = 'atmospheria.admin.users.v1';

export const DEMO_ADMIN = {
  email: 'admin@atmospheria.in',
  password: 'Atmospheria@2026',
  name: 'Floor Manager',
  role: 'owner',
};

/* ------------------------------------------------------------------ storage */

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('[localBackend] could not persist', key, err);
    return false;
  }
}

const nowISO = () => new Date().toISOString();

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

function minutesAgo(n) {
  return new Date(Date.now() - n * 60000).toISOString();
}

/* ------------------------------------------------------------------ seeding */

function demoBookings() {
  const base = [
    { name: 'Ananya Shrivastava', phone: '+91 98930 11223', partySize: 2, pod: "couple's-nook", date: daysFromToday(0), slot: '8:00 PM', status: 'confirmed', specialRequests: 'Anniversary — please arrange a candle and a dessert message.' },
    { name: 'Rohit Deshmukh', phone: '+91 99931 45678', partySize: 6, pod: 'family-dining', date: daysFromToday(0), slot: '8:30 PM', status: 'pending', specialRequests: 'One guest is Jain — no onion or garlic for one plate.' },
    { name: 'Sneha Agrawal', phone: '+91 98260 77889', partySize: 24, pod: 'family-dining', date: daysFromToday(0), slot: '7:00 PM', status: 'confirmed', specialRequests: 'Kitty party. Set menu B, unlimited mocktails, cake at 8:15.' },
    { name: 'Faisal Khan', phone: '+91 93030 12345', partySize: 4, pod: 'deck-seating', date: daysFromToday(0), slot: '9:30 PM', status: 'pending', specialRequests: '' },
    { name: 'Meera Nair', phone: '+91 88710 55667', partySize: 2, pod: 'cafe-corner', date: daysFromToday(1), slot: '5:30 PM', status: 'pending', specialRequests: 'Quiet corner if possible, working on a laptop.' },
    { name: 'Vikram Singh Deo', phone: '+91 70000 98765', partySize: 8, pod: 'deck-seating', date: daysFromToday(1), slot: '8:00 PM', status: 'confirmed', specialRequests: 'Birthday — cake from outside, please allow.' },
    { name: 'Pooja Tiwari', phone: '+91 91099 33221', partySize: 30, pod: 'family-dining', date: daysFromToday(3), slot: '12:30 PM', status: 'pending', specialRequests: 'Monthly kitty, need projector for 15 minutes.' },
    { name: 'Karan Malhotra', phone: '+91 90980 44556', partySize: 4, pod: 'deck-seating', date: daysFromToday(-2), slot: '9:00 PM', status: 'completed', specialRequests: '' },
    { name: 'Ritika Sahu', phone: '+91 76970 22110', partySize: 2, pod: "couple's-nook", date: daysFromToday(-1), slot: '8:30 PM', status: 'no_show', specialRequests: '' },
  ];

  return base.map((b, i) => ({
    id: `demo-booking-${i + 1}`,
    ref: `ATM-${String(1000 + i * 37).padStart(4, '0')}`,
    type: 'table',
    ...b,
    source: 'website',
    ownerUid: null,
    createdAt: minutesAgo((base.length - i) * 137 + 40),
    updatedAt: minutesAgo((base.length - i) * 61),
    history: [{ status: b.status === 'pending' ? 'pending' : 'confirmed', at: minutesAgo((base.length - i) * 130), by: b.status === 'pending' ? 'guest' : 'Floor Manager' }],
  }));
}

function demoOrders() {
  const item = (id, qty, opts = {}) => ({ id, qty, ...opts });
  const base = [
    {
      orderType: 'dine-in',
      tableNo: '14',
      status: 'preparing',
      items: [
        item('paneer-tikka-lasooni', 1, { lineName: 'Paneer Tikka Lasooni', linePrice: 340 }),
        item('dal-atmospheria', 1, { lineName: 'Dal Atmospheria', linePrice: 320, spice: 'Mild' }),
        item('butter-chicken', 1, { lineName: 'Butter Chicken', linePrice: 440 }),
        item('laccha-paratha', 4, { lineName: 'Laccha Paratha', linePrice: 70 }),
      ],
      notes: 'Table 14, no onion in the dal please.',
      createdAt: minutesAgo(14),
    },
    {
      orderType: 'takeaway',
      tableNo: '',
      status: 'received',
      items: [
        item('schezwan-chicken-rice', 2, { lineName: 'Schezwan Chicken Fried Rice', linePrice: 300, spice: 'Raipuri hot' }),
        item('honey-chilli-potato', 1, { lineName: 'Honey Chilli Potato', linePrice: 220 }),
        item('virgin-mojito', 2, { lineName: 'Virgin Mojito', linePrice: 150 }),
      ],
      notes: 'Packing for 20 minutes from now.',
      createdAt: minutesAgo(4),
    },
    {
      orderType: 'dine-in',
      tableNo: '07',
      status: 'ready',
      items: [
        item('margherita-pizza', 1, { lineName: 'Margherita', linePrice: 320 }),
        item('penne-arrabbiata', 1, { lineName: 'Penne Arrabbiata', linePrice: 340 }),
        item('cold-coffee', 2, { lineName: 'Cold Coffee', linePrice: 160 }),
      ],
      notes: '',
      createdAt: minutesAgo(28),
    },
    {
      orderType: 'dine-in',
      tableNo: '21',
      status: 'served',
      items: [
        item('grilled-peri-peri-chicken', 1, { lineName: 'Grilled Peri-Peri Chicken', linePrice: 480 }),
        item('hakka-noodles-veg', 1, { lineName: 'Veg Hakka Noodles', linePrice: 240 }),
        item('sizzling-brownie', 1, { lineName: 'Sizzling Brownie', linePrice: 260 }),
      ],
      notes: '',
      paid: true,
      createdAt: minutesAgo(96),
    },
    {
      orderType: 'takeaway',
      tableNo: '',
      status: 'served',
      items: [
        item('butter-chicken', 1, { lineName: 'Butter Chicken', linePrice: 440, portion: 'Half' }),
        item('tandoori-roti', 6, { lineName: 'Tandoori Roti', linePrice: 40 }),
      ],
      notes: '',
      paid: true,
      createdAt: new Date(`${daysFromToday(-1)}T20:15:00`).toISOString(),
    },
  ];

  return base.map((o, i) => {
    const subtotal = o.items.reduce((s, it) => s + it.linePrice * it.qty, 0);
    const tax = Math.round(subtotal * 0.05);
    const packaging = o.orderType === 'takeaway' ? 20 : 0;
    return {
      id: `demo-order-${i + 1}`,
      ref: `A${String(2400 + i * 13)}`,
      guestName: ['Table 14', 'Takeaway — Faisal', 'Table 07', 'Table 21', 'Takeaway — Ritika'][i],
      phone: '+91 90000 00000',
      ...o,
      paid: o.paid ?? false,
      subtotal,
      tax,
      packaging,
      total: subtotal + tax + packaging,
      orderDate: o.createdAt.slice(0, 10),
      ownerUid: null,
      updatedAt: minutesAgo(i * 3),
      statusHistory: [{ status: 'received', at: o.createdAt }],
    };
  });
}

function seed() {
  return {
    _seededAt: nowISO(),
    _version: 1,
    menu_items: MENU_ITEMS.map((m) => ({ ...m, createdAt: nowISO(), updatedAt: nowISO() })),
    gallery: GALLERY_PHOTOS.map((g) => ({ ...g, createdAt: nowISO() })),
    reviews: REVIEWS.map((r) => ({ ...r, createdAt: r.date })),
    bookings: demoBookings(),
    orders: demoOrders(),
    site_settings: [{ id: 'public', notice: '', hoursOverride: null }],
  };
}

function loadDb() {
  const existing = read(DB_KEY, null);
  if (existing && existing._version === 1) return existing;
  const fresh = seed();
  write(DB_KEY, fresh);
  return fresh;
}

let state = null;
const listeners = new Map(); // collection -> Set<cb>

function db() {
  if (!state) state = loadDb();
  return state;
}

function persist() {
  write(DB_KEY, state);
  // Notify other tabs.
  try {
    localStorage.setItem(`${DB_KEY}.ping`, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function notify(name) {
  const set = listeners.get(name);
  if (!set) return;
  const rows = [...(state?.[name] || [])];
  set.forEach((cb) => {
    try {
      cb(rows);
    } catch (err) {
      console.error('[localBackend] listener failed', err);
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY || e.key === `${DB_KEY}.ping`) {
      state = loadDb();
      listeners.forEach((_, name) => notify(name));
    }
  });
}

/* ------------------------------------------------------------------- CRUD */

export const local = {
  isDemo: true,

  list(name) {
    return [...(db()[name] || [])];
  },

  get(name, id) {
    return (db()[name] || []).find((r) => r.id === id) || null;
  },

  add(name, doc) {
    const row = { ...doc, id: doc.id || `${name.slice(0, 3)}-${Math.random().toString(36).slice(2, 10)}` };
    state = db();
    state[name] = [row, ...(state[name] || [])];
    persist();
    notify(name);
    return row;
  },

  update(name, id, patch) {
    state = db();
    const rows = state[name] || [];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch, id };
    persist();
    notify(name);
    return rows[idx];
  },

  remove(name, id) {
    state = db();
    state[name] = (state[name] || []).filter((r) => r.id !== id);
    persist();
    notify(name);
    return true;
  },

  /** Reorders a whole collection by the given id order. */
  reorder(name, orderedIds) {
    state = db();
    const rows = state[name] || [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    state[name] = orderedIds.map((id, i) => ({ ...byId.get(id), sortOrder: (i + 1) * 10 })).filter(Boolean);
    persist();
    notify(name);
    return state[name];
  },

  subscribe(name, cb) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(cb);
    // Emit synchronously, like Firestore's onSnapshot does on attach.
    queueMicrotask(() => cb([...(db()[name] || [])]));
    return () => listeners.get(name)?.delete(cb);
  },

  reset() {
    state = seed();
    persist();
    listeners.forEach((_, name) => notify(name));
  },

  exportJson() {
    return JSON.stringify(db(), null, 2);
  },

  /* ------------------------------------------------------------------ auth */

  admins() {
    const list = read(ADMINS_KEY, null);
    if (list) return list;
    write(ADMINS_KEY, [{ email: DEMO_ADMIN.email, password: DEMO_ADMIN.password, name: DEMO_ADMIN.name, role: 'owner', uid: 'demo-admin-uid', disabled: false }]);
    return read(ADMINS_KEY, []);
  },

  session() {
    return read(SESSION_KEY, null);
  },

  signIn(email, password) {
    const found = this.admins().find((a) => a.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!found) {
      const err = new Error('auth/user-not-found');
      err.code = 'auth/user-not-found';
      throw err;
    }
    if (found.password !== password) {
      const err = new Error('auth/wrong-password');
      err.code = 'auth/wrong-password';
      throw err;
    }
    if (found.disabled) {
      const err = new Error('auth/user-disabled');
      err.code = 'auth/user-disabled';
      throw err;
    }
    const session = { uid: found.uid, email: found.email, name: found.name, role: found.role, signedInAt: nowISO() };
    write(SESSION_KEY, session);
    return session;
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },
};
