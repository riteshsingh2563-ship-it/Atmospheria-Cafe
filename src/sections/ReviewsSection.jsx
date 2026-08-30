import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { submitReview } from '../lib/api.js';
import { VENUE } from '../lib/venue.js';
import Reveal from '../components/Reveal.jsx';
import { Star, StarOutline, Quote, ExternalLink, CheckCircle, ArrowRight } from '../components/Icons.jsx';

/* Aggregate shown on the Google listing. Distribution mirrors a 4.4 average. */
const DISTRIBUTION = [
  { stars: 5, pct: 68 },
  { stars: 4, pct: 19 },
  { stars: 3, pct: 6 },
  { stars: 2, pct: 3 },
  { stars: 1, pct: 4 },
];

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

function Stars({ value, size = 'h-4 w-4', className = 'text-gold' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(value) ? <Star key={i} className={size} /> : <StarOutline key={i} className={`${size} opacity-30`} />,
      )}
    </span>
  );
}

function ReviewForm({ onDone }) {
  const { push } = useToast();
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (author.trim().length < 2 || text.trim().length < 10) {
      push('Add your name and a sentence or two so we can publish it.', { tone: 'error', title: 'Almost there' });
      return;
    }
    setBusy(true);
    try {
      await submitReview({ author: author.trim(), rating, text: text.trim(), source: 'website' });
      push('Thank you — it will appear once the floor manager approves it.', { tone: 'success', title: 'Review received' });
      onDone();
    } catch (err) {
      push(err.message || 'Could not save your review. Please try again.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={send} className="card mt-6 space-y-4 p-6">
      <div>
        <label className="label" htmlFor="rev-name">Your name</label>
        <input id="rev-name" className="field" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Ananya S." />
      </div>
      <div>
        <p className="label">Rating</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className={`grid h-10 w-10 place-items-center rounded-xl border transition ${
                n <= rating ? 'border-gold/50 bg-gold/[.12] text-gold' : 'border-bark-200 text-bark-300 hover:border-gold/40'
              }`}
            >
              <Star className="h-4.5 w-4.5" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="rev-text">What happened at your table?</label>
        <textarea id="rev-text" rows={4} className="field resize-none" value={text} onChange={(e) => setText(e.target.value)} placeholder="The pod, the food, the wait, the people — the honest version." />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary btn-sm">
          {busy ? 'Sending…' : 'Send for approval'}
        </button>
        <button type="button" onClick={onDone} className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-clay-600">
          Cancel
        </button>
      </div>
      <p className="text-[11.5px] leading-relaxed text-ink-muted">
        Reviews submitted here are moderated before publishing — the security rules store them with{' '}
        <code className="rounded bg-bark-100 px-1">approved: false</code> until an admin publishes them.
      </p>
    </form>
  );
}

/* ---------------------------------------------------------------------------
   Reviews — pull-style wall of testimonials next to the Google aggregate.
   Content is read live from the `reviews` collection.
--------------------------------------------------------------------------- */
export default function ReviewsSection({ preview = false }) {
  const { reviews, reviewsLoading } = useData();
  const [writing, setWriting] = useState(false);
  const shown = preview ? reviews.slice(0, 4) : reviews;

  const average = useMemo(() => {
    if (!reviews.length) return VENUE.rating.value;
    const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <section id="reviews" className="relative scroll-mt-24 overflow-hidden bg-cream-200/60 py-24 sm:py-32">
      <div className="grain-overlay" />
      <div className="shell relative">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* --------------------------------------------------- aggregate */}
          <Reveal>
            <p className="eyebrow">Reviews</p>
            <h2 className="mt-6 text-h2 section-title text-balance">
              Four thousand tables,
              <span className="italic text-clay-600"> four thousand opinions</span>
            </h2>

            <div className="mt-8 rounded-[1.75rem] border border-bark-200 bg-cream-50 p-7 shadow-card">
              <div className="flex items-end gap-4">
                <p className="font-display text-[4.5rem] leading-none text-forest-800">{VENUE.rating.value}</p>
                <div className="pb-2">
                  <Stars value={VENUE.rating.value} size="h-5 w-5" />
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {VENUE.rating.count.toLocaleString('en-IN')}+ {VENUE.rating.source}
                  </p>
                </div>
              </div>

              <dl className="mt-6 space-y-2">
                {DISTRIBUTION.map((d) => (
                  <div key={d.stars} className="flex items-center gap-3 text-[12px] text-ink-muted">
                    <dt className="w-8 shrink-0">{d.stars}★</dt>
                    <dd className="h-1.5 flex-1 overflow-hidden rounded-full bg-bark-200">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${d.pct}%` }} />
                    </dd>
                    <dd className="w-9 shrink-0 text-right tabular-nums">{d.pct}%</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 flex flex-col gap-2.5">
                <a
                  href={`${VENUE.mapsLink}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-outline btn-sm w-full"
                >
                  Read them on Google <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button onClick={() => setWriting((v) => !v)} className="btn-sm text-ink-soft underline decoration-clay-400/50 underline-offset-4 hover:text-clay-600">
                  {writing ? 'Close the form' : 'Leave a review of your visit'}
                </button>
              </div>

              {reviews.length > 0 && reviews.length !== VENUE.rating.count && (
                <p className="mt-4 border-t border-bark-200 pt-4 text-[12px] text-ink-muted">
                  {reviews.length} of those reviews are mirrored here — {average.toFixed(1)}★ average.
                </p>
              )}
            </div>

            {writing && <ReviewForm onDone={() => setWriting(false)} />}
          </Reveal>

          {/* ------------------------------------------------------- cards */}
          <div className={preview ? 'columns-1 gap-5 sm:columns-2' : 'columns-1 gap-5 sm:columns-2'}>
            {reviewsLoading && (
              <div className="space-y-5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-bark-200/50" />
                ))}
              </div>
            )}

            {shown.map((r, i) => (
              <Reveal key={r.id ?? i} delay={Math.min(i, 6) * 80} className="mb-5 break-inside-avoid">
                <figure className="card relative p-6">
                  <Quote className="absolute right-5 top-5 h-7 w-7 text-clay-200" />
                  <Stars value={r.rating} />
                  <blockquote className="mt-3.5 text-[14.5px] leading-relaxed text-ink-soft">“{r.text}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-bark-200/80 pt-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-800 text-[12px] font-semibold text-cream-100">
                      {initials(r.author) || 'G'}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-forest-800">{r.author}</span>
                      <span className="block text-[11.5px] text-ink-muted">
                        {r.source ?? 'Google'} · {r.date ? new Date(r.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </span>
                    {!r.approved && (
                      <span className="ml-auto rounded-full bg-bark-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                        awaiting approval
                      </span>
                    )}
                  </figcaption>
                </figure>
              </Reveal>
            ))}

            {!reviewsLoading && shown.length === 0 && (
              <div className="card p-8 text-center text-sm text-ink-muted">
                No reviews mirrored yet. Seed starter content from Admin → Dashboard, or add the first one above.
              </div>
            )}
          </div>
        </div>

        {preview && (
          <Reveal className="mt-12 flex justify-center">
            <a href={`${VENUE.mapsLink}`} target="_blank" rel="noreferrer noopener" className="btn-outline btn-sm">
              All {VENUE.rating.count.toLocaleString('en-IN')}+ reviews <ArrowRight className="h-4 w-4" />
            </a>
          </Reveal>
        )}

        {!preview && (
          <Reveal className="mt-14 flex flex-col items-center gap-4 rounded-[1.75rem] border border-forest-300/30 bg-forest-800/[0.04] p-8 text-center">
            <CheckCircle className="h-7 w-7 text-forest-600" />
            <p className="max-w-2xl font-display text-xl italic leading-snug text-forest-800">
              “They remembered we were celebrating, moved us under the tree without being asked, and the bill matched the
              estimate to the rupee. That is the whole review.”
            </p>
            <p className="text-[12px] uppercase tracking-[0.14em] text-ink-muted">
              Sneha A. · hosted 45 guests on the lawn
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
