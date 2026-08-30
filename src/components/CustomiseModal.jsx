import { useEffect, useMemo, useState } from 'react';
import Photo from './Photo.jsx';
import { useScrollLock } from '../context/ToastContext.jsx';
import { VegDot, X, Plus, Minus, Check } from './Icons.jsx';
import { DEFAULT_ADDONS, PORTIONS, SPICE_LEVELS, inr } from '../lib/venue.js';
import { priceLine } from '../context/CartContext.jsx';

/* ---------------------------------------------------------------------------
   CustomiseModal — the per-dish option sheet:
   portion → spice → add-ons → note → quantity, with a live price.
--------------------------------------------------------------------------- */
export default function CustomiseModal({ item, onClose, onConfirm }) {
  const [portion, setPortion] = useState(PORTIONS[0]);
  const [spice, setSpice] = useState(item?.spice || 'Medium');
  const [addons, setAddons] = useState([]);
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);

  useScrollLock(Boolean(item));

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  const availableAddons = useMemo(() => {
    const ids = item?.addons?.length ? item.addons : DEFAULT_ADDONS.slice(0, 3).map((a) => a.id);
    return DEFAULT_ADDONS.filter((a) => ids.includes(a.id));
  }, [item]);

  if (!item) return null;

  const unit = priceLine(item, { portion, addons });
  const showSpice = item.category !== 'beverages' && item.category !== 'desserts';

  const toggleAddon = (a) =>
    setAddons((prev) => (prev.some((x) => x.id === a.id) ? prev.filter((x) => x.id !== a.id) : [...prev, a]));

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`Customise ${item.name}`}>
      <div className="absolute inset-0 bg-forest-950/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-cream-100 shadow-lift sm:rounded-[2rem]">
        <div className="relative">
          <Photo
            src={item.photo}
            alt={`${item.name} — ${item.description || ''}`}
            ratio="16/9"
            imgClassName=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-cream-50/90 text-ink transition hover:bg-cream-50"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-6 text-cream-100">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded bg-cream-50">
                <VegDot veg={item.veg} />
              </span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-cream-100/70">{item.serves}</span>
            </div>
            <h3 className="mt-2 font-display text-3xl">{item.name}</h3>
            <p className="mt-1.5 max-w-md text-sm text-cream-100/75">{item.description}</p>
          </div>
        </div>

        <div className="space-y-7 p-6 sm:p-8">
          {/* ------------------------------------------------------ portion */}
          <div>
            <p className="label">Portion</p>
            <div className="grid grid-cols-3 gap-2">
              {PORTIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPortion(p)}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${
                    portion.id === p.id
                      ? 'border-clay-500 bg-clay-500 text-cream-50 shadow-[0_8px_20px_-10px_rgba(196,98,45,.9)]'
                      : 'border-bark-200 bg-cream-50 text-ink-soft hover:border-clay-300'
                  }`}
                >
                  <span className="block font-medium">{p.name}</span>
                  <span className={`mt-0.5 block text-[11px] ${portion.id === p.id ? 'text-cream-100/75' : 'text-ink-muted'}`}>
                    {inr(Math.round(Number(item.price) * (p.multiplier ?? 1)))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* -------------------------------------------------------- spice */}
          {showSpice && (
            <div>
              <p className="label">Spice level</p>
              <div className="flex flex-wrap gap-2">
                {SPICE_LEVELS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpice(s)}
                    data-active={spice === s}
                    className="chip"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- addons */}
          {availableAddons.length > 0 && (
            <div>
              <p className="label">Add to this plate</p>
              <div className="space-y-2">
                {availableAddons.map((a) => {
                  const on = addons.some((x) => x.id === a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAddon(a)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        on ? 'border-clay-400 bg-clay-500/[0.07]' : 'border-bark-200 bg-cream-50 hover:border-clay-300'
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition ${
                          on ? 'border-clay-500 bg-clay-500 text-cream-50' : 'border-bark-300'
                        }`}
                      >
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      <VegDot veg={a.veg} />
                      <span className="flex-1 text-sm text-ink">{a.name}</span>
                      <span className="text-sm font-medium text-clay-700">+{inr(a.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- notes */}
          <div>
            <label className="label" htmlFor="dish-notes">
              Anything the kitchen should know
            </label>
            <textarea
              id="dish-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. less oil, no onion, extra crisp"
              className="field resize-none"
            />
          </div>
        </div>

        {/* -------------------------------------------------------- footer */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-bark-200 bg-cream-100/95 px-6 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-1 rounded-full border border-bark-200 bg-cream-50 p-1">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-bark-100" aria-label="Decrease quantity">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-display text-lg text-forest-800">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-bark-100" aria-label="Increase quantity">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onConfirm({ portion, spice: showSpice ? spice : '', addons, notes, qty });
              onClose();
            }}
            className="btn-primary flex-1 justify-between"
          >
            <span>Add to order</span>
            <span className="font-semibold">{inr(unit * qty)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
