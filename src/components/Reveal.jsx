import { useEffect, useRef } from 'react';

/* ---------------------------------------------------------------------------
   <Reveal/> — subtle scroll-in motion.

   IntersectionObserver adds `.is-visible`; the CSS lives in index.css and is
   fully disabled under `prefers-reduced-motion`. One shared observer keeps the
   scroll handler count at zero.
--------------------------------------------------------------------------- */

let observer = null;
const watched = new WeakMap();

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  return observer;
}

export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const nodeRef = useRef(null);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    // No IntersectionObserver (old browser / SSR) → just show it.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    watched.set(el, true);
    getObserver().observe(el);
    return () => {
      getObserver().unobserve(el);
      watched.delete(el);
    };
  }, [delay]);

  return (
    <Tag ref={nodeRef} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Staggered grid helper — wraps children in Reveal with increasing delay. */
export function RevealGroup({ items, render, className = '', step = 90, as: Tag = 'div' }) {
  return (
    <Tag className={className}>
      {items.map((item, i) => (
        <Reveal key={item.id ?? i} delay={i * step}>
          {render(item, i)}
        </Reveal>
      ))}
    </Tag>
  );
}

/** Count-up used on the stats strip. */
export function useCountUp(target, { duration = 1400, start = false } = {}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}
