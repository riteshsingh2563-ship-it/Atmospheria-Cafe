import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createOrder, getOrder, subscribeOrder } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ORDER_STATUSES, VENUE, inr, timeAgo } from '../lib/venue.js';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';
import { CheckCircle, ClockCircle, Chef, Utensils, XCircle, ArrowRight, Receipt, Phone, VegDot } from '../components/Icons.jsx';

const FLOW = ['received', 'preparing', 'ready', 'served'];
const FLOW_UI = {
  received: { icon: Receipt, label: 'Order received', copy: 'The kitchen has your order on the screen.' },
  preparing: { icon: Chef, label: 'Preparing', copy: 'Tandoor and wok are on it. About 15–20 minutes.' },
  ready: { icon: Utensils, label: 'Ready at the pass', copy: 'Plated and waiting — a steward is bringing it over.' },
  served: { icon: CheckCircle, label: 'Served', copy: 'On your table. Enjoy the evening.' },
  cancelled: { icon: XCircle, label: 'Cancelled', copy: 'This order was cancelled.' },
};

const ORDER_KEY = 'atmospheria.lastOrder.v1';

/* ==========================================================================
   OrderTracker — live status, fed by an onSnapshot on the single order doc
   ========================================================================== */
export function OrderTracker({ order }) {
  if (!order) return null;
  const stepIndex = FLOW.indexOf(order.status);
  const cancelled = order.status === 'cancelled';

  return (
    <div className="card overflow-hidden">
      <div className={`p-7 text-cream-100 ${cancelled ? 'bg-bark-700' : 'bg-forest-800'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-cream-100/55">Order number</p>
            <p className="mt-1 font-display text-3xl tracking-wide">{order.ref}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-cream-100/55">Status</p>
            <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-cream-100/15 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em]">
              <span className={`h-2 w-2 rounded-full ${cancelled ? 'bg-cream-100' : 'animate-pulseRing bg-clay-400'}`} />
              {order.status}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-cream-100/75">{FLOW_UI[order.status]?.copy}</p>
      </div>

      {/* progress rail */}
      <div className="px-7 py-7">
        <ol className="relative grid grid-cols-4 gap-2">
          <span className="absolute left-[12%] right-[12%] top-4 h-0.5 bg-bark-200" />
          <span
            className="absolute left-[12%] top-4 h-0.5 bg-clay-500 transition-all duration-700"
            style={{ width: cancelled ? 0 : `${Math.max(0, stepIndex) * 25.3}%` }}
          />
          {FLOW.map((s, i) => {
            const ui = FLOW_UI[s];
            const done = !cancelled && i <= stepIndex;
            return (
              <li key={s} className="relative flex flex-col items-center text-center">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full border-2 transition-all duration-500 ${
                    done ? 'border-clay-500 bg-clay-500 text-cream-50' : 'border-bark-200 bg-cream-50 text-bark-300'
                  }`}
                >
                  <ui.icon className="h-4 w-4" />
                </span>
                <span className={`mt-2.5 text-[11.5px] font-medium ${done ? 'text-forest-800' : 'text-ink-muted'}`}>
                  {ui.label}
                </span>
              </li>
            );
          })}
        </ol>

        <dl className="mt-8 grid gap-5 border-t border-bark-200 pt-6 sm:grid-cols-2">
          <div>
            <dt className="label">Ordering for</dt>
            <dd className="text-[15px] text-ink">
              {order.guestName} · {order.orderType === 'dine-in' ? `Table ${order.tableNo || '—'}` : 'Takeaway'}
            </dd>
          </div>
          <div>
            <dt className="label">Placed</dt>
            <dd className="text-[15px] text-ink">{timeAgo(order.createdAt) || '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="label">Items</dt>
            <dd>
              <ul className="mt-1 divide-y divide-bark-200/70">
                {order.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2.5 py-2 text-[14px]">
                    <VegDot veg={it.veg !== false} />
                    <span className="flex-1 text-ink">
                      {it.qty} × {it.lineName}
                      {[it.portion, it.spice, it.addons?.map((a) => a.name).join(', ')].filter(Boolean).length > 0 && (
                        <span className="block text-[12px] text-ink-muted">
                          {[it.portion, it.spice, it.addons?.map((a) => a.name).join(', ')].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-ink-soft">{inr(it.linePrice * it.qty)}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          {order.notes && (
            <div className="sm:col-span-2">
              <dt className="label">Note for the kitchen</dt>
              <dd className="text-[14px] italic text-ink-soft">“{order.notes}”</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-bark-200 pt-6">
          <div>
            <p className="text-[12px] text-ink-muted">Payable {order.orderType === 'takeaway' ? 'on pickup' : 'at the table'}</p>
            <p className="font-display text-2xl text-forest-800">{inr(order.total)}</p>
            <p className="mt-1">
              {order.paid ? (
                <span className="pill border border-forest-300/60 bg-forest-800/10 text-forest-700">
                  <CheckCircle className="h-3 w-3" /> Paid
                </span>
              ) : (
                <span className="pill border border-gold/40 bg-gold/[.12] text-bark-700">
                  <ClockCircle className="h-3 w-3" /> To pay
                </span>
              )}
            </p>
          </div>
          <a href={`tel:${VENUE.phoneHref}`} className="btn-outline btn-sm">
            <Phone className="h-4 w-4" /> Call about this order
          </a>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   OrderCheckout
   ========================================================================== */
export default function OrderCheckout() {
  const { lines, totals, count, orderType, setOrderType, clear, setDrawerOpen } = useCart();
  const { push } = useToast();
  const [form, setForm] = useState({ guestName: '', phone: '', tableNo: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [trackingId, setTrackingId] = useState(() => localStorage.getItem(ORDER_KEY) || '');
  const [tracked, setTracked] = useState(null);

  /* Re-attach to the last order this browser placed. */
  useEffect(() => {
    if (!trackingId) {
      setTracked(null);
      return undefined;
    }
    return subscribeOrder(trackingId, (doc) => setTracked(doc));
  }, [trackingId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const placeOrder = async (e) => {
    e.preventDefault();
    const err = {};
    if (!form.guestName.trim()) err.guestName = orderType === 'dine-in' ? 'Table name or number, please.' : 'Name for the parcel.';
    if (String(form.phone).replace(/\D/g, '').replace(/^91/, '').length !== 10) err.phone = 'Enter a 10-digit mobile number.';
    if (orderType === 'dine-in' && !form.tableNo.trim()) err.tableNo = 'Which table are you seated at?';
    if (!lines.length) err.items = 'Add a dish or two first.';
    setErrors(err);
    if (Object.keys(err).length) {
      push('Check the highlighted fields.', { tone: 'error', title: 'Cannot place order yet' });
      return;
    }

    setBusy(true);
    try {
      const items = lines.map((l) => ({
        itemId: l.itemId,
        lineName: l.name,
        linePrice: l.linePrice,
        qty: l.qty,
        veg: l.veg,
        portion: l.portion?.name ?? 'Regular',
        spice: l.spice ?? '',
        addons: l.addons ?? [],
        notes: l.notes ?? '',
      }));
      const order = await createOrder({
        guestName: form.guestName.trim(),
        phone: form.phone.trim(),
        orderType,
        tableNo: form.tableNo.trim(),
        items,
        notes: form.notes.trim(),
      });
      localStorage.setItem(ORDER_KEY, order.id);
      setTrackingId(order.id);
      clear();
      push(`Order ${order.ref} sent to the kitchen.`, { tone: 'success', title: 'Order placed' });
      document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e2) {
      console.error(e2);
      push(
        e2?.code === 'permission-denied'
          ? 'Firestore refused the write — check that firestore.rules is deployed.'
          : 'Could not place the order. Please call us instead.',
        { tone: 'error', title: 'Order failed' },
      );
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------- track another order */
  const [lookup, setLookup] = useState('');
  const lookupOrder = async (e) => {
    e.preventDefault();
    const id = lookup.trim();
    if (!id) return;
    const doc = await getOrder(id);
    if (doc) {
      localStorage.setItem(ORDER_KEY, id);
      setTrackingId(id);
      push('Found it — showing live status.', { tone: 'success' });
    } else {
      push('No order with that reference on this device.', { tone: 'error' });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      {/* ------------------------------------------------------- checkout */}
      <div id="checkout" className="scroll-mt-32">
        <Reveal>
          <div className="card p-6 sm:p-8">
            <p className="eyebrow">Checkout</p>
            <h2 className="mt-5 font-display text-3xl text-forest-800">Where is it going?</h2>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-bark-200 bg-cream-100 p-1">
              {[
                { id: 'dine-in', label: 'Dine-in' },
                { id: 'takeaway', label: 'Takeaway' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOrderType(t.id)}
                  className={`rounded-full py-2.5 text-sm font-medium transition ${
                    orderType === t.id ? 'bg-forest-800 text-cream-100 shadow-card' : 'text-ink-soft hover:text-forest-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={placeOrder} noValidate className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="od-name">
                    {orderType === 'dine-in' ? 'Name / table host' : 'Name on the parcel'}
                  </label>
                  <input id="od-name" className={`field ${errors.guestName ? 'border-clay-500' : ''}`} value={form.guestName} onChange={set('guestName')} placeholder="e.g. Table 14 — Rohit" />
                  {errors.guestName && <p className="mt-1.5 text-[12px] text-clay-700">{errors.guestName}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="od-phone">Mobile number</label>
                  <input id="od-phone" className={`field ${errors.phone ? 'border-clay-500' : ''}`} value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="98XXX XXXXX" />
                  {errors.phone && <p className="mt-1.5 text-[12px] text-clay-700">{errors.phone}</p>}
                </div>
              </div>

              {orderType === 'dine-in' && (
                <div>
                  <label className="label" htmlFor="od-table">Table number</label>
                  <input id="od-table" className={`field ${errors.tableNo ? 'border-clay-500' : ''}`} value={form.tableNo} onChange={set('tableNo')} placeholder="e.g. 14" />
                  {errors.tableNo && <p className="mt-1.5 text-[12px] text-clay-700">{errors.tableNo}</p>}
                  <p className="mt-1.5 text-[12px] text-ink-muted">Written on the KOT so the steward finds you in the courtyard.</p>
                </div>
              )}

              <div>
                <label className="label" htmlFor="od-notes">Anything else for the kitchen?</label>
                <textarea id="od-notes" rows={2} className="field resize-none" value={form.notes} onChange={set('notes')} placeholder="Less oil, no onion, pack the gravy separately…" />
              </div>

              {/* summary */}
              <div className="rounded-2xl border border-bark-200 bg-cream-100 p-5">
                <div className="flex items-center justify-between">
                  <p className="label mb-0">Order summary</p>
                  <button type="button" onClick={() => setDrawerOpen(true)} className="text-[12px] text-clay-600 underline underline-offset-2">
                    Edit basket
                  </button>
                </div>
                {lines.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-muted">
                    Nothing in the basket yet —{' '}
                    <Link to="/menu" className="text-clay-600 underline underline-offset-2">
                      browse the menu
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="mt-3 space-y-1.5 text-[13.5px]">
                    {lines.map((l) => (
                      <li key={l.key} className="flex items-start gap-2">
                        <VegDot veg={l.veg} />
                        <span className="flex-1 text-ink-soft">
                          {l.qty} × {l.name}
                          {(l.portion?.id !== 'regular' || l.spice || l.addons?.length) && (
                            <span className="text-[11.5px] text-ink-muted">
                              {' '}
                              ({[l.portion?.name !== 'Regular' ? l.portion?.name : '', l.spice, l.addons?.map((a) => a.name).join(', ')].filter(Boolean).join(', ')})
                            </span>
                          )}
                        </span>
                        <span className="text-ink">{inr(l.linePrice * l.qty)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <dl className="mt-4 space-y-1.5 border-t border-bark-200 pt-4 text-[13.5px]">
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
                  <div className="flex justify-between font-display text-xl text-forest-800">
                    <dt>Payable</dt>
                    <dd>{inr(totals.total)}</dd>
                  </div>
                </dl>
              </div>

              <button type="submit" disabled={busy || !count} className="btn-primary w-full py-3.5">
                {busy ? 'Sending to the kitchen…' : `Place order · ${inr(totals.total)}`}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
              <p className="text-center text-[11.5px] leading-relaxed text-ink-muted">
                Payment at the table or on pickup — UPI, card or cash. No card details are collected here.
              </p>
            </form>
          </div>
        </Reveal>
      </div>

      {/* --------------------------------------------------------- tracker */}
      <div id="tracker" className="scroll-mt-32 space-y-6">
        <Reveal delay={100}>
          {tracked ? (
            <OrderTracker order={tracked} />
          ) : (
            <div className="card flex flex-col items-center p-10 text-center">
              <Photo
                src="/images/ambience/order-pass-kitchen.jpg"
                alt="The kitchen pass at Atmospheria with plated dishes waiting to be carried out to the courtyard"
                ratio="4/3"
                className="w-full rounded-2xl"
              />
              <h3 className="mt-6 font-display text-2xl text-forest-800">Your order will appear here</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-muted">
                Place an order and this panel shows the live status — received, preparing, ready, served — updated by the
                kitchen from the admin portal.
              </p>
            </div>
          )}
        </Reveal>

        <Reveal delay={160}>
          <form onSubmit={lookupOrder} className="card p-6">
            <label className="label" htmlFor="od-lookup">Track an earlier order</label>
            <div className="flex gap-2">
              <input id="od-lookup" className="field" value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Order document id" />
              <button type="submit" className="btn-outline btn-sm shrink-0">
                Track
              </button>
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-muted">
              Orders are private: only the exact order id can be read, so keep the reference from your confirmation.
            </p>
          </form>
        </Reveal>

        <Reveal delay={220}>
          <div className="card bg-forest-800 p-6 text-cream-100">
            <p className="font-display text-xl">Prefer to order at the table?</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-cream-100/70">
              Ask the steward for the QR card — it opens this same menu with your table number already filled in, so the
              kitchen knows exactly where to send the plate.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export { ORDER_STATUSES };
