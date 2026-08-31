import { useEffect } from 'react';
import { STATUS_MAP } from '../../lib/venue.js';
import { useScrollLock } from '../../context/ToastContext.jsx';
import { X, CheckCircle, XCircle, ClockCircle, Alert } from '../Icons.jsx';

/* ---------------------------------------------------------------------------
   Shared admin UI primitives. Deliberately plainer than the public site —
   this is a working tool the floor manager uses mid-service on a phone.
--------------------------------------------------------------------------- */

const TONES = {
  forest: 'bg-forest-800/10 text-forest-700 border-forest-300/60',
  clay: 'bg-clay-500/[.12] text-clay-700 border-clay-300/60',
  gold: 'bg-gold/15 text-bark-700 border-gold/40',
  slate: 'bg-bark-100 text-ink-soft border-bark-300',
  red: 'bg-clay-700/[.12] text-clay-800 border-clay-400/50',
};

const STATUS_ICON = {
  forest: CheckCircle,
  clay: ClockCircle,
  gold: ClockCircle,
  slate: ClockCircle,
  red: XCircle,
};

export function Badge({ status, className = '' }) {
  const meta = STATUS_MAP[status] ?? { label: status, tone: 'slate' };
  const Icon = STATUS_ICON[meta.tone] ?? ClockCircle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${TONES[meta.tone] ?? TONES.slate} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

export function Pill({ children, tone = 'slate', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${TONES[tone] ?? TONES.slate} ${className}`}>
      {children}
    </span>
  );
}

export function Panel({ title, subtitle, actions, children, className = '', bodyClass = '' }) {
  return (
    <section className={`rounded-2xl border border-bark-200 bg-cream-50 shadow-card ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bark-200 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-lg text-forest-800">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`p-5 ${bodyClass}`}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'forest', onClick }) {
  const toneMap = {
    forest: 'bg-forest-800/[.08] text-forest-700',
    clay: 'bg-clay-500/10 text-clay-700',
    gold: 'bg-gold/15 text-bark-700',
    slate: 'bg-bark-100 text-ink-soft',
  };
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`card p-5 text-left transition ${onClick ? 'hover:-translate-y-0.5 hover:shadow-lift' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
        {Icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-full ${toneMap[tone]}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-4xl leading-none text-forest-800">{value}</p>
      {hint && <p className="mt-2 text-[12.5px] text-ink-muted">{hint}</p>}
    </Tag>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  useScrollLock(true);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-forest-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 my-auto w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} rounded-2xl bg-cream-100 shadow-lift`}>
        <header className="flex items-start justify-between gap-4 border-b border-bark-200 px-6 py-4">
          <div>
            <h2 className="font-display text-xl text-forest-800">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-bark-200 text-ink-soft transition hover:border-clay-400 hover:text-clay-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[65svh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-bark-200 px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', tone = 'red', onConfirm, onClose }) {
  if (!open) return null;
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-outline btn-sm">
            Keep it
          </button>
          <button
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className={`btn btn-sm ${tone === 'red' ? 'bg-clay-700 text-cream-50 hover:bg-clay-800' : 'bg-forest-800 text-cream-100 hover:bg-forest-700'}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-soft">{message}</p>
    </Modal>
  );
}

export function Empty({ icon: Icon = Alert, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-bark-100 text-bark-400">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-xl text-forest-800">{title}</p>
      {hint && <p className="mt-1.5 max-w-sm text-[13px] text-ink-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-forest-600' : 'bg-bark-300'
      }`}
    >
      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-cream-50 shadow transition-transform ${checked ? 'translate-x-[1.45rem]' : 'translate-x-1'}`} />
    </button>
  );
}

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Tiny dependency-free bar chart used by the analytics page. */
export function BarChart({ data, height = 140, format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-medium text-ink-muted opacity-0 transition group-hover:opacity-100">
            {format(d.value)}
          </span>
          <span
            className="w-full rounded-t-md bg-gradient-to-t from-forest-700 to-forest-500 transition-all duration-500 group-hover:from-clay-600 group-hover:to-clay-400"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            title={`${d.label}: ${format(d.value)}`}
          />
          <span className="text-[9.5px] uppercase tracking-wide text-ink-muted">{d.short ?? d.label.slice(0, 3)}</span>
        </div>
      ))}
    </div>
  );
}
