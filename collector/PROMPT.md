# Recolector de Planes Adayai (instrucciones para la tarea programada de Claude)

> Esta tarea se ejecuta **los lunes a las 07:00** (entre semana) y **los jueves a las 07:00** (finde), hora de Canarias.
> Copia este texto entero como mensaje de la tarea programada. Va dentro de tu plan de Claude: no usa la API ni genera cargos aparte.

---

Eres el recolector de eventos de **Planes Adayai**, una app privada con planes de Gran Canaria para Aday y Yai.

## 0. Preparación
1. Trabaja en el repositorio `adayperez8-glitch/Planes-Adayai` (rama `main`). Clónalo si hace falta.
2. Lee `src/data/taxonomy.js` (categorías, subcategorías, etiquetas y zonas válidas), `collector/FUENTES.md`, `collector/venues.json` y `collector/municipios.json`.

## 1. Ventana de fechas (hora de Canarias, Atlantic/Canary)
- **Si hoy es lunes:** desde hoy 00:00 hasta el **jueves 23:59** (entre semana es de lunes a jueves; el viernes es finde).
- **Si hoy es jueves:** desde el **viernes 14:00** hasta el **domingo 23:59**.
- Otro día (ejecución manual): usa la ventana del finde más próximo.

## 2. Buscar eventos
- Recorre **todas las fuentes** de `collector/FUENTES.md`, empezando por calendarioeventos. Usa la búsqueda web y lee las páginas de agenda.
- Incluye solo eventos **en Gran Canaria** que ocurran (aunque sea en parte) dentro de la ventana.
- Añade los **mercadillos fijos** de FUENTES.md que caigan en la ventana. Antes de incluirlos, comprueba que no haya avisos de cancelación.
- Si encuentras una fuente nueva útil, añádela a FUENTES.md.

## 3. Contrastar y deduplicar
- Varios resultados son el **mismo evento** si coinciden en fecha, lugar y título parecido. Fusiónalos en uno solo, con todas sus fuentes en `sources`.
- Si las fuentes no coinciden en hora, precio o lugar, usa el dato más oficial (organizador > ayuntamiento/Cabildo > agregador). Escribe la discrepancia en `conflicts`, por ejemplo: `"Una fuente indica 21:30 y otra 22:00."`.
- No inventes datos. Si algo no aparece, déjalo en `null`.

## 4. Normalizar cada evento
| Campo | Regla |
|---|---|
| `id` | `slug(título)-AAAAMMDD-slug(municipio)`, en minúsculas y sin tildes. Debe ser estable entre ejecuciones. |
| `title` | Título limpio, sin mayúsculas gritadas. |
| `description` | 1–2 frases propias (no copies párrafos de la fuente). |
| `category` / `subcategory` | Ids de `taxonomy.js`. Ballet → `cultura`/`danza`; catas → `gastronomia`/`vinos`; anime/manga/cosplay → `popfriki`/`anime`; rutas guiadas por cascos históricos o yacimientos → `caminatas`/`patrimonio`. |
| `tags` | Todas las etiquetas de `TAGS` que encajen (sirven para los perfiles). Por ejemplo, un concierto en la playa lleva `["conciertos","playa"]`. |
| `starts_at` / `ends_at` | ISO 8601 con zona horaria (`2026-11-13T20:30:00+00:00`; en horario de verano, `+01:00`). Si no hay hora de fin, suma 2 h (conciertos y teatro) o 3 h (rutas). |
| `all_day` | `true` si **no trae hora**. En ese caso, `starts_at` = día 08:00 y `ends_at` = día 14:00 (o el horario real del mercadillo si se sabe). |
| `venue`, `municipality` | Municipio con su **nombre oficial** tal como aparece en `taxonomy.js` (ZONES). |
| `lat`, `lng` | 1) `collector/venues.json`; 2) si no está, búscalo (OpenStreetMap/Nominatim o la web del lugar) y **añádelo a venues.json**; 3) si no hay manera, usa el centro del municipio de `municipios.json`. |
| `price_min`, `price_max` | Números en €. Gratis = `0` y `0`. Desconocido = `null` y `null`. |
| `url` | Enlace principal (organizador o venta de entradas). |
| `sources` | `[{ "name": "...", "url": "..." }]`, una entrada por fuente donde apareció. |
| `conflicts` | Texto o `null`. |

## 5. Guardar
1. Escribe `events/AAAA-MM-DD.json` (fecha de hoy) con este formato:
   ```json
   { "generated_at": "...", "window_start": "...", "window_end": "...", "events": [ ... ] }
   ```
2. Ejecuta `node scripts/ingest.mjs events/AAAA-MM-DD.json` y corrige los errores hasta que salga ✅.
3. Haz commit (`eventos: lote del <lunes|jueves> AAAA-MM-DD (N eventos)`) y push a `main`. GitHub Actions lo carga en Supabase.

## 6. Resumen final
Termina con un resumen breve:
- cuántos eventos hay, por categoría y por zona;
- qué fuentes fallaron o no respondieron;
- qué discrepancias encontraste.
