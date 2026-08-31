import { Link } from 'react-router-dom';
import { EVENT_PHOTOS } from '../data/seed.js';
import { VENUE, EVENT_TYPES } from '../lib/venue.js';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';
import { Check, Users, ArrowRight, Phone, Music, Projector, Cake, Utensils } from '../components/Icons.jsx';

const TYPE_ICONS = {
  'kitty-party': Music,
  birthday: Cake,
  corporate: Projector,
  catering: Utensils,
};

/* ---------------------------------------------------------------------------
   Events & Private Dining — the venue closes the lawn regularly, so this is a
   real revenue line, not a decorative section.

   PHOTO SOURCES
     /images/events/private-dining-lawn-night.jpg  venue phone / WhatsApp events gallery
     /images/events/kitty-party-lawn.jpg           Instagram @atmospheria.raipur events highlight
     /images/events/birthday-canopy.jpg            venue phone gallery
     /images/events/corporate-deck.jpg             venue phone gallery
     /images/events/catering-live-counter.jpg      venue phone gallery (outside catering)
--------------------------------------------------------------------------- */
export default function EventsSection({ preview = false }) {
  const types = preview ? EVENT_TYPES.slice(0, 3) : EVENT_TYPES;

  return (
    <section id="events" className="relative scroll-mt-24 overflow-hidden bg-cream-100 py-24 sm:py-32">
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-forest-200/25 blur-3xl" />

      <div className="shell relative">
        <Reveal className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Events &amp; Private Dining</p>
            <h2 className="mt-6 text-h2 section-title text-balance">
              Close the lawn. <span className="italic text-clay-600">Make it yours.</span>
            </h2>
            <p className="lede">
              We host kitty parties, fiftieths, product launches and weddings-adjacent chaos for 20 to 180 guests. The
              section is closed to walk-ins, a steward is assigned to your group, and the kitchen runs the menu you
              chose — including live counters if you want the theatre.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-ink-soft">
              {[
                'Set menus from ₹650 per plate, or à la carte with a minimum spend',
                'Outside cake, decor and return gifts allowed at no charge',
                'Projector, screen, mic and Wi-Fi for corporate groups',
                'Advance booking advised — Thursday kitty slots go three weeks out',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-800/10 text-forest-700">
                    <Check className="h-3 w-3" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/book?type=event" className="btn-primary">
                Enquire about an event <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`tel:${VENUE.phoneHref}`} className="btn-outline">
                <Phone className="h-4 w-4" /> {VENUE.phone}
              </a>
            </div>
          </div>

          <Reveal delay={120} className="relative">
            <Photo
              src={EVENT_PHOTOS.hero.src}
              alt={EVENT_PHOTOS.hero.alt}
              ratio="4/3"
              className="rounded-[2rem] shadow-lift"
            />
            <div className="absolute -bottom-6 left-6 right-6 rounded-2xl border border-bark-200 bg-cream-50/95 p-5 shadow-card backdrop-blur sm:left-10 sm:right-auto sm:max-w-xs">
              <Users className="h-5 w-5 text-clay-500" />
              <p className="mt-2 font-display text-2xl text-forest-800">20 – 180 guests</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                Lawn buyout, deck section or a single pod. Tell us the headcount and we will draw the plan.
              </p>
            </div>
          </Reveal>
        </Reveal>

        {/* --------------------------------------------------------- cards */}
        <div className="mt-24 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {types.map((ev, i) => {
            const Icon = TYPE_ICONS[ev.id] ?? Music;
            return (
              <Reveal key={ev.id} delay={i * 100} className="h-full">
                <article className="card hover-lift group flex h-full flex-col overflow-hidden">
                  <Photo
                    src={ev.image}
                    alt={`${ev.name} at Atmospheria — ${ev.blurb.split('.')[0]}.`}
                    ratio="4/3"
                    imgClassName="transition-transform duration-[1000ms] group-hover:scale-[1.06]"
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-clay-500/10 text-clay-600">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{ev.capacity}</span>
                    </div>
                    <h3 className="mt-4 font-display text-xl text-forest-800">{ev.name}</h3>
                    <p className="mt-2.5 flex-1 text-[14px] leading-relaxed text-ink-soft">{ev.blurb}</p>
                    <ul className="mt-4 space-y-1.5 border-t border-bark-200/80 pt-4">
                      {ev.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-[12.5px] text-ink-muted">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-500" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                    <Link to={`/book?type=event&event=${ev.id}`} className="btn-outline btn-sm mt-5 w-full">
                      Plan this event
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {preview && (
          <Reveal className="mt-12 text-center">
            <Link to="/events" className="btn-outline btn-sm">
              All event formats &amp; catering <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        )}

        {!preview && (
          <Reveal className="mt-16 overflow-hidden rounded-[2rem] border border-bark-200 bg-forest-800 text-cream-100">
            <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <p className="eyebrow eyebrow--light">Catering outside the courtyard</p>
                <h3 className="mt-5 font-display text-3xl sm:text-4xl">The same kitchen, at your venue</h3>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream-100/75">
                  Live chaat, pasta and Indo-Chinese counters, serving staff, crockery and transport within
                  Raipur–Bhilai. We cook a tasting session before the event so nothing is a surprise on the day.
                </p>
                <Link to="/book?type=event&event=catering" className="btn-primary mt-7">
                  Request a catering quote
                </Link>
              </div>
              <Photo
                src="/images/events/catering-live-counter-wide.jpg"
                alt="Live catering counter set up at an outside event in Raipur with a chef plating food for a queue of guests"
                ratio="4/3"
                className="rounded-2xl"
              />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
