// Valida un lote de eventos del recolector y, si hay credenciales, lo carga en Supabase.
//   node scripts/ingest.mjs events/2026-11-12.json            → solo valida
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/ingest.mjs events/…json  → valida y carga
import { readFileSync, readdirSync } from 'node:fs';
import { CATEGORIES, TAGS, zoneOfMunicipality } from '../src/data/taxonomy.js';

const file = process.argv[2] || 'events/' + readdirSync('events').filter(f => f.endsWith('.json')).sort().at(-1);
const batch = JSON.parse(readFileSync(file, 'utf8'));
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
