import { Link } from 'react-router-dom';
import { VENUE } from '../lib/venue.js';
import Reveal from '../components/Reveal.jsx';
import { MapPin, Clock, Phone, Instagram, ExternalLink, Parking, Wifi, Users, Coffee, ArrowRight } from '../components/Icons.jsx';

const AMENITIES = [
  { icon: Parking, label: 'On-site parking', note: 'Valet after 8 PM' },
  { icon: Wifi, label: 'Free Wi-Fi', note: 'Works on the deck' },
  { icon: Users, label: 'Family friendly', note: 'High chairs, kids’ portions' },
  { icon: Coffee, label: 'Non-alcoholic bar', note: 'Mocktails, coffee, coolers' },
];

/* Today's row in the hours table, matched by weekday name. */
const todayName = () =>
  new Date().toLocaleDateString('en-IN', { weekday: 'long' });

/* ---------------------------------------------------------------------------
   Location & Hours — Google Maps embed + the practical details.

   The embed needs no API key: `?q=…&output=embed`. To pin the exact venue
   instead of the street, replace VITE_GOOGLE_MAPS_EMBED in .env with the
   embed code from Google Maps → Share → Embed a map on the venue's listing.
--------------------------------------------------------------------------- */
export default function LocationSection({ preview = false }) {
  const today = todayName();

  return (
    <section id="visit" className="relative scroll-mt-24 overflow-hidden bg-cream-100 py-24 sm:py-32">
      <div className="shell">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Find us</p>
          <h2 className="mt-6 text-h2 section-title text-balance">
            VIP Road, Vishal Nagar — <span className="italic text-clay-600">look for the lights</span>
          </h2>
          <p className="lede">
            Ten minutes from Marine Drive, with the courtyard visible from the road once the sun goes down. Parking is on
            site; the entrance is step-free.
          </p>
        </Reveal>

        <div className={`mt-12 grid gap-6 ${preview ? 'lg:grid-cols-[1.25fr_1fr]' : 'lg:grid-cols-[1.3fr_1fr]'}`}>
          {/* ---------------------------------------------------------- map */}
          <Reveal className="h-full">
            <div className="card h-full overflow-hidden">
              <div className="relative h-[22rem] w-full sm:h-[28rem] lg:h-full lg:min-h-[30rem]">
                <iframe
                  title={`Map showing ${VENUE.fullName} at ${VENUE.addressFull}`}
                  src={VENUE.mapsEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0 grayscale-[0.15]"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-bark-200 p-5">
                <div>
                  <p className="font-display text-lg text-forest-800">{VENUE.fullName}</p>
                  <p className="mt-0.5 text-[13.5px] text-ink-muted">{VENUE.addressFull}</p>
                </div>
                <a href={VENUE.mapsLink} target="_blank" rel="noreferrer noopener" className="btn-outline btn-sm">
                  Get directions <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </Reveal>

          {/* ------------------------------------------------------- details */}
          <div className="space-y-5">
            <Reveal delay={80}>
              <div className="card p-6">
                <h3 className="flex items-center gap-2.5 font-display text-lg text-forest-800">
                  <Clock className="h-4.5 w-4.5 text-clay-500" /> Opening hours
                </h3>
                <dl className="mt-4 divide-y divide-bark-200/70">
                  {VENUE.hours.days.map((d) => {
                    const isToday = d.day === today;
                    return (
                      <div
                        key={d.day}
                        className={`flex items-center justify-between py-2.5 text-[14px] ${
                          isToday ? 'font-medium text-forest-800' : 'text-ink-soft'
                        }`}
                      >
                        <dt className="flex items-center gap-2">
                          {d.day}
                          {isToday && (
                            <span className="rounded-full bg-clay-500/[.12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-clay-700">
                              today
                            </span>
                          )}
                        </dt>
                        <dd className="tabular-nums">{d.open} – {d.close}</dd>
                      </div>
                    );
                  })}
                </dl>
                <p className="mt-4 border-t border-bark-200 pt-4 text-[12.5px] text-ink-muted">{VENUE.hours.note}</p>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="card p-6">
                <h3 className="flex items-center gap-2.5 font-display text-lg text-forest-800">
                  <MapPin className="h-4.5 w-4.5 text-clay-500" /> Reach us
                </h3>
                <ul className="mt-4 space-y-3.5 text-[14px]">
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
                    <span>
                      <a href={`tel:${VENUE.phoneHref}`} className="font-medium text-forest-800 hover:text-clay-600">
                        {VENUE.phone}
                      </a>
                      <span className="block text-[12.5px] text-ink-muted">Reservations &amp; events, 12 PM – 11 PM</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
                    <span>
                      <a href={VENUE.instagram} target="_blank" rel="noreferrer noopener" className="font-medium text-forest-800 hover:text-clay-600">
                        {VENUE.instagramHandle}
                      </a>
                      <span className="block text-[12.5px] text-ink-muted">Tonight’s specials &amp; event photographs</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
                    <span>
                      <span className="font-medium text-forest-800">{VENUE.email}</span>
                      <span className="block text-[12.5px] text-ink-muted">Catering quotes &amp; buyouts</span>
                    </span>
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="grid grid-cols-2 gap-3">
                {AMENITIES.map((a) => (
                  <div key={a.label} className="card p-4">
                    <a.icon className="h-4.5 w-4.5 text-clay-500" />
                    <p className="mt-2.5 text-[13px] font-medium text-forest-800">{a.label}</p>
                    <p className="text-[11.5px] text-ink-muted">{a.note}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {!preview && (
              <Reveal delay={260}>
                <Link to="/book" className="btn-primary w-full">
                  Book a table for tonight <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
