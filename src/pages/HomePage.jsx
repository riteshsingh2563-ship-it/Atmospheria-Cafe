import Hero from '../sections/Hero.jsx';
import About from '../sections/About.jsx';
import { MenuTeaser } from '../sections/MenuSection.jsx';
import GallerySection from '../sections/GallerySection.jsx';
import BookingSection from '../sections/BookingSection.jsx';
import EventsSection from '../sections/EventsSection.jsx';
import ReviewsSection from '../sections/ReviewsSection.jsx';
import LocationSection from '../sections/LocationSection.jsx';
import { VENUE } from '../lib/venue.js';
import { Leaf } from '../components/Icons.jsx';

/* Thin scrolling strip between the hero and the copy — sets the tone. */
function CuisineMarquee() {
  const items = [...VENUE.cuisines, 'Tandoor', 'Wok', 'Wood oven', 'Coal grill', 'Mocktail bar', ...VENUE.cuisines, 'Tandoor', 'Wok', 'Wood oven', 'Coal grill', 'Mocktail bar'];
  return (
    <div className="relative overflow-hidden border-y border-bark-200 bg-cream-50 py-4">
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {items.map((c, i) => (
          <span key={`${c}-${i}`} className="flex items-center gap-10 text-[12px] font-medium uppercase tracking-widest2 text-ink-muted">
            {c}
            <Leaf className="h-3.5 w-3.5 text-clay-400" />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-cream-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-cream-50 to-transparent" />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <CuisineMarquee />
      <About />
      <MenuTeaser />
      <GallerySection preview limit={8} />
      <BookingSection variant="compact" />
      <EventsSection preview />
      <ReviewsSection preview />
      <LocationSection preview />
    </>
  );
}
