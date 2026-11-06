// Motivos gráficos originales inspirados en pintaderas, tuneras y volcanes.

export function Pintadera({ size = 36, title }) {
  // Sello circular con anillos de triángulos (geometría tipo pintadera)
  const tri = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r1 = 40, r2 = 29;
    const p = (r, ang) => `${50 + r * Math.cos(ang)},${50 + r * Math.sin(ang)}`;
    tri.push(<polygon key={i} points={`${p(r1, a - 0.22)} ${p(r1, a + 0.22)} ${p(r2, a)}`} fill={i % 2 ? '#0068A8' : '#FFCC00'} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title || 'Planes Adayai'}>
      <circle cx="50" cy="50" r="47" fill="#fff" stroke="#1d2733" strokeWidth="4" />
      {tri}
      <rect x="35" y="35" width="30" height="30" fill="#C8411B" transform="rotate(45 50 50)" />
      <rect x="43" y="43" width="14" height="14" fill="#fff" transform="rotate(45 50 50)" />
    </svg>
  );
}

export function ZigzagBand({ height = 8 }) {
  // Franja de dientes de sierra (amarillo/azul) como separador
  return (
    <svg className="zigzag" width="100%" height={height} preserveAspectRatio="none" viewBox="0 0 120 8" aria-hidden="true">
      <rect width="120" height="8" fill="#0068A8" />
      <path d={Array.from({ length: 12 }, (_, i) => `M${i * 10} 8 L${i * 10 + 5} 0 L${i * 10 + 10} 8`).join(' ')} fill="#FFCC00" />
    </svg>
  );
}

export function Tunera({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="70" rx="16" ry="22" fill="#3E8E41" />
      <ellipse cx="30" cy="42" rx="12" ry="16" fill="#4FA352" transform="rotate(-25 30 42)" />
      <ellipse cx="68" cy="38" rx="12" ry="17" fill="#4FA352" transform="rotate(20 68 38)" />
      <circle cx="26" cy="25" r="5" fill="#C8411B" /><circle cx="72" cy="20" r="5" fill="#C8411B" /><circle cx="60" cy="26" r="4" fill="#E0A100" />
      {[[45, 62], [55, 75], [48, 84], [30, 45], [66, 40], [70, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#E8F5E9" />)}
    </svg>
  );
}

export function Volcan({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M5 90 L38 40 L46 46 L54 40 L62 46 L95 90 Z" fill="#6B4E3D" />
      <path d="M38 40 L46 46 L54 40 L62 46 L58 58 L50 52 L42 58 Z" fill="#C8411B" />
      <circle cx="44" cy="24" r="7" fill="#d9d4cc" /><circle cx="55" cy="16" r="9" fill="#e7e3dc" /><circle cx="64" cy="27" r="6" fill="#d9d4cc" />
    </svg>
  );
}
