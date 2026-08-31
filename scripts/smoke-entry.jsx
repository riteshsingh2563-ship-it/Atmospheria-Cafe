/* ---------------------------------------------------------------------------
   Smoke-test render entry.

   Loaded by scripts/smoke-test.mjs through Vite's ssrLoadModule so the JSX is
   transformed exactly the way the browser build transforms it. Nothing in the
   app imports this file, so it never lands in a production bundle.
--------------------------------------------------------------------------- */
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import { CartProvider } from '../src/context/CartContext.jsx';
import { DataProvider } from '../src/context/DataContext.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';

import Nav from '../src/components/Nav.jsx';
import Footer from '../src/components/Footer.jsx';
import CartDrawer from '../src/components/CartDrawer.jsx';
import HomePage from '../src/pages/HomePage.jsx';
import { MenuPage, GalleryPage, EventsPage, BookPage, OrderPage, VisitPage } from '../src/pages/PublicPages.jsx';
import AdminLogin from '../src/pages/admin/AdminLogin.jsx';
import Dashboard from '../src/pages/admin/Dashboard.jsx';
import BookingsManager from '../src/pages/admin/BookingsManager.jsx';
import OrdersManager from '../src/pages/admin/OrdersManager.jsx';
import MenuManager from '../src/pages/admin/MenuManager.jsx';
import GalleryManager from '../src/pages/admin/GalleryManager.jsx';
import Analytics from '../src/pages/admin/Analytics.jsx';

const wrap = (node, route = '/') => (
  <MemoryRouter initialEntries={[route]}>
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <DataProvider>{node}</DataProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  </MemoryRouter>
);

export const screens = {
  // The public chrome lives outside every page, so it needs its own render.
  shell: () =>
    wrap(
      <>
        <Nav />
        <Footer />
        <CartDrawer />
      </>,
    ),
  home: () => wrap(<HomePage />),
  menu: () => wrap(<MenuPage />, '/menu'),
  gallery: () => wrap(<GalleryPage />, '/gallery'),
  events: () => wrap(<EventsPage />, '/events'),
  book: () => wrap(<BookPage />, '/book'),
  order: () => wrap(<OrderPage />, '/order'),
  visit: () => wrap(<VisitPage />, '/visit'),
  adminLogin: () => wrap(<AdminLogin />, '/admin/login'),
  adminDashboard: () => wrap(<Dashboard />, '/admin'),
  adminBookings: () => wrap(<BookingsManager />, '/admin/bookings'),
  adminOrders: () => wrap(<OrdersManager />, '/admin/orders'),
  adminMenu: () => wrap(<MenuManager />, '/admin/menu'),
  adminGallery: () => wrap(<GalleryManager />, '/admin/gallery'),
  adminAnalytics: () => wrap(<Analytics />, '/admin/analytics'),
};
