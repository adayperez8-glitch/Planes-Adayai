// Capa de datos con dos modos:
//  - "supabase": cuentas reales, pareja, favoritos compartidos y eventos del recolector.
//  - "demo": todo en este navegador, con Aday y Yai simulados y eventos de ejemplo.
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_LIKES } from '../data/taxonomy.js';
import { demoEvents } from '../data/demoEvents.js';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const MODE = URL_ && KEY ? 'supabase' : 'demo';
export const supabase = MODE === 'supabase' ? createClient(URL_, KEY) : null;

/* ---------------------------- DEMO ---------------------------- */
const LS = 'planes-adayai-demo-v1';
const memory = { value: null };
function loadDemo() {
  if (memory.value) return memory.value;
  let v = null;
  try { v = JSON.parse(localStorage.getItem(LS)); } catch { /* sin almacenamiento */ }
  memory.value = v || {
    current: 'aday',
    users: {
      aday: { id: 'aday', name: 'Aday', likes: DEFAULT_LIKES.aday, favs: ['demo-finde-1', 'demo-finde-11', 'demo-finde-16'] },
      yai: { id: 'yai', name: 'Yai', likes: DEFAULT_LIKES.yai, favs: ['demo-finde-1', 'demo-finde-9', 'demo-finde-13', 'demo-finde-26'] },
    },
  };
  return memory.value;
}
function saveDemo() { try { localStorage.setItem(LS, JSON.stringify(memory.value)); } catch { /* ignorar */ } }
const other = (id) => (id === 'aday' ? 'yai' : 'aday');

const demo = {
  async session() { return { user: { id: loadDemo().current } }; },
  async signIn() { return { error: null }; },
  async signUp() { return { error: null }; },
  async signOut() {},
  async me() {
    const s = loadDemo(); const u = s.users[s.current]; const p = s.users[other(s.current)];
    return { id: u.id, name: u.name, likes: u.likes, partner: { id: p.id, name: p.name, likes: p.likes }, code: 'DEMO-1234' };
  },
  async switchUser() { const s = loadDemo(); s.current = other(s.current); saveDemo(); },
  async updateProfile(patch) { const s = loadDemo(); Object.assign(s.users[s.current], patch); saveDemo(); },
  async linkPartner() { return { error: null }; },
  async unlinkPartner() { return { error: { message: 'En modo demo la pareja es fija.' } }; },
  async events() { return demoEvents(); },
  async lastUpdate() { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 3) % 7)); d.setHours(7, 0, 0, 0); return d; },
  async favorites() {
    const s = loadDemo();
    return { mine: new Set(s.users[s.current].favs), partner: new Set(s.users[other(s.current)].favs) };
  },
  async toggleFavorite(eventId) {
    const s = loadDemo(); const u = s.users[s.current];
    u.favs = u.favs.includes(eventId) ? u.favs.filter(x => x !== eventId) : [...u.favs, eventId];
    saveDemo();
  },
  async savePush() { return { error: { message: 'Los avisos se activan al conectar Supabase.' } }; },
};

/* -------------------------- SUPABASE -------------------------- */
const rowToEvent = (r) => ({
  id: r.id, title: r.title, description: r.description, category: r.category, subcategory: r.subcategory,
  tags: r.tags || [], start: r.starts_at, end: r.ends_at, allDay: r.all_day, venue: r.venue,
  municipality: r.municipality, zone: r.zone, lat: r.lat, lng: r.lng,
  priceMin: r.price_min == null ? null : Number(r.price_min), priceMax: r.price_max == null ? null : Number(r.price_max),
  url: r.url, sources: r.sources || [], conflicts: r.conflicts,
});

const real = {
  async session() { const { data } = await supabase.auth.getSession(); return data.session; },
  async signIn(email, password) { return supabase.auth.signInWithPassword({ email, password }); },
  async signUp(email, password, name) {
    return supabase.auth.signUp({ email, password, options: { data: { name } } });
  },
  async signOut() { await supabase.auth.signOut(); },
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    let partner = null;
    if (p?.partner_id) {
      const { data: q } = await supabase.from('profiles').select('id,name,likes').eq('id', p.partner_id).single();
      partner = q;
    }
    return { id: user.id, name: p?.name ?? '', likes: p?.likes ?? [], partner, code: p?.link_code };
  },
  async updateProfile(patch) {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('profiles').update(patch).eq('id', user.id);
  },
  async linkPartner(code) { return supabase.rpc('link_partner', { code: code.trim().toUpperCase() }); },
  async unlinkPartner() { return supabase.rpc('unlink_partner'); },
  async events() {
    const from = new Date(); from.setHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + 14 * 86400000);
    const { data, error } = await supabase.from('events').select('*')
      .gte('ends_at', from.toISOString()).lte('starts_at', to.toISOString()).order('starts_at');
    if (error) throw error;
    return data.map(rowToEvent);
  },
  async lastUpdate() {
    const { data } = await supabase.from('ingest_log').select('created_at').order('created_at', { ascending: false }).limit(1);
    return data?.[0] ? new Date(data[0].created_at) : null;
  },
  async favorites() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('favorites').select('user_id,event_id');
    const mine = new Set(), partner = new Set();
    (data || []).forEach(f => (f.user_id === user.id ? mine : partner).add(f.event_id));
    return { mine, partner };
  },
  async toggleFavorite(eventId, isFav) {
    const { data: { user } } = await supabase.auth.getUser();
    if (isFav) return supabase.from('favorites').delete().eq('user_id', user.id).eq('event_id', eventId);
    return supabase.from('favorites').insert({ user_id: user.id, event_id: eventId });
  },
  async savePush(sub) {
    const { data: { user } } = await supabase.auth.getUser();
    const j = sub.toJSON();
    return supabase.from('push_subscriptions').upsert(
      { user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent },
      { onConflict: 'endpoint' });
  },
};

export const store = MODE === 'supabase' ? real : demo;
