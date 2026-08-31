import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { MenuBrowser } from '../sections/MenuSection.jsx';
import GallerySection from '../sections/GallerySection.jsx';
import EventsSection from '../sections/EventsSection.jsx';
import ReviewsSection from '../sections/ReviewsSection.jsx';
import LocationSection from '../sections/LocationSection.jsx';
import BookingSection from '../sections/BookingSection.jsx';
import OrderCheckout from '../sections/OrderSection.jsx';
import { VENUE } from '../lib/venue.js';
import { Link } from 'react-router-dom';
import { Instagram, ArrowRight, ShoppingBag } from '../components/Icons.jsx';

export function MenuPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Menu"
        title="Everything we cook,"
        titleAccent="priced as it is billed"
        lede="Four cuisines off one pass. Prices are per portion and exclude taxes; the veg and non-veg marks follow the FSSAI convention. Dishes marked 86'd are off today — the kitchen runs out of some things and we would rather say so."
        photo="/images/ambience/menu-open-kitchen.jpg"
        alt="The open kitchen at Atmospheria with the tandoor glowing and chefs plating dishes"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/order" className="btn-primary btn-sm">
            <ShoppingBag className="h-4 w-4" /> Start an order
          </Link>
          <Link to="/book" className="btn-ghost-light btn-sm">
            Book a table first
          </Link>
        </div>
      </PageHeader>
      <MenuBrowser />
      <div className="shell pb-24 pt-4">
        <p className="text-[12px] text-ink-muted">
          Allergen and dietary information is available on request — the kitchen handles nut, dairy and gluten across
          sections. Jain preparations (no onion, no garlic) are available on most North Indian dishes with 20 minutes
          notice.
        </p>
      </div>
    </>
  );
}

export function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="The courtyard, the pass"
        titleAccent="and the parties"
        lede="Photographs from our Instagram grid, the Google Maps listing and the events we have hosted. Albums are managed from the admin portal, so what you see here is what the venue last uploaded."
        photo="/images/ambience/gallery-hero-courtyard.jpg"
        alt="Evening photograph of the Atmospheria courtyard with lanterns, plants and guests seated at wooden tables"
      >
        <a href={VENUE.instagram} target="_blank" rel="noreferrer noopener" className="btn-ghost-light btn-sm mt-8 inline-flex">
          <Instagram className="h-4 w-4" /> Follow {VENUE.instagramHandle} <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </PageHeader>
      <GallerySection />
    </>
  );
}

export function EventsPage() {
  const [params] = useSearchParams();
  return (
    <>
      <EventsSection />
      <div className="border-t border-bark-200 bg-cream-200/40">
        <BookingSection variant="full" initialType="event" initialEvent={params.get('event') || ''} />
      </div>
      <ReviewsSection />
    </>
  );
}

export function BookPage() {
  const [params] = useSearchParams();
  return <BookingSection variant="full" initialType={params.get('type') || 'table'} initialEvent={params.get('event') || ''} />;
}

export function OrderPage() {
  return (
    <>
      <PageHeader
        eyebrow="Order"
        title="Dine-in or takeaway,"
        titleAccent="straight to the pass"
        lede="Build the order here — portion, spice, add-ons — and it lands on the kitchen screen with your table number or a takeaway reference. You get a live status the whole way: received, preparing, ready, served."
        photo="/images/ambience/order-pass-kitchen.jpg"
        alt="Plated dishes waiting on the kitchen pass at Atmospheria before being carried out to the courtyard"
      />
      <div className="bg-cream-100">
        <MenuBrowser />
      </div>
      <div className="border-t border-bark-200 bg-cream-200/40 py-16 sm:py-20">
        <div className="shell">
          <OrderCheckout />
        </div>
      </div>
    </>
  );
}

export function VisitPage() {
  return (
    <>
      <PageHeader
        eyebrow="Visit"
        title="VIP Road, Vishal Nagar —"
        titleAccent="look for the lights"
        lede="Open all seven days from 2 PM. Parking on site, step-free entrance, and the courtyard visible from the road once the fairy lights come on."
        photo="/images/ambience/entrance-night-signage.jpg"
        alt="The entrance to Atmospheria at night with the lit signboard and lanterns along the path"
      />
      <LocationSection />
      <div className="border-t border-bark-200 bg-cream-200/40">
        <BookingSection variant="full" />
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <div className="grid min-h-[80svh] place-items-center bg-cream-100 px-6 pt-24 text-center">
      <div>
        <p className="eyebrow justify-center">404</p>
        <h1 className="mt-5 font-display text-5xl text-forest-800">This table does not exist</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          The page you were looking for has been moved or never set. The courtyard, however, is open from 2 PM.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary btn-sm">
            Back to the courtyard
          </Link>
          <Link to="/menu" className="btn-outline btn-sm">
            See the menu
          </Link>
        </div>
      </div>
    </div>
  );
}
