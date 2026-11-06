// EVENTOS DE EJEMPLO para el modo demo. No son eventos reales: sirven para probar la app
// hasta que el recolector de los lunes y jueves cargue los de verdad.
import { weekendWindow, weekdayWindow, startOfDay } from '../lib/time.js';
import { zoneOfMunicipality } from './taxonomy.js';

const P = {
  galdos: ['Teatro Pérez Galdós', 'Las Palmas de Gran Canaria', 28.1009, -15.4146],
  kraus: ['Auditorio Alfredo Kraus', 'Las Palmas de Gran Canaria', 28.1302, -15.4467],
  caam: ['CAAM', 'Las Palmas de Gran Canaria', 28.1004, -15.4157],
  colon: ['Casa de Colón', 'Las Palmas de Gran Canaria', 28.1014, -15.4150],
  canario: ['Museo Canario', 'Las Palmas de Gran Canaria', 28.1003, -15.4171],
  cuyas: ['Teatro Cuyás', 'Las Palmas de Gran Canaria', 28.1077, -15.4186],
  vegueta: ['Plaza de Santa Ana, Vegueta', 'Las Palmas de Gran Canaria', 28.1011, -15.4139],
  canteras: ['Playa de Las Canteras', 'Las Palmas de Gran Canaria', 28.1415, -15.4335],
  infecar: ['INFECAR', 'Las Palmas de Gran Canaria', 28.0905, -15.4290],
  sanmateo: ['Mercado de Vega de San Mateo', 'Vega de San Mateo', 28.0110, -15.5330],
  teror: ['Plaza de Teror', 'Teror', 28.0600, -15.5475],
  stabrigida: ['Mercado de Santa Brígida', 'Santa Brígida', 28.0320, -15.5010],
  roque: ['Roque Nublo', 'Tejeda', 27.9707, -15.6131],
  tejeda: ['Casco de Tejeda', 'Tejeda', 27.9952, -15.6150],
  bandama: ['Caldera de Bandama', 'Santa Brígida', 28.0350, -15.4560],
  arucas: ['Casco de Arucas', 'Arucas', 28.1195, -15.5230],
  cueva: ['Cueva Pintada', 'Gáldar', 28.1446, -15.6557],
  agaete: ['Puerto de Las Nieves', 'Agaete', 28.0965, -15.7125],
  telde: ['Barrio de San Juan', 'Telde', 27.9935, -15.4170],
  aguimes: ['Casco de Agüimes', 'Agüimes', 27.9055, -15.4460],
  maspalomas: ['Dunas de Maspalomas', 'San Bartolomé de Tirajana', 27.7430, -15.5760],
  mogan: ['Puerto de Mogán', 'Mogán', 27.8170, -15.7630],
  aldea: ['Charco de La Aldea', 'La Aldea de San Nicolás', 27.9970, -15.8170],
  valsequillo: ['Valsequillo', 'Valsequillo', 27.9860, -15.4980],
};

const DEMO = [
  // dayOffset relativo al viernes del finde; h/m inicio; dur en horas; allDay
  { d: 0, h: 17, m: 0, dur: 4, p: 'vegueta', title: 'Muestra de vinos de Gran Canaria', cat: 'gastronomia', sub: 'vinos', tags: ['vinos', 'gastronomia'], price: [12, 12], desc: 'Cata de vinos de bodegas de la isla con maridaje de quesos.' },
  { d: 0, h: 20, m: 30, dur: 2, p: 'galdos', title: 'Gala de ballet: clásicos y contemporáneo', cat: 'cultura', sub: 'danza', tags: ['ballet', 'baile', 'cultura'], price: [18, 35], desc: 'Programa mixto con piezas de repertorio y coreografías contemporáneas.' },
  { d: 0, h: 21, m: 0, dur: 2.5, p: 'kraus', title: 'Concierto de rock canario', cat: 'musica', sub: 'conciertos', tags: ['conciertos'], price: [22, 22], desc: 'Bandas locales en directo.' },
  { d: 0, h: 18, m: 0, dur: 2, p: 'caam', title: 'Inauguración: exposición de pintura atlántica', cat: 'cultura', sub: 'pintura', tags: ['exposiciones', 'cultura', 'museos'], price: [0, 0], desc: 'Apertura de la muestra con visita comentada.' },
  { d: 0, h: 19, m: 0, dur: 1.5, p: 'colon', title: 'Charla: la navegación atlántica', cat: 'charlas', sub: 'charla', tags: ['charlas', 'cultura', 'patrimonio'], price: [0, 0], desc: 'Conferencia divulgativa.' },
  { d: 0, h: 22, m: 0, dur: 4, p: 'canteras', title: 'Sesión DJ al atardecer en la playa', cat: 'musica', sub: 'electronica', tags: ['conciertos', 'playa'], price: null, desc: 'Sesión al aire libre. Precio por confirmar.', conflict: 'Una fuente indica 21:30 y otra 22:00.' },

  { d: 1, allDay: true, p: 'sanmateo', title: 'Mercado agrícola de San Mateo', cat: 'mercadillos', sub: 'agricola', tags: ['mercadillos', 'gastronomia', 'campo'], price: [0, 0], desc: 'Productos de la tierra, quesos y artesanía.' },
  { d: 1, allDay: true, p: 'stabrigida', title: 'Mercadillo de Santa Brígida', cat: 'mercadillos', sub: 'agricola', tags: ['mercadillos', 'gastronomia'], price: [0, 0], desc: 'Mercado municipal de fin de semana.' },
  { d: 1, h: 9, m: 0, dur: 5, p: 'roque', title: 'Ruta guiada al Roque Nublo', cat: 'caminatas', sub: 'ruta-guiada', tags: ['senderismo', 'campo'], price: [8, 8], desc: 'Dificultad media, 10 km. Llevar agua y calzado de montaña.' },
  { d: 1, h: 10, m: 30, dur: 2, p: 'vegueta', title: 'Ruta de patrimonio por Vegueta', cat: 'caminatas', sub: 'patrimonio', tags: ['patrimonio', 'cultura'], price: [5, 5], desc: 'Paseo guiado por el casco histórico.' },
  { d: 1, h: 11, m: 0, dur: 7, p: 'infecar', title: 'Jornada de anime y manga', cat: 'popfriki', sub: 'anime', tags: ['anime', 'videojuegos'], price: [6, 10], desc: 'Stands, cosplay, proyecciones y torneos.' },
  { d: 1, h: 12, m: 0, dur: 3, p: 'bandama', title: 'Cata en bodega de Bandama', cat: 'gastronomia', sub: 'vinos', tags: ['vinos', 'gastronomia', 'campo'], price: [25, 25], desc: 'Visita a viñedos y cata de tres vinos.' },
  { d: 1, h: 13, m: 30, dur: 3, p: 'agaete', title: 'Ruta gastronómica de pescado fresco', cat: 'gastronomia', sub: 'comida', tags: ['gastronomia', 'playa'], price: [30, 45], desc: 'Menú degustación en restaurantes del puerto.' },
  { d: 1, h: 17, m: 0, dur: 1.5, p: 'canario', title: 'Visita guiada al Museo Canario', cat: 'cultura', sub: 'museos', tags: ['museos', 'cultura', 'patrimonio'], price: [4, 4], desc: 'Recorrido por las salas de arqueología aborigen.' },
  { d: 1, h: 19, m: 0, dur: 2, p: 'cuyas', title: 'Teatro: comedia canaria', cat: 'cultura', sub: 'teatro', tags: ['teatro', 'cultura'], price: [15, 20], desc: 'Comedia en clave local.' },
  { d: 1, h: 21, m: 0, dur: 3, p: 'telde', title: 'Noche de folclore en San Juan', cat: 'musica', sub: 'folclore', tags: ['folclore', 'conciertos', 'baile'], price: [0, 0], desc: 'Agrupaciones folclóricas y baile de taifa.' },
  { d: 1, h: 22, m: 0, dur: 2, p: 'kraus', title: 'Concierto sinfónico de bandas sonoras de anime', cat: 'musica', sub: 'clasica', tags: ['conciertos', 'anime'], price: [28, 55], desc: 'Orquesta en directo con bandas sonoras de anime.' },
  { d: 1, h: 16, m: 0, dur: 3, p: 'maspalomas', title: 'Paseo al atardecer por las dunas', cat: 'airelibre', sub: 'playa', tags: ['playa', 'campo'], price: [0, 0], desc: 'Ruta suave por el sendero autorizado.' },
  { d: 1, h: 10, m: 0, dur: 3, p: 'mogan', title: 'Bautismo de kayak', cat: 'deportes', sub: 'agua', tags: ['deportes', 'playa'], price: [35, 35], desc: 'Iniciación con monitor, material incluido.' },

  { d: 2, allDay: true, p: 'teror', title: 'Mercadillo de Teror', cat: 'mercadillos', sub: 'artesania', tags: ['mercadillos', 'gastronomia'], price: [0, 0], desc: 'Artesanía, chorizo de Teror y dulces.' },
  { d: 2, allDay: true, p: 'sanmateo', title: 'Mercado agrícola de San Mateo', cat: 'mercadillos', sub: 'agricola', tags: ['mercadillos', 'gastronomia', 'campo'], price: [0, 0], desc: 'Productos de la tierra, quesos y artesanía.' },
  { d: 2, h: 8, m: 30, dur: 4, p: 'tejeda', title: 'Caminata Tejeda – Cruz de Tejeda', cat: 'caminatas', sub: 'ruta-libre', tags: ['senderismo', 'campo'], price: [0, 0], desc: 'Ruta circular de 8 km.' },
  { d: 2, h: 10, m: 0, dur: 2, p: 'cueva', title: 'Visita al Parque Arqueológico Cueva Pintada', cat: 'caminatas', sub: 'patrimonio', tags: ['patrimonio', 'museos', 'cultura'], price: [6, 6], desc: 'Visita con reserva previa.' },
  { d: 2, h: 11, m: 0, dur: 4, p: 'arucas', title: 'Feria de artesanía y queso', cat: 'mercadillos', sub: 'artesania', tags: ['mercadillos', 'gastronomia'], price: [0, 0], desc: 'Productores locales.' },
  { d: 2, h: 12, m: 0, dur: 2, p: 'aguimes', title: 'Taller de danza contemporánea', cat: 'charlas', sub: 'taller', tags: ['baile', 'talleres'], price: [10, 10], desc: 'Taller abierto, todos los niveles.' },
  { d: 2, h: 13, m: 0, dur: 4, p: 'valsequillo', title: 'Fiesta del almendro', cat: 'fiestas', sub: 'fiesta', tags: ['fiestas', 'gastronomia', 'campo', 'folclore'], price: [0, 0], desc: 'Música, puestos y comida típica.' },
  { d: 2, h: 18, m: 0, dur: 2, p: 'galdos', title: 'Ballet: El lago de los cisnes', cat: 'cultura', sub: 'danza', tags: ['ballet', 'cultura', 'baile'], price: [25, 60], desc: 'Compañía invitada.' },
  { d: 2, h: 19, m: 30, dur: 2, p: 'vegueta', title: 'Cine de verano bajo las estrellas', cat: 'cultura', sub: 'cine', tags: ['cine', 'cultura'], price: [0, 0], desc: 'Proyección al aire libre.' },
  { d: 2, h: 17, m: 0, dur: 2, p: 'aldea', title: 'Charla sobre astronomía en la playa', cat: 'charlas', sub: 'charla', tags: ['charlas', 'playa', 'campo'], price: [0, 0], desc: 'Observación con telescopios al anochecer.' },
];

const DEMO_WEEK = [
  // dayOffset relativo al lunes de la semana laboral mostrada
  { d: 1, h: 19, m: 0, dur: 1.5, p: 'colon', title: 'Club de lectura canaria', cat: 'cultura', sub: 'literatura', tags: ['literatura', 'cultura'], price: [0, 0], desc: 'Tertulia mensual.' },
  { d: 2, h: 20, m: 0, dur: 2, p: 'cuyas', title: 'Danza flamenca', cat: 'cultura', sub: 'danza', tags: ['baile', 'cultura'], price: [15, 15], desc: 'Espectáculo de flamenco.' },
  { d: 3, h: 18, m: 30, dur: 2, p: 'infecar', title: 'Quedada de cosplay y anime', cat: 'popfriki', sub: 'anime', tags: ['anime'], price: [0, 0], desc: 'Encuentro libre de aficionados.' },
  { d: 3, h: 19, m: 0, dur: 2, p: 'vegueta', title: 'Cata de vinos volcánicos', cat: 'gastronomia', sub: 'vinos', tags: ['vinos', 'gastronomia'], price: [18, 18], desc: 'Vinos de suelos volcánicos de Canarias.' },
  { d: 2, h: 18, m: 0, dur: 2, p: 'caam', title: 'Visita nocturna al CAAM', cat: 'cultura', sub: 'museos', tags: ['museos', 'exposiciones', 'cultura'], price: [0, 0], desc: 'Visita guiada fuera de horario.' },
  { d: 0, h: 18, m: 0, dur: 2, p: 'canteras', title: 'Surf al atardecer (iniciación)', cat: 'deportes', sub: 'agua', tags: ['deportes', 'playa'], price: [20, 20], desc: 'Clase grupal.' },
];

function build(list, base, prefix) {
  return list.map((x, i) => {
    const [venue, municipality, lat, lng] = P[x.p];
    const day = new Date(base.getTime() + x.d * 86400000);
    const start = new Date(day); const end = new Date(day);
    if (x.allDay) { start.setHours(8, 0, 0, 0); end.setHours(14, 0, 0, 0); }
    else { start.setHours(x.h, x.m, 0, 0); end.setTime(start.getTime() + x.dur * 3600000); }
    return {
      id: `${prefix}-${i}`, title: x.title, description: x.desc,
      category: x.cat, subcategory: x.sub, tags: x.tags,
      start: start.toISOString(), end: end.toISOString(), allDay: !!x.allDay,
      venue, municipality, zone: zoneOfMunicipality(municipality), lat, lng,
      priceMin: x.price ? x.price[0] : null, priceMax: x.price ? x.price[1] : null,
      url: null, sources: [{ name: 'Datos de ejemplo', url: null }], conflicts: x.conflict || null,
    };
  });
}

export function demoEvents(now = new Date()) {
  const fri = startOfDay(weekendWindow(now).start);
  const wk = weekdayWindow(now);
  const mon = startOfDay(new Date(wk.end.getTime() - 4 * 86400000));
  return [...build(DEMO, fri, 'demo-finde'), ...build(DEMO_WEEK, mon, 'demo-semana')];
}
