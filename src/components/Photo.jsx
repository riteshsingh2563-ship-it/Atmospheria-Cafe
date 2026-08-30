import { useEffect, useState } from 'react';
import { placeholderFor } from '../lib/placeholder.js';

/* ---------------------------------------------------------------------------
   <Photo/> — the only way this codebase renders a photograph.

   It emits a real <img> pointing at the final on-disk path, with alt text that
   describes the actual scene (screen-reader and SEO friendly). If the file is
   not there yet the request 404s and the component swaps in a labelled SVG
   stand-in showing the exact path it is waiting for — so nothing ever looks
   broken, and the photographer knows precisely which file to drop in.

   Usage:
     <Photo
       src="/images/ambience/courtyard-hero-01.jpg"   ← real target path
       alt="Wide evening shot of the open-air courtyard under string lights"
       ratio="3/2"
       kenburns
     />

   Sourcing: Instagram @atmospheria.raipur · Google Maps listing → Photos
--------------------------------------------------------------------------- */
export default function Photo({
  src,
  alt,
  ratio, // e.g. '3/2' | '1/1' | '16/9' | '4/5'
  className = '',
  imgClassName = '',
  kenburns = false,
  priority = false,
  note,
  fit = 'cover',
  showMissingBadge = false,
  ...rest
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Re-arm the fallback if `src` changes (admin swapped the photo).
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const isMissing = failed || !src;
  const resolved = isMissing ? placeholderFor(src || '/images/untitled.jpg', { note, ratio: ratioToNumber(ratio) }) : src;

  return (
    <span className={`relative block overflow-hidden bg-forest-900 ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      <img
        src={resolved}
        alt={alt}
        width={ratio ? 1200 : undefined}
        height={ratio ? Math.round(1200 / ratioToNumber(ratio)) : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={priority ? 'high' : 'auto'}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={[
          'h-full w-full select-none',
          kenburns ? 'animate-kenburns' : '',
          'transition-opacity duration-700',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        ].join(' ')}
        style={{ objectFit: fit, ...(ratio ? {} : { position: 'absolute', inset: 0 }) }}
        {...rest}
      />

      {showMissingBadge && isMissing && (
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-forest-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-clay-200 backdrop-blur">
          awaiting photo
        </span>
      )}
    </span>
  );
}

function ratioToNumber(ratio) {
  if (!ratio) return 3 / 2;
  if (typeof ratio === 'number') return ratio;
  const [a, b] = String(ratio).split('/').map(Number);
  return a && b ? a / b : 3 / 2;
}

/** Decorative divider used between sections. */
export function LeafDivider({ className = '', light = false }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span className={`h-px w-16 ${light ? 'bg-cream-100/30' : 'bg-bark-300'}`} />
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${light ? 'text-clay-300' : 'text-clay-500'}`} fill="currentColor">
        <path d="M12 2c4 3.2 6.5 6.6 6.5 10.4A6.5 6.5 0 0 1 12 22a6.5 6.5 0 0 1-6.5-9.6C5.5 8.6 8 5.2 12 2Zm0 4.4c-2 1.9-3.4 3.9-3.4 6.1a3.4 3.4 0 0 0 3.4 3.5V6.4Z" />
      </svg>
      <span className={`h-px w-16 ${light ? 'bg-cream-100/30' : 'bg-bark-300'}`} />
    </div>
  );
}
