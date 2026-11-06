// Taxonomía de Planes Adayai: tipos, subtipos, etiquetas de gustos, zonas, precios y franjas.

export const CATEGORIES = [
  { id: 'mercadillos', label: 'Mercadillos', emoji: '🧺', color: '#E0A100',
    subs: [ { id: 'agricola', label: 'Agrícola' }, { id: 'artesania', label: 'Artesanía' }, { id: 'segunda-mano', label: 'Segunda mano' } ] },
  { id: 'caminatas', label: 'Caminatas', emoji: '🥾', color: '#3E8E41',
    subs: [ { id: 'ruta-libre', label: 'Rutas' }, { id: 'ruta-guiada', label: 'Rutas guiadas' }, { id: 'patrimonio', label: 'Rutas de patrimonio' } ] },
  { id: 'cultura', label: 'Cultura', emoji: '🎭', color: '#7B3FA0',
    subs: [ { id: 'teatro', label: 'Teatro' }, { id: 'danza', label: 'Danza y ballet' }, { id: 'pintura', label: 'Pintura y exposiciones' },
            { id: 'museos', label: 'Museos' }, { id: 'cine', label: 'Cine' }, { id: 'literatura', label: 'Literatura' } ] },
  { id: 'musica', label: 'Música', emoji: '🎸', color: '#C8411B',
    subs: [ { id: 'conciertos', label: 'Conciertos' }, { id: 'electronica', label: 'DJ y electrónica' }, { id: 'folclore', label: 'Folclore canario' }, { id: 'clasica', label: 'Clásica' } ] },
  { id: 'charlas', label: 'Charlas y talleres', emoji: '🎤', color: '#0068A8',
    subs: [ { id: 'charla', label: 'Charlas' }, { id: 'taller', label: 'Talleres' } ] },
  { id: 'deportes', label: 'Deportes', emoji: '🏃', color: '#00897B',
    subs: [ { id: 'carreras', label: 'Carreras' }, { id: 'agua', label: 'Deportes de agua' }, { id: 'lucha', label: 'Lucha canaria' }, { id: 'otros', label: 'Otros' } ] },
  { id: 'gastronomia', label: 'Gastronomía', emoji: '🍷', color: '#8E1B3A',
    subs: [ { id: 'comida', label: 'Comida' }, { id: 'vinos', label: 'Vinos y catas' } ] },
  { id: 'airelibre', label: 'Playa y campo', emoji: '🌵', color: '#5C8A2E',
    subs: [ { id: 'playa', label: 'Playa' }, { id: 'campo', label: 'Campo' } ] },
  { id: 'popfriki', label: 'Anime y cultura pop', emoji: '🍥', color: '#D6336C',
    subs: [ { id: 'anime', label: 'Anime y manga' }, { id: 'videojuegos', label: 'Videojuegos' }, { id: 'comic', label: 'Cómic' } ] },
  { id: 'fiestas', label: 'Fiestas populares', emoji: '🎉', color: '#F08C00',
    subs: [ { id: 'fiesta', label: 'Fiestas' }, { id: 'romeria', label: 'Romerías' } ] },
  { id: 'infantil', label: 'Infantil y familia', emoji: '🧸', color: '#4DABF7', subs: [] },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Etiquetas de gustos (perfil). Cada evento lleva varias.
export const TAGS = [
  { id: 'campo', label: 'Campo' }, { id: 'playa', label: 'Playa' }, { id: 'conciertos', label: 'Conciertos' },
  { id: 'anime', label: 'Anime' }, { id: 'gastronomia', label: 'Gastronomía' }, { id: 'vinos', label: 'Vinos' },
  { id: 'cultura', label: 'Cultura' }, { id: 'museos', label: 'Museos' }, { id: 'ballet', label: 'Ballet' },
  { id: 'baile', label: 'Baile' }, { id: 'patrimonio', label: 'Rutas de patrimonio' }, { id: 'teatro', label: 'Teatro' },
  { id: 'cine', label: 'Cine' }, { id: 'exposiciones', label: 'Exposiciones' }, { id: 'senderismo', label: 'Senderismo' },
  { id: 'mercadillos', label: 'Mercadillos' }, { id: 'deportes', label: 'Deportes' }, { id: 'charlas', label: 'Charlas' },
  { id: 'talleres', label: 'Talleres' }, { id: 'fiestas', label: 'Fiestas' }, { id: 'folclore', label: 'Folclore' },
  { id: 'videojuegos', label: 'Videojuegos' }, { id: 'literatura', label: 'Literatura' }, { id: 'infantil', label: 'Infantil' },
];

export const DEFAULT_LIKES = {
  aday: ['campo', 'playa', 'conciertos', 'anime', 'gastronomia', 'vinos'],
  yai: ['cultura', 'museos', 'ballet', 'baile', 'patrimonio'],
};

export const ZONES = [
  { id: 'capital', label: 'Capital', municipalities: ['Las Palmas de Gran Canaria'] },
  { id: 'norte', label: 'Norte', municipalities: ['Arucas', 'Firgas', 'Moya', 'Santa María de Guía', 'Gáldar', 'Agaete'] },
  { id: 'centro', label: 'Centro/Cumbre', municipalities: ['Teror', 'Valleseco', 'Vega de San Mateo', 'Tejeda', 'Artenara', 'Santa Brígida'] },
  { id: 'este', label: 'Este', municipalities: ['Telde', 'Valsequillo', 'Ingenio', 'Agüimes'] },
  { id: 'sur', label: 'Sur', municipalities: ['Santa Lucía de Tirajana', 'San Bartolomé de Tirajana', 'Mogán'] },
  { id: 'oeste', label: 'Oeste', municipalities: ['La Aldea de San Nicolás'] },
];

export const zoneOfMunicipality = (m) => ZONES.find(z => z.municipalities.includes(m))?.id ?? null;

export const PRICE_BUCKETS = [
  { id: 'gratis', label: 'Gratis', min: 0, max: 0 },
  { id: 'p0-10', label: '< 10 €', min: 0.01, max: 9.99 },
  { id: 'p10-20', label: '10–20 €', min: 10, max: 20 },
  { id: 'p20-30', label: '20–30 €', min: 20.01, max: 30 },
  { id: 'p30-50', label: '30–50 €', min: 30.01, max: 50 },
  { id: 'p50', label: '+50 €', min: 50.01, max: Infinity },
  { id: 'desconocido', label: 'Precio sin confirmar' },
];

// Franjas horarias (horas locales). Noche cruza la medianoche.
export const BANDS = [
  { id: 'manana', label: 'Mañana', range: '8–13', from: 8, to: 13 },
  { id: 'mediodia', label: 'Mediodía', range: '13–16', from: 13, to: 16 },
  { id: 'tarde', label: 'Tarde', range: '16–20', from: 16, to: 20 },
  { id: 'noche', label: 'Noche', range: '20–3', from: 20, to: 27 },
];
