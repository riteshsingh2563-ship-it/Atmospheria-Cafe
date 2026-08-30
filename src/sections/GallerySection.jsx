import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { GALLERY_ALBUMS } from '../data/seed.js';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';
import { useScrollLock } from '../context/ToastContext.jsx';
import { X, ChevronLeft, ChevronRight, Instagram, ArrowRight } from '../components/Icons.jsx';
import { VENUE } from '../lib/venue.js';

/* ---------------------------------------------------------------------------
   Gallery — an Instagram-style grid fed by the `gallery` collection.
   Album filters are the same albums the admin gallery manager writes to, so a
   new album added in the portal appears here as a chip automatically.

   PHOTO SOURCES — every image carries its own `source` note in the seed data:
   Instagram @atmospheria.raipur · Google Maps listing → Photos · venue phone.
--------------------------------------------------------------------------- */

function Lightbox({ photos, index, onClose, onStep }) {
  useScrollLock(true);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onStep(-1);
      if (e.key === 'ArrowRight') onStep(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onStep]);

  const p = photos[index];
  if (!p) return null;

  return (
    <div className="fixed inset-0 z-[115] flex flex-col bg-forest-950/95 backdrop-blur" role="dialog" aria-modal="true" aria-label={p.alt}>
      <div className="flex items-center justify-between px-5 py-4 text-cream-100">
        <p className="text-[11px] uppercase tracking-widest2 text-cream-100/60">
          {index + 1} / {photos.length} · {GALLERY_ALBUMS.find((a) => a.id === p.album)?.name ?? 'Gallery'}
        </p>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/25 transition hover:bg-cream-100/10" aria-label="Close gallery">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        <button
          onClick={() => onStep(-1)}
          className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full border border-cream-100/25 text-cream-100 transition hover:bg-cream-100/10 sm:left-6"
          aria-label="Previous photograph"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <figure className="max-h-full w-full max-w-4xl">
          <Photo src={p.src} alt={p.alt} ratio="4/3" className="mx-auto max-h-[62svh] w-auto rounded-2xl" fit="contain" priority />
          <figcaption className="mx-auto mt-4 max-w-xl text-center">
            <p className="font-display text-lg italic text-cream-100/90">{p.caption}</p>
            {/* Development aid: where this photograph should come from. */}
            <p className="mt-1.5 text-[11px] text-cream-100/40">
              {p.src} · {p.source ?? `Instagram ${VENUE.instagramHandle} or Google Maps listing`}
            </p>
          </figcaption>
        </figure>

        <button
          onClick={() => onStep(1)}
          className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full border border-cream-100/25 text-cream-100 transition hover:bg-cream-100/10 sm:right-6"
          aria-label="Next photograph"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default function GallerySection({ preview = false, limit = 8 }) {
  const { gallery, galleryLoading } = useData();
  const [album, setAlbum] = useState('all');
  const [openIndex, setOpenIndex] = useState(null);

  const albums = useMemo(() => {
    const ids = new Set(gallery.map((g) => g.album));
    const known = GALLERY_ALBUMS.filter((a) => ids.has(a.id));
    // Albums that exist in Firestore but not in the shipped list still show up.
    const extra = [...ids].filter((id) => !GALLERY_ALBUMS.some((a) => a.id === id)).map((id) => ({ id, name: id }));
    return [...known, ...extra];
  }, [gallery]);

  const filtered = useMemo(
    () => (album === 'all' ? gallery : gallery.filter((g) => g.album === album)),
    [gallery, album],
  );
  const shown = preview ? filtered.slice(0, limit) : filtered;

  const step = (dir) => setOpenIndex((i) => (i === null ? null : (i + dir + shown.length) % shown.length));

  return (
    <section
      id="gallery"
      className={`relative scroll-mt-24 overflow-hidden py-24 sm:py-32 ${preview ? 'bg-forest-900 text-cream-100' : 'bg-cream-100'}`}
    >
      {preview && <div className="grain-overlay" />}

      <div className="shell relative">
        <Reveal className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className={`eyebrow ${preview ? 'eyebrow--light' : ''}`}>Gallery</p>
            <h2 className={`mt-6 text-h2 section-title text-balance ${preview ? 'text-cream-100' : ''}`}>
              Ninety seconds of <span className={`italic ${preview ? 'text-clay-300' : 'text-clay-600'}`}>our evening</span>
            </h2>
            <p className={`lede ${preview ? 'text-cream-100/70' : ''}`}>
              Pulled from the same set we post on {VENUE.instagramHandle} and the photographs guests leave on our Google
              Maps listing — the courtyard, the pass, the parties.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href={VENUE.instagram} target="_blank" rel="noreferrer noopener" className={`btn-sm ${preview ? 'btn-ghost-light' : 'btn-outline'}`}>
              <Instagram className="h-4 w-4" /> {VENUE.instagramHandle}
            </a>
            {preview && (
              <Link to="/gallery" className="btn-primary btn-sm">
                All photographs <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </Reveal>

        {/* album chips */}
        <Reveal delay={90} className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-1">
          <button
            data-active={album === 'all'}
            onClick={() => setAlbum('all')}
            className={`chip whitespace-nowrap ${preview ? 'border-cream-100/20 bg-transparent text-cream-100/80 data-[active=true]:border-clay-400' : ''}`}
          >
            Everything
          </button>
          {albums.map((a) => (
            <button
              key={a.id}
              data-active={album === a.id}
              onClick={() => setAlbum(a.id)}
              className={`chip whitespace-nowrap ${preview ? 'border-cream-100/20 bg-transparent text-cream-100/80 data-[active=true]:border-clay-400' : ''}`}
            >
              {a.name}
            </button>
          ))}
        </Reveal>

        {/* grid — featured tiles span two cells so it never looks like a spreadsheet */}
        {galleryLoading ? (
          <div className={`mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
            {Array.from({ length: preview ? 8 : 12 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-bark-200/50" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid auto-rows-[minmax(0,13rem)] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {shown.map((p, i) => {
              const big = p.featured || (i % 7 === 0 && !preview);
              return (
                <Reveal key={p.id} delay={Math.min(i, 8) * 60} className={big ? 'row-span-2 sm:col-span-2' : ''}>
                  <button
                    onClick={() => setOpenIndex(i)}
                    className="group relative block h-full w-full overflow-hidden rounded-2xl focus-visible:ring-clay-400"
                    aria-label={`Open photograph: ${p.caption}`}
                  >
                    <Photo
                      src={p.src}
                      alt={p.alt}
                      ratio=""
                      className="h-full w-full"
                      imgClassName="transition-transform duration-[1200ms] group-hover:scale-[1.07]"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-4 text-left text-cream-100 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="block font-display text-[15px] italic leading-snug">{p.caption}</span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-clay-200">
                        {GALLERY_ALBUMS.find((a) => a.id === p.album)?.name ?? p.album}
                      </span>
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        )}

        {!galleryLoading && shown.length === 0 && (
          <p className={`mt-10 text-sm ${preview ? 'text-cream-100/60' : 'text-ink-muted'}`}>
            No photographs in this album yet — upload some from Admin → Gallery.
          </p>
        )}
      </div>

      {openIndex !== null && <Lightbox photos={shown} index={openIndex} onClose={() => setOpenIndex(null)} onStep={step} />}
    </section>
  );
}
