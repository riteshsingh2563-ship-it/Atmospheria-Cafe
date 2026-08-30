/* ---------------------------------------------------------------------------
   venue.js — single source of truth for everything the venue publishes.
   Change it here once; the whole site (and the JSON-LD in index.html) follows.
--------------------------------------------------------------------------- */

export const VENUE = {
  name: 'Atmospheria',
  fullName: 'Atmospheria – The Courtyard Kitchen',
  tagline: 'Where every table has a story',
  positioning: 'Open-air multi-cuisine · Raipur',

  address: {
    line1: 'VIP Road, Vishal Nagar',
    line2: 'Near Marine Drive',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pin: '492001',
    country: 'India',
  },
  get addressFull() {
    const a = this.address;
    return `${a.line1}, ${a.line2}, ${a.city}, ${a.state} ${a.pin}`;
  },

  // Replace with the number from the Google Maps listing / Instagram bio.
  phone: import.meta.env.VITE_VENUE_PHONE || '+91 90000 00000',
  phoneHref: (import.meta.env.VITE_VENUE_PHONE || '+919000000000').replace(/[^0-9+]/g, ''),
  whatsapp: '919000000000',
  email: 'reserve@atmospheria.in',
  instagram: import.meta.env.VITE_VENUE_INSTAGRAM || 'https://www.instagram.com/atmospheria.raipur',
  instagramHandle: '@atmospheria.raipur',
  googleMapsQuery: 'Atmospheria The Courtyard Kitchen VIP Road Raipur',
  mapsEmbed:
    import.meta.env.VITE_GOOGLE_MAPS_EMBED ||
    'https://www.google.com/maps?q=VIP+Road+Vishal+Nagar+Raipur+Chhattisgarh&output=embed',
  mapsLink: 'https://www.google.com/maps/search/?api=1&query=Atmospheria+The+Courtyard+Kitchen+VIP+Road+Raipur',

  hours: {
    open: '14:00',
    close: '23:59',
    label: '2:00 PM – 11:59 PM',
    note: 'Open all seven days. Kitchen closes at 11:30 PM.',
    days: [
      { day: 'Monday', open: '2:00 PM', close: '11:59 PM' },
      { day: 'Tuesday', open: '2:00 PM', close: '11:59 PM' },
      { day: 'Wednesday', open: '2:00 PM', close: '11:59 PM' },
      { day: 'Thursday', open: '2:00 PM', close: '11:59 PM' },
      { day: 'Friday', open: '2:00 PM', close: '11:59 PM' },
      { day: 'Saturday', open: '2:00 PM', close: '11:59 PM' },
      { day: 'Sunday', open: '2:00 PM', close: '11:59 PM' },
    ],
  },

  rating: { value: 4.4, count: 4000, source: 'Google Reviews' },

  cuisines: ['North Indian', 'Chinese', 'Italian', 'Continental'],

  capacity: {
    total: 180,
    pods: [
      {
        id: 'deck-seating',
        name: 'The Deck',
        seats: '2–8 guests',
        blurb:
          'Timber decking under a canopy of fairy lights and neem leaves. Our most-photographed corner once the sun dips.',
        best: 'Evenings, groups of friends',
      },
      {
        id: 'couples-nook',
        name: "Couple's Nook",
        seats: '2 guests',
        blurb:
          'Twelve screened two-tops lined along the ivy wall, each with its own lantern. Booked out on most weekends.',
        best: 'Date nights, anniversaries',
      },
      {
        id: 'cafe-corner',
        name: 'Café Corner',
        seats: '1–4 guests',
        blurb:
          'Rattan chairs, a slow coffee bar and the whole courtyard in view. Where Raipur comes to read the paper at 4 PM.',
        best: 'Coffee, catch-ups, working evenings',
      },
      {
        id: 'family-dining',
        name: 'Family Dining',
        seats: '6–20 guests',
        blurb:
          'Long communal tables on the lawn with space for a high chair, a cake and a very loud birthday song.',
        best: 'Family lunches, birthdays, kitty parties',
      },
    ],
  },
};

/* ---------------------------------------------------------------- categories */

export const CATEGORIES = [
  { id: 'starters', name: 'Courtyard Starters', kind: 'starter', blurb: 'Small plates built for sharing across the table' },
  { id: 'north-indian', name: 'North Indian', kind: 'main', cuisine: 'North Indian', blurb: 'Tandoor, slow curries and hand-rolled breads' },
  { id: 'chinese', name: 'Chinese', kind: 'main', cuisine: 'Chinese', blurb: 'Wok-fired, Indo-Chinese, made the way Raipur likes it' },
  { id: 'italian', name: 'Italian', kind: 'main', cuisine: 'Italian', blurb: 'Pizzas, pastas and the classics done properly' },
  { id: 'continental', name: 'Continental', kind: 'main', cuisine: 'Continental', blurb: 'From the grill — steaks, chops and sea' },
  { id: 'desserts', name: 'Desserts', kind: 'dessert', blurb: 'The sweet ending, often with a sizzle' },
  { id: 'beverages', name: 'Beverages', kind: 'beverage', blurb: 'Coolers, coffees and no-alcohol bar favourites' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

/* ------------------------------------------------------------- time slots */

// 2 PM – 11:59 PM. Slots the booking form offers, grouped by service.
export const TIME_SLOTS = [
  { group: 'Lunch', slots: ['12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM'] },
  { group: 'Evening', slots: ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'] },
  { group: 'Dinner', slots: ['8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM'] },
];

export const ALL_SLOTS = TIME_SLOTS.flatMap((g) => g.slots);

/* ------------------------------------------------------- order / booking */

export const ORDER_STATUSES = [
  { id: 'received', label: 'Received', hint: 'Order placed, awaiting the kitchen', tone: 'slate' },
  { id: 'preparing', label: 'Preparing', hint: 'On the tandoor and the wok', tone: 'clay' },
  { id: 'ready', label: 'Ready', hint: 'Plated and waiting at the pass', tone: 'gold' },
  { id: 'served', label: 'Served', hint: 'On your table / handed over', tone: 'forest' },
  { id: 'cancelled', label: 'Cancelled', hint: 'Order cancelled', tone: 'red' },
];

export const BOOKING_STATUSES = [
  { id: 'pending', label: 'Pending', hint: 'Waiting for the floor manager to confirm', tone: 'gold' },
  { id: 'confirmed', label: 'Confirmed', hint: 'Your table is blocked', tone: 'forest' },
  { id: 'seated', label: 'Seated', hint: 'Guests have arrived', tone: 'forest' },
  { id: 'completed', label: 'Completed', hint: 'Thank you for dining with us', tone: 'slate' },
  { id: 'rejected', label: 'Rejected', hint: 'Could not be accommodated', tone: 'red' },
  { id: 'cancelled', label: 'Cancelled', hint: 'Cancelled by the guest or venue', tone: 'slate' },
  { id: 'no_show', label: 'No-show', hint: 'Guest did not arrive', tone: 'slate' },
];

export const STATUS_MAP = Object.fromEntries(
  [...ORDER_STATUSES, ...BOOKING_STATUSES].map((s) => [s.id, s]),
);

/* ------------------------------------------------------- customisation */

export const DEFAULT_ADDONS = [
  { id: 'extra-cheese', name: 'Extra cheese', price: 80, veg: true },
  { id: 'butter-naan', name: 'Butter naan (2 pc)', price: 60, veg: true },
  { id: 'steamed-rice', name: 'Steamed rice', price: 70, veg: true },
  { id: 'extra-gravy', name: 'Extra gravy', price: 60, veg: true },
  { id: 'fried-egg', name: 'Fried egg on top', price: 30, veg: false },
];

export const PORTIONS = [
  { id: 'regular', name: 'Regular', multiplier: 1 },
  { id: 'half', name: 'Half', multiplier: 0.6 },
  { id: 'full', name: 'Full / Family', multiplier: 1.8 },
];

export const SPICE_LEVELS = ['Mild', 'Medium', 'Spicy', 'Raipuri hot'];

export const TAX_RATE = 0.05; // 5% GST on restaurant food
export const PACKAGING_FEE = 20; // per takeaway order

/* --------------------------------------------------------------- events */

export const EVENT_TYPES = [
  {
    id: 'kitty-party',
    name: 'Kitty Parties',
    capacity: '20 – 60 guests',
    blurb:
      'The lawn is closed to walk-ins, the playlist is yours, and our team runs a set menu with unlimited mocktails. Every Thursday is booked three weeks out.',
    includes: ['Reserved lawn section', 'Set menu with 3 course options', 'Dedicated steward', 'Music system & mic'],
    image: '/images/events/kitty-party-lawn.jpg',
  },
  {
    id: 'birthday',
    name: 'Birthdays & Anniversaries',
    capacity: '10 – 40 guests',
    blurb:
      'Fairy-lit canopy, a cake table under the neem tree and a surprise dessert platter. Tell us the name and we will write it in chocolate.',
    includes: ['Decorated pod or table', 'Cake arrangement', 'Personalised dessert message', 'Group photo on request'],
    image: '/images/events/birthday-canopy.jpg',
  },
  {
    id: 'corporate',
    name: 'Corporate Off-sites',
    capacity: '30 – 120 guests',
    blurb:
      'Projector, power on the deck and a working lunch that people actually finish. We have hosted product launches and year-end dinners here.',
    includes: ['Projector & screen', 'Wi-Fi and power points', 'Tea-break counter', 'Invoice & GST billing'],
    image: '/images/events/corporate-deck.jpg',
  },
  {
    id: 'catering',
    name: 'Outside Catering',
    capacity: '50 – 500 guests',
    blurb:
      'The same kitchen, the same tandoor, brought to your venue. Live counters for chaat, pasta and Indo-Chinese are the usual favourites.',
    includes: ['Live cooking counters', 'Serving staff & crockery', 'Transport within Raipur–Bhilai', 'Tasting session before the event'],
    image: '/images/events/catering-live-counter.jpg',
  },
];

/* ------------------------------------------------------------- utilities */

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const todayISO = (d = new Date()) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};

export const prettyDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const timeAgo = (ts) => {
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (!date || Number.isNaN(date.getTime())) return '';
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
};

export const toDate = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null);
