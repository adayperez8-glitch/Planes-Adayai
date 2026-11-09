# 🌵 Planes Adayai

Planes de Gran Canaria en un mapa, por horas, para **Aday y Yai**.
Se actualiza los **lunes** (entre semana) y los **jueves** (finde). Coste: **0 €**.

## Qué hace
- Mapa de la isla con pines por tipo de plan. Una barra de horas filtra lo que pasa a una hora concreta.
- Pestañas **Este finde** (viernes 14:00 → domingo 23:59), **Entre semana** y **💛 Match**.
- Filtros a la derecha: para quién (Aday / Yai / Los dos), tipo y subtipo, zona, precio y franja horaria.
- Favoritos ❤️. Cuando los dos marcáis el mismo plan, aparece en **Match**, en tiempo real.
- Perfiles con gustos editables.
- Avisos: nuevo match, recordatorio el día antes (20:00) y resumen del jueves (19:00).

## Cómo funciona
```
Tarea programada de Claude (lun/jue 07:00)
   └─ busca en las fuentes, contrasta, clasifica → events/AAAA-MM-DD.json → git push
GitHub Actions
   └─ scripts/ingest.mjs valida el lote y lo carga en Supabase (función ingest_events)
Supabase (gratis)
   ├─ cuentas, pareja, favoritos (RLS) y tiempo real
   └─ pg_cron cada 10 min → función "notify" → notificaciones push
Vercel (gratis)
   └─ la web/app (React + MapLibre + OpenStreetMap)
```

## Estructura
| Ruta | Qué es |
|---|---|
| `src/` | La app (React). `data/taxonomy.js` define categorías, etiquetas, zonas, precios y franjas. |
| `supabase/schema.sql` | Tablas, seguridad, pareja, ingesta y cola de avisos. |
| `supabase/cron.sql` | Programación de los avisos. |
| `supabase/functions/notify/` | Función que envía las notificaciones. |
| `collector/PROMPT.md` | Instrucciones de la tarea programada (el recolector). |
| `collector/FUENTES.md` | Lista de fuentes. |
| `collector/venues.json`, `municipios.json` | Coordenadas guardadas. |
| `scripts/ingest.mjs` | Validador y carga de lotes. |
| `events/` | Lotes de eventos que sube el recolector. |

## Probar en local (modo demo, sin cuentas)
```bash
npm install
npm run dev
```
Sin variables de entorno la app arranca en **modo demo**: eventos de ejemplo, y Aday y Yai simulados (en Perfil → "Ver la app como Yai").

## Puesta en marcha (una vez, unos 30 minutos)

### 1. GitHub
1. Crea un repositorio **privado** `planes-adayai` y sube esta carpeta.

### 2. Supabase (plan Free, sin tarjeta)
1. Crea un proyecto en la región **EU (West)**.
2. **SQL Editor** → pega `supabase/schema.sql` → Run.
3. **Authentication → Providers → Email**: déjalo activado. Para no depender del correo, desactiva *Confirm email*.
4. Genera las claves de los avisos: `npx web-push generate-vapid-keys`
5. **Edge Functions → Secrets**: añade `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:tu@email`) y `NOTIFY_SECRET` (una contraseña larga inventada).
6. Despliega la función:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase functions deploy notify --no-verify-jwt
   ```
7. **SQL Editor** → pega `supabase/cron.sql` con tus valores → Run.

> El plan Free pausa los proyectos tras una semana sin actividad. Las cargas de los lunes y jueves y el cron lo mantienen activo.

### 3. GitHub Actions
En **Settings → Secrets and variables → Actions**, añade `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Esta clave solo vive aquí, nunca en la app.

### 4. Vercel (plan Hobby)
1. Importa el repositorio.
2. Añade las variables de `.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_VAPID_PUBLIC_KEY`.
3. Despliega.

### 5. Cuentas
1. Aday y Yai se registran desde la app, con su nombre (así salen sus gustos por defecto).
2. Perfil → uno copia su código y el otro lo escribe en "Vincular".
3. **Yai (iPhone):** Safari → Compartir → *Añadir a pantalla de inicio*. Después abre la app desde el icono → Perfil → *Activar avisos*.
4. **Aday (Android):** Chrome → *Instalar app*. Después Perfil → *Activar avisos*.

### 6. Recolector
Crea en Claude una **tarea programada** los lunes y jueves a las 07:00 (Atlantic/Canary). Usa como mensaje el contenido de `collector/PROMPT.md` (ya apunta a `adayperez8-glitch/Planes-Adayai`) y dale permiso de escritura en el repositorio. Gasta parte del uso de tu plan esos dos días, pero no genera cobros aparte.

**Plan B, sin IA:** si algún día no quieres gastar uso, puedes subir a mano un lote a `events/` (con el mismo formato). El validador te dirá si algo falla.

## Licencias y datos
- Mapa © colaboradores de OpenStreetMap. Respeta su política de uso, que en un uso tan pequeño como este no es problema.
- Los eventos enlazan siempre a su fuente original.
- Los motivos gráficos (pintaderas, tuneras, volcán) son dibujos originales de esta app.
