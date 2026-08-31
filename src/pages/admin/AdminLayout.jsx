import { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLive } from '../../hooks/useLive.js';
import { subscribeBookings, subscribeOrders } from '../../lib/api.js';
import { isDemo } from '../../lib/firebase.js';
import { VENUE, todayISO } from '../../lib/venue.js';
import {
  Dashboard as DashboardIcon,
  CalendarCheck,
  Receipt,
  BookOpen,
  Images,
  BarChart,
  LogOut,
  ExternalLink,
  Leaf,
  MenuBars,
  X,
  Alert,
} from '../../components/Icons.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/menu', label: 'Menu', icon: BookOpen },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart },
];

export default function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const { pathname } = useLocation();
  const [mobileNav, setMobileNav] = useState(false);

  const { rows: bookings } = useLive(subscribeBookings);
  const { rows: orders } = useLive(subscribeOrders);

  const today = todayISO();
  const counts = useMemo(() => {
    const pendingBookings = bookings.filter((b) => b.status === 'pending' && b.date >= today).length;
    const liveOrders = orders.filter((o) => ['received', 'preparing', 'ready'].includes(o.status)).length;
    return { pendingBookings, liveOrders };
  }, [bookings, orders, today]);

  useEffect(() => setMobileNav(false), [pathname]);

  if (loading) {
    return <div className="grid min-h-svh place-items-center bg-cream-100 text-ink-muted">Checking session…</div>;
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: pathname }} />;

  const badgeFor = (to) => {
    if (to === '/admin/bookings' && counts.pendingBookings) return counts.pendingBookings;
    if (to === '/admin/orders' && counts.liveOrders) return counts.liveOrders;
    return null;
  };

  return (
    <div className="min-h-svh bg-cream-100 lg:grid lg:grid-cols-[16.5rem_1fr]">
      {/* ------------------------------------------------------- sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[95] flex w-[16.5rem] flex-col bg-forest-900 text-cream-100 transition-transform duration-400 lg:translate-x-0 ${
          mobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-cream-100/10 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-cream-100/25 text-clay-200">
              <Leaf className="h-4.5 w-4.5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg">Atmospheria</p>
              <p className="text-[9.5px] uppercase tracking-widest2 text-cream-100/50">Staff portal</p>
            </div>
          </div>
          <button onClick={() => setMobileNav(false)} className="grid h-8 w-8 place-items-center rounded-full text-cream-100/70 lg:hidden" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Admin">
          {NAV.map((n) => {
            const badge = badgeFor(n.to);
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition ${
                    isActive ? 'bg-clay-500 text-cream-50 shadow-[0_8px_20px_-10px_rgba(196,98,45,.9)]' : 'text-cream-100/70 hover:bg-cream-100/10 hover:text-cream-100'
                  }`
                }
              >
                <n.icon className="h-4.5 w-4.5 shrink-0" />
                <span className="flex-1">{n.label}</span>
                {badge ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cream-100/20 px-1.5 text-[10.5px] font-bold">
                    {badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-cream-100/10 p-4">
          <div className="rounded-xl bg-cream-100/[0.06] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cream-100/45">Signed in</p>
            <p className="mt-1.5 truncate text-[13.5px] font-medium">{user.name || user.email}</p>
            <p className="truncate text-[11.5px] text-cream-100/50">{user.email}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cream-100/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-cream-100/70">
              {user.role}
            </p>
          </div>
          <button onClick={signOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cream-100/20 py-2.5 text-[13px] text-cream-100/80 transition hover:border-clay-300 hover:text-clay-200">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {mobileNav && <div className="fixed inset-0 z-[90] bg-forest-950/60 lg:hidden" onClick={() => setMobileNav(false)} />}

      {/* --------------------------------------------------------- main */}
      <div className="lg:col-start-2">
        <header className="sticky top-0 z-[80] flex items-center gap-3 border-b border-bark-200 bg-cream-100/[.92] px-4 py-3 backdrop-blur-xl sm:px-6">
          <button onClick={() => setMobileNav(true)} className="grid h-9 w-9 place-items-center rounded-full border border-bark-200 text-ink-soft lg:hidden" aria-label="Open navigation">
            <MenuBars className="h-4.5 w-4.5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              {VENUE.fullName} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="truncate font-display text-lg text-forest-800">
              {NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? 'Dashboard'}
            </p>
          </div>

          {isDemo && (
            <span className="hidden items-center gap-1.5 rounded-full border border-gold/40 bg-gold/[.12] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-bark-700 sm:inline-flex">
              <Alert className="h-3.5 w-3.5" /> Demo data
            </span>
          )}
          <a href="/" target="_blank" rel="noreferrer" className="btn-outline btn-sm hidden sm:inline-flex">
            View site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-bark-200 px-6 py-6 text-[12px] text-ink-muted">
          {VENUE.fullName} staff portal · Firestore collections: menu_items, bookings, orders, gallery, admin_users.
          {isDemo && ' Running on the local stand-in — nothing is stored on a server.'}
        </footer>
      </div>
    </div>
  );
}
