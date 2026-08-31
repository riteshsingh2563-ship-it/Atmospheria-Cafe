/* ---------------------------------------------------------------------------
   placeholder.js — generates the "photo goes here" stand-in.

   These are plain, deterministic SVGs (no AI imagery, no external requests).
   They exist so the site looks intentional while the real photographs are
   still being collected from the venue's Instagram and Google Maps listing.
   Drop a real file at the path shown and it replaces the placeholder
   automatically — <Photo/> only falls back when the request 404s.
--------------------------------------------------------------------------- */

const PALETTES = {
  ambience: ['#1f3d2b', '#2b5d45', '#c4622d'],
  menu: ['#3c2a1d', '#6f4a2f', '#c9a227'],
  gallery: ['#234a38', '#3c7759', '#e07f52'],
  events: ['#5a2a18', '#a94e21', '#e3c766'],
  default: ['#2b3b33', '#4a5a50', '#c4622d'],
};

function paletteFor(path = '') {
  if (path.includes('ambience')) return PALETTES.ambience;
  if (path.includes('menu')) return PALETTES.menu;
  if (path.includes('gallery')) return PALETTES.gallery;
  if (path.includes('events')) return PALETTES.events;
  return PALETTES.default;
}

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

/**
 * @param {string} path  the on-disk path the real photo should live at
 * @param {{ratio?:number, label?:string, note?:string}} opts
 * @returns {string} data URI usable straight in an <img src>
 */
export function placeholderFor(path = '/images/photo.jpg', opts = {}) {
  const { ratio = 3 / 2, label, note = 'replace with photo from Instagram @atmospheria.raipur or Google Maps listing' } = opts;
  const [bg, bg2, accent] = paletteFor(path);
  const fileName = decodeURIComponent(String(path).split('/').pop() || 'photo.jpg');
  const folder = decodeURIComponent(String(path).split('/').filter(Boolean).slice(0, -1).join('/'));
  const title = escapeXml(label || fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '));

  const W = 1200;
  const H = Math.round(W / ratio);
  const showNote = W >= 800;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <pattern id="p" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="34" height="34" fill="none"/>
      <line x1="0" y1="0" x2="0" y2="34" stroke="#faf5ec" stroke-opacity="0.045" stroke-width="9"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#p)"/>
  <g fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="2">
    <rect x="${W * 0.06}" y="${H * 0.09}" width="${W * 0.88}" height="${H * 0.82}" rx="10"/>
  </g>
  <g transform="translate(${W / 2}, ${H * 0.42})" fill="none" stroke="#faf5ec" stroke-opacity="0.85" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="-58" y="-40" width="116" height="82" rx="10"/>
    <path d="M-22 -40 L-12 -54 H12 L22 -40"/>
    <circle cx="0" cy="0" r="24"/>
    <circle cx="38" cy="-24" r="4" fill="#faf5ec" stroke="none"/>
  </g>
  <text x="${W / 2}" y="${H * 0.70}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(H * 0.062)}" fill="#faf5ec" fill-opacity="0.92">${title}</text>
  <text x="${W / 2}" y="${H * 0.79}" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="${Math.round(H * 0.036)}" fill="${accent}">${escapeXml(path)}</text>
  ${showNote ? `<text x="${W / 2}" y="${H * 0.865}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="${Math.round(H * 0.031)}" fill="#faf5ec" fill-opacity="0.5">${escapeXml(note)}</text>` : ''}
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Source hint shown in the admin UI next to every empty image slot. */
export function sourceHintFor(path = '') {
  if (path.includes('menu')) return 'Instagram @atmospheria.raipur food posts, or the Google Maps “Photos → Food” tab';
  if (path.includes('events')) return 'The venue phone / WhatsApp events gallery';
  if (path.includes('ambience')) return 'Google Maps listing → Photos → By owner (wide courtyard shots)';
  return 'Instagram @atmospheria.raipur grid, or the Google Maps listing photos';
}
