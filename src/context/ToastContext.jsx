import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastCtx = createContext({ toasts: [], push: () => {}, dismiss: () => {} });

let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, { tone = 'info', title, duration = 4200 } = {}) => {
      const id = ++seq;
      setToasts((t) => [...t, { id, message, tone, title }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lift backdrop-blur',
              t.tone === 'error'
                ? 'border-clay-700/40 bg-clay-900/95 text-cream-100'
                : t.tone === 'success'
                  ? 'border-forest-300/40 bg-forest-800/95 text-cream-100'
                  : 'border-bark-300/40 bg-forest-950/95 text-cream-100',
            ].join(' ')}
          >
            <span className="mt-0.5 shrink-0">
              {t.tone === 'error' ? '!' : t.tone === 'success' ? '✓' : '•'}
            </span>
            <div className="min-w-0 flex-1">
              {t.title && <p className="font-semibold">{t.title}</p>}
              <p className={t.title ? 'mt-0.5 text-cream-100/80' : ''}>{t.message}</p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-full p-1 text-cream-100/60 transition hover:bg-cream-100/10 hover:text-cream-100"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* Body scroll lock — shared by the cart drawer, lightbox and mobile nav. */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
