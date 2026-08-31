import { useMemo, useState } from 'react';
import { useLive } from '../../hooks/useLive.js';
import { subscribeBookings, updateBookingStatus, rescheduleBooking, deleteBooking, updateBooking, initialBookings } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, Panel, Empty, ConfirmDialog, Modal } from '../../components/admin/ui.jsx';
import { VENUE, BOOKING_STATUSES, TIME_SLOTS, prettyDate, todayISO, timeAgo } from '../../lib/venue.js';
import { CalendarCheck, Search, Check, X, XCircle, Users, ClockCircle, Pencil, Trash, Calendar } from '../../components/Icons.jsx';

const QUICK = [
  { id: 'today', label: 'Today', offset: 0 },
  { id: 'tomorrow', label: 'Tomorrow', offset: 1 },
  { id: 'week', label: 'Next 7 days', offset: null },
];

const offsetDate = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayISO(d);
};

export default function BookingsManager() {
  const { rows, loading } = useLive(subscribeBookings, { initial: initialBookings() });
  const { push } = useToast();
  const today = todayISO();

  const [quick, setQuick] = useState('today');
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [rescheduling, setRescheduling] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((b) => {
        if (quick === 'today' && b.date !== today) return false;
        if (quick === 'tomorrow' && b.date !== offsetDate(1)) return false;
        if (quick === 'week' && (b.date < today || b.date > offsetDate(6))) return false;
        if (quick === 'custom' && b.date !== date) return false;
        if (status !== 'all' && b.status !== status) return false;
        if (needle && !`${b.name} ${b.phone} ${b.ref} ${b.specialRequests}`.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => (a.date === b.date ? String(a.slot).localeCompare(String(b.slot)) : String(b.date).localeCompare(String(a.date))));
  }, [rows, quick, date, status, q, today]);

  const covers = filtered.reduce((s, b) => s + (Number(b.partySize) || 0), 0);

  const act = async (b, next) => {
    try {
      await updateBookingStatus(b.id, next);
      push(`${b.name} → ${next.replace('_', ' ')}`, { tone: 'success' });
    } catch (err) {
      push(err.message || 'Could not update the booking.', { tone: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------- filters */}
      <Panel
        title="Bookings"
        subtitle="Everything written to the bookings collection by the website, newest request first"
        bodyClass="p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((s) => (
              <button
                key={s.id}
                data-active={quick === s.id}
                onClick={() => setQuick(s.id)}
                className="chip px-3.5 py-2 text-[12.5px]"
              >
                {s.label}
              </button>
            ))}
            <button data-active={quick === 'all'} onClick={() => setQuick('all')} className="chip px-3.5 py-2 text-[12.5px]">
              All dates
            </button>
          </div>

          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setQuick('custom');
              }}
              className="field py-2 pl-9 text-[13px]"
              aria-label="Filter by date"
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field w-auto py-2 text-[13px]" aria-label="Filter by status">
            <option value="all">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or reference" className="field py-2 pl-9 text-[13px]" />
          </div>

          <p className="ml-auto text-[12.5px] text-ink-muted">
            {loading ? 'Loading…' : `${filtered.length} bookings · ${covers} covers`}
          </p>
        </div>
      </Panel>

      {/* ----------------------------------------------------------- list */}
      {filtered.length === 0 && !loading ? (
        <Panel>
          <Empty
            icon={CalendarCheck}
            title="Nothing matches those filters"
            hint="Try “All dates”, or clear the status filter. Website requests land here the instant a guest submits the form."
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <article key={b.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-start gap-4 p-5">
                <div className="w-24 shrink-0 rounded-xl bg-forest-800/[0.06] p-3 text-center">
                  <p className="font-display text-lg leading-none text-forest-800">{b.slot?.replace(/\s?(AM|PM)/i, '')}</p>
                  <p className="mt-1 text-[10.5px] uppercase tracking-[0.1em] text-ink-muted">{b.slot?.match(/(AM|PM)/i)?.[0]}</p>
                  <p className="mt-2 border-t border-bark-200 pt-2 text-[11px] text-ink-muted">
                    {new Date(`${b.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display text-xl text-forest-800">{b.name}</h3>
                    <Badge status={b.status} />
                    {b.type === 'event' && (
                      <span className="pill border border-clay-300/60 bg-clay-500/10 text-clay-700">
                        {VENUE.capacity.pods ? 'Event' : 'Event'} enquiry
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-bark-400" /> {b.partySize} guests
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ClockCircle className="h-3.5 w-3.5 text-bark-400" /> {prettyDate(b.date)} · {b.slot}
                    </span>
                    <a href={`tel:${String(b.phone).replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-clay-600">
                      {b.phone}
                    </a>
                    <span className="text-ink-muted">ref {b.ref}</span>
                    <span className="text-ink-muted">requested {timeAgo(b.createdAt)}</span>
                  </div>

                  {b.pod && (
                    <p className="mt-2 text-[13px] text-ink-soft">
                      <span className="text-ink-muted">Seating preference:</span>{' '}
                      {VENUE.capacity.pods.find((p) => p.id === b.pod)?.name ?? b.pod}
                    </p>
                  )}
                  {b.specialRequests && (
                    <p className="mt-2 rounded-xl border border-bark-200 bg-cream-100 px-3.5 py-2.5 text-[13px] italic text-ink-soft">
                      “{b.specialRequests}”
                    </p>
                  )}
                </div>

                {/* ------------------------------------------------- actions */}
                <div className="flex w-full flex-wrap items-center gap-2 border-t border-bark-200 pt-4 sm:w-auto sm:border-0 sm:pt-0">
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => act(b, 'confirmed')} className="btn-primary btn-sm">
                        <Check className="h-3.5 w-3.5" /> Confirm
                      </button>
                      <button onClick={() => act(b, 'rejected')} className="btn-outline btn-sm text-clay-700">
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button onClick={() => act(b, 'seated')} className="btn-primary btn-sm">
                      Mark seated
                    </button>
                  )}
                  {['seated', 'confirmed'].includes(b.status) && (
                    <button onClick={() => act(b, 'completed')} className="btn-outline btn-sm">
                      Complete
                    </button>
                  )}
                  {!['cancelled', 'rejected', 'completed', 'no_show'].includes(b.status) && (
                    <>
                      <button onClick={() => setRescheduling(b)} className="btn-outline btn-sm" title="Reschedule">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => act(b, 'no_show')} className="btn-outline btn-sm" title="Mark as no-show">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setConfirmingDelete(b)}
                    className="btn-outline btn-sm text-clay-700"
                    title="Delete booking"
                    aria-label={`Delete booking for ${b.name}`}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------- reschedule */}
      {rescheduling && (
        <RescheduleModal
          booking={rescheduling}
          onClose={() => setRescheduling(null)}
          onSave={async ({ date: d, slot, partySize, pod }) => {
            await rescheduleBooking(rescheduling.id, { date: d, slot });
            await updateBooking(rescheduling.id, { partySize: Number(partySize), pod });
            push(`Rescheduled to ${prettyDate(d)}, ${slot}.`, { tone: 'success' });
            setRescheduling(null);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmingDelete)}
        title="Delete this booking?"
        message={
          confirmingDelete
            ? `${confirmingDelete.name} · ${prettyDate(confirmingDelete.date)}, ${confirmingDelete.slot}. This removes it from Firestore permanently — cancel instead if the guest might still turn up.`
            : ''
        }
        onConfirm={async () => {
          await deleteBooking(confirmingDelete.id);
          push('Booking deleted.', { tone: 'success' });
        }}
        onClose={() => setConfirmingDelete(null)}
      />
    </div>
  );
}

function RescheduleModal({ booking, onClose, onSave }) {
  const [date, setDate] = useState(booking.date);
  const [slot, setSlot] = useState(booking.slot);
  const [partySize, setPartySize] = useState(booking.partySize);
  const [pod, setPod] = useState(booking.pod || '');
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      title={`Reschedule — ${booking.name}`}
      subtitle={`Currently ${prettyDate(booking.date)}, ${booking.slot}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-outline btn-sm">
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave({ date, slot, partySize, pod });
              } finally {
                setBusy(false);
              }
            }}
            className="btn-primary btn-sm"
          >
            Save new slot
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rs-date">New date</label>
            <input id="rs-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="rs-size">Party size</label>
            <input id="rs-size" type="number" min={1} max={60} className="field" value={partySize} onChange={(e) => setPartySize(e.target.value)} />
          </div>
        </div>

        <div>
          <p className="label">New slot</p>
          <div className="space-y-2.5">
            {TIME_SLOTS.map((g) => (
              <div key={g.group} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{g.group}</span>
                <div className="flex flex-wrap gap-1.5">
                  {g.slots.map((s) => (
                    <button key={s} type="button" data-active={slot === s} onClick={() => setSlot(s)} className="chip px-3 py-1.5 text-[12px]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="rs-pod">Seating</label>
          <select id="rs-pod" className="field" value={pod} onChange={(e) => setPod(e.target.value)}>
            <option value="">No preference</option>
            {VENUE.capacity.pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.seats}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
