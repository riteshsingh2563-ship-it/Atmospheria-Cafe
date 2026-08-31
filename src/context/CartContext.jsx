import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PORTIONS, TAX_RATE, PACKAGING_FEE } from '../lib/venue.js';

/* ---------------------------------------------------------------------------
   CartContext — the takeaway / dine-in order basket.

   A cart line is a dish plus its customisation (portion, spice, add-ons, note).
   Two lines of the same dish with different options are separate lines, so the
   key is a deterministic hash of the choice set.
--------------------------------------------------------------------------- */

const CART_KEY = 'atmospheria.cart.v1';
const CartCtx = createContext(null);

const money = (n) => Math.round(n);

export function lineKey(itemId, opts = {}) {
  const addons = (opts.addons || []).map((a) => a.id).sort().join('+');
  return [itemId, opts.portion?.id ?? 'regular', opts.spice ?? '', addons, (opts.notes || '').trim().toLowerCase()].join('|');
}

export function priceLine(item, opts = {}) {
  const portion = opts.portion ?? PORTIONS[0];
  const addons = opts.addons || [];
  const base = money(Number(item.price) * (portion.multiplier ?? 1));
  const extras = money(addons.reduce((s, a) => s + Number(a.price || 0), 0));
  return base + extras;
}

export function cartTotals(lines, orderType = 'takeaway') {
  const subtotal = money(lines.reduce((s, l) => s + l.linePrice * l.qty, 0));
  const tax = money(subtotal * TAX_RATE);
  const packaging = orderType === 'takeaway' && lines.length ? PACKAGING_FEE : 0;
  return { subtotal, tax, packaging, total: subtotal + tax + packaging };
}

function load() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(load);
  const [orderType, setOrderType] = useState(() => localStorage.getItem('atmospheria.cart.type.v1') || 'dine-in');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
      localStorage.setItem('atmospheria.cart.type.v1', orderType);
    } catch {
      /* storage full or blocked — cart stays in memory */
    }
  }, [lines, orderType]);

  const add = useCallback((item, opts = {}) => {
    const key = lineKey(item.id, opts);
    const line = {
      key,
      itemId: item.id,
      name: item.name,
      photo: item.photo,
      veg: Boolean(item.veg),
      category: item.category,
      portion: opts.portion ?? PORTIONS[0],
      spice: opts.spice ?? '',
      addons: opts.addons ?? [],
      notes: opts.notes ?? '',
      linePrice: priceLine(item, opts),
      qty: 1,
    };
    setLines((prev) => {
      const i = prev.findIndex((l) => l.key === key);
      if (i === -1) return [...prev, line];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + 1 };
      return next;
    });
    return line;
  }, []);

  const setQty = useCallback((key, qty) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((key) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const totals = useMemo(() => cartTotals(lines, orderType), [lines, orderType]);

  const value = useMemo(
    () => ({ lines, add, setQty, remove, clear, count, totals, orderType, setOrderType, drawerOpen, setDrawerOpen }),
    [lines, add, setQty, remove, clear, count, totals, orderType, drawerOpen],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
