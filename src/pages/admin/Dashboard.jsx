import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLive } from '../../hooks/useLive.js';
import { subscribeBookings, subscribeOrders, subscribeMenu, updateBookingStatus, advanceOrder, setOrderPaid, seedStarterContent, isDemo, initialBookings, initialOrders, initialMenu } from '../../lib/api.js';
import { local } from '../../lib/localBackend.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Panel, StatCard, Spinner, Empty } from '../../components/admin/ui.jsx';
import { VENUE, inr, todayISO, prettyDate, timeAgo } from '../../lib/venue.js';
import {
  CalendarCheck,
  Receipt,
  Users,
  Flame,
  Download,
  Refresh,
  Check,
  ArrowRight,
  Alert,
  Utensils,
} from '../../components/Icons.jsx';

const slotMinutes = (slot = '') => {
  const m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(slot.trim());
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};

export default function Dashboard() {
  const { rows: bookings, loading: bLoading } = useLive(subscribeBookings, { initial: initialBookings() });
  const { rows: orders, loading: oLoading } = useLive(subscribeOrders, { initial: initialOrders() });
  const { rows: menu } = useLive(subscribeMenu, { initial: initialMenu() });
  const { push } = useToast();
  const [seeding, setSeeding] = useState(false);
  const today = todayISO();

  const stats = useMemo(() => {
    const todaysBookings = bookings.filter((b) => b.date === today && !['cancelled', 'rejected'].includes(b.status));
    const confirmed = todaysBookings.filter((b) => b.status === 'confirmed').length;
    const pending = bookings.filter((b) => b.status === 'pending' && b.date >= today).length;
    const covers = todaysBookings.reduce((s, b) => s + (Number(b.partySize) || 0), 0);
    const todaysOrders = orders.filter((o) => (o.orderDate || (o.createdAt || '').slice(0, 10)) === today);
    const live = orders.filter((o) => ['received', 'preparing', 'ready'].includes(o.status));
    const revenue = todaysOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const unpaid = todaysOrders.filter((o) => !o.paid).reduce((s, o) => s + (Number(o.total) || 0), 0);
    const unavailable = menu.filter((m) => m.available === false);
    return { todaysBookings, confirmed, pending, covers, todaysOrders, live, revenue, unpaid, unavailable };
  }, [bookings, orders, menu, today]);

  const tonight = useMemo(
    () =>
      bookings
        .filter((b) => b.date === today && !['cancelled', 'rejected', 'completed'].includes(b.status))
        .sort((a, b) => slotMinutes(a.slot) - slotMinutes(b.slot)),
    [bookings, today],
  );

  const queue = useMemo(
    () => orders.filter((o) => ['received', 'preparing', 'ready'].includes(o.status)).slice(0, 8),
    [orders],
  );

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await seedStarterContent();
      push(
        isDemo
          ? `Demo data restored — ${res.menu} dishes, ${res.gallery} photos, ${res.reviews} reviews.`
          : `Wrote ${res.menu} menu items, ${res.gallery} gallery photos and ${res.reviews} reviews to Firestore.`,
        { tone: 'success', title: 'Starter content loaded' },
      );
    } catch (err) {
      push(err.message || 'Seeding failed — check that firestore.rules is deployed.', { tone: 'error' });
    } finally {
      setSeeding(false);
    }
  };

  const exportJson = () => {
    if (!isDemo) {
      push('Export is a demo-mode helper. Use the Firebase console export for live data.', { tone: 'error' });
      return;
    }
    const blob = new Blob([local.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atmospheria-demo-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------- stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Bookings today"
          value={bLoading ? '—' : stats.todaysBookings.length}
          hint={`${stats.confirmed} confirmed · ${stats.pending} awaiting confirmation`}
          icon={CalendarCheck}
        />
        <StatCard
          label="Covers booked"
          value={bLoading ? '—' : stats.covers}
          hint={`of ${VENUE.capacity.total} seats in the courtyard`}
          icon={Users}
          tone="clay"
        />
        <StatCard
          label="Orders in the kitchen"
          value={oLoading ? '—' : stats.live.length}
          hint={`${stats.todaysOrders.length} placed today`}
          icon={Flame}
          tone="gold"
        />
        <StatCard
          label="Billed today"
          value={oLoading ? '—' : inr(stats.revenue)}
          hint={`${inr(stats.unpaid)} still to collect`}
          icon={Receipt}
        />
        <StatCard
          label="86'd dishes"
          value={stats.unavailable.length}
          hint={stats.unavailable.length ? stats.unavailable.map((m) => m.name).slice(0, 2).join(', ') : 'Everything is on'}
          icon={Utensils}
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* --------------------------------------------- today's bookings */}
        <Panel
          title="Tonight’s table plan"
          subtitle={prettyDate(today)}
          actions={
            <Link to="/admin/bookings" className="btn-outline btn-sm">
              All bookings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          bodyClass="p-0"
        >
          {tonight.length === 0 ? (
            <Empty
              icon={CalendarCheck}
              title="No bookings for today"
              hint="Requests from the website appear here the moment they are placed."
            />
          ) : (
            <ul className="divide-y divide-bark-200">
              {tonight.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="w-20 shrink-0 font-display text-lg text-forest-800">{b.slot}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium text-ink">{b.name}</p>
                    <p className="truncate text-[12px] text-ink-muted">
                      {b.partySize} guests · {b.pod ? VENUE.capacity.pods.find((p) => p.id === b.pod)?.name ?? b.pod : 'no pod preference'} ·{' '}
                      {b.phone}
                      {b.type === 'event' && ' · EVENT'}
                    </p>
                    {b.specialRequests && <p className="mt-0.5 line-clamp-1 text-[12px] italic text-clay-700">“{b.specialRequests}”</p>}
                  </div>
                  <Badge status={b.status} />
                  {b.status === 'pending' && (
                    <button
                      onClick={async () => {
                        await updateBookingStatus(b.id, 'confirmed');
                        push(`${b.name} confirmed for ${b.slot}.`, { tone: 'success' });
                      }}
                      className="btn-primary btn-sm"
                    >
                      <Check className="h-3.5 w-3.5" /> Confirm
                    </button>
                  )}
                  {b.status === 'confirmed' && (
                    <button onClick={() => updateBookingStatus(b.id, 'seated')} className="btn-outline btn-sm">
                      Seated
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* ------------------------------------------------- order queue */}
        <Panel
          title="Live order queue"
          subtitle="Updates in real time from the website"
          actions={
            <Link to="/admin/orders" className="btn-outline btn-sm">
              Full queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          bodyClass="p-0"
        >
          {queue.length === 0 ? (
            <Empty icon={Receipt} title="Kitchen is clear" hint="New orders land here instantly — received, preparing, ready, served." />
          ) : (
            <ul className="divide-y divide-bark-200">
              {queue.map((o) => (
                <li key={o.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg text-clay-700">{o.ref}</span>
                    <Badge status={o.status} />
                    <span className="ml-auto text-[12px] text-ink-muted">{timeAgo(o.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[13.5px] text-ink-soft">
                    {o.orderType === 'dine-in' ? `Table ${o.tableNo || '—'}` : 'Takeaway'} · {o.guestName} ·{' '}
                    {o.items.reduce((s, i) => s + i.qty, 0)} items · {inr(o.total)}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-muted">
                    {o.items.map((i) => `${i.qty}× ${i.lineName}`).join(', ')}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button onClick={() => advanceOrder(o)} className="btn-primary btn-sm">
                      {o.status === 'ready' ? 'Mark served' : o.status === 'preparing' ? 'Mark ready' : 'Start preparing'}
                    </button>
                    {!o.paid && (
                      <button
                        onClick={async () => {
                          await setOrderPaid(o.id, true);
                          push(`Payment recorded for ${o.ref}.`, { tone: 'success' });
                        }}
                        className="btn-outline btn-sm"
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ------------------------------------------------- needs attention */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Needs a decision" subtitle="Pending requests and unpaid bills" bodyClass="p-0">
          {(() => {
            const pendingList = bookings.filter((b) => b.status === 'pending' && b.date >= today).slice(0, 5);
            const unpaidOrders = orders.filter((o) => !o.paid && ['served', 'ready'].includes(o.status)).slice(0, 3);
            if (!pendingList.length && !unpaidOrders.length && !stats.unavailable.length) {
              return <Empty icon={Check} title="All clear" hint="No pending bookings, no unpaid bills, nothing 86'd." />;
            }
            return (
              <ul className="divide-y divide-bark-200">
                {pendingList.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Alert className="h-4 w-4 shrink-0 text-gold" />
                    <span className="min-w-0 flex-1 text-[13.5px] text-ink-soft">
                      <strong className="text-ink">{b.name}</strong> · {prettyDate(b.date)}, {b.slot} · {b.partySize} guests
                    </span>
                    <Link to="/admin/bookings" className="btn-outline btn-sm">
                      Review
                    </Link>
                  </li>
                ))}
                {unpaidOrders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Receipt className="h-4 w-4 shrink-0 text-clay-500" />
                    <span className="min-w-0 flex-1 text-[13.5px] text-ink-soft">
                      <strong className="text-ink">{o.ref}</strong> · {inr(o.total)} unpaid · {o.orderType}
                    </span>
                    <button onClick={() => setOrderPaid(o.id, true)} className="btn-outline btn-sm">
                      Mark paid
                    </button>
                  </li>
                ))}
                {stats.unavailable.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Utensils className="h-4 w-4 shrink-0 text-bark-400" />
                    <span className="min-w-0 flex-1 text-[13.5px] text-ink-soft">
                      <strong className="text-ink">{m.name}</strong> is 86&apos;d — guests see it greyed out on the menu.
                    </span>
                    <Link to="/admin/menu" className="btn-outline btn-sm">
                      Menu
                    </Link>
                  </li>
                ))}
              </ul>
            );
          })()}
        </Panel>

        <Panel title="Content & data" subtitle="Starter menu, gallery and reviews">
          <p className="text-[13.5px] leading-relaxed text-ink-soft">
            A fresh Firestore project starts empty. Loading starter content writes the {menu.length || 'shipped'} menu
            items, the gallery set and the mirrored reviews by document id, so it is safe to run more than once.
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {[
              { k: 'Menu items', v: menu.length },
              { k: 'Bookings', v: bookings.length },
              { k: 'Orders', v: orders.length },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-bark-200 bg-cream-100 p-3.5">
                <dt className="text-[10.5px] uppercase tracking-[0.12em] text-ink-muted">{s.k}</dt>
                <dd className="mt-1 font-display text-2xl text-forest-800">{s.v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={seed} disabled={seeding} className="btn-forest btn-sm">
              {seeding ? <Spinner /> : <Refresh className="h-4 w-4" />} Load starter content
            </button>
            {isDemo && (
              <button onClick={exportJson} className="btn-outline btn-sm">
                <Download className="h-4 w-4" /> Export demo JSON
              </button>
            )}
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-ink-muted">
            {isDemo
              ? 'Demo mode writes to this browser only. Configure .env to point the same screens at Firestore.'
              : 'Live mode. Writes go through the deployed firestore.rules — only an admin uid can change the menu.'}
          </p>
        </Panel>
      </div>
    </div>
  );
}
