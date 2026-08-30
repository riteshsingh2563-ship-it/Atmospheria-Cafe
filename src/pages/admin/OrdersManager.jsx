import { useMemo, useState } from 'react';
import { useLive } from '../../hooks/useLive.js';
import { subscribeOrders, updateOrderStatus, setOrderPaid, deleteOrder, initialOrders } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Panel, Empty, ConfirmDialog, Modal, Pill } from '../../components/admin/ui.jsx';
import { inr, todayISO, timeAgo, toDate } from '../../lib/venue.js';
import { Receipt, Search, ArrowRight, Check, XCircle, Trash, ClockCircle, VegDot } from '../../components/Icons.jsx';

const COLUMNS = [
  { id: 'received', label: 'Received', tone: 'clay', next: 'preparing', nextLabel: 'Start preparing' },
  { id: 'preparing', label: 'Preparing', tone: 'gold', next: 'ready', nextLabel: 'Mark ready' },
  { id: 'ready', label: 'Ready at the pass', tone: 'forest', next: 'served', nextLabel: 'Mark served' },
  { id: 'served', label: 'Served', tone: 'slate', next: null, nextLabel: null },
];

const minutesWaiting = (o) => {
  const d = toDate(o.createdAt);
  return d ? Math.max(0, Math.round((Date.now() - d.getTime()) / 60000)) : 0;
};

export default function OrdersManager() {
  const { rows, loading } = useLive(subscribeOrders, { initial: initialOrders() });
  const { push } = useToast();
  const today = todayISO();

  const [scope, setScope] = useState('today');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const scoped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((o) => {
        const day = o.orderDate || (o.createdAt || '').slice(0, 10);
        if (scope === 'today' && day !== today) return false;
        if (scope === 'open' && !['received', 'preparing', 'ready'].includes(o.status)) return false;
        if (needle && !`${o.ref} ${o.guestName} ${o.phone} ${o.tableNo} ${o.items.map((i) => i.lineName).join(' ')}`.toLowerCase().includes(needle))
          return false;
        return true;
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [rows, scope, q, today]);

  const byStatus = useMemo(() => {
    const map = { received: [], preparing: [], ready: [], served: [], cancelled: [] };
    scoped.forEach((o) => (map[o.status] ?? map.received).push(o));
    return map;
  }, [scoped]);

  const advance = async (o, next) => {
    try {
      await updateOrderStatus(o.id, next);
      push(`${o.ref} → ${next}`, { tone: 'success' });
    } catch (err) {
      push(err.message || 'Could not update the order.', { tone: 'error' });
    }
  };

  const ticket = (o, column) => {
    const waiting = minutesWaiting(o);
    const late = ['received', 'preparing'].includes(o.status) && waiting > 20;
    return (
      <article
        key={o.id}
        className={`rounded-xl border bg-cream-50 p-4 shadow-card transition hover:shadow-lift ${
          late ? 'border-clay-400' : 'border-bark-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-clay-700">{o.ref}</span>
          {late && (
            <span className="pill border border-clay-400/60 bg-clay-500/[.12] text-clay-700">
              <ClockCircle className="h-3 w-3" /> {waiting}m
            </span>
          )}
          <span className="ml-auto text-[11px] text-ink-muted">{timeAgo(o.createdAt)}</span>
        </div>

        <p className="mt-1.5 text-[13px] font-medium text-ink">
          {o.orderType === 'dine-in' ? `Table ${o.tableNo || '—'}` : 'Takeaway'} · {o.guestName}
        </p>
        <ul className="mt-2 space-y-1">
          {o.items.slice(0, 4).map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink-soft">
              <VegDot veg={it.veg !== false} />
              <span className="flex-1">
                {it.qty}× {it.lineName}
                {it.spice && it.spice !== 'Medium' && <span className="text-clay-700"> · {it.spice}</span>}
              </span>
            </li>
          ))}
          {o.items.length > 4 && <li className="text-[12px] text-ink-muted">+{o.items.length - 4} more…</li>}
        </ul>
        {o.notes && <p className="mt-2 rounded-lg bg-bark-100 px-2.5 py-1.5 text-[11.5px] italic text-ink-soft">“{o.notes}”</p>}

        <div className="mt-3 flex items-center justify-between border-t border-bark-200 pt-3">
          <span className="font-display text-lg text-forest-800">{inr(o.total)}</span>
          <span className="flex items-center gap-1.5">
            {o.paid ? (
              <Pill tone="forest">
                <Check className="h-3 w-3" /> Paid
              </Pill>
            ) : (
              <Pill tone="gold">To pay</Pill>
            )}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {column?.next && (
            <button onClick={() => advance(o, column.next)} className="btn-primary btn-sm flex-1">
              {column.nextLabel} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {!o.paid && (
            <button
              onClick={async () => {
                await setOrderPaid(o.id, true);
                push(`${o.ref} marked paid.`, { tone: 'success' });
              }}
              className="btn-outline btn-sm"
            >
              Paid
            </button>
          )}
          <button onClick={() => setDetail(o)} className="btn-outline btn-sm" aria-label={`Open ${o.ref}`}>
            View
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <Panel bodyClass="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'open', label: 'Open now' },
              { id: 'all', label: 'All orders' },
            ].map((s) => (
              <button key={s.id} data-active={scope === s.id} onClick={() => setScope(s.id)} className="chip px-3.5 py-2 text-[12.5px]">
                {s.label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reference, table, guest or dish" className="field py-2 pl-9 text-[13px]" />
          </div>
          <p className="text-[12.5px] text-ink-muted">
            {loading ? 'Listening…' : `${scoped.length} orders · ${['received', 'preparing', 'ready'].reduce((s, k) => s + byStatus[k].length, 0)} open`}
          </p>
        </div>
      </Panel>

      {/* --------------------------------------------------------- board */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <section key={col.id} className="rounded-2xl border border-bark-200 bg-cream-200/50 p-3">
            <header className="flex items-center justify-between px-2 pb-3">
              <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {col.label}
              </h2>
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-cream-50 px-1.5 text-[11.5px] font-bold text-ink-soft">
                {byStatus[col.id].length}
              </span>
            </header>
            <div className="space-y-3">
              {byStatus[col.id].length === 0 ? (
                <p className="rounded-xl border border-dashed border-bark-300 px-3 py-8 text-center text-[12px] text-ink-muted">
                  Nothing here
                </p>
              ) : (
                byStatus[col.id].map((o) => ticket(o, col))
              )}
            </div>
          </section>
        ))}
      </div>

      {byStatus.cancelled.length > 0 && (
        <Panel title="Cancelled" bodyClass="p-0">
          <ul className="divide-y divide-bark-200">
            {byStatus.cancelled.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="font-display text-lg text-clay-700">{o.ref}</span>
                <span className="text-[13px] text-ink-soft">
                  {o.guestName} · {o.items.reduce((s, i) => s + i.qty, 0)} items · {inr(o.total)}
                </span>
                <Badge status="cancelled" className="ml-auto" />
                <button onClick={() => setConfirmingDelete(o)} className="btn-outline btn-sm text-clay-700" aria-label={`Delete ${o.ref}`}>
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {scoped.length === 0 && !loading && (
        <Panel>
          <Empty
            icon={Receipt}
            title="No orders in this view"
            hint="Orders placed on the website appear here instantly. Switch to “All orders” to see earlier ones."
          />
        </Panel>
      )}

      {/* --------------------------------------------------------- detail */}
      {detail && (
        <Modal
          title={`Order ${detail.ref}`}
          subtitle={`${detail.orderType === 'dine-in' ? `Table ${detail.tableNo}` : 'Takeaway'} · ${detail.guestName} · ${detail.phone}`}
          onClose={() => setDetail(null)}
          footer={
            <>
              {!detail.paid && (
                <button
                  onClick={async () => {
                    await setOrderPaid(detail.id, true);
                    setDetail({ ...detail, paid: true });
                    push('Marked paid.', { tone: 'success' });
                  }}
                  className="btn-outline btn-sm"
                >
                  Mark paid
                </button>
              )}
              <button
                onClick={async () => {
                  await updateOrderStatus(detail.id, 'cancelled');
                  setDetail(null);
                  push(`${detail.ref} cancelled.`, { tone: 'success' });
                }}
                className="btn btn-sm bg-clay-700 text-cream-50 hover:bg-clay-800"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel order
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge status={detail.status} />
              {detail.paid ? <Pill tone="forest">Paid</Pill> : <Pill tone="gold">To pay</Pill>}
              <span className="text-[12px] text-ink-muted">placed {timeAgo(detail.createdAt)}</span>
            </div>

            <ul className="divide-y divide-bark-200">
              {detail.items.map((it, i) => (
                <li key={i} className="flex items-start gap-3 py-2.5">
                  <VegDot veg={it.veg !== false} />
                  <span className="flex-1 text-[14px] text-ink">
                    {it.qty}× {it.lineName}
                    <span className="block text-[12px] text-ink-muted">
                      {[it.portion, it.spice, it.addons?.map((a) => a.name).join(', '), it.notes].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="text-[14px] text-ink-soft">{inr(it.linePrice * it.qty)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-1.5 border-t border-bark-200 pt-4 text-[13.5px]">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd>{inr(detail.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>GST</dt>
                <dd>{inr(detail.tax)}</dd>
              </div>
              {detail.packaging > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <dt>Packaging</dt>
                  <dd>{inr(detail.packaging)}</dd>
                </div>
              )}
              <div className="flex justify-between font-display text-xl text-forest-800">
                <dt>Total</dt>
                <dd>{inr(detail.total)}</dd>
              </div>
            </dl>

            {detail.statusHistory?.length > 0 && (
              <div>
                <p className="label">Timeline</p>
                <ol className="space-y-1.5">
                  {detail.statusHistory.map((h, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[12.5px] text-ink-soft">
                      <span className="h-1.5 w-1.5 rounded-full bg-clay-400" />
                      <span className="font-medium text-ink">{h.status}</span>
                      <span className="text-ink-muted">{new Date(h.at).toLocaleString('en-IN')}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(confirmingDelete)}
        title="Delete this order?"
        message={confirmingDelete ? `${confirmingDelete.ref} will be removed from the orders collection permanently.` : ''}
        onConfirm={async () => {
          await deleteOrder(confirmingDelete.id);
          push('Order deleted.', { tone: 'success' });
        }}
        onClose={() => setConfirmingDelete(null)}
      />
    </div>
  );
}
