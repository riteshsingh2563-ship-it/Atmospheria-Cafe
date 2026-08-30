import Photo from './Photo.jsx';
import { VegDot, Plus, Flame, Sparkles, Chef } from './Icons.jsx';
import { inr } from '../lib/venue.js';

export const TAG_META = {
  bestseller: { label: 'Bestseller', icon: Flame, className: 'bg-clay-500/[.12] text-clay-700 border-clay-300/60' },
  chef: { label: "Chef's special", icon: Chef, className: 'bg-forest-800/10 text-forest-700 border-forest-300/60' },
  premium: { label: 'Premium', icon: Sparkles, className: 'bg-gold/15 text-bark-700 border-gold/40' },
};

/* ---------------------------------------------------------------------------
   DishCard — one menu line: photograph, statutory veg mark, price, tags,
   availability. The photo path comes straight from the menu_items document, so
   the admin's upload is what renders here.
--------------------------------------------------------------------------- */
export default function DishCard({ item, onAdd, onCustomize, showPhoto = true }) {
  const soldOut = item.available === false;

  return (
    <article
      className={[
        'group card relative flex h-full overflow-hidden transition-all duration-500',
        soldOut ? 'opacity-70' : 'hover:-translate-y-1 hover:shadow-lift',
        showPhoto ? 'flex-col' : 'flex-row items-stretch',
      ].join(' ')}
    >
      {showPhoto && (
        <div className="relative shrink-0">
          <Photo
            src={item.photo}
            alt={`${item.name} — ${item.description || ''}`}
            ratio={showPhoto === 'wide' ? '4/3' : '3/2'}
            className={showPhoto === 'wide' ? '' : ''}
            imgClassName={`transition-transform duration-[900ms] ${soldOut ? 'grayscale' : 'group-hover:scale-[1.06]'}`}
          />
          {/* veg / non-veg mark sits on the photo, as guests expect */}
          <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-md bg-cream-50/95 shadow-card">
            <VegDot veg={item.veg} />
          </span>
          {soldOut && (
            <span className="absolute inset-0 grid place-items-center bg-forest-950/55">
              <span className="rounded-full bg-cream-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-clay-700">
                86'd today
              </span>
            </span>
          )}
          {(item.tags || []).slice(0, 2).map((t, i) => {
            const meta = TAG_META[t];
            if (!meta) return null;
            return (
              <span
                key={t}
                className={`absolute right-3 ${i === 0 ? 'top-3' : 'top-[3.4rem]'} inline-flex items-center gap-1 rounded-full border bg-cream-50/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${meta.className}`}
              >
                <meta.icon className="h-3 w-3" /> {meta.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-display text-[19px] leading-snug text-forest-800">{item.name}</h4>
          <p className="shrink-0 font-display text-lg text-clay-700">{inr(item.price)}</p>
        </div>

        <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink-soft">{item.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
          {!showPhoto && <VegDot veg={item.veg} />}
          {item.serves && <span>{item.serves}</span>}
          {item.spice && item.spice !== 'Mild' && (
            <span className="inline-flex items-center gap-1 text-clay-600">
              <Flame className="h-3.5 w-3.5" /> {item.spice}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-bark-200/70 pt-4">
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onCustomize?.(item)}
            className="btn-outline btn-sm flex-1 disabled:opacity-40"
          >
            Customise
          </button>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onAdd?.(item)}
            className="btn-primary btn-sm disabled:opacity-40"
            aria-label={`Add ${item.name} to the order`}
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
