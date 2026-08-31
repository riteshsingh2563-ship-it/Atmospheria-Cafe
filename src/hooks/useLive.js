import { useEffect, useRef, useState } from 'react';

/**
 * Subscribes to one of the api.js streams (Firestore onSnapshot in live mode,
 * localBackend listener in demo mode) and keeps the result in state.
 *
 * @param {(cb:(rows:any[])=>void)=>() => void} subscribe  stable module-level fn
 */
export function useLive(subscribe, { enabled = true, initial } = {}) {
  // `initial` lets demo mode paint with data on the very first render instead
  // of flashing a loading state for one frame.
  const [rows, setRows] = useState(() => (Array.isArray(initial) ? initial : []));
  const [loading, setLoading] = useState(() => (Array.isArray(initial) ? false : enabled));
  const [error, setError] = useState(null);
  const subRef = useRef(subscribe);
  subRef.current = subscribe;

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    setLoading(true);
    const unsub = subRef.current((data, err) => {
      if (!alive) return;
      setRows(Array.isArray(data) ? data : []);
      setError(err ?? null);
      setLoading(false);
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, [enabled]);

  return { rows, loading, error };
}

/** True once the page has scrolled past `offset` px. */
export function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);
  return scrolled;
}

/** Index of the section currently in view — powers the nav underline. */
export function useActiveSection(ids, enabled = true) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return undefined;
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.2, 0.6] },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [ids.join('|'), enabled]);
  return active;
}

/** Normalised pointer progress (0–1) across an element — used for hero parallax. */
export function usePointerParallax(enabled = true) {
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--px', x.toFixed(4));
      el.style.setProperty('--py', y.toFixed(4));
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [enabled]);
  return ref;
}
