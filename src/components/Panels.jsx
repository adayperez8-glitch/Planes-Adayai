import { useState } from 'react';
import { CATEGORIES, CATEGORY_BY_ID, ZONES, PRICE_BUCKETS, BANDS, TAGS } from '../data/taxonomy.js';
import { EMPTY_FILTERS, activeFilterCount, priceLabel } from '../lib/filters.js';
import { formatWhen, dayLabel, hhmm, startOfDay, longDate } from '../lib/time.js';
import { ZigzagBand, Tunera, Volcan } from './Motifs.jsx';

const toggle = (arr, v) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
const Chip = ({ on, onClick, children, color }) => (
  <button className={'chip' + (on ? ' on' : '')} style={color ? { '--c': color } : undefined} onClick={onClick}>{children}</button>
);

/* ------------------------- Filtros (derecha) ------------------------- */
export function FilterPanel({ open, onClose, filters, setFilters, me }) {
  const [openCat, setOpenCat] = useState(null);
  const f = filters; const set = (patch) => setFilters({ ...f, ...patch });
  const partnerName = me?.partner?.name || 'Pareja';
  return (
    <>
      <div className={'scrim' + (open ? ' show' : '')} onClick={onClose} />
      <aside className={'filters' + (open ? ' open' : '')} aria-hidden={!open}>
        <header className="filters-head">
          <h2>Filtros</h2>
          <button className="link" onClick={() => setFilters(EMPTY_FILTERS)}>Limpiar</button>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <ZigzagBand />
        <div className="filters-body">
          <section>
            <h3>Para quién</h3>
            <div className="chips">
              <Chip on={f.who === 'todos'} onClick={() => set({ who: 'todos' })}>Todos</Chip>
              <Chip on={f.who === 'mine'} onClick={() => set({ who: 'mine' })}>Planes de {me?.name || 'mí'}</Chip>
              {me?.partner && <Chip on={f.who === 'partner'} onClick={() => set({ who: 'partner' })}>Planes de {partnerName}</Chip>}
              {me?.partner && <Chip on={f.who === 'both'} onClick={() => set({ who: 'both' })}>💛 Para los dos</Chip>}
            </div>
          </section>

          <section>
            <h3>Tipo de actividad</h3>
            <div className="cats">
              {CATEGORIES.map(c => {
                const subsOn = f.subs.filter(s => s.startsWith(c.id + ':')).length;
                return (
                  <div key={c.id} className="cat">
                    <div className="cat-row">
                      <Chip color={c.color} on={f.categories.includes(c.id)}
                        onClick={() => set({ categories: toggle(f.categories, c.id), subs: f.subs.filter(s => !s.startsWith(c.id + ':')) })}>
                        {c.emoji} {c.label}{subsOn ? ` · ${subsOn}` : ''}
                      </Chip>
                      {c.subs.length > 0 && (
                        <button className="expand" onClick={() => setOpenCat(openCat === c.id ? null : c.id)} aria-label={`Subtipos de ${c.label}`}>
                          {openCat === c.id ? '−' : '+'}
                        </button>
                      )}
                    </div>
                    {openCat === c.id && (
                      <div className="chips subs">
                        {c.subs.map(s => {
                          const k = `${c.id}:${s.id}`;
                          return <Chip key={k} color={c.color} on={f.subs.includes(k)}
                            onClick={() => set({ subs: toggle(f.subs, k), categories: f.categories.filter(x => x !== c.id) })}>{s.label}</Chip>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3>Zona</h3>
            <div className="chips">
              {ZONES.map(z => <Chip key={z.id} on={f.zones.includes(z.id)} onClick={() => set({ zones: toggle(f.zones, z.id) })}>{z.label}</Chip>)}
            </div>
          </section>

          <section>
            <h3>Precio</h3>
            <div className="chips">
              {PRICE_BUCKETS.map(p => <Chip key={p.id} on={f.prices.includes(p.id)} onClick={() => set({ prices: toggle(f.prices, p.id) })}>{p.label}</Chip>)}
            </div>
          </section>

          <section>
            <h3>Franja horaria</h3>
            <div className="chips">
              {BANDS.map(b => <Chip key={b.id} on={f.bands.includes(b.id)} onClick={() => set({ bands: toggle(f.bands, b.id) })}>{b.label} <small>{b.range}</small></Chip>)}
            </div>
            <p className="hint">Los planes sin hora cuentan como “todo el día”. Para una hora exacta, usa la barra sobre el mapa.</p>
          </section>
        </div>
        <footer className="filters-foot">
          <button className="btn primary" onClick={onClose}>Ver planes{activeFilterCount(f) ? ` (${activeFilterCount(f)} filtros)` : ''}</button>
        </footer>
      </aside>
    </>
  );
}

/* ------------------------- Barra de horas ------------------------- */
// Fila 1: elegir día (o todos). Fila 2: afinar a una hora concreta (opcional).
export function TimeBar({ window, day, atTime, setDay, setAtTime, allLabel }) {
  const step = 30 * 60000;
  const days = [];
  for (let d = startOfDay(window.start); d <= window.end; d = new Date(d.getTime() + 86400000)) days.push(d);
  // rango de la barra: el día elegido (recortado a la ventana) o toda la ventana
  let lo = window.start.getTime(), hi = window.end.getTime();
  if (day) { lo = Math.max(lo, day + 8 * 3600000); hi = Math.min(hi, day + 27 * 3600000); }
  if (hi <= lo) hi = lo + step;
  const value = atTime != null ? Math.min(Math.max(atTime, lo), hi) : lo;
  return (
    <div className="timebar">
      <div className="timebar-top">
        <button className={'chip small' + (!day ? ' on' : '')} onClick={() => { setDay(null); setAtTime(null); }}>{allLabel}</button>
        {days.map(d => {
          const on = day === d.getTime();
          return <button key={d.getTime()} className={'chip small' + (on ? ' on' : '')}
            onClick={() => { setDay(on ? null : d.getTime()); setAtTime(null); }}>{dayLabel(d).split(' ').slice(0, 2).join(' ')}</button>;
        })}
      </div>
      <div className="timebar-slider">
        <input type="range" aria-label="Hora" min={lo} max={hi} step={step}
          value={value} onChange={(e) => setAtTime(Number(e.target.value))} className={atTime ? '' : 'idle'} />
        {atTime
          ? <button className="time-read clear" onClick={() => setAtTime(null)} aria-label="Quitar hora">{`${dayLabel(new Date(atTime)).split(' ')[0]} ${hhmm(new Date(atTime))}`} ✕</button>
          : <span className="time-read idle-txt">Cualquier hora</span>}
      </div>
    </div>
  );
}

/* ------------------------- Lista inferior ------------------------- */
export function EventRow({ ev, onSelect, favs }) {
  const c = CATEGORY_BY_ID[ev.category];
  const zone = ZONES.find(z => z.id === ev.zone)?.label;
  return (
    <li>
      <button className="row" onClick={() => onSelect(ev.id)}>
        <span className="row-ico" style={{ '--c': c?.color }}>{c?.emoji}</span>
        <span className="row-main">
          <strong>{ev.title}</strong>
          <span className="row-meta">{formatWhen(ev)}</span>
          <span className="row-meta">{ev.venue} · {zone} · {priceLabel(ev)}</span>
        </span>
        <span className="row-fav">{favs.both.has(ev.id) ? '💛' : favs.mine.has(ev.id) ? '❤️' : favs.partner.has(ev.id) ? '🤍' : ''}</span>
      </button>
    </li>
  );
}

export function ListSheet({ events, state, setState, onSelect, favs, emptyText }) {
  const next = { peek: 'half', half: 'full', full: 'peek' };
  return (
    <section className={'sheet ' + state}>
      <button className="sheet-handle" onClick={() => setState(next[state])} aria-label="Mostrar lista">
        <span className="grab" />
        <span><b>{events.length}</b> {events.length === 1 ? 'plan' : 'planes'}</span>
        <span className="sheet-hint">{state === 'full' ? 'Ocultar' : state === 'half' ? 'Ampliar' : 'Ver lista'}</span>
      </button>
      <ul className="list">
        {events.map((ev, i) => {
          const d = startOfDay(new Date(ev.start)).getTime();
          const prev = i ? startOfDay(new Date(events[i - 1].start)).getTime() : null;
          return [
            d !== prev && <li key={'h' + d} className="day-head">{longDate(new Date(d))}</li>,
            <EventRow key={ev.id} ev={ev} onSelect={onSelect} favs={favs} />,
          ];
        })}
        {!events.length && (
          <li className="empty"><Volcan size={70} /><p>{emptyText}</p></li>
        )}
      </ul>
    </section>
  );
}

/* ------------------------- Ficha del evento ------------------------- */
export function EventDetail({ ev, onClose, favs, onToggleFav, me }) {
  if (!ev) return null;
  const c = CATEGORY_BY_ID[ev.category];
  const sub = c?.subs.find(s => s.id === ev.subcategory)?.label;
  const zone = ZONES.find(z => z.id === ev.zone)?.label;
  const mine = favs.mine.has(ev.id), theirs = favs.partner.has(ev.id);
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`;
  const realSources = (ev.sources || []).filter(s => s.url);
  return (
    <>
      <div className="scrim show" onClick={onClose} />
      <article className="detail" role="dialog" aria-label={ev.title}>
        <div className="detail-band" style={{ '--c': c?.color }}><span>{c?.emoji} {c?.label}{sub ? ` · ${sub}` : ''}</span>
          <button className="icon-btn light" onClick={onClose} aria-label="Cerrar">✕</button></div>
        <div className="detail-body">
          {mine && theirs && <div className="match-badge">💛 Match Adayai</div>}
          <h2>{ev.title}</h2>
          <dl>
            <div><dt>Cuándo</dt><dd>{formatWhen(ev)}</dd></div>
            <div><dt>Dónde</dt><dd>{ev.venue}, {ev.municipality} <small>({zone})</small></dd></div>
            <div><dt>Precio</dt><dd>{priceLabel(ev)}</dd></div>
          </dl>
          {ev.conflicts && <p className="warn">⚠️ {ev.conflicts}</p>}
          {ev.description && <p className="desc">{ev.description}</p>}
          <div className="tags">{(ev.tags || []).map(t => <span key={t} className="tag">#{TAGS.find(x => x.id === t)?.label || t}</span>)}</div>
          <p className="sources">
            {(ev.sources || []).length > 1 ? `Visto en ${ev.sources.length} fuentes: ` : 'Fuente: '}
            {(ev.sources || []).map((s, i) => <span key={i}>{i ? ', ' : ''}{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.name}</a> : s.name}</span>)}
          </p>
          {me?.partner && <p className="partner-fav">{theirs ? `A ${me.partner.name} le gusta este plan 🤍` : `${me.partner.name} aún no lo ha marcado`}</p>}
        </div>
        <div className="detail-actions">
          <button className={'btn ' + (mine ? 'fav-on' : 'primary')} onClick={() => onToggleFav(ev.id, mine)}>{mine ? '❤️ En favoritos' : '🤍 Me gusta'}</button>
          <a className="btn" href={maps} target="_blank" rel="noreferrer">🧭 Cómo llegar</a>
          {(ev.url || realSources[0]) && <a className="btn" href={ev.url || realSources[0].url} target="_blank" rel="noreferrer">↗ Fuente</a>}
        </div>
      </article>
    </>
  );
}

/* ------------------------- Perfil ------------------------- */
export function ProfilePanel({ open, onClose, me, mode, onSaveLikes, onSwitchUser, onLink, onUnlink, onSignOut, push, onEnablePush, lastUpdate }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  if (!open || !me) return null;
  return (
    <div className="profile">
      <header className="profile-head">
        <button className="icon-btn" onClick={onClose} aria-label="Volver">←</button>
        <h2>Perfil de {me.name}</h2>
      </header>
      <ZigzagBand />
      <div className="profile-body">
        {mode === 'demo' && (
          <section className="card demo">
            <p><b>Modo demo.</b> Eventos de ejemplo y datos guardados solo en este navegador.</p>
            <button className="btn" onClick={onSwitchUser}>Ver la app como {me.partner?.name}</button>
          </section>
        )}
        <section className="card">
          <h3>Mis gustos</h3>
          <p className="hint">Se usan en el filtro “Planes de {me.name}” y en “Para los dos”.</p>
          <div className="chips">
            {TAGS.map(t => <Chip key={t.id} on={me.likes.includes(t.id)} onClick={() => onSaveLikes(toggle(me.likes, t.id))}>{t.label}</Chip>)}
          </div>
        </section>

        <section className="card">
          <h3>Pareja</h3>
          {me.partner ? (
            <>
              <p>Vinculado con <b>{me.partner.name}</b> 💛. Cuando los dos marquéis el mismo plan, sale en Match.</p>
              {mode !== 'demo' && <button className="btn" onClick={onUnlink}>Desvincular</button>}
            </>
          ) : (
            <>
              <p>Tu código: <b className="code">{me.code}</b>. Pásaselo a tu pareja, o escribe aquí el suyo:</p>
              <form className="inline" onSubmit={async (e) => { e.preventDefault(); const r = await onLink(code); setMsg(r?.error ? r.error.message : '¡Vinculados!'); }}>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="Código de tu pareja" />
                <button className="btn primary">Vincular</button>
              </form>
              {msg && <p className="hint">{msg}</p>}
            </>
          )}
        </section>

        <section className="card">
          <h3>Avisos</h3>
          <ul className="bullets">
            <li>💛 Nuevo match</li><li>⏰ El día antes de un plan en Match</li><li>📅 Jueves a las 19:00, resumen del finde</li>
          </ul>
          {push.enabled ? <p className="ok">Avisos activados en este móvil ✔︎</p>
            : push.support.ok ? <button className="btn primary" onClick={onEnablePush}>Activar avisos</button>
            : push.support.reason === 'ios-install' ? (
              <div className="ios">
                <p><b>En iPhone</b>, primero instala la app:</p>
                <ol><li>Ábrela en <b>Safari</b>.</li><li>Pulsa <b>Compartir</b> (cuadrado con flecha).</li><li><b>Añadir a pantalla de inicio</b>.</li><li>Ábrela desde el icono y vuelve aquí.</li></ol>
              </div>
            ) : <p className="hint">{push.support.reason}</p>}
        </section>

        <section className="card">
          <h3>Datos</h3>
          <p className="hint">Se actualizan los lunes (entre semana) y los jueves (finde).{lastUpdate ? ` Última actualización: ${dayLabel(lastUpdate)}, ${hhmm(lastUpdate)}.` : ''}</p>
        </section>
        {mode !== 'demo' && <button className="btn" onClick={onSignOut}>Cerrar sesión</button>}
        <div className="profile-deco"><Tunera size={64} /><Volcan size={64} /></div>
      </div>
    </div>
  );
}

/* ------------------------- Acceso ------------------------- */
export function AuthScreen({ onSignIn, onSignUp, onReset }) {
  const [mode, setMode] = useState('in'); // in | up | reset
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [name, setName] = useState('');
  const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setOk('');
    const r = mode === 'in' ? await onSignIn(email, pw) : mode === 'up' ? await onSignUp(email, pw, name) : await onReset(email);
    if (r?.error) setErr(r.error.message);
    else if (mode === 'reset') setOk('Te hemos enviado un email con un enlace. Ábrelo en este mismo móvil para elegir una contraseña nueva (mira también en spam).');
    setBusy(false);
  };
  return (
    <div className="auth">
      <div className="auth-deco"><Tunera size={90} /><Volcan size={90} /></div>
      <h1>Planes Adayai</h1>
      <p className="hint">{mode === 'reset' ? 'Recuperar contraseña' : 'Los planes de Gran Canaria, para Aday y Yai.'}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'up' && <input required placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} />}
        <input required type="email" autoComplete="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        {mode !== 'reset' && <input required type="password" minLength={6} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} placeholder="Contraseña" value={pw} onChange={e => setPw(e.target.value)} />}
        <button className="btn primary" disabled={busy}>{mode === 'in' ? 'Entrar' : mode === 'up' ? 'Crear cuenta' : 'Enviarme el enlace'}</button>
        {err && <p className="warn">{err}</p>}
        {ok && <p className="ok">{ok}</p>}
      </form>
      {mode === 'in' && <button className="link" onClick={() => { setMode('reset'); setErr(''); }}>¿Olvidaste tu contraseña?</button>}
      <button className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); setOk(''); }}>{mode === 'in' ? '¿No tienes cuenta? Créala' : 'Volver a entrar'}</button>
    </div>
  );
}

export function NewPasswordScreen({ onSave }) {
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (pw !== pw2) return setErr('Las contraseñas no coinciden.');
    setBusy(true); const r = await onSave(pw); setBusy(false);
    if (r?.error) setErr(r.error.message);
  };
  return (
    <div className="auth">
      <div className="auth-deco"><Tunera size={90} /><Volcan size={90} /></div>
      <h1>Nueva contraseña</h1>
      <form onSubmit={submit} className="auth-form">
        <input required type="password" minLength={6} autoComplete="new-password" placeholder="Contraseña nueva" value={pw} onChange={e => setPw(e.target.value)} />
        <input required type="password" minLength={6} autoComplete="new-password" placeholder="Repítela" value={pw2} onChange={e => setPw2(e.target.value)} />
        <button className="btn primary" disabled={busy}>Guardar y entrar</button>
        {err && <p className="warn">{err}</p>}
      </form>
    </div>
  );
}
