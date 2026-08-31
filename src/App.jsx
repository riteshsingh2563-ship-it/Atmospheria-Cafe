import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';

import HomePage from './pages/HomePage.jsx';
import ReviewsSection from './sections/ReviewsSection.jsx';
import PageHeader from './components/PageHeader.jsx';
import { VENUE } from './lib/venue.js';
import { MenuPage, GalleryPage, EventsPage, BookPage, OrderPage, VisitPage, NotFoundPage } from './pages/PublicPages.jsx';

/* The admin portal is code-split — guests never download Firestore admin UI. */
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const BookingsManager = lazy(() => import('./pages/admin/BookingsManager.jsx'));
const OrdersManager = lazy(() => import('./pages/admin/OrdersManager.jsx'));
const MenuManager = lazy(() => import('./pages/admin/MenuManager.jsx'));
const GalleryManager = lazy(() => import('./pages/admin/GalleryManager.jsx'));
const Analytics = lazy(() => import('./pages/admin/Analytics.jsx'));

function AdminFallback() {
  return (
    <div className="grid min-h-[70svh] place-items-center bg-cream-100">
      <div className="flex items-center gap-3 text-ink-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-clay-500" />
        Loading the admin portal…
      </div>
    </div>
  );
}

/** Scrolls to top on navigation, or to #hash when present. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

function PublicLayout({ children }) {
  return (
    <DataProvider>
      <Nav />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollManager />
            <Routes>
              {/* ------------------------------------------------ public */}
              <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/menu" element={<PublicLayout><MenuPage /></PublicLayout>} />
              <Route path="/gallery" element={<PublicLayout><GalleryPage /></PublicLayout>} />
              <Route path="/events" element={<PublicLayout><EventsPage /></PublicLayout>} />
              <Route path="/book" element={<PublicLayout><BookPage /></PublicLayout>} />
              <Route path="/order" element={<PublicLayout><OrderPage /></PublicLayout>} />
              <Route path="/visit" element={<PublicLayout><VisitPage /></PublicLayout>} />
              <Route path="/reviews" element={<PublicLayout><ReviewsSectionPage /></PublicLayout>} />

              {/* ------------------------------------------------- admin */}
              <Route
                path="/admin/login"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <AdminLogin />
                  </Suspense>
                }
              />
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <AdminLayout />
                  </Suspense>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="bookings" element={<BookingsManager />} />
                <Route path="orders" element={<OrdersManager />} />
                <Route path="menu" element={<MenuManager />} />
                <Route path="gallery" element={<GalleryManager />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>

              <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

/* Small wrapper so /reviews renders inside the public chrome. */
function ReviewsSectionPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reviews"
        title="What four thousand tables"
        titleAccent="have said"
        lede={`A ${VENUE.rating.value}★ average across ${VENUE.rating.count.toLocaleString('en-IN')}+ ${VENUE.rating.source}. The ones below are mirrored into our own system so the team can read them without leaving the dashboard.`}
        photo="/images/ambience/reviews-courtyard-tables.jpg"
        alt="Courtyard tables at Atmospheria seen from above with guests dining under string lights"
      />
      <ReviewsSection />
    </>
  );
}
