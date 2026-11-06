import { BANDS, PRICE_BUCKETS } from '../data/taxonomy.js';
import { eventInterval, overlaps, startOfDay } from './time.js';

export const EMPTY_FILTERS = {
  who: 'todos',          // todos | mine | partner | both
  categories: [],        // ids de categoría
  subs: [],              // "cat:sub"
  zones: [],
  prices: [],
  bands: [],
  atTime: null,          // ms: solo eventos activos en ese instante
};

export const activeFilterCount = (f) =>
  (f.who !== 'todos' ? 1 : 0) + f.categories.length + f.subs.length + f.zones.length + f.prices.length + f.bands.length + (f.atTime ? 1 : 0);

const likesEvent = (likes, ev) => (ev.tags || []).some(t => likes.includes(t));

function matchesPrice(ev, ids) {
  if (!ids.length) return true;
  const known = ev.priceMin != null;
  return ids.some(id => {
    if (id === 'desconocido') return !known;
    if (!known) return false;
    const b = PRICE_BUCKETS.find(p => p.id === id);
    const lo = ev.priceMin, hi = ev.priceMax ?? ev.priceMin;
    if (b.id === 'gratis') return lo === 0;
    return lo <= b.max && hi >= b.min;
  });
}

function matchesBand(ev, ids) {
  if (!ids.length || ev.allDay) return true;
  const iv = eventInterval(ev);
  for (let d = startOfDay(iv.s); d <= iv.e; d = new Date(d.getTime() + 86400000)) {
    for (const id of ids) {
      const b = BANDS.find(x => x.id === id);
      const s = new Date(d); s.setHours(b.from, 0, 0, 0);
      const e = new Date(d); e.setHours(b.to, 0, 0, 0); // setHours(27) pasa al día siguiente a las 3
      if (overlaps(iv, { s, e })) return true;
    }
    // la noche del día anterior (00:00–03:00)
    if (ids.includes('noche')) {
      const s = new Date(d); const e = new Date(d); e.setHours(3, 0, 0, 0);
      if (overlaps(iv, { s, e })) return true;
    }
  }
  return false;
}

export function applyFilters(events, f, { window, myLikes, partnerLikes }) {
  return events.filter(ev => {
    const iv = eventInterval(ev);
    if (window && !overlaps(iv, { s: window.start, e: window.end })) return false;
    if (f.who === 'mine' && !likesEvent(myLikes, ev)) return false;
    if (f.who === 'partner' && !likesEvent(partnerLikes, ev)) return false;
    if (f.who === 'both' && !(likesEvent(myLikes, ev) && likesEvent(partnerLikes, ev))) return false;
    if (f.categories.length || f.subs.length) {
      const inCat = f.categories.includes(ev.category);
      const inSub = f.subs.includes(`${ev.category}:${ev.subcategory}`);
      if (!inCat && !inSub) return false;
    }
    if (f.zones.length && !f.zones.includes(ev.zone)) return false;
    if (!matchesPrice(ev, f.prices)) return false;
    if (!matchesBand(ev, f.bands)) return false;
    if (f.atTime) {
      const t = new Date(f.atTime);
      if (ev.allDay) { if (startOfDay(t) < startOfDay(iv.s) || t > iv.e) return false; }
      else if (!(iv.s <= t && t < iv.e)) return false;
    }
    return true;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));
}

export const priceLabel = (ev) => {
  if (ev.priceMin == null) return 'Precio sin confirmar';
  if (ev.priceMin === 0 && !ev.priceMax) return 'Gratis';
  if (ev.priceMax && ev.priceMax !== ev.priceMin) return `${ev.priceMin}–${ev.priceMax} €`;
  return `${ev.priceMin} €`;
};
