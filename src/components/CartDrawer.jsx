import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useScrollLock } from '../context/ToastContext.jsx';
import { inr } from '../lib/venue.js';
import { X, Plus, Minus, ShoppingBag, VegDot, ArrowRight } from './Icons.jsx';

/* ---------------------------------------------------------------------------
   CartDrawer — slide-over basket. Order type lives here so the guest decides
   dine-in vs takeaway before checkout; the price updates with packaging.
--------------------------------------------------------------------------- */
export default function CartDrawer() {
  const { lines, setQty, remove, clear, totals, count, orderType, setOrderType, drawerOpen, setDrawerOpen } = useCart();
  const navigate = useNavigate();
  useScrollLock(drawerOpen);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Your order basket">
      <div className="absolute inset-0 bg-forest-950/65 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream-100 shadow-lift">
        <header className="flex items-center justify-between border-b border-bark-200 px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-ink-muted">Your basket</p>
            <h2 className="mt-1 font-display text-2xl text-forest-800">
              {count === 0 ? 'Nothing yet' : `${count} item${count === 1 ? '' : 's'}`}
            </h2>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-bark-200 text-ink-soft transition hover:border-clay-400 hover:text-clay-600"
            aria-label="Close basket"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* ----------------------------------------------------- order type */}
        <div className="border-b border-bark-200 px-6 py-4">
          <div className="grid grid-cols-2 gap-2 rounded-full border border-bark-200 bg-cream-50 p-1">
            {[
              { id: 'dine-in', label: 'Dine-in' },
              { id: 'takeaway', label: 'Takeaway' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setOrderType(t.id)}
                className={`rounded-full py-2 text-sm font-medium transition ${
                  orderType === t.id ? 'bg-forest-800 text-cream-100 shadow-card' : 'text-ink-soft hover:text-forest-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] text-ink-muted">
            {orderType === 'dine-in'
              ? 'The kitchen gets your table number with the order.'
              : `Packaging ${inr(20)} added at checkout. Ready in about 20 minutes.`}
          </p>
        </div>

        {/* ---------------------------------------------------------- lines */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="h-10 w-10 text-bark-300" />
              <p className="mt-4 font-display text-xl text-forest-800">Your basket is empty</p>
              <p className="mt-2 max-w-xs text-sm text-ink-muted">
                Add a few plates from the menu — the honey chilli potato is where most tables start.
              </p>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  navigate('/menu');
                }}
                className="btn-outline btn-sm mt-6"
              >
                Browse the menu
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {lines.map((l) => (
                <li key={l.key} className="rounded-2xl border border-bark-200 bg-cream-50 p-4">
                  <div className="flex items-start gap-2">
                    <VegDot veg={l.veg} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[17px] leading-snug text-forest-800">{l.name}</p>
                      <p className="mt-1 text-[12px] text-ink-muted">
                        {[l.portion?.name, l.spice, l.addons?.map((a) => a.name).join(', ')].filter(Boolean).join(' · ')}
                      </p>
                      {l.notes && <p className="mt-1 text-[12px] italic text-clay-700">“{l.notes}”</p>}
                    </div>
                    <p className="shrink-0 font-medium text-ink">{inr(l.linePrice * l.qty)}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-bark-200/70 pt-3">
                    <div className="flex items-center gap-1 rounded-full border border-bark-200 p-0.5">
                      <button
                        onClick={() => setQty(l.key, l.qty - 1)}
                        className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition hover:bg-bark-100"
                        aria-label={`Remove one ${l.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium text-forest-800">{l.qty}</span>
                      <button
                        onClick={() => setQty(l.key, l.qty + 1)}
                        className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition hover:bg-bark-100"
                        aria-label={`Add one ${l.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button onClick={() => remove(l.key)} className="text-[12px] text-ink-muted underline underline-offset-2 transition hover:text-clay-600">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* --------------------------------------------------------- totals */}
        {lines.length > 0 && (
          <footer className="border-t border-bark-200 bg-cream-50 px-6 py-5">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd>{inr(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>GST (5%)</dt>
                <dd>{inr(totals.tax)}</dd>
              </div>
              {totals.packaging > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <dt>Packaging</dt>
                  <dd>{inr(totals.packaging)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-bark-200 pt-2.5 font-display text-xl text-forest-800">
                <dt>Payable</dt>
                <dd>{inr(totals.total)}</dd>
              </div>
            </dl>

            <button
              onClick={() => {
                setDrawerOpen(false);
                navigate('/order#checkout');
              }}
              className="btn-primary mt-4 w-full"
            >
              Continue to checkout <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={clear} className="mt-2.5 w-full text-[12px] text-ink-muted underline underline-offset-2 transition hover:text-clay-600">
              Empty the basket
            </button>
            <p className="mt-3 text-center text-[11px] text-ink-muted">
              Payment is collected at the table or on pickup — we do not take card details online.
            </p>
          </footer>
        )}
      </aside>
    </div>
  );
}
