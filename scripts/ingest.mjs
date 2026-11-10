// Valida un lote de eventos del recolector y, si hay credenciales, lo carga en Supabase.
//   node scripts/ingest.mjs events/2026-11-12.json            → solo valida
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/ingest.mjs events/…json  → valida y carga
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { CATEGORIES, TAGS, zoneOfMunicipality } from '../src/data/taxonomy.js';

const file = process.argv[2] || 'events/' + readdirSync('events').filter(f => f.endsWith('.json')).sort().at(-1);
const batch = JSON.parse(readFileSync(file, 'utf8'));

// --- Planes manuales (collector/manual/*.json, p. ej. la agenda PDF del Cabildo) ---
// Se añaden a cualquier lote cuya ventana solapen. Si ya están (mismo día y título parecido,
// o mismo sitio y hora), no se duplican: solo se suma su fuente al plan existente.
const norm = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
const toks = (t) => new Set(norm(t).split(/\s+/).filter(w => w.length > 3));
const sim = (a, b) => { const A = toks(a), B = toks(b); const i = [...A].filter(x => B.has(x)).length; return i / Math.max(1, Math.min(A.size, B.size)); };
const dayOf = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Atlantic/Canary' });
export function mergeManual(b, dir = 'collector/manual') {
  const ws = Date.parse(b.window_start), we = Date.parse(b.window_end);
  let added = 0, merged = 0;
  if (!existsSync(dir)) return { added, merged };
  for (const f of readdirSync(dir).filter(x => x.endsWith('.json'))) {
    for (const m of JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')).events || []) {
      if (!(Date.parse(m.starts_at) < we && Date.parse(m.ends_at) > ws)) continue;
      const dup = b.events.find(e => e.id === m.id || (dayOf(e.starts_at) === dayOf(m.starts_at) &&
        (sim(e.title, m.title) >= 0.6 || (e.venue === m.venue && e.starts_at === m.starts_at && sim(e.title, m.title) >= 0.34))));
      if (dup) { for (const x of m.sources || []) if (!(dup.sources ||= []).some(y => y.url === x.url)) dup.sources.push(x); merged++; }
      else { b.events.push(structuredClone(m)); added++; }
    }
  }
  return { added, merged };
}
const mm = mergeManual(batch);
if (mm.added || mm.merged) console.log(`➕ Planes manuales: ${mm.added} añadidos, ${mm.merged} ya estaban (se suma la fuente)`);
const tagIds = new Set(TAGS.map(t => t.id));
const errors = [], warnings = [];

if (!batch.window_start || !batch.window_end || !Array.isArray(batch.events)) errors.push('Faltan window_start, window_end o events');
const ids = new Set();
for (const [i, e] of (batch.events || []).entries()) {
  const at = `#${i} "${e.title}"`;
  const cat = CATEGORIES.find(c => c.id === e.category);
  if (!e.id || ids.has(e.id)) errors.push(`${at}: id vacío o repetido`); ids.add(e.id);
  if (!e.title) errors.push(`${at}: sin título`);
  if (!cat) errors.push(`${at}: categoría desconocida "${e.category}"`);
  else if (e.subcategory && cat.subs.length && !cat.subs.some(s => s.id === e.subcategory)) errors.push(`${at}: subcategoría "${e.subcategory}" no existe en ${cat.id}`);
  for (const t of e.tags || []) if (!tagIds.has(t)) warnings.push(`${at}: etiqueta desconocida "${t}" (se quitará)`);
  e.tags = (e.tags || []).filter(t => tagIds.has(t));
  if (isNaN(Date.parse(e.starts_at)) || isNaN(Date.parse(e.ends_at))) errors.push(`${at}: fechas no válidas`);
  else if (Date.parse(e.ends_at) < Date.parse(e.starts_at)) errors.push(`${at}: termina antes de empezar`);
  e.zone = zoneOfMunicipality(e.municipality);
  if (!e.zone) errors.push(`${at}: municipio "${e.municipality}" no reconocido (usa el nombre oficial)`);
  if (typeof e.lat !== 'number' || typeof e.lng !== 'number' || e.lat < 27.6 || e.lat > 28.25 || e.lng < -15.9 || e.lng > -15.3)
    errors.push(`${at}: coordenadas fuera de Gran Canaria`);
  if (e.price_min != null && e.price_max != null && e.price_max < e.price_min) errors.push(`${at}: precio máximo < mínimo`);
}

warnings.forEach(w => console.warn('⚠️ ', w));
if (errors.length) { errors.forEach(e => console.error('❌', e)); process.exit(1); }
console.log(`✅ ${file}: ${batch.events.length} eventos válidos (${batch.window_start} → ${batch.window_end})`);

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ingest_events`, {
    method: 'POST',
    // Claves nuevas (sb_secret_…) van solo en "apikey"; las antiguas (JWT eyJ…) también en Authorization
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json',
      ...(SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } : {}),
    },
    body: JSON.stringify({ payload: batch }),
  });
  const text = await res.text();
  if (!res.ok) { console.error('❌ Supabase:', res.status, text); process.exit(1); }
  console.log('📥 Cargado en Supabase:', text);
}
