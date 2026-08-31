import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HERO_SLIDES } from '../data/seed.js';
import { VENUE } from '../lib/venue.js';
import Photo from '../components/Photo.jsx';
import { ArrowRight, Star, Clock, MapPin, ChevronLeft, ChevronRight } from '../components/Icons.jsx';
import { usePointerParallax } from '../hooks/useLive.js';

const SLIDE_MS = 6800;

/* ---------------------------------------------------------------------------
   Hero — ambience carousel + the two things a guest actually wants to do.

   PHOTO SOURCES (drop real files at these exact paths):
     /images/ambience/courtyard-hero-01.jpg     Google Maps listing → Photos → By owner
     /images/ambience/deck-hero-02.jpg          Instagram @atmospheria.raipur pinned reel
     /images/ambience/couples-nook-hero-03.jpg  Instagram grid post
     /images/ambience/cafe-corner-hero-04.jpg   Instagram story highlight "Café"
     /images/ambience/fairy-lights-hero-05.jpg  Google Maps listing → Photos
--------------------------------------------------------------------------- */
export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const parallaxRef = usePointerParallax();
  const timer = useRef(null);

  const go = useCallback((next) => setIndex((i) => (next + HERO_SLIDES.length) % HERO_SLIDES.length), []);

  useEffect(() => {
    if (paused) return undefined;
    timer.current = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(timer.current);
  }, [index, paused, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go]);

  const slide = HERO_SLIDES[index];

  return (
    <section
      id="top"
      ref={parallaxRef}
      className="relative min-h-[92svh] overflow-hidden bg-forest-950 text-cream-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Photographs of the Atmospheria courtyard"
    >
      {/* ------------------------------------------------- photo carousel */}
      <div className="absolute inset-0">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Photo
              src={s.src}
              alt={s.alt}
              ratio=""
              priority={i === 0}
              kenburns={i === index}
              imgClassName={i === index ? '' : 'scale-[1.02]'}
              className="h-full w-full"
            />
          </div>
        ))}

        {/* legibility scrims — heavier bottom-left where the type sits */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/55 to-forest-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/25 to-transparent" />
        <div className="grain-overlay" />
      </div>

      {/* --------------------------------------------------------- content */}
      <div className="relative flex min-h-[92svh] flex-col justify-end pb-28 pt-32 sm:pb-32">
        <div className="shell">
          <div
            className="max-w-3xl"
            style={{ transform: 'translate3d(calc(var(--px, 0) * -10px), calc(var(--py, 0) * -8px), 0)' }}
          >
            <p className="eyebrow eyebrow--light animate-fadeUp">
              {VENUE.positioning}
            </p>

            <h1 className="mt-6 text-display animate-fadeUp font-display [animation-delay:120ms]">
              Where every table
              <span className="block italic text-clay-300">has a story.</span>
            </h1>

            <p
              key={slide.id}
              className="mt-7 max-w-xl animate-fadeUp text-[1.0625rem] leading-relaxed text-cream-100/80 [animation-delay:220ms]"
            >
              {slide.caption}. Four cuisines, one courtyard, and an old neem tree that was here long before the first
              table was set.
            </p>

            <div className="mt-9 flex animate-fadeUp flex-wrap items-center gap-3 [animation-delay:320ms]">
              <Link to="/book" className="btn-primary px-7 py-3.5 text-[15px]">
                Book a Table <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/order" className="btn-ghost-light px-7 py-3.5 text-[15px]">
                Order Now
              </Link>
              <a
                href={`tel:${VENUE.phoneHref}`}
                className="ml-1 hidden items-center gap-2 text-sm text-cream-100/70 transition hover:text-clay-200 sm:inline-flex"
              >
                or call {VENUE.phone}
              </a>
            </div>

            {/* trust strip */}
            <div className="mt-10 flex animate-fadeUp flex-wrap items-center gap-x-7 gap-y-3 text-[13px] text-cream-100/70 [animation-delay:420ms]">
              <span className="inline-flex items-center gap-2">
                <span className="flex">
                  {[0, 1, 2, 3].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-gold-soft" />
                  ))}
                  <Star className="h-3.5 w-3.5 text-gold-soft/45" />
                </span>
                <strong className="font-semibold text-cream-100">{VENUE.rating.value}</strong>
                {VENUE.rating.count.toLocaleString('en-IN')}+ {VENUE.rating.source.toLowerCase()}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-clay-300" /> {VENUE.hours.label}, daily
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-clay-300" /> {VENUE.address.line1}, {VENUE.address.city}
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ carousel chrome */}
        <div className="shell mt-12 flex items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => go(index - 1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-cream-100/25 text-cream-100/80 transition hover:border-clay-300 hover:bg-clay-500/20 hover:text-clay-200"
              aria-label="Previous photograph"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(index + 1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-cream-100/25 text-cream-100/80 transition hover:border-clay-300 hover:bg-clay-500/20 hover:text-clay-200"
              aria-label="Next photograph"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="hidden max-w-md flex-1 sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-clay-200">{slide.kicker}</p>
            <p className="mt-1.5 font-display text-lg italic text-cream-100/85">{slide.line}</p>
          </div>

          <div className="flex items-center gap-2" role="tablist" aria-label="Choose photograph">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${s.kicker}`}
                onClick={() => go(i)}
                className="group relative h-1.5 w-10 overflow-hidden rounded-full bg-cream-100/25 transition-all duration-500 hover:bg-cream-100/45 sm:w-14"
              >
                <span
                  className={`absolute inset-y-0 left-0 w-full bg-clay-400 ${
                    i === index ? (paused ? 'scale-x-100' : 'progress-fill') : 'scale-x-0 group-hover:scale-x-[0.28]'
                  } transition-transform duration-500`}
                  style={i === index ? { '--progress-ms': `${SLIDE_MS}ms` } : undefined}
                />
              </button>
            ))}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          Photograph {index + 1} of {HERO_SLIDES.length}: {slide.caption}
        </p>
      </div>
    </section>
  );
}
