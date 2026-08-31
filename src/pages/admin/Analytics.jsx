import { useMemo } from 'react';
import { useLive } from '../../hooks/useLive.js';
import { subscribeBookings, subscribeOrders, subscribeMenu, initialBookings, initialOrders, initialMenu } from '../../lib/api.js';
import { Panel, StatCard, BarChart, Empty } from '../../components/admin/ui.jsx';
import Photo from '../../components/Photo.jsx';
import { inr, todayISO, ALL_SLOTS } from '../../lib/venue.js';
import { BarChart as BarIcon, Users, Receipt, Utensils, Flame, CalendarCheck, ClockCircle } from '../../components/Icons.jsx';

const DAYS = 14;

const dayKeys = () => {
  const out = [];
  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      key: todayISO(d),
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      short: d.toLocaleDateString('en-IN', { day: 'numeric' }),
    });
  }
  return out;
};

export default function Analytics() {
  const { rows: bookings } = useLive(subscribeBookings, { initial: initialBookings() });
  const { rows: orders } = useLive(subscribeOrders, { initial: initialOrders() });
  const { rows: menu } = useLive(subscribeMenu, { initial: initialMenu() });

  const model = useMemo(() => {
    const days = dayKeys();
    const index = new Map(days.map((d) => [d.key, { ...d, bookings: 0, covers: 0, orders: 0, revenue: 0 }]));

    bookings.forEach((b) => {
      const row = index.get(b.date);
      if (!row || ['cancelled', 'rejected'].includes(b.status)) return;
      row.bookings += 1;
      row.covers += Number(b.partySize) || 0;
    });

    orders.forEach((o) => {
      const day = o.orderDate || (o.createdAt || '').slice(0, 10);
      const row = index.get(day);
      if (!row || o.status === 'cancelled') return;
      row.orders += 1;
      row.revenue += Number(o.total) || 0;
    });

    const series = days.map((d) => index.get(d.key));

    const itemCounts = new Map();
    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach((it) => {
        const key = it.itemId || it.lineName;
        const prev = itemCounts.get(key) || { name: it.lineName, qty: 0, revenue: 0, photo: it.photo, veg: it.veg };
        prev.qty += Number(it.qty) || 0;
        prev.revenue += (Number(it.linePrice) || 0) * (Number(it.qty) || 0);
        itemCounts.set(key, prev);
      });
    });
    const popular = [...itemCounts.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
    const photoFor = (name) => menu.find((m) => m.name === name)?.photo;

    const slotCounts = new Map();
    bookings.forEach((b) => {
      if (['cancelled', 'rejected'].includes(b.status)) return;
      slotCounts.set(b.slot, (slotCounts.get(b.slot) || 0) + (Number(b.partySize) || 0));
    });
    const busiest = [...slotCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    const dineIn = orders.filter((o) => o.orderType === 'dine-in').length;
    const takeaway = orders.filter((o) => o.orderType === 'takeaway').length;

    return {
      series,
      popular: popular.map((p) => ({ ...p, photo: p.photo || photoFor(p.name) })),
      busiest,
      dineIn,
      takeaway,
      totalRevenue: series.reduce((s, d) => s + d.revenue, 0),
      totalOrders: series.reduce((s, d) => s + d.orders, 0),
      totalBookings: series.reduce((s, d) => s + d.bookings, 0),
      totalCovers: series.reduce((s, d) => s + d.covers, 0),
      events: bookings.filter((b) => b.type === 'event').length,
    };
  }, [bookings, orders, menu]);

  const avgTicket = model.totalOrders ? Math.round(model.totalRevenue / model.totalOrders) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Revenue · last ${DAYS} days`} value={inr(model.totalRevenue)} hint={`${model.totalOrders} orders billed`} icon={Receipt} />
        <StatCard label="Average ticket" value={inr(avgTicket)} hint={`${model.dineIn} dine-in · ${model.takeaway} takeaway`} icon={Flame} tone="clay" />
        <StatCard label={`Covers booked · ${DAYS} days`} value={model.totalCovers} hint={`${model.totalBookings} bookings taken`} icon={Users} tone="gold" />
        <StatCard label="Event enquiries" value={model.events} hint="Written to the same bookings collection" icon={CalendarCheck} tone="slate" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Bookings & covers per day" subtitle={`Rolling ${DAYS} days`} actions={<BarIcon className="h-4 w-4 text-ink-muted" />}>
          {model.totalBookings === 0 ? (
            <Empty icon={CalendarCheck} title="No bookings in this window" hint="Once the site starts taking reservations this chart fills in." />
          ) : (
            <>
              <BarChart data={model.series.map((d) => ({ label: d.label, short: d.short, value: d.bookings }))} />
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-bark-200 pt-4 text-[12.5px] text-ink-muted">
                <span>
                  <strong className="text-ink">{Math.max(...model.series.map((d) => d.bookings))}</strong> bookings on the busiest day
                </span>
                <span>
                  <strong className="text-ink">{model.busiest ? model.busiest[0] : '—'}</strong> is the most-booked slot
                </span>
                <span>
                  <strong className="text-ink">{model.totalCovers}</strong> covers booked
                </span>
              </div>
            </>
          )}
        </Panel>

        <Panel title="Orders & revenue per day" subtitle={`Rolling ${DAYS} days`} actions={<ClockCircle className="h-4 w-4 text-ink-muted" />}>
          {model.totalOrders === 0 ? (
            <Empty icon={Receipt} title="No orders in this window" hint="Orders placed through the website land here the same day." />
          ) : (
            <>
              <BarChart
                data={model.series.map((d) => ({ label: d.label, short: d.short, value: d.orders }))}
                format={(v) => `${v} orders`}
              />
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-bark-200 pt-4 sm:grid-cols-4">
                {model.series.slice(-4).map((d) => (
                  <div key={d.key}>
                    <p className="text-[10.5px] uppercase tracking-[0.1em] text-ink-muted">{d.label}</p>
                    <p className="mt-0.5 font-display text-lg text-forest-800">{inr(d.revenue)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Most ordered dishes" subtitle="Counted across every order in Firestore" bodyClass="p-0">
          {model.popular.length === 0 ? (
            <Empty icon={Utensils} title="No orders yet" hint="Popular items appear once the first orders come through the website." />
          ) : (
            <ul className="divide-y divide-bark-200">
              {model.popular.map((p, i) => {
                const max = model.popular[0].qty || 1;
                return (
                  <li key={p.name} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="w-5 shrink-0 font-display text-lg text-bark-300">{i + 1}</span>
                    <Photo src={p.photo} alt={`${p.name} — most ordered`} ratio="1/1" className="h-11 w-11 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-medium text-ink">{p.name}</p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bark-200">
                        <span className="block h-full rounded-full bg-gradient-to-r from-clay-500 to-clay-400" style={{ width: `${(p.qty / max) * 100}%` }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg text-forest-800">{p.qty}</p>
                      <p className="text-[11px] text-ink-muted">{inr(p.revenue)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Order mix" subtitle="Where the orders are going">
            {model.totalOrders === 0 ? (
              <p className="text-[13px] text-ink-muted">Nothing to split yet.</p>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-bark-200">
                  <span className="bg-forest-600" style={{ width: `${(model.dineIn / model.totalOrders) * 100}%` }} />
                  <span className="bg-clay-500" style={{ width: `${(model.takeaway / model.totalOrders) * 100}%` }} />
                </div>
                <dl className="mt-4 space-y-2 text-[13.5px]">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-ink-soft">
                      <span className="h-2.5 w-2.5 rounded-full bg-forest-600" /> Dine-in
                    </dt>
                    <dd className="font-medium text-ink">{model.dineIn} orders</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-ink-soft">
                      <span className="h-2.5 w-2.5 rounded-full bg-clay-500" /> Takeaway
                    </dt>
                    <dd className="font-medium text-ink">{model.takeaway} orders</dd>
                  </div>
                </dl>
              </>
            )}
          </Panel>

          <Panel title="Slot pressure" subtitle="Covers by requested time slot">
            {ALL_SLOTS.length === 0 ? null : (
              <ul className="space-y-2">
                {(() => {
                  const counts = new Map();
                  bookings.forEach((b) => {
                    if (['cancelled', 'rejected'].includes(b.status)) return;
                    counts.set(b.slot, (counts.get(b.slot) || 0) + (Number(b.partySize) || 0));
                  });
                  const max = Math.max(1, ...counts.values());
                  return ALL_SLOTS.filter((s) => counts.get(s)).map((s) => (
                    <li key={s} className="flex items-center gap-3 text-[12.5px]">
                      <span className="w-16 shrink-0 text-ink-muted">{s}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-bark-200">
                        <span className="block h-full rounded-full bg-forest-600" style={{ width: `${((counts.get(s) || 0) / max) * 100}%` }} />
                      </span>
                      <span className="w-14 shrink-0 text-right font-medium text-ink">{counts.get(s)} covers</span>
                    </li>
                  ));
                })()}
              </ul>
            )}
            <p className="mt-4 border-t border-bark-200 pt-3 text-[11.5px] leading-relaxed text-ink-muted">
              Use this to decide which slots to stop offering on the booking form — the slots list lives in{' '}
              <code className="rounded bg-bark-100 px-1">src/lib/venue.js</code>.
            </p>
          </Panel>
        </div>
      </div>

      <Panel title="How these numbers are produced" subtitle="No extra infrastructure — it is all client-side aggregation">
        <p className="max-w-3xl text-[13.5px] leading-relaxed text-ink-soft">
          The dashboard subscribes to <code className="rounded bg-bark-100 px-1">bookings</code> and{' '}
          <code className="rounded bg-bark-100 px-1">orders</code> and groups them by date in the browser. That is free and
          instant at restaurant scale. Once you pass a few thousand documents a month, move this to a scheduled Cloud
          Function that writes daily totals into an <code className="rounded bg-bark-100 px-1">analytics/daily</code>{' '}
          collection, and read that instead — the charts here will not need to change.
        </p>
      </Panel>
    </div>
  );
}
