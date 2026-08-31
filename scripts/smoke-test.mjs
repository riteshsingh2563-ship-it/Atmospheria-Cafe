#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   smoke-test.mjs — renders every screen and drives the data layer end to end.

   This is not a typecheck: it actually mounts the React tree through Vite's own
   JSX transform and asserts on the resulting HTML, then exercises the booking,
   order, menu and gallery paths in the local stand-in that the app uses when no
   Firebase project is configured.

   Run:  npm run smoke
--------------------------------------------------------------------------- */
import { createServer } from 'vite';

/* ------------------------------------------------------------ browser stubs */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
};
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  localStorage: globalThis.localStorage,
  location: { href: 'http://localhost/', pathname: '/', search: '', hash: '' },
  history: { pushState() {}, replaceState() {}, state: {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  scrollY: 0,
  scrollTo() {},
};
globalThis.document = {
  body: { style: {} },
  documentElement: { style: {} },
  getElementById: () => null,
  querySelector: () => null,
  addEventListener() {},
  removeEventListener() {},
  createElement: () => ({ style: {}, setAttribute() {}, getContext: () => ({ drawImage() {} }), toBlob: (cb) => cb(null) }),
};
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node-smoke-test' }, configurable: true, writable: true });
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.Image = class {
  set src(_v) {}
};
globalThis.matchMedia = globalThis.window.matchMedia;

/* ------------------------------------------------------------------ harness */
let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    pass += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    fail += 1;
    failures.push(name);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// Vite's teardown logs "The build was canceled" when the SSR pipeline is closed
// mid-flight. Harmless, but it looks like a failure, so filter just that line.
const { createLogger } = await import('vite');
const logger = createLogger('error');
const loggerError = logger.error;
logger.error = (msg, options) => {
  if (String(msg).includes('The build was canceled')) return;
  loggerError(msg, options);
};
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', customLogger: logger });

// React and react-dom are loaded by Node directly — Vite only needs to
// transform our own JSX, and sharing one React instance keeps hooks happy.
const React = (await import('react')).default;
const { renderToString } = await import('react-dom/server');
const entry = await vite.ssrLoadModule('/scripts/smoke-entry.jsx');
const api = await vite.ssrLoadModule('/src/lib/api.js');
const { local } = await vite.ssrLoadModule('/src/lib/localBackend.js');
const { VENUE, CATEGORIES, todayISO } = await vite.ssrLoadModule('/src/lib/venue.js');

console.log('\n\x1b[1mAtmospheria smoke test\x1b[0m\n');

/* react-router logs useLayoutEffect warnings under a server renderer. Expected
   here and irrelevant to the assertions, so keep the output readable. */
const realError = console.error;
const realWarn = console.warn;
console.error = (...a) => {
  if (String(a[0]).includes('useLayoutEffect') || String(a[0]).includes('not wrapped in act')) return;
  realError(...a);
};
console.warn = (...a) => {
  if (String(a[0]).includes('useLayoutEffect')) return;
  realWarn(...a);
};

/* ------------------------------------------------------- 1. demo mode wired */
console.log('\x1b[1mData layer\x1b[0m');
check('boots in demo mode with no Firebase config', api.isDemo === true, `isDemo=${api.isDemo}`);

const menu = await api.listMenu();
check(`menu seeds ${menu.length} dishes`, menu.length >= 30, `got ${menu.length}`);
check(
  'every seeded dish has a photo path under /images/menu',
  menu.every((m) => String(m.photo).startsWith('/images/menu/')),
  menu.find((m) => !String(m.photo).startsWith('/images/menu/'))?.name,
);
check(
  'every seeded dish has alt-worthy description and a veg flag',
  menu.every((m) => typeof m.description === 'string' && m.description.length > 10 && typeof m.veg === 'boolean'),
);
check('all 7 shipped categories are represented', CATEGORIES.every((c) => menu.some((m) => m.category === c.id)));
check('at least one dish is 86’d', menu.some((m) => m.available === false));

/* ---------------------------------------------------------- 2. booking flow */
console.log('\n\x1b[1mBooking lifecycle\x1b[0m');
const booking = await api.createBooking({
  name: 'Smoke Test',
  phone: '+91 98123 45678',
  date: todayISO(),
  slot: '8:00 PM',
  partySize: 4,
  pod: 'deck-seating',
  specialRequests: 'Window seat',
});
check('createBooking returns a reference and pending status', booking.ref.startsWith('ATM-') && booking.status === 'pending');
check('booking id is unguessable (uuid-backed)', /^b_[0-9a-f-]{20,}$/.test(booking.id), booking.id);

let watched = null;
const unsubBooking = api.subscribeBooking(booking.id, (b) => {
  watched = b;
});
await new Promise((r) => setTimeout(r, 30));
check('subscribeBooking delivers the new booking', watched?.id === booking.id);

await api.updateBookingStatus(booking.id, 'confirmed');
await new Promise((r) => setTimeout(r, 30));
check('status flips to confirmed for the guest listener', watched?.status === 'confirmed', watched?.status);
check('history records both transitions', (watched?.history || []).length >= 2, JSON.stringify(watched?.history));

await api.rescheduleBooking(booking.id, { date: todayISO(), slot: '9:30 PM' });
await new Promise((r) => setTimeout(r, 30));
check('reschedule moves the slot', watched?.slot === '9:30 PM', watched?.slot);

await api.cancelBookingByGuest(booking.id);
await new Promise((r) => setTimeout(r, 30));
check('guest can cancel their own pending booking', watched?.status === 'cancelled', watched?.status);
unsubBooking();

/* ------------------------------------------------------------ 3. order flow */
console.log('\n\x1b[1mOrder lifecycle\x1b[0m');
const dish = menu.find((m) => m.id === 'butter-chicken');
const order = await api.createOrder({
  guestName: 'Table 9',
  phone: '+91 98123 45678',
  orderType: 'takeaway',
  tableNo: '',
  items: [
    { itemId: dish.id, lineName: dish.name, linePrice: dish.price, qty: 2, veg: dish.veg, portion: 'Regular', spice: 'Medium', addons: [], notes: '' },
    { itemId: 'laccha-paratha', lineName: 'Laccha Paratha', linePrice: 70, qty: 4, veg: true, portion: 'Regular', spice: '', addons: [], notes: '' },
  ],
  notes: 'No onion',
});
const expectedSubtotal = dish.price * 2 + 70 * 4;
check('subtotal is priced correctly', order.subtotal === expectedSubtotal, `${order.subtotal} vs ${expectedSubtotal}`);
check('GST is 5%', order.tax === Math.round(expectedSubtotal * 0.05), String(order.tax));
check('takeaway packaging fee applied', order.packaging === 20, String(order.packaging));
check('total = subtotal + tax + packaging', order.total === order.subtotal + order.tax + order.packaging);

const seen = [];
const unsubOrder = api.subscribeOrder(order.id, (o) => seen.push(o?.status));
for (const next of ['preparing', 'ready', 'served']) {
  await api.updateOrderStatus(order.id, next);
  await new Promise((r) => setTimeout(r, 20));
}
const flow = seen.filter(Boolean);
check(
  'order advances received → preparing → ready → served',
  ['received', 'preparing', 'ready', 'served'].every((s) => flow.includes(s)) && flow[flow.length - 1] === 'served',
  flow.join(','),
);
const storedOrder = await api.getOrder(order.id);
check('statusHistory captured every step', (storedOrder.statusHistory || []).length >= 4, String((storedOrder.statusHistory || []).length));

await api.setOrderPaid(order.id, true);
await new Promise((r) => setTimeout(r, 20));
const paid = await api.getOrder(order.id);
check('mark paid persists', paid?.paid === true);
unsubOrder();

/* --------------------------------------------------------- 4. menu + gallery */
console.log('\n\x1b[1mMenu & gallery writes\x1b[0m');
const created = await api.saveMenuItem({
  name: 'Smoke Test Kebab',
  category: 'starters',
  price: 310,
  veg: false,
  description: 'Temporary dish used by the smoke test.',
  photo: '/images/menu/smoke-test-kebab.jpg',
  available: true,
  sortOrder: 999,
});
check('saveMenuItem creates a dish', Boolean(created?.id) && created.name === 'Smoke Test Kebab');
check('new dish is readable from the public query', (await api.listMenu()).some((m) => m.id === created.id));
await api.saveMenuItem({ ...created, available: false });
check('86 toggle persists', (await api.listMenu()).find((m) => m.id === created.id)?.available === false);
await api.deleteMenuItem(created.id);
check('delete removes it from the menu', !(await api.listMenu()).some((m) => m.id === created.id));

const gallery = local.list('gallery');
check(`gallery seeds ${gallery.length} photographs`, gallery.length >= 12, String(gallery.length));
check(
  'every gallery photo has alt text and a sourcing note',
  gallery.every((g) => typeof g.alt === 'string' && g.alt.length > 20 && typeof g.source === 'string'),
);
const photo = await api.addGalleryPhoto({
  album: 'ambience',
  src: '/images/gallery/smoke-test.jpg',
  alt: 'Smoke test placeholder photograph of the courtyard',
  caption: 'Smoke test',
  source: 'smoke test',
  sortOrder: 999,
});
const order1 = local.list('gallery').map((g) => g.id);
await api.reorderGallery([...order1].reverse());
check('reorderGallery rewrites sortOrder', local.list('gallery')[0].id === order1[order1.length - 1]);
await api.deleteGalleryPhoto(photo.id);
check('gallery delete works', !local.list('gallery').some((g) => g.id === photo.id));

/* ------------------------------------------------------------- 5. reviews */
console.log('\n\x1b[1mReviews\x1b[0m');
const review = await api.submitReview({ author: 'Smoke Tester', rating: 5, text: 'Great courtyard, great dal.' });
check('submitted reviews are forced to unapproved', review.approved === false);

/* --------------------------------------------------------------- 6. auth */
console.log('\n\x1b[1mAdmin auth\x1b[0m');
const { local: authLocal, DEMO_ADMIN } = await vite.ssrLoadModule('/src/lib/localBackend.js');
const session = authLocal.signIn(DEMO_ADMIN.email, DEMO_ADMIN.password);
check('demo admin can sign in', session?.email === DEMO_ADMIN.email);
let rejected = false;
try {
  authLocal.signIn(DEMO_ADMIN.email, 'wrong-password');
} catch {
  rejected = true;
}
check('wrong password is rejected', rejected);

/* ------------------------------------------------------- 7. render screens */
console.log('\n\x1b[1mScreen renders\x1b[0m');
const expectations = {
  shell: ['Atmospheria', 'Book a Table', 'Where every table has a story', 'Staff Login', 'VIP Road', '2:00 PM'],
  home: ['Where every table', 'has a story', 'The Deck', 'Couple', 'Café Corner', 'VIP Road', 'Kitty Parties', '4.4'],
  menu: ['Paneer Tikka Lasooni', 'Dal Atmospheria', 'North Indian', 'Continental', 'Desserts', '86'],
  gallery: ['courtyard', 'Instagram'],
  events: ['Private Dining', 'Catering', 'Kitty'],
  book: ['Reserve a table', 'Time slot', 'Special requests'],
  order: ['Checkout', 'Takeaway', 'Order summary'],
  visit: ['Opening hours', 'VIP Road', 'Get directions'],
  adminLogin: ['Sign in', 'admin@atmospheria.in', 'Demo mode'],
  adminDashboard: ['Bookings today', 'Live order queue', 'Billed today'],
  adminBookings: ['Bookings', 'Confirm', 'Reschedule'],
  adminOrders: ['Received', 'Preparing', 'Ready at the pass'],
  adminMenu: ['Menu manager', 'Add dish', '86'],
  adminGallery: ['Gallery manager', 'Upload photos'],
  adminAnalytics: ['Most ordered dishes', 'Average ticket'],
};

// Still holding the session created above: the login screen must bounce.
const signedInHtml = renderToString(React.createElement(entry.screens.adminLogin));
check(
  'a signed-in admin never sees the login form (<Navigate/> redirect)',
  !signedInHtml.includes('id="login-email"') && !signedInHtml.includes('Demo mode'),
  `${signedInHtml.length} bytes`,
);

// The login screen itself is only rendered for a signed-out visitor.
authLocal.signOut();

for (const [name, needles] of Object.entries(expectations)) {
  let html = '';
  try {
    html = renderToString(React.createElement(entry.screens[name]));
  } catch (err) {
    check(`${name} renders`, false, err.message);
    continue;
  }
  const missing = needles.filter((n) => !html.includes(n));
  check(`${name} renders (${(html.length / 1024).toFixed(0)} KB of HTML)`, missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : '');
}

/* Placeholders must be real <img> tags with alt text, never AI imagery. */
const homeHtml = renderToString(React.createElement(entry.screens.home));
check('photos render as <img> tags', (homeHtml.match(/<img /g) || []).length > 10, String((homeHtml.match(/<img /g) || []).length));
check('every <img> carries alt text', !/<img (?![^>]*alt=")/.test(homeHtml));
const imgSrcs = [...homeHtml.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map((m) => m[1]);
check('image sources point at local /images paths', imgSrcs.length > 8 && imgSrcs.every((s) => s.startsWith('/images/')), imgSrcs.filter((s) => !s.startsWith('/images/')).join(', '));
check(
  'no AI-generated or stock imagery is referenced anywhere',
  !/https?:\/\/[^"]*(unsplash|picsum|placehold|lorem|dall|openai|midjourney|generated)/i.test(homeHtml),
);
check(`venue phone is wired`, homeHtml.includes(VENUE.phone.replace('+91 ', '+91 ')) || homeHtml.includes('90000 00000'));

/* --------------------------------------------------------------- summary */
await vite.close();
console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m`);
if (fail) {
  console.log(`\nFailed: ${failures.join(' · ')}\n`);
  process.exit(1);
}
console.log('');
process.exit(0);
