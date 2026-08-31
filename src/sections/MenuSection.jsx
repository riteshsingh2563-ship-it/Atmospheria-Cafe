import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { CATEGORIES, CATEGORY_BY_ID, inr } from '../lib/venue.js';

/* Categories created in the admin portal that are not in the shipped list. */
export function allCategories(items = []) {
  const known = CATEGORIES.filter((c) => items.some((i) => i.category === c.id));
  const extraIds = [...new Set(items.map((i) => i.category))].filter((id) => id && !CATEGORY_BY_ID[id]);
  const extra = extraIds.map((id) => ({
    id,
    name: id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    kind: 'extra',
    blurb: 'Added from the admin portal',
  }));
  return [...known, ...extra];
}
import DishCard from '../components/DishCard.jsx';
import CustomiseModal from '../components/CustomiseModal.jsx';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';
import { LeafDivider } from '../components/Photo.jsx';
import { Search, VegDot, ShoppingBag, ArrowRight, Utensils, Flame } from '../components/Icons.jsx';

const DIET_FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'veg', label: 'Vegetarian' },
  { id: 'nonveg', label: 'Non-veg' },
];

/* ==========================================================================
   MenuBrowser — the full menu with live data from menu_items.
   ========================================================================== */
export function MenuBrowser() {
  const { items, byCategory, loading } = useData();
  const { add, setDrawerOpen, count, totals } = useCart();
  const [diet, setDiet] = useState('all');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [customising, setCustomising] = useState(null);

  const categories = useMemo(() => allCategories(items), [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((m) => {
      if (diet === 'veg' && !m.veg) return false;
      if (diet === 'nonveg' && m.veg) return false;
      if (cat !== 'all' && m.category !== cat) return false;
      if (needle && !`${m.name} ${m.description} ${CATEGORY_BY_ID[m.category]?.name ?? ''}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, diet, cat, q]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((m) => {
      const key = m.category || 'uncategorised';
      (map[key] ||= []).push(m);
    });
    Object.values(map).forEach((l) => l.sort((a, b) => (a.sortOrder ?? 9e9) - (b.sortOrder ?? 9e9)));
    return map;
  }, [filtered]);

  const activeCats = cat === 'all' ? categories.filter((c) => grouped[c.id]?.length) : categories.filter((c) => c.id === cat);

  return (
    <>
      {/* ------------------------------------------------------ filter rail */}
      <div className="sticky top-[4.5rem] z-40 border-b border-bark-200/70 bg-cream-100/95 backdrop-blur-xl">
        <div className="shell flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
            <button data-active={cat === 'all'} onClick={() => setCat('all')} className="chip whitespace-nowrap">
              All sections
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                data-active={cat === c.id}
                onClick={() => setCat(c.id)}
                className="chip whitespace-nowrap"
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-56 lg:flex-none">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a dish"
                aria-label="Search the menu"
                className="field py-2.5 pl-10 text-sm"
              />
            </div>
            <div className="flex gap-1.5">
              {DIET_FILTERS.map((f) => (
                <button
                  key={f.id}
                  data-active={diet === f.id}
                  onClick={() => setDiet(f.id)}
                  className="chip whitespace-nowrap px-3 py-2 text-[12px]"
                  title={f.label}
                >
                  {f.id === 'all' ? 'All' : <VegDot veg={f.id === 'veg'} />}
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- legend */}
      <div className="shell mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <VegDot veg /> Vegetarian
        </span>
        <span className="inline-flex items-center gap-2">
          <VegDot veg={false} /> Non-vegetarian
        </span>
        <span className="inline-flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-clay-500" /> Spice level is adjustable on every plate
        </span>
        <span className="ml-auto">
          {loading ? 'Loading today’s menu…' : `${filtered.length} dishes · prices in ₹, taxes extra`}
        </span>
      </div>

      {/* -------------------------------------------------------- sections */}
      {activeCats.length === 0 && !loading && (
        <div className="shell py-24 text-center">
          <Utensils className="mx-auto h-8 w-8 text-bark-300" />
          <p className="mt-4 font-display text-2xl text-forest-800">Nothing matches that yet</p>
          <p className="mt-2 text-sm text-ink-muted">Try clearing the search or the diet filter.</p>
          <button
            onClick={() => {
              setQ('');
              setDiet('all');
              setCat('all');
            }}
            className="btn-outline btn-sm mt-6"
          >
            Reset filters
          </button>
        </div>
      )}

      {activeCats.map((c) => {
        const list = grouped[c.id] || [];
        if (!list.length) return null;
        return (
          <section key={c.id} id={`menu-${c.id}`} className="shell scroll-mt-40 py-14">
            <Reveal className="flex flex-col gap-3 border-b border-bark-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">{c.kind === 'main' ? `Mains · ${c.cuisine}` : c.kind}</p>
                <h3 className="mt-3 font-display text-3xl text-forest-800 sm:text-[2.4rem]">{c.name}</h3>
                <p className="mt-2 max-w-lg text-sm text-ink-muted">{c.blurb}</p>
              </div>
              <p className="text-[12px] uppercase tracking-[0.14em] text-ink-muted">{list.length} dishes</p>
            </Reveal>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((item, i) => (
                <Reveal key={item.id} delay={Math.min(i, 5) * 70} className="h-full">
                  <DishCard item={item} onAdd={(it) => add(it)} onCustomize={setCustomising} />
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}

      {/* ------------------------------------------------------- sticky bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-bark-200 bg-cream-50/95 backdrop-blur-xl sm:hidden">
          <div className="shell flex items-center gap-3 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-clay-500 text-cream-50">
              <ShoppingBag className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-ink-muted">
                {count} item{count === 1 ? '' : 's'} · {inr(totals.subtotal)}
              </p>
              <p className="truncate text-sm font-semibold text-forest-800">Payable {inr(totals.total)}</p>
            </div>
            <button onClick={() => setDrawerOpen(true)} className="btn-primary btn-sm">
              View basket
            </button>
          </div>
        </div>
      )}

      <CustomiseModal item={customising} onClose={() => setCustomising(null)} onConfirm={(opts) => add(customising, opts)} />
    </>
  );
}

/* ==========================================================================
   MenuTeaser — the home-page taste of the menu.
   ========================================================================== */
export function MenuTeaser() {
  const { byCategory, loading } = useData();
  const { add, setDrawerOpen } = useCart();
  const [customising, setCustomising] = useState(null);
  const [tab, setTab] = useState('starters');

  const tabs = allCategories(Object.values(byCategory).flat()).filter((c) => c.kind === 'starter' || c.kind === 'main');
  const list = (byCategory[tab] || []).filter((m) => m.available !== false).slice(0, 3);
  const hero = (byCategory[tab] || []).find((m) => m.tags?.includes('bestseller')) ?? list[0];

  return (
    <section id="menu" className="relative scroll-mt-24 overflow-hidden bg-cream-200/50 py-24 sm:py-32">
      <div className="grain-overlay" />
      <div className="shell relative">
        <Reveal className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">The Menu</p>
            <h2 className="mt-6 text-h2 section-title text-balance">
              Four kitchens, <span className="italic text-clay-600">one courtyard pass</span>
            </h2>
            <p className="lede">
              Tandoor, wok, oven and grill share the same fire and the same evening. Everything below is cooked to order
              and every price is printed as it is billed.
            </p>
          </div>
          <Link to="/menu" className="btn-forest shrink-0">
            Full menu <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {/* cuisine tabs */}
        <Reveal delay={100} className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((c) => (
            <button key={c.id} data-active={tab === c.id} onClick={() => setTab(c.id)} className="chip whitespace-nowrap">
              {c.name}
            </button>
          ))}
        </Reveal>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* featured dish */}
          {hero && (
            <Reveal className="h-full">
              <article className="group card hover-lift relative h-full overflow-hidden">
                <Photo
                  src={hero.photo}
                  alt={`${hero.name} — ${hero.description}`}
                  ratio="4/3"
                  imgClassName="transition-transform duration-[1200ms] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950 via-forest-950/70 to-transparent p-6 pt-16 text-cream-100">
                  <div className="flex items-center gap-2">
                    <span className="pill border border-cream-100/25 bg-cream-100/10 text-cream-100/85">
                      <VegDot veg={hero.veg} /> {CATEGORY_BY_ID[hero.category]?.name}
                    </span>
                    {hero.tags?.includes('bestseller') && (
                      <span className="pill border border-clay-300/50 bg-clay-500/25 text-clay-100">Bestseller</span>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-3xl">{hero.name}</h3>
                  <p className="mt-2 max-w-md text-sm text-cream-100/75">{hero.description}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="font-display text-2xl text-clay-200">{inr(hero.price)}</span>
                    <button onClick={() => setCustomising(hero)} className="btn-primary btn-sm ml-auto">
                      Customise &amp; add
                    </button>
                  </div>
                </div>
              </article>
            </Reveal>
          )}

          {/* the rest of the category */}
          <div className="space-y-4">
            {loading && !list.length && (
              <div className="card p-10 text-center text-sm text-ink-muted">Loading today’s menu…</div>
            )}
            {list.map((item, i) => (
              <Reveal key={item.id} delay={i * 90}>
                <article className="card hover-lift flex items-center gap-4 p-4">
                  <Photo
                    src={item.photo}
                    alt={`${item.name} — ${item.description}`}
                    ratio="1/1"
                    className="w-24 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <VegDot veg={item.veg} />
                      <h4 className="flex-1 font-display text-lg leading-snug text-forest-800">{item.name}</h4>
                      <span className="font-display text-clay-700">{inr(item.price)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">{item.description}</p>
                    <div className="mt-2.5 flex gap-2">
                      <button onClick={() => setCustomising(item)} className="btn-outline btn-sm px-3 py-1.5 text-[12px]">
                        Customise
                      </button>
                      <button onClick={() => add(item)} className="btn-primary btn-sm px-3 py-1.5 text-[12px]">
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-14">
          <LeafDivider />
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="max-w-xl text-sm text-ink-muted">
              Ordering for the table or taking it home? Add dishes here and the basket follows you — dine-in orders go
              straight to the kitchen with your table number.
            </p>
            <button onClick={() => setDrawerOpen(true)} className="btn-outline btn-sm">
              <ShoppingBag className="h-4 w-4" /> Open basket
            </button>
          </div>
        </Reveal>
      </div>

      <CustomiseModal item={customising} onClose={() => setCustomising(null)} onConfirm={(opts) => add(customising, opts)} />
    </section>
  );
}
