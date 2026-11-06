// Planes Adayai · función "notify" (Supabase Edge Functions, Deno)
// La llama pg_cron cada 10 minutos. Envía:
//   1) Nuevo match (cola notification_queue)
//   2) Recordatorio a las 20:00 del día anterior a un plan en Match
//   3) Resumen del jueves a las 19:00 con los planes del finde que encajan con cada uno
// Todo en hora de Canarias. notification_log evita repetir avisos.
//
// Secretos de la función: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:tu@email), NOTIFY_SECRET
// Despliegue: supabase functions deploy notify --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const TZ = 'Atlantic/Canary';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);

// "2026-11-12 19:05:00" en hora de Canarias
const local = (d: Date) => d.toLocaleString('sv-SE', { timeZone: TZ });
const localDate = (d: Date) => local(d).slice(0, 10);
const localHour = (d: Date) => Number(local(d).slice(11, 13));
const localWeekday = (d: Date) => new Date(localDate(d) + 'T12:00:00Z').getUTCDay(); // 0 dom … 4 jue

async function alreadySent(userId: string, key: string) {
  const { error } = await db.from('notification_log').insert({ user_id: userId, key });
  return !!error; // si ya existía (clave primaria), no se reenvía
}

async function sendTo(userId: string, msg: { title: string; body: string; url?: string; tag?: string }) {
  const { data: subs } = await db.from('push_subscriptions').select('*').eq('user_id', userId);
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg));
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('id', s.id);
      else console.error('push', code, e);
    }
  }
}

async function processMatches() {
  const { data } = await db.from('notification_queue').select('*').is('sent_at', null).order('id').limit(50);
  for (const n of data ?? []) {
    if (n.kind === 'match') {
      await sendTo(n.user_id, { title: '💛 ¡Nuevo match Adayai!', body: `A los dos os gusta: ${n.payload.title}`, tag: `match-${n.payload.event_id}` });
    }
    await db.from('notification_queue').update({ sent_at: new Date().toISOString() }).eq('id', n.id);
  }
}

async function couples() {
  const { data } = await db.from('profiles').select('id,name,likes,partner_id').not('partner_id', 'is', null);
  return data ?? [];
}

async function reminders(now: Date) {
  const tomorrow = localDate(new Date(now.getTime() + 86400000));
  const { data: evs } = await db.from('events').select('id,title,venue,starts_at,all_day')
    .gte('starts_at', now.toISOString()).lte('starts_at', new Date(now.getTime() + 2 * 86400000).toISOString());
  const upcoming = (evs ?? []).filter(e => localDate(new Date(e.starts_at)) === tomorrow);
  if (!upcoming.length) return;
  const { data: favs } = await db.from('favorites').select('user_id,event_id').in('event_id', upcoming.map(e => e.id));
  for (const p of await couples()) {
    const mine = new Set((favs ?? []).filter(f => f.user_id === p.id).map(f => f.event_id));
    const theirs = new Set((favs ?? []).filter(f => f.user_id === p.partner_id).map(f => f.event_id));
    for (const e of upcoming.filter(e => mine.has(e.id) && theirs.has(e.id))) {
      if (await alreadySent(p.id, `reminder:${e.id}`)) continue;
      const hora = e.all_day ? 'todo el día' : `a las ${local(new Date(e.starts_at)).slice(11, 16)}`;
      await sendTo(p.id, { title: '⏰ Mañana tenéis plan', body: `${e.title} · ${hora} · ${e.venue ?? ''}`, tag: `rem-${e.id}` });
    }
  }
}

async function thursdaySummary(now: Date) {
  const key = `summary:${localDate(now)}`;
  const { data: evs } = await db.from('events').select('id,tags')
    .gte('starts_at', now.toISOString()).lte('starts_at', new Date(now.getTime() + 80 * 3600000).toISOString());
  const { data: users } = await db.from('profiles').select('id,name,likes');
  for (const u of users ?? []) {
    const n = (evs ?? []).filter(e => (e.tags ?? []).some((t: string) => (u.likes ?? []).includes(t))).length;
    if (!n || (await alreadySent(u.id, key))) continue;
    await sendTo(u.id, { title: '📅 Planes para este finde', body: `${n} planes que encajan contigo, ${u.name}. ¡Échales un ojo!`, tag: 'summary' });
  }
}

Deno.serve(async (req) => {
  if (req.headers.get('x-notify-secret') !== Deno.env.get('NOTIFY_SECRET')) return new Response('no', { status: 401 });
  const now = new Date();
  await processMatches();
  if (localHour(now) === 20) await reminders(now);
  if (localWeekday(now) === 4 && localHour(now) === 19) await thursdaySummary(now);
  return new Response(JSON.stringify({ ok: true, at: local(now) }), { headers: { 'Content-Type': 'application/json' } });
});
