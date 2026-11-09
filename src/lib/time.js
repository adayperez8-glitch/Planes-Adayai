// Ventanas de tiempo: "Este finde" (viernes → domingo) y "Entre semana" (lunes → jueves).

const DAY = 86400000;

export function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

/** Viernes 00:00 → domingo 23:59 del finde en curso o del próximo. */
export function weekendWindow(now = new Date()) {
  const dow = now.getDay(); // 0 dom … 6 sáb
  const today = startOfDay(now);
  let friday;
  if (dow === 5) friday = today;
  else if (dow === 6) friday = new Date(today.getTime() - DAY);
  else if (dow === 0) friday = new Date(today.getTime() - 2 * DAY);
  else friday = new Date(today.getTime() + (5 - dow) * DAY);
  const start = new Date(friday); start.setHours(0, 0, 0, 0);
  const end = new Date(friday.getTime() + 2 * DAY); end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Entre semana = lunes 00:00 (u hoy) → jueves 23:59. De viernes a domingo, la semana siguiente.
 *  (El viernes pertenece al finde.) */
export function weekdayWindow(now = new Date()) {
  const dow = now.getDay();
  const today = startOfDay(now);
  const thuEnd = (mon) => { const t = new Date(mon.getTime() + 3 * DAY); t.setHours(23, 59, 59, 999); return t; };
  let monday = new Date(today.getTime() - ((dow + 6) % 7) * DAY);
  if (now > thuEnd(monday)) { monday = new Date(monday.getTime() + 7 * DAY); return { start: monday, end: thuEnd(monday) }; }
  return { start: today > monday ? today : monday, end: thuEnd(monday) };
}

export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAY_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const pad = (n) => String(n).padStart(2, '0');
export const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const dayLabel = (d) => `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const longDate = (d) => `${DAY_LONG[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;

/** Intervalo efectivo de un evento (los de "todo el día" ocupan 00:00–23:59 de cada día). */
export function eventInterval(ev) {
  const s = new Date(ev.start);
  let e = ev.end ? new Date(ev.end) : new Date(s.getTime() + 2 * 3600000);
  if (ev.allDay) { const s0 = startOfDay(s); const e0 = startOfDay(e); e0.setHours(23, 59, 59, 999); return { s: s0, e: e0 }; }
  return { s, e };
}

export const overlaps = (a, b) => a.s < b.e && b.s < a.e;

export function formatWhen(ev) {
  const { s, e } = eventInterval(ev);
  const sameDay = startOfDay(s).getTime() === startOfDay(e).getTime();
  if (ev.allDay) return sameDay ? `${dayLabel(s)} · todo el día` : `${dayLabel(s)} → ${dayLabel(e)} · todo el día`;
  return sameDay ? `${dayLabel(s)} · ${hhmm(s)}–${hhmm(e)}` : `${dayLabel(s)} ${hhmm(s)} → ${dayLabel(e)} ${hhmm(e)}`;
}
