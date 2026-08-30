/* ---------------------------------------------------------------------------
   api.js — the only module the UI talks to for data.

   Every function works in both modes:
     • live  → Cloud Firestore (see firestore.rules for what the client may do)
     • demo  → localBackend.js

   Collections: menu_items · gallery · reviews · bookings · orders · site_settings
--------------------------------------------------------------------------- */
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query as fsQuery,
  orderBy,
  limit,
} from 'firebase/firestore';

import { auth, db as fsdb, isDemo } from './firebase.js';
import { local } from './localBackend.js';
import { MENU_ITEMS, GALLERY_PHOTOS, REVIEWS } from '../data/seed.js';
import { TAX_RATE, PACKAGING_FEE } from './venue.js';

export { isDemo };

/* ------------------------------------------------------------- utilities */

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

/** ATM-7Q3K9 — the reference a guest is shown and can read out over the phone. */
export function humanRef(prefix = 'ATM') {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = new Uint8Array(5);
  (globalThis.crypto?.getRandomValues?.(bytes) ?? bytes).forEach((_, i) => {
    out += alphabet[Math.floor(Math.random() * alphabet.length)] ?? alphabet[i % alphabet.length];
  });
  return `${prefix}-${out}`;
}

const ts = (v) => (typeof v?.toDate === 'function' ? v.toDate().toISOString() : v ?? null);

/** Firestore doc → plain object with ISO timestamps. */
function ser(d) {
  const data = d.data() ?? {};
  return {
    id: d.id,
    ...data,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

const stampNow = () => (isDemo ? new Date().toISOString() : serverTimestamp());
const ownerUid = () => auth?.currentUser?.uid ?? null;

/* ----------------------------------------------------------- live queries */

async function liveList(name, { max = 500 } = {}) {
  const snap = await getDocs(fsQuery(collection(fsdb, name), limit(max)));
  return snap.docs.map(ser);
}

function liveSubscribe(name, cb, { max = 500 } = {}) {
  return onSnapshot(
    fsQuery(collection(fsdb, name), limit(max)),
    (snap) => cb(snap.docs.map(ser)),
    (err) => {
      console.error(`[api] ${name} subscription failed`, err);
      cb([], err);
    },
  );
}

const sortDesc = (rows, key = 'createdAt') =>
  [...rows].sort((a, b) => String(b[key] ?? '').localeCompare(String(a[key] ?? '')));

const sortAsc = (rows, key = 'sortOrder') =>
  [...rows].sort((a, b) => (a[key] ?? 9e9) - (b[key] ?? 9e9));

/* ------------------------------------------------- synchronous first paint
   In demo mode the stand-in already has the data in memory, so hand it to the
   first render instead of waiting for the subscription's first emission.
   In live mode these return [] and the snapshot listener fills them in.      */

export const initialMenu = () => (isDemo ? sortAsc(local.list('menu_items')) : []);
export const initialGallery = () => (isDemo ? sortAsc(local.list('gallery')) : []);
export const initialReviews = () => (isDemo ? sortDesc(local.list('reviews')) : []);
export const initialBookings = () => (isDemo ? sortDesc(local.list('bookings')) : []);
export const initialOrders = () => (isDemo ? sortDesc(local.list('orders')) : []);

/* =======================================================================
   MENU
   ======================================================================= */

export function subscribeMenu(cb) {
  if (isDemo) {
    return local.subscribe('menu_items', (rows) => cb(sortAsc(rows)));
  }
  return liveSubscribe('menu_items', (rows) => cb(sortAsc(rows)));
}

export async function listMenu() {
  const rows = isDemo ? local.list('menu_items') : await liveList('menu_items');
  return sortAsc(rows);
}

export async function saveMenuItem(item) {
  const payload = {
    ...item,
    price: Number(item.price) || 0,
    veg: Boolean(item.veg),
    available: item.available !== false,
    updatedAt: stampNow(),
  };
  if (isDemo) {
    return item.id ? local.update('menu_items', item.id, payload) : local.add('menu_items', payload);
  }
  if (item.id) {
    await updateDoc(doc(fsdb, 'menu_items', item.id), payload);
    return { ...item, ...payload };
  }
  const ref = await addDoc(collection(fsdb, 'menu_items'), { ...payload, createdAt: stampNow() });
  return { ...payload, id: ref.id };
}

export async function deleteMenuItem(id) {
  if (isDemo) return local.remove('menu_items', id);
  return deleteDoc(doc(fsdb, 'menu_items', id));
}

export async function setItemAvailability(id, available) {
  return saveMenuItem({ id, available });
}

/* =======================================================================
   GALLERY
   ======================================================================= */

export function subscribeGallery(cb) {
  if (isDemo) return local.subscribe('gallery', (rows) => cb(sortAsc(rows)));
  return liveSubscribe('gallery', (rows) => cb(sortAsc(rows)));
}

export async function addGalleryPhoto(photo) {
  const payload = { ...photo, createdAt: stampNow(), updatedAt: stampNow() };
  if (isDemo) return local.add('gallery', payload);
  const ref = await addDoc(collection(fsdb, 'gallery'), payload);
  return { ...payload, id: ref.id };
}

export async function updateGalleryPhoto(id, patch) {
  const payload = { ...patch, updatedAt: stampNow() };
  if (isDemo) return local.update('gallery', id, payload);
  await updateDoc(doc(fsdb, 'gallery', id), payload);
  return { id, ...patch };
}

export async function deleteGalleryPhoto(id) {
  if (isDemo) return local.remove('gallery', id);
  return deleteDoc(doc(fsdb, 'gallery', id));
}

export async function reorderGallery(orderedIds) {
  const payload = orderedIds.map((id, i) => ({ id, sortOrder: (i + 1) * 10 }));
  if (isDemo) return local.reorder('gallery', orderedIds);
  await Promise.all(payload.map(({ id, sortOrder }) => updateDoc(doc(fsdb, 'gallery', id), { sortOrder })));
  return payload;
}

/* =======================================================================
   REVIEWS
   ======================================================================= */

export function subscribeReviews(cb) {
  if (isDemo) {
    return local.subscribe('reviews', (rows) => cb(sortDesc(rows)));
  }
  // Public read is restricted to approved reviews (see firestore.rules).
  return liveSubscribe('reviews', (rows) => cb(sortDesc(rows.filter((r) => r.approved))));
}

export async function submitReview(review) {
  const payload = {
    ...review,
    rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
    approved: false, // admin publishes it — enforced by the security rules
    createdAt: stampNow(),
  };
  if (isDemo) return local.add('reviews', { ...payload, id: `rev-${uid().slice(0, 8)}` });
  const ref = await addDoc(collection(fsdb, 'reviews'), payload);
  return { ...payload, id: ref.id };
}

export async function setReviewApproved(id, approved) {
  if (isDemo) return local.update('reviews', id, { approved });
  return updateDoc(doc(fsdb, 'reviews', id), { approved });
}

/* =======================================================================
   BOOKINGS
   ======================================================================= */

export function createBooking({ name, phone, date, slot, partySize, pod, specialRequests, type = 'table', eventType, eventDate, guestName }) {
  const id = `b_${uid()}`;
  const booking = {
    id,
    ref: humanRef('ATM'),
    name: guestName || name,
    phone,
    date,
    slot,
    partySize: Number(partySize) || 2,
    pod: pod || '',
    type, // 'table' | 'event'
    eventType: eventType || null,
    eventDate: eventDate || null,
    specialRequests: specialRequests || '',
    status: 'pending',
    source: 'website',
    ownerUid: ownerUid(),
    createdAt: stampNow(),
    updatedAt: stampNow(),
    history: [{ status: 'pending', at: new Date().toISOString(), by: 'guest' }],
  };
  if (isDemo) {
    local.add('bookings', booking);
    return Promise.resolve(booking);
  }
  return setDoc(doc(fsdb, 'bookings', id), booking).then(() => booking);
}

export async function getBooking(id) {
  if (isDemo) return local.get('bookings', id);
  const snap = await getDoc(doc(fsdb, 'bookings', id));
  return snap.exists() ? ser(snap) : null;
}

export function subscribeBookings(cb) {
  if (isDemo) return local.subscribe('bookings', (rows) => cb(sortDesc(rows)));
  return liveSubscribe('bookings', (rows) => cb(sortDesc(rows)));
}

/**
 * Live status for a single booking — this is how "pending → confirmed" reaches
 * the guest without an account. Allowed by the rules because the document id is
 * the guest's unguessable reference.
 */
export function subscribeBooking(id, cb) {
  if (!id) return () => {};
  if (isDemo) {
    const push = (rows) => cb(rows.find((r) => r.id === id) ?? null);
    push(local.list('bookings'));
    return local.subscribe('bookings', push);
  }
  return onSnapshot(
    doc(fsdb, 'bookings', id),
    (snap) => cb(snap.exists() ? ser(snap) : null),
    (err) => {
      console.error('[api] booking subscription failed', err);
      cb(null, err);
    },
  );
}

export async function updateBooking(id, patch, actor = 'Floor Manager') {
  const payload = { ...patch, updatedAt: stampNow() };
  if (patch.status) {
    payload.history = [
      ...((isDemo ? local.get('bookings', id)?.history : null) ?? []),
      { status: patch.status, at: new Date().toISOString(), by: actor },
    ];
  }
  if (isDemo) return local.update('bookings', id, payload);
  await updateDoc(doc(fsdb, 'bookings', id), payload);
  return { id, ...patch };
}

export function updateBookingStatus(id, status, meta = {}) {
  return updateBooking(id, { status, ...meta });
}

/** Guest-initiated cancellation — the only write a non-admin may make. */
export async function cancelBookingByGuest(id) {
  if (isDemo) return local.update('bookings', id, { status: 'cancelled', updatedAt: new Date().toISOString() });
  return updateDoc(doc(fsdb, 'bookings', id), {
    status: 'cancelled',
    updatedAt: stampNow(),
    cancelledAt: stampNow(),
  });
}

export function rescheduleBooking(id, { date, slot }) {
  return updateBooking(id, { date, slot });
}

export async function deleteBooking(id) {
  if (isDemo) return local.remove('bookings', id);
  return deleteDoc(doc(fsdb, 'bookings', id));
}

/* =======================================================================
   ORDERS
   ======================================================================= */

export function priceCart(lines, orderType) {
  const subtotal = lines.reduce((sum, l) => sum + l.linePrice * l.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const packaging = orderType === 'takeaway' ? PACKAGING_FEE : 0;
  return { subtotal, tax, packaging, total: subtotal + tax + packaging };
}

export function createOrder({ guestName, phone, orderType, tableNo, items, notes }) {
  const id = `o_${uid()}`;
  const priced = priceCart(items, orderType);
  const order = {
    id,
    ref: humanRef('A'),
    guestName,
    phone,
    orderType,
    tableNo: orderType === 'dine-in' ? tableNo || '' : '',
    items,
    notes: notes || '',
    ...priced,
    status: 'received',
    paid: false,
    orderDate: new Date().toISOString().slice(0, 10),
    ownerUid: ownerUid(),
    createdAt: stampNow(),
    updatedAt: stampNow(),
    statusHistory: [{ status: 'received', at: new Date().toISOString() }],
  };
  if (isDemo) {
    local.add('orders', order);
    return Promise.resolve(order);
  }
  return setDoc(doc(fsdb, 'orders', id), order).then(() => order);
}

export async function getOrder(id) {
  if (isDemo) return local.get('orders', id);
  const snap = await getDoc(doc(fsdb, 'orders', id));
  return snap.exists() ? ser(snap) : null;
}

export function subscribeOrders(cb) {
  if (isDemo) return local.subscribe('orders', (rows) => cb(sortDesc(rows)));
  return liveSubscribe('orders', (rows) => cb(sortDesc(rows)));
}

/** Live status for a single order — powers the guest-facing tracker. */
export function subscribeOrder(id, cb) {
  if (isDemo) {
    const push = (rows) => cb(rows.find((r) => r.id === id) ?? null);
    push(local.list('orders'));
    return local.subscribe('orders', push);
  }
  return onSnapshot(
    doc(fsdb, 'orders', id),
    (snap) => cb(snap.exists() ? ser(snap) : null),
    (err) => {
      console.error('[api] order subscription failed', err);
      cb(null, err);
    },
  );
}

const ORDER_FLOW = ['received', 'preparing', 'ready', 'served'];

export async function updateOrderStatus(id, status) {
  const at = new Date().toISOString();
  let history = [{ status, at }];
  if (isDemo) {
    const current = local.get('orders', id);
    history = [...(current?.statusHistory ?? []), { status, at }];
  }
  const payload = { status, updatedAt: stampNow(), statusHistory: history };
  if (isDemo) return local.update('orders', id, payload);
  const snap = await getDoc(doc(fsdb, 'orders', id));
  payload.statusHistory = [...(snap.data()?.statusHistory ?? []), { status, at }];
  return updateDoc(doc(fsdb, 'orders', id), payload);
}

export async function advanceOrder(order) {
  const i = ORDER_FLOW.indexOf(order.status);
  const next = ORDER_FLOW[Math.min(i + 1, ORDER_FLOW.length - 1)];
  return updateOrderStatus(order.id, next);
}

export async function setOrderPaid(id, paid = true) {
  const payload = { paid, paidAt: paid ? stampNow() : null, updatedAt: stampNow() };
  if (isDemo) return local.update('orders', id, payload);
  return updateDoc(doc(fsdb, 'orders', id), payload);
}

export async function deleteOrder(id) {
  if (isDemo) return local.remove('orders', id);
  return deleteDoc(doc(fsdb, 'orders', id));
}

/* =======================================================================
   SETTINGS + SEEDING
   ======================================================================= */

export async function getSiteSettings() {
  if (isDemo) return local.get('site_settings', 'public') ?? { notice: '' };
  const snap = await getDoc(doc(fsdb, 'site_settings', 'public'));
  return snap.exists() ? snap.data() : { notice: '' };
}

export async function saveSiteSettings(patch) {
  if (isDemo) return local.update('site_settings', 'public', patch);
  return setDoc(doc(fsdb, 'site_settings', 'public'), patch, { merge: true });
}

/**
 * Populates an empty Firestore project with the shipped menu, gallery and
 * review content. Triggered from Admin → Dashboard ("Load starter content")
 * and by `npm run seed`. Safe to re-run: documents are written by id.
 */
export async function seedStarterContent() {
  const results = { menu: 0, gallery: 0, reviews: 0 };

  if (isDemo) {
    local.reset();
    return { menu: local.list('menu_items').length, gallery: local.list('gallery').length, reviews: local.list('reviews').length, demo: true };
  }

  const batchWrite = async (name, rows) => {
    for (const row of rows) {
      const { id, ...rest } = row;
      await setDoc(doc(fsdb, name, id), { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      results[name === 'menu_items' ? 'menu' : name === 'gallery' ? 'gallery' : 'reviews'] += 1;
    }
  };

  await batchWrite('menu_items', MENU_ITEMS);
  await batchWrite('gallery', GALLERY_PHOTOS);
  await batchWrite('reviews', REVIEWS);
  return results;
}

export const __testing = { uid, humanRef, priceCart, ser };
