// Notificaciones push web (Android: directo; iPhone: solo con la app añadida a la pantalla de inicio).
import { store, MODE } from './store.js';

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export function pushSupport() {
  if (MODE === 'demo') return { ok: false, reason: 'Los avisos se activan cuando la app esté conectada a Supabase.' };
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'Este navegador no admite avisos.' };
  if (isIOS() && !isStandalone()) return { ok: false, reason: 'ios-install' };
  if (!('PushManager' in window)) return { ok: false, reason: 'Este navegador no admite avisos.' };
  if (!VAPID) return { ok: false, reason: 'Falta la clave VAPID en la configuración.' };
  return { ok: true };
}

function b64ToUint8(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function enablePush() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { error: 'Permiso de notificaciones denegado.' };
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(VAPID) }));
  const { error } = await store.savePush(sub);
  return { error: error?.message };
}

export async function pushEnabled() {
  try {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(await reg?.pushManager?.getSubscription());
  } catch { return false; }
}
