import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView.jsx';
import { FilterPanel, TimeBar, ListSheet, EventDetail, ProfilePanel, AuthScreen } from './components/Panels.jsx';
import { Pintadera, ZigzagBand } from './components/Motifs.jsx';
import { store, MODE, supabase } from './lib/store.js';
import { applyFilters, activeFilterCount, EMPTY_FILTERS } from './lib/filters.js';
import { weekendWindow, weekdayWindow, dayLabel } from './lib/time.js';
import { pushSupport, pushEnabled, enablePush } from './lib/push.js';

const LS_FILTERS = 'planes-adayai-filters';
const loadFilters = () => { try { return { ...EMPTY_FILTERS, ...JSON.parse(localStorage.getItem(LS_FILTERS)), atTime: null, day: null }; } catch { return EMPTY_FILTERS; } };

export default function App() {
  const [session, setSession] = useState(undefined);
  const [me, setMe] = useState(null);
  const [events, setEvents] = useState([]);
  const [favSets, setFavSets] = useState({ mine: new Set(), partner: new Set() });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tab, setTab] = useState('finde');
  const [filters, setFilters] = useState(loadFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sheet, setSheet] = useState('peek');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [push, setPush] = useState({ support: { ok: false }, enabled: false });

  useEffect(() => { try { localStorage.setItem(LS_FILTERS, JSON.stringify({ ...filters, atTime: null, day: null })); } catch { /* */ } }, [filters]);

  useEffect(() => {
    store.session().then(setSession);
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      return () => data.subscription.unsubscribe();
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      const [m, ev, fv, lu] = await Promise.all([store.me(), store.events(), store.favorites(), store.lastUpdate()]);
      setMe(m); setEvents(ev); setFavSets(fv); setLastUpdate(lu);
      setPush({ support: pushSupport(), enabled: await pushEnabled() });
    } catch (e) { setError(e.message || String(e)); }
  }, []);

  useEffect(() => { if (session) reload(); }, [session, reload]);

  // Favoritos de la pareja en tiempo real
  useEffect(() => {
    if (!supabase || !session) return;
    const ch = supabase.channel('favs').on('postgres_changes', { event: '*', schema: 'public', table: 'favorites' }, () =>
      store.favorites().then(setFavSets)).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session]);

  const favs = useMemo(() => ({
    ...favSets, both: new Set([...favSets.mine].filter(id => favSets.partner.has(id))),
  }), [favSets]);

  const win = useMemo(() => (tab === 'semana' ? weekdayWindow() : weekendWindow()), [tab]);
  const ctx = { myLikes: me?.likes || [], partnerLikes: me?.partner?.likes || [] };

  const visible = useMemo(() => {
    if (tab === 'match') return applyFilters(events.filter(e => favs.both.has(e.id) && new Date(e.end) > new Date()), filters, { ...ctx, window: null });
    return applyFilters(events, filters, { ...ctx, window: win });
  }, [events, filters, win, tab, favs, me]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedEv = events.find(e => e.id === selected);
  const onSelect = useCallback((id) => setSelected(id), []);

  const toggleFav = async (id, isFav) => {
    // optimista
    setFavSets(f => { const mine = new Set(f.mine); isFav ? mine.delete(id) : mine.add(id); return { ...f, mine }; });
    const r = await store.toggleFavorite(id, isFav);
    if (r?.error) { setError(r.error.message); store.favorites().then(setFavSets); }
  };

  if (session === undefined) return <div className="splash"><Pintadera size={72} /></div>;
  if (!session) return <AuthScreen onSignIn={store.signIn} onSignUp={store.signUp} />;

  const nFilters = activeFilterCount(filters);
  const winLabel = tab === 'match' ? 'Planes que os gustan a los dos'
    : `${dayLabel(win.start)} → ${dayLabel(win.end)}`;

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><Pintadera size={34} /><div><h1>Planes Adayai</h1><span className="sub">{winLabel}</span></div></div>
        <button className="avatar" onClick={() => setProfileOpen(true)} aria-label="Perfil">{(me?.name || '?')[0]}</button>
        <button className="filter-btn" onClick={() => setFiltersOpen(true)} aria-label="Filtros">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4-2v-4z" fill="currentColor" /></svg>
          Filtros{nFilters ? <span className="badge">{nFilters}</span> : null}
        </button>
      </header>
      <ZigzagBand height={6} />
      <nav className="tabs">
        {[['finde', 'Este finde'], ['semana', 'Entre semana'], ['match', `💛 Match${favs.both.size ? ` (${favs.both.size})` : ''}`]].map(([id, label]) =>
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setFilters(f => ({ ...f, atTime: null, day: null })); }}>{label}</button>)}
      </nav>
      {MODE === 'demo' && <div className="demo-flag">Demo · eventos de ejemplo · viendo como <b>{me?.name}</b></div>}
      {error && <div className="error" onClick={() => setError('')}>{error} ✕</div>}

      <main className="stage">
        <MapView events={visible} selectedId={selected} onSelect={onSelect} favs={favs} />
        {tab !== 'match' && <TimeBar window={win} day={filters.day} atTime={filters.atTime} allLabel={tab === 'finde' ? 'Todo el finde' : 'Toda la semana'}
          setDay={(d) => setFilters(f => ({ ...f, day: d }))} setAtTime={(t) => setFilters(f => ({ ...f, atTime: t }))} />}
        <ListSheet events={visible} state={sheet} setState={setSheet} onSelect={onSelect} favs={favs}
          emptyText={tab === 'match' ? 'Aún no hay matches. Marca planes con ❤️ y, si a tu pareja también le gustan, aparecerán aquí.' : 'No hay planes con estos filtros. Prueba a quitar alguno.'} />
      </main>

      <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} setFilters={setFilters} me={me} />
      <EventDetail ev={selectedEv} onClose={() => setSelected(null)} favs={favs} onToggleFav={toggleFav} me={me} />
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} me={me} mode={MODE} push={push} lastUpdate={lastUpdate}
        onSaveLikes={async (likes) => { setMe(m => ({ ...m, likes })); await store.updateProfile({ likes }); }}
        onSwitchUser={async () => { await store.switchUser(); await reload(); }}
        onLink={async (code) => { const r = await store.linkPartner(code); if (!r?.error) await reload(); return r; }}
        onUnlink={async () => { await store.unlinkPartner(); await reload(); }}
        onSignOut={async () => { await store.signOut(); setMe(null); }}
        onEnablePush={async () => { const r = await enablePush(); if (r.error) setError(r.error); setPush({ support: pushSupport(), enabled: await pushEnabled() }); }} />
    </div>
  );
}
