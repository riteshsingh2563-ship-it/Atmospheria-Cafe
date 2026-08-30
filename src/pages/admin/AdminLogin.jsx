import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { isDemo, DEMO_ADMIN } from '../../lib/authApi.js';
import { VENUE } from '../../lib/venue.js';
import Photo from '../../components/Photo.jsx';
import { Lock, ArrowRight, Leaf, Alert } from '../../components/Icons.jsx';

export default function AdminLogin() {
  const { user, loading, signIn } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState(isDemo ? DEMO_ADMIN.email : '');
  const [password, setPassword] = useState(isDemo ? DEMO_ADMIN.password : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return <div className="grid min-h-svh place-items-center bg-cream-100 text-ink-muted">Checking session…</div>;
  }
  // Redirect via <Navigate/>, never navigate() during render.
  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const session = await signIn(email, password);
      push(`Signed in as ${session.email}`, { tone: 'success', title: 'Welcome back' });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-svh bg-cream-100 lg:grid-cols-2">
      {/* ---------------------------------------------------------- photo */}
      <div className="relative hidden overflow-hidden bg-forest-900 lg:block">
        {/* /images/ambience/admin-login-courtyard-night.jpg — Google Maps listing → Photos */}
        <Photo
          src="/images/ambience/admin-login-courtyard-night.jpg"
          alt="The Atmospheria courtyard at night with lanterns lit and tables set, photographed from the deck"
          ratio=""
          className="absolute inset-0 h-full w-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/60 to-forest-950/30" />
        <div className="grain-overlay" />
        <div className="relative flex h-full flex-col justify-between p-12 text-cream-100">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/30 text-clay-200">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-display text-xl">Atmospheria</span>
          </Link>
          <div>
            <p className="eyebrow eyebrow--light">Staff portal</p>
            <h1 className="mt-5 max-w-md font-display text-5xl leading-[1.05]">
              Run the courtyard <span className="italic text-clay-300">from one screen.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-cream-100/70">
              Tonight&apos;s bookings, the live order queue, the menu with 86&apos;d items and the gallery — everything the
              floor manager needs during service.
            </p>
          </div>
          <p className="text-[12px] text-cream-100/50">
            {VENUE.fullName} · {VENUE.address.line1}, {VENUE.address.city}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------- form */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-[13px] text-ink-muted transition hover:text-clay-600">
            ← Back to the website
          </Link>

          <span className="grid h-12 w-12 place-items-center rounded-full bg-forest-800 text-clay-200">
            <Lock className="h-5 w-5" />
          </span>
          <h2 className="mt-6 font-display text-4xl text-forest-800">Sign in</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Firebase Authentication, email and password. Admins are checked against the <code className="rounded bg-bark-100 px-1">admin_users</code> collection.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <div>
              <label className="label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@atmospheria.in"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-clay-300/60 bg-clay-500/10 px-4 py-3 text-[13px] text-clay-800">
                <Alert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5">
              {busy ? 'Signing in…' : 'Sign in'}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {isDemo && (
            <div className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bark-700">Demo mode</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                No Firebase project is configured, so the portal runs on a local stand-in. Sign in with:
              </p>
              <dl className="mt-3 space-y-1 font-mono text-[12.5px] text-forest-800">
                <div className="flex gap-2">
                  <dt className="text-ink-muted">email</dt>
                  <dd>{DEMO_ADMIN.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-ink-muted">password</dt>
                  <dd>{DEMO_ADMIN.password}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[12px] text-ink-muted">
                Copy <code className="rounded bg-cream-50 px-1">.env.example</code> to <code className="rounded bg-cream-50 px-1">.env</code>, fill in your Firebase
                keys and the same screens talk to Firestore instead.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
