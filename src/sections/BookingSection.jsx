import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createBooking } from '../lib/api.js';
import { VENUE, TIME_SLOTS, EVENT_TYPES, prettyDate, todayISO, inr } from '../lib/venue.js';
import { rememberBooking, useMyBookings } from '../hooks/useMyBookings.js';
import { useToast } from '../context/ToastContext.jsx';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';
import {
  CheckCircle,
  ClockCircle,
  XCircle,
  Calendar,
  Users,
  Phone,
  Sparkles,
  ArrowRight,
  Alert,
  Check,
} from '../components/Icons.jsx';

const PHONE_RE = /^[6-9]\d{9}$/;

const STATUS_UI = {
  pending: { tone: 'bg-gold/15 text-bark-700 border-gold/40', icon: ClockCircle, copy: 'Pending — the floor manager has not confirmed yet.' },
  confirmed: { tone: 'bg-forest-800/10 text-forest-700 border-forest-300/60', icon: CheckCircle, copy: 'Confirmed — your table is blocked.' },
  seated: { tone: 'bg-forest-800/10 text-forest-700 border-forest-300/60', icon: CheckCircle, copy: 'You have been seated. Enjoy the evening.' },
  completed: { tone: 'bg-bark-100 text-ink-soft border-bark-300', icon: CheckCircle, copy: 'Completed — thank you for dining with us.' },
  rejected: { tone: 'bg-clay-500/[.12] text-clay-700 border-clay-300/60', icon: XCircle, copy: 'We could not accommodate this request. Please call us.' },
  cancelled: { tone: 'bg-bark-100 text-ink-soft border-bark-300', icon: XCircle, copy: 'Cancelled.' },
  no_show: { tone: 'bg-bark-100 text-ink-soft border-bark-300', icon: Alert, copy: 'Marked as a no-show.' },
};

const cleanPhone = (v) => String(v).replace(/\D/g, '').replace(/^91/, '');

function StatusPill({ status }) {
  const ui = STATUS_UI[status] ?? STATUS_UI.pending;
  const Icon = ui.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] ${ui.tone}`}>
      <Icon className="h-3.5 w-3.5" /> {status.replace('_', ' ')}
    </span>
  );
}

/* ==========================================================================
   BookingForm
   ========================================================================== */
function BookingForm({ variant = 'full', initialType = 'table', initialEvent = '' }) {
  const { push } = useToast();
  const [type, setType] = useState(initialType === 'event' ? 'event' : 'table');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    date: todayISO(),
    slot: '8:00 PM',
    partySize: 2,
    pod: '',
    specialRequests: '',
    eventType: initialEvent || EVENT_TYPES[0].id,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please tell us the name for the booking.';
    if (!PHONE_RE.test(cleanPhone(form.phone))) e.phone = 'Enter a 10-digit Indian mobile number.';
    if (!form.date) e.date = 'Pick a date.';
    else if (form.date < todayISO()) e.date = 'That date has already passed.';
    if (!form.slot) e.slot = 'Choose a time slot.';
    const size = Number(form.partySize);
    if (!size || size < 1) e.partySize = 'At least one guest.';
    if (size > 60) e.partySize = 'For more than 60 guests, please use the event enquiry.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      push('A couple of fields need attention.', { tone: 'error', title: 'Check the form' });
      return;
    }
    setBusy(true);
    try {
      const booking = await createBooking({
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        slot: form.slot,
        partySize: Number(form.partySize),
        pod: form.pod,
        specialRequests: form.specialRequests.trim(),
        type,
        eventType: type === 'event' ? form.eventType : null,
      });
      rememberBooking(booking.id);
      setConfirmed(booking);
      push(
        type === 'event'
          ? 'Our events team will call you within a few hours.'
          : `Table requested for ${prettyDate(booking.date)}, ${booking.slot}.`,
        { tone: 'success', title: 'Request received' },
      );
      if (variant === 'compact') {
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error(err);
      push(
        err?.message?.includes('permission') || err?.code === 'permission-denied'
          ? 'The booking service refused the write — check that firestore.rules is deployed.'
          : 'Could not save the booking. Please call us instead.',
        { tone: 'error', title: 'Booking failed' },
      );
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------- confirmation screen */
  if (confirmed) {
    const ui = STATUS_UI[confirmed.status] ?? STATUS_UI.pending;
    const Icon = ui.icon;
    return (
      <div className="card overflow-hidden">
        <div className="border-b border-bark-200 bg-forest-800 p-7 text-cream-100">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-cream-100/15">
            <Icon className="h-6 w-6 text-clay-200" />
          </span>
          <h3 className="mt-5 font-display text-3xl">
            {type === 'event' ? 'Enquiry received' : 'Your table is requested'}
          </h3>
          <p className="mt-2 max-w-md text-sm text-cream-100/75">{ui.copy}</p>
        </div>

        <dl className="grid gap-x-6 gap-y-5 p-7 sm:grid-cols-2">
          <div>
            <dt className="label">Booking reference</dt>
            <dd className="font-display text-2xl tracking-wide text-clay-700">{confirmed.ref}</dd>
            <dd className="mt-1 text-[11.5px] text-ink-muted">
              Quote this on the phone. Keep it — it is how you track the status.
            </dd>
          </div>
          <div>
            <dt className="label">Current status</dt>
            <dd>
              <StatusPill status={confirmed.status} />
            </dd>
          </div>
          <div>
            <dt className="label">Name</dt>
            <dd className="text-[15px] text-ink">{confirmed.name}</dd>
          </div>
          <div>
            <dt className="label">Phone</dt>
            <dd className="text-[15px] text-ink">{confirmed.phone}</dd>
          </div>
          <div>
            <dt className="label">When</dt>
            <dd className="text-[15px] text-ink">
              {prettyDate(confirmed.date)} · {confirmed.slot}
            </dd>
          </div>
          <div>
            <dt className="label">{type === 'event' ? 'Guests' : 'Party size'}</dt>
            <dd className="text-[15px] text-ink">
              {confirmed.partySize} {type === 'event' ? 'guests' : `guest${confirmed.partySize === 1 ? '' : 's'}`}
            </dd>
          </div>
          {confirmed.pod && (
            <div className="sm:col-span-2">
              <dt className="label">Preferred seating</dt>
              <dd className="text-[15px] text-ink">{VENUE.capacity.pods.find((p) => p.id === confirmed.pod)?.name ?? confirmed.pod}</dd>
            </div>
          )}
          {confirmed.specialRequests && (
            <div className="sm:col-span-2">
              <dt className="label">Your note</dt>
              <dd className="text-[15px] italic text-ink-soft">“{confirmed.specialRequests}”</dd>
            </div>
          )}
        </dl>

        <div className="border-t border-bark-200 bg-cream-200/50 p-7">
          <p className="text-[13.5px] leading-relaxed text-ink-soft">
            {type === 'event'
              ? 'Our events team will call you to share set-menu options, a floor plan and the deposit. Nothing is blocked until then.'
              : 'Most requests are confirmed within 30 minutes during opening hours. This screen updates itself the moment the floor manager confirms — you do not need to refresh.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`tel:${VENUE.phoneHref}`} className="btn-outline btn-sm">
              <Phone className="h-4 w-4" /> Call {VENUE.phone}
            </a>
            <button
              onClick={() => {
                setConfirmed(null);
                setForm((f) => ({ ...f, name: '', phone: '', specialRequests: '' }));
              }}
              className="btn-sm text-ink-soft underline decoration-clay-400/50 underline-offset-4 hover:text-clay-600"
            >
              Make another booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------- form */
  return (
    <form onSubmit={submit} noValidate className="card p-6 sm:p-8">
      {/* mode switch */}
      <div className="grid grid-cols-2 gap-2 rounded-full border border-bark-200 bg-cream-100 p-1">
        {[
          { id: 'table', label: 'Table booking' },
          { id: 'event', label: 'Event enquiry' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`rounded-full py-2.5 text-sm font-medium transition ${
              type === t.id ? 'bg-forest-800 text-cream-100 shadow-card' : 'text-ink-soft hover:text-forest-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {/* name */}
        <div>
          <label className="label" htmlFor="bk-name">Name on the booking</label>
          <input
            id="bk-name"
            className={`field ${errors.name ? 'border-clay-500' : ''}`}
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Ananya Shrivastava"
            autoComplete="name"
          />
          {errors.name && <p className="mt-1.5 text-[12px] text-clay-700">{errors.name}</p>}
        </div>

        {/* phone */}
        <div>
          <label className="label" htmlFor="bk-phone">Mobile number</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-ink-muted">+91</span>
            <input
              id="bk-phone"
              className={`field pl-12 ${errors.phone ? 'border-clay-500' : ''}`}
              value={form.phone}
              onChange={set('phone')}
              placeholder="98XXX XXXXX"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-[12px] text-clay-700">{errors.phone}</p>}
        </div>

        {/* date */}
        <div>
          <label className="label" htmlFor="bk-date">{type === 'event' ? 'Event date' : 'Date'}</label>
          <input
            id="bk-date"
            type="date"
            min={todayISO()}
            className={`field ${errors.date ? 'border-clay-500' : ''}`}
            value={form.date}
            onChange={set('date')}
          />
          {errors.date && <p className="mt-1.5 text-[12px] text-clay-700">{errors.date}</p>}
        </div>

        {/* party size */}
        <div>
          <label className="label" htmlFor="bk-size">{type === 'event' ? 'Expected guests' : 'Party size'}</label>
          <div className="flex items-center gap-2">
            {[2, 4, 6, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((f) => ({ ...f, partySize: n }))}
                data-active={Number(form.partySize) === n}
                className="chip flex-1 justify-center px-0 py-2.5"
              >
                {n}
              </button>
            ))}
            <input
              id="bk-size"
              type="number"
              min={1}
              max={60}
              className="field w-20 text-center"
              value={form.partySize}
              onChange={set('partySize')}
              aria-label="Party size"
            />
          </div>
          {errors.partySize && <p className="mt-1.5 text-[12px] text-clay-700">{errors.partySize}</p>}
        </div>
      </div>

      {/* slots */}
      <fieldset className="mt-7">
        <legend className="label">Time slot</legend>
        <div className="space-y-3">
          {TIME_SLOTS.map((g) => (
            <div key={g.group} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="w-20 shrink-0 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {g.group}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, slot: s }))}
                    data-active={form.slot === s}
                    className="chip px-3.5 py-2 text-[12.5px]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {errors.slot && <p className="mt-1.5 text-[12px] text-clay-700">{errors.slot}</p>}
      </fieldset>

      {/* event type or pod */}
      <div className="mt-7">
        {type === 'event' ? (
          <>
            <label className="label" htmlFor="bk-event">What are you planning?</label>
            <select id="bk-event" className="field" value={form.eventType} onChange={set('eventType')}>
              {EVENT_TYPES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.capacity}
                </option>
              ))}
            </select>
          </>
        ) : (
          variant === 'full' && (
            <>
              <label className="label" htmlFor="bk-pod">Preferred seating (we will try)</label>
              <select id="bk-pod" className="field" value={form.pod} onChange={set('pod')}>
                <option value="">No preference — surprise us</option>
                {VENUE.capacity.pods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.seats}
                  </option>
                ))}
              </select>
            </>
          )
        )}
      </div>

      {/* notes */}
      <div className="mt-5">
        <label className="label" htmlFor="bk-notes">Special requests</label>
        <textarea
          id="bk-notes"
          rows={variant === 'compact' ? 2 : 3}
          className="field resize-none"
          value={form.specialRequests}
          onChange={set('specialRequests')}
          placeholder="Birthday, anniversary, Jain food for two, high chair, wheelchair access, cake from outside…"
        />
      </div>

      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full py-3.5">
        {busy ? 'Sending to the floor manager…' : type === 'event' ? 'Send event enquiry' : 'Request this table'}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="mt-3.5 text-center text-[11.5px] leading-relaxed text-ink-muted">
        No payment is taken online and nothing is charged for cancelling. We hold the table for 15 minutes past the slot.
      </p>
    </form>
  );
}

/* ==========================================================================
   YourBookings — live status for bookings made from this browser
   ========================================================================== */
function YourBookings() {
  const { bookings, loading, cancel, refresh } = useMyBookings();
  const { push } = useToast();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!bookings.length && !loading) return null;

  return (
    <div className="mt-6">
      <h3 className="font-display text-xl text-forest-800">Your bookings from this device</h3>
      <p className="mt-1 text-[13px] text-ink-muted">
        Status updates live — when the floor manager confirms in the admin portal, this changes without a refresh.
      </p>
      <ul className="mt-4 space-y-3">
        {bookings.map((b) => (
          <li key={b.id} className="card flex flex-wrap items-center gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest-800/[0.07] text-clay-600">
              <Calendar className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg text-forest-800">
                {prettyDate(b.date)} · {b.slot}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {b.partySize} guests · ref <span className="font-medium text-ink-soft">{b.ref}</span>
                {b.type === 'event' && ` · ${EVENT_TYPES.find((e) => e.id === b.eventType)?.name ?? 'Event'}`}
              </p>
            </div>
            <StatusPill status={b.status} />
            {b.status === 'pending' && (
              <button
                onClick={async () => {
                  try {
                    await cancel(b.id);
                    push('Booking cancelled.', { tone: 'success' });
                  } catch {
                    push('Could not cancel — please call us.', { tone: 'error' });
                  }
                }}
                className="btn-outline btn-sm"
              >
                Cancel
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ==========================================================================
   BookingSection — full page version and home strip version
   ========================================================================== */
export default function BookingSection({ variant = 'full', initialType = 'table', initialEvent = '' }) {
  const sidePhoto = useMemo(
    () => ({
      src: '/images/ambience/reservation-deck-evening.jpg',
      alt: 'A reserved table for two on the timber deck at dusk with a candle, set cutlery and fairy lights above',
    }),
    [],
  );

  if (variant === 'compact') {
    return (
      <section id="booking" className="relative scroll-mt-24 overflow-hidden bg-forest-900 py-24 text-cream-100 sm:py-28">
        <div className="grain-overlay" />
        <div className="pointer-events-none absolute -right-32 -top-24 h-[26rem] w-[26rem] rounded-full bg-clay-500/15 blur-3xl" />
        <div className="shell relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <p className="eyebrow eyebrow--light">Reserve</p>
            <h2 className="mt-6 text-h2 section-title text-cream-100 text-balance">
              Block a table under <span className="italic text-clay-300">the neem tree</span>
            </h2>
            <p className="lede text-cream-100/70">
              Weekends and Thursdays fill a fortnight out. Send the request here and the floor manager confirms it —
              usually within half an hour during service.
            </p>
            <ul className="mt-7 space-y-2.5 text-sm text-cream-100/75">
              {['Hold of 15 minutes past your slot', 'Free cancellation, no advance', 'Pods and the lawn for 20+'].map((l) => (
                <li key={l} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-clay-300" /> {l}
                </li>
              ))}
            </ul>
            <Link to="/book" className="btn-ghost-light btn-sm mt-7">
              Full booking page <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <BookingForm variant="compact" />
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-cream-100 py-16 sm:py-20">
      <div className="pointer-events-none absolute -left-32 top-32 h-[24rem] w-[24rem] rounded-full bg-clay-200/30 blur-3xl" />
      <div className="shell relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="eyebrow">{initialType === 'event' ? 'Events & Private Dining' : 'Table Booking'}</p>
          <h1 className="mt-6 text-h2 section-title text-balance">
            {initialType === 'event' ? (
              <>
                Tell us what you are <span className="italic text-clay-600">planning</span>
              </>
            ) : (
              <>
                Reserve a table in <span className="italic text-clay-600">the courtyard</span>
              </>
            )}
          </h1>
          <p className="lede">
            {initialType === 'event'
              ? 'Share the headcount and the date. The events team will come back with set-menu options, a floor plan and the deposit — usually the same day.'
              : 'Pick a slot and we will hold it. You get a reference number immediately and the status flips to confirmed the moment the floor manager approves it.'}
          </p>

          <div className="mt-8">
            <BookingForm variant="full" initialType={initialType} initialEvent={initialEvent} />
          </div>

          <YourBookings />
        </div>

        {/* ------------------------------------------------------ side rail */}
        <aside className="space-y-5 lg:pt-24">
          <Photo src={sidePhoto.src} alt={sidePhoto.alt} ratio="4/5" className="rounded-[2rem] shadow-lift" />

          <div className="card p-6">
            <h3 className="flex items-center gap-2.5 font-display text-lg text-forest-800">
              <Sparkles className="h-4.5 w-4.5 text-clay-500" /> Good to know
            </h3>
            <ul className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-ink-soft">
              <li className="flex gap-3">
                <ClockCircle className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
                <span>
                  Kitchen runs {VENUE.hours.label}. Last order at 11:30 PM.
                </span>
              </li>
              <li className="flex gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
                <span>
                  Parties above 12 are seated on the lawn or the long family table — mention it in the notes.
                </span>
              </li>
              <li className="flex gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
                <span>Thursday kitty slots and weekend couple&apos;s nooks go three weeks out.</span>
              </li>
              <li className="flex gap-3">
                <Alert className="mt-0.5 h-4 w-4 shrink-0 text-bark-400" />
                <span>In the monsoon the open lawn is moved under the covered deck — we will tell you when you arrive.</span>
              </li>
            </ul>
          </div>

          <div className="card bg-forest-800 p-6 text-cream-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-cream-100/50">Rather talk?</p>
            <p className="mt-3 font-display text-2xl">
              <a href={`tel:${VENUE.phoneHref}`} className="hover:text-clay-200">
                {VENUE.phone}
              </a>
            </p>
            <p className="mt-2 text-[13px] text-cream-100/70">
              Reservations desk, 12 PM – 11 PM. Events and catering: {VENUE.email}.
            </p>
            <p className="mt-4 border-t border-cream-100/15 pt-4 text-[12.5px] text-cream-100/60">
              Set menus start at {inr(650)} per plate for events, tasting session included above 60 guests.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export { BookingForm, StatusPill };
