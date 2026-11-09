# Fuentes de eventos de Gran Canaria

El recolector las recorre todas y contrasta los datos entre ellas. En la primera ejecución apunta aquí la URL exacta de cada una que funcione (`→ URL:`). Lo que no se ha confirmado todavía va marcado como *(confirmar)*.

## Agregadores
- **calendarioeventos**: la referencia principal. ✅ Confirmado el 9-nov-2026.
  - Listado por día: `https://calendarioeventos.com/eventos?layout=lista&period=d%C3%ADa&date=AAAA-MM-DD`
  - Muestra 20 eventos por página: añade `&offset=20`, `&offset=40`… hasta cubrir el total ("1-20 de N").
  - Un sábado típico tiene más de 100 eventos. Prioriza la tarde/noche y descarta los de colegios, solo mayores, formación profesional y competiciones con inscripción.
  - Ficha de cada evento: `https://calendarioeventos.com/evento/<slug>`
- Agendas generales de ocio de Gran Canaria y Canarias (prensa local, guías de ocio). → URLs: *(confirmar)*

## Instituciones
- **Portal de eventos del Cabildo** (eventosgrancanaria.com → datagran.grancanaria.com/eventos): ⛔ su robots.txt no permite lectores automáticos. **No usar.**
- **Turismo de Gran Canaria (Cabildo)**: ✅ `https://www.grancanaria.com/turismo/pt/agenda/agenda` (la versión /es/ dio error el 9-nov). Pocos eventos, pero grandes (ferias, ARC, pruebas deportivas). Ficha: `?r=event%2Fview&event=<id>&id=4066&L=8`
- **LPA Cultura (Ayuntamiento de Las Palmas de GC)**: ✅ `https://www.lpacultura.com/events` (tiene 2 páginas; fichas `/events/<slug>`). Buena para cine, literatura y danza en la capital.
- Gobierno de Canarias: agenda cultural.
- Agendas municipales de los 21 ayuntamientos. Las que más mueven: Las Palmas de GC, Telde, Arucas, Santa Brígida, Vega de San Mateo, Teror, Gáldar, Agüimes, Ingenio, San Bartolomé de Tirajana y Mogán.

## Salas y museos
- **Auditorio Alfredo Kraus + Teatro Pérez Galdós**: ✅ `https://auditorioteatrolaspalmasgc.es/programacion` (portada con la semana; fichas `auditorioalfredokraus.es/evento/<slug>` y `teatroperezgaldos.es/evento/<slug>`). No siempre muestra hora ni precio: cógelos de calendarioeventos.
- Teatro Cuyás, Teatro Guiniguada
- CAAM, Casa de Colón, Museo Canario, Museo Elder, Cueva Pintada, Casa-Museo Pérez Galdós
- Gran Canaria Arena, Estadio de Gran Canaria, INFECAR

## Conciertos
- La Ganzúa: ✅ `https://www.laganzua.net/conciertos/las-palmas-de-gran-canaria` (solo grandes conciertos; útil para confirmar fecha, sala y precio)

## Venta de entradas
- Tomaticket, Entradas.com, Ticketmaster, Eventbrite (filtrar por Gran Canaria)

## Senderismo y naturaleza
- Rutas y actividades del Cabildo (Medio Ambiente)
- Clubes de senderismo de la isla con salidas abiertas *(confirmar cuáles publican calendario)*

## Mercadillos fijos (base semanal: comprobar cada vez si hay cambios o cancelaciones)
- Mercado agrícola de Vega de San Mateo: viernes a domingo (en verano: sábado 08–19 y domingo 08–14:30; *horario de invierno por confirmar*)
- Mercadillo de Teror: domingos 09:00–15:00 (mercadillos.org)
- Mercado de Santa Brígida: viernes 14–20, sábado 08–20 y domingo 08–14
- Mercadillo de Vegueta (Plaza del Pilar Nuevo): domingos *(confirmar horario)*
- Fuentes: mercadillos.org (`/es/gran-canaria/domingo`, `/es/gran-canaria/fin-de-semana`) y la guía "Mercados Tradicionales Medianías"
- Otros mercadillos municipales: Arucas, Vegueta, San Fernando de Maspalomas… *(confirmar días y horarios)*

## Anime y cultura pop
- Salones y jornadas manga/anime de la isla, tiendas y asociaciones que organizan quedadas *(confirmar)*
