import { createContext, useContext, useMemo } from 'react';
import { subscribeMenu, subscribeGallery, subscribeReviews, initialMenu, initialGallery, initialReviews } from '../lib/api.js';
import { useLive } from '../hooks/useLive.js';
import { CATEGORY_BY_ID } from '../lib/venue.js';

/* ---------------------------------------------------------------------------
   DataContext — one subscription per collection, shared by every public page.
   Firestore bills per document read, so we deliberately subscribe once at the
   root instead of per-component.
--------------------------------------------------------------------------- */

const DataCtx = createContext(null);

export function DataProvider({ children }) {
  // Evaluated once: these are only read by useState's lazy initialiser.
  const seed = useMemo(() => ({ menu: initialMenu(), gallery: initialGallery(), reviews: initialReviews() }), []);
  const menu = useLive(subscribeMenu, { initial: seed.menu });
  const gallery = useLive(subscribeGallery, { initial: seed.gallery });
  const reviews = useLive(subscribeReviews, { initial: seed.reviews });

  const value = useMemo(() => {
    const items = menu.rows.filter((m) => m && m.name);
    const byId = new Map(items.map((m) => [m.id, m]));
    const byCategory = items.reduce((acc, m) => {
      const key = m.category || 'uncategorised';
      (acc[key] ||= []).push(m);
      return acc;
    }, {});
    Object.values(byCategory).forEach((list) => list.sort((a, b) => (a.sortOrder ?? 9e9) - (b.sortOrder ?? 9e9)));
    return {
      items,
      byId,
      byCategory,
      loading: menu.loading,
      gallery: gallery.rows,
      galleryLoading: gallery.loading,
      reviews: reviews.rows,
      reviewsLoading: reviews.loading,
    };
  }, [menu.rows, menu.loading, gallery.rows, gallery.loading, reviews.rows, reviews.loading]);

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export const useData = () => useContext(DataCtx);
