import { Link } from 'react-router-dom';
import { ABOUT_PHOTOS } from '../data/seed.js';
import { VENUE } from '../lib/venue.js';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';
import { Coffee, Users, Sparkles, Utensils, ArrowRight } from '../components/Icons.jsx';

/* The four dining pods — each maps to a seating zone the floor manager assigns. */
const POD_ICONS = {
  'deck-seating': Sparkles,
  'couples-nook': Sparkles,
  'cafe-corner': Coffee,
  'family-dining': Users,
};

/* ---------------------------------------------------------------------------
   About — the concept, then the four ways to sit in it.

   PHOTO SOURCES
     /images/ambience/courtyard-daylight-wide.jpg  Google Maps listing → Photos → By owner
     /images/ambience/chef-at-tandoor.jpg          Instagram @atmospheria.raipur kitchen reel
     /images/ambience/table-setting-close-up.jpg   Instagram detail post
--------------------------------------------------------------------------- */
export default function About() {
  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden bg-cream-100 py-24 sm:py-32">
      <div className="pointer-events-none absolute -right-32 top-24 h-[26rem] w-[26rem] rounded-full bg-clay-200/25 blur-3xl" />

      <div className="shell relative">
        <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          {/* --------------------------------------------------------- copy */}
          <Reveal>
            <p className="eyebrow">The Courtyard</p>
            <h2 className="mt-6 text-h2 section-title text-balance">
              Built around a tree
              <span className="italic text-clay-600"> that was here first.</span>
            </h2>

            <div className="mt-7 space-y-5 text-[1.0625rem] leading-relaxed text-ink-soft">
              <p>
                Atmospheria started as a stubborn idea: that a meal in Raipur should not have to happen inside a box. So
                we kept the neem, laid timber decking around it, strung lights between the branches and built four ways
                to sit — each with its own light, its own noise level and its own kind of evening.
              </p>
              <p>
                The kitchen is open on three sides. You can watch the tandoor glow, hear the wok catch flame and smell
                the garlic butter before the plate arrives. Four cuisines share one pass —{' '}
                {VENUE.cuisines.join(', ')} — cooked by teams who have worked together since the first service.
              </p>
              <p className="text-ink">
                There is no dress code and no rush. Come at four for coffee in the café corner, come at nine for the
                fairy lights. Either way, you leave with a story.
              </p>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-bark-200 pt-9 sm:grid-cols-4">
              {[
                { k: 'Seating', v: `${VENUE.capacity.total}`, sub: 'covers, open air' },
                { k: 'Dining pods', v: String(VENUE.capacity.pods.length), sub: 'each with its own mood' },
                { k: 'Cuisines', v: String(VENUE.cuisines.length), sub: 'one kitchen, one pass' },
                { k: 'Rated', v: `${VENUE.rating.value}★`, sub: `${VENUE.rating.count.toLocaleString('en-IN')}+ reviews` },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-[10px] font-semibold uppercase tracking-widest2 text-ink-muted">{s.k}</dt>
                  <dd className="mt-1.5 font-display text-3xl text-forest-800">{s.v}</dd>
                  <dd className="mt-1 text-[12px] text-ink-muted">{s.sub}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/gallery" className="btn-outline btn-sm">
                See the courtyard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/menu" className="btn-sm text-ink-soft underline decoration-clay-400/50 underline-offset-4 transition hover:text-clay-600">
                Browse the menu
              </Link>
            </div>
          </Reveal>

          {/* ------------------------------------------------------- photos */}
          <Reveal delay={140} className="relative">
            <div className="relative">
              <Photo
                src={ABOUT_PHOTOS.primary.src}
                alt={ABOUT_PHOTOS.primary.alt}
                ratio="4/3"
                className="rounded-[2rem] shadow-lift"
              />

              {/* offset secondary frame */}
              <div className="absolute -bottom-12 -left-4 w-[46%] sm:-left-10 sm:w-[44%]">
                <Photo
                  src={ABOUT_PHOTOS.secondary.src}
                  alt={ABOUT_PHOTOS.secondary.alt}
                  ratio="3/4"
                  className="rounded-[1.5rem] border-[6px] border-cream-100 shadow-lift"
                />
              </div>

              {/* detail inset */}
              <div className="absolute -right-2 -top-8 hidden w-[38%] sm:block lg:-right-8">
                <Photo
                  src={ABOUT_PHOTOS.detail.src}
                  alt={ABOUT_PHOTOS.detail.alt}
                  ratio="1/1"
                  className="rounded-[1.25rem] border-[6px] border-cream-100 shadow-card"
                />
              </div>

              {/* pull quote plate */}
              <div className="absolute -bottom-6 right-2 max-w-[15rem] rounded-2xl border border-bark-200 bg-cream-50 p-5 shadow-card sm:right-6">
                <Utensils className="h-5 w-5 text-clay-500" />
                <p className="mt-3 font-display text-[15px] italic leading-snug text-forest-800">
                  “Ask for the deck. Watch the lights come on at seven.”
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-muted">The usual advice</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ------------------------------------------------------ the pods */}
        <div className="mt-28">
          <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Four ways to sit</p>
              <h3 className="mt-4 font-display text-3xl text-forest-800 sm:text-4xl">Pick your corner of the courtyard</h3>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
              Tell us which pod you would like when you book — we will do our best, and we will always tell you honestly
              if it is taken.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VENUE.capacity.pods.map((pod, i) => {
              const Icon = POD_ICONS[pod.id] ?? Sparkles;
              return (
                <Reveal key={pod.id} delay={i * 100}>
                  <article className="group card hover-lift relative h-full overflow-hidden p-7">
                    <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-clay-400 to-clay-600 transition-transform duration-500 group-hover:scale-x-100" />
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-forest-800/[0.06] text-clay-600 transition-colors duration-500 group-hover:bg-clay-500 group-hover:text-cream-50">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h4 className="mt-5 font-display text-xl text-forest-800">{pod.name}</h4>
                    <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.12em] text-clay-600">{pod.seats}</p>
                    <p className="mt-3.5 text-[14.5px] leading-relaxed text-ink-soft">{pod.blurb}</p>
                    <p className="mt-5 border-t border-bark-200/80 pt-4 text-[12.5px] text-ink-muted">
                      <span className="font-medium text-ink-soft">Best for:</span> {pod.best}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
