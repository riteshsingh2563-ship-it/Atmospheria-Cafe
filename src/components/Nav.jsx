import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useScrolled, useActiveSection } from '../hooks/useLive.js';
import { useCart } from '../context/CartContext.jsx';
import { VENUE } from '../lib/venue.js';
import { MenuBars, X, ShoppingBag, Leaf } from './Icons.jsx';

const LINKS = [
  { href: '/#about', label: 'About' },
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/events', label: 'Events' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/visit', label: 'Visit' },
];

export default function Nav() {
  const scrolled = useScrolled(40);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { count, setDrawerOpen } = useCart();
  const [open, setOpen] = useState(false);

  const isHome = pathname === '/';
  const overHero = isHome && !scrolled;
  const active = useActiveSection(['about', 'menu', 'gallery', 'events', 'reviews', 'visit'], isHome);

  useEffect(() => setOpen(false), [pathname]);

  const go = (href) => (e) => {
    e.preventDefault();
    setOpen(false);
    if (href.startsWith('/#')) {
      const id = href.slice(2);
      if (pathname !== '/') {
        navigate(`/#${id}`);
        return;
      }
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `/#${id}`);
      return;
    }
    navigate(href);
  };

  const isActive = (href) => {
    if (href.startsWith('/#')) return isHome && active === href.slice(2);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={[
          'fixed inset-x-0 top-0 z-[90] transition-all duration-500',
          overHero
            ? 'bg-transparent py-4 text-cream-100'
            : 'border-b border-bark-200/70 bg-cream-100/[.92] py-2.5 text-ink shadow-[0_10px_30px_-24px_rgba(36,29,23,.6)] backdrop-blur-xl',
        ].join(' ')}
      >
        <div className="shell flex items-center justify-between gap-4">
          {/* ---------------------------------------------------- wordmark */}
          <Link to="/" className="group flex items-center gap-3" aria-label={`${VENUE.fullName} — home`}>
            <span
              className={[
                'grid h-10 w-10 place-items-center rounded-full border transition-colors duration-500',
                overHero ? 'border-cream-100/40 text-clay-200' : 'border-forest-800/20 text-clay-500',
              ].join(' ')}
            >
              <Leaf className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[1.35rem] font-medium tracking-tight">Atmospheria</span>
              <span
                className={[
                  'mt-1 block text-[9.5px] font-medium uppercase tracking-widest2 transition-colors duration-500',
                  overHero ? 'text-cream-100/70' : 'text-ink-muted',
                ].join(' ')}
              >
                The Courtyard Kitchen
              </span>
            </span>
          </Link>

          {/* ------------------------------------------------------- links */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={go(l.href)}
                className={[
                  'relative rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors duration-300',
                  overHero ? 'hover:text-clay-200' : 'hover:text-clay-600',
                  isActive(l.href) ? (overHero ? 'text-clay-200' : 'text-clay-600') : overHero ? 'text-cream-100/85' : 'text-ink-soft',
                ].join(' ')}
              >
                {l.label}
                <span
                  className={[
                    'absolute inset-x-3 -bottom-0.5 h-px origin-left transition-transform duration-300',
                    overHero ? 'bg-clay-200' : 'bg-clay-500',
                    isActive(l.href) ? 'scale-x-100' : 'scale-x-0',
                  ].join(' ')}
                />
              </a>
            ))}
          </nav>

          {/* --------------------------------------------------------- CTA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={[
                'relative hidden h-10 w-10 place-items-center rounded-full border transition-colors duration-300 sm:grid',
                overHero ? 'border-cream-100/40 hover:bg-cream-100/10' : 'border-bark-200 hover:border-clay-400 hover:text-clay-600',
              ].join(' ')}
              aria-label={`Open order basket, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-cream-50">
                  {count}
                </span>
              )}
            </button>

            <Link to="/book" className="btn-primary btn-sm hidden sm:inline-flex">
              Book a Table
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              className={[
                'grid h-10 w-10 place-items-center rounded-full border transition-colors lg:hidden',
                overHero ? 'border-cream-100/40 hover:bg-cream-100/10' : 'border-bark-200 hover:border-clay-400',
              ].join(' ')}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X className="h-5 w-5" /> : <MenuBars className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------- mobile nav */}
      <div
        id="mobile-nav"
        className={[
          'fixed inset-0 z-[85] lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity duration-400 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-x-0 top-0 origin-top bg-cream-100 px-5 pb-8 pt-24 shadow-lift transition-transform duration-500 ${
            open ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={go(l.href)}
                className="flex items-center justify-between border-b border-bark-200/70 py-3.5 font-display text-2xl text-forest-800"
              >
                {l.label}
                <span className="text-clay-400">→</span>
              </a>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/book" onClick={() => setOpen(false)} className="btn-primary w-full">
              Book a Table
            </Link>
            <Link to="/order" onClick={() => setOpen(false)} className="btn-outline w-full">
              Order Now {count > 0 && `· ${count}`}
            </Link>
          </div>
          <p className="mt-6 text-center text-[13px] text-ink-muted">
            {VENUE.hours.label} daily · {VENUE.address.line1}, {VENUE.address.city}
          </p>
        </div>
      </div>
    </>
  );
}
