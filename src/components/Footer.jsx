import { Link } from 'react-router-dom';
import { VENUE } from '../lib/venue.js';
import { LeafDivider } from './Photo.jsx';
import { Instagram, MapPin, Phone, Clock, ExternalLink, Lock } from './Icons.jsx';

const EXPLORE = [
  { to: '/menu', label: 'Full Menu' },
  { to: '/book', label: 'Table Booking' },
  { to: '/order', label: 'Order Takeaway' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/events', label: 'Events & Private Dining' },
  { to: '/visit', label: 'Location & Hours' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest-900 text-cream-100">
      <div className="grain-overlay" />
      {/* soft warm glow so the dark block doesn't read as a hard slab */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-clay-500/[.12] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 right-0 h-[26rem] w-[26rem] rounded-full bg-forest-500/10 blur-3xl" />

      <div className="shell relative py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          {/* ---------------------------------------------------- brand */}
          <div>
            <p className="font-display text-3xl">Atmospheria</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-widest2 text-clay-200">The Courtyard Kitchen</p>
            <p className="mt-5 max-w-sm font-display text-xl italic leading-snug text-cream-100/90">
              “{VENUE.tagline}.”
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-100/65">
              An open-air kitchen under an old neem tree on VIP Road — North Indian, Chinese, Italian and Continental,
              cooked over coal and served slowly.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href={VENUE.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/25 transition hover:border-clay-300 hover:bg-clay-500/15 hover:text-clay-200"
                aria-label={`Atmospheria on Instagram — ${VENUE.instagramHandle}`}
              >
                <Instagram className="h-[18px] w-[18px]" />
              </a>
              <a
                href={VENUE.mapsLink}
                target="_blank"
                rel="noreferrer noopener"
                className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/25 transition hover:border-clay-300 hover:bg-clay-500/15 hover:text-clay-200"
                aria-label="Open the Atmospheria Google Maps listing"
              >
                <MapPin className="h-[18px] w-[18px]" />
              </a>
              <a
                href={`tel:${VENUE.phoneHref}`}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/25 transition hover:border-clay-300 hover:bg-clay-500/15 hover:text-clay-200"
                aria-label={`Call Atmospheria on ${VENUE.phone}`}
              >
                <Phone className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          {/* -------------------------------------------------- explore */}
          <nav aria-label="Footer">
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-cream-100/45">Explore</p>
            <ul className="mt-5 space-y-2.5">
              {EXPLORE.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="group inline-flex items-center gap-2 text-sm text-cream-100/75 transition hover:text-clay-200">
                    <span className="h-px w-0 bg-clay-300 transition-all duration-300 group-hover:w-4" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ----------------------------------------------------- visit */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-cream-100/45">Visit</p>
            <address className="mt-5 space-y-4 text-sm not-italic text-cream-100/75">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay-300" />
                <span>
                  {VENUE.address.line1}
                  <br />
                  {VENUE.address.line2}
                  <br />
                  {VENUE.address.city}, {VENUE.address.state} {VENUE.address.pin}
                </span>
              </p>
              <p className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-clay-300" />
                <span>
                  {VENUE.hours.label}
                  <br />
                  <span className="text-cream-100/55">All seven days</span>
                </span>
              </p>
              <p className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-clay-300" />
                <a href={`tel:${VENUE.phoneHref}`} className="hover:text-clay-200">
                  {VENUE.phone}
                </a>
              </p>
            </address>
          </div>

          {/* ------------------------------------------------- reservation */}
          <div className="rounded-2xl border border-cream-100/[.12] bg-cream-100/[0.04] p-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-cream-100/45">Reservations</p>
            <p className="mt-4 text-sm leading-relaxed text-cream-100/70">
              Weekends and Thursdays fill early. Block a table online, or call the floor manager and we will hold it for
              fifteen minutes past your slot.
            </p>
            <Link to="/book" className="btn-primary btn-sm mt-5 w-full">
              Book a Table
            </Link>
            <a href={`tel:${VENUE.phoneHref}`} className="btn-ghost-light btn-sm mt-2.5 w-full">
              Call {VENUE.phone}
            </a>
            <p className="mt-4 text-[11px] leading-relaxed text-cream-100/45">
              Large groups (20+) and private buyouts: see{' '}
              <Link to="/events" className="text-clay-200 underline decoration-clay-300/40 underline-offset-2">
                Events & Private Dining
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-14">
          <LeafDivider light />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-5 text-[12px] text-cream-100/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {VENUE.fullName}. {VENUE.positioning}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-clay-200">{VENUE.rating.value}★</span> {VENUE.rating.count.toLocaleString('en-IN')}+{' '}
              {VENUE.rating.source}
            </span>
            <a
              href={VENUE.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 transition hover:text-clay-200"
            >
              {VENUE.instagramHandle} <ExternalLink className="h-3 w-3" />
            </a>
            <Link to="/admin" className="inline-flex items-center gap-1.5 transition hover:text-clay-200">
              <Lock className="h-3 w-3" /> Staff Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
