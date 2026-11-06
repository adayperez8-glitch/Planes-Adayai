import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

maplibregl.setWorkerUrl(workerUrl);
import { ISLAND, ISLAND_BOUNDS, ISLAND_CENTER, ZONE_CENTERS } from '../data/island.js';
import { CATEGORY_BY_ID, ZONES } from '../data/taxonomy.js';

const OFFLINE = import.meta.env.VITE_OFFLINE_MAP === '1';

function style() {
  const sources = { island: { type: 'geojson', data: ISLAND } };
  const layers = [{ id: 'sea', type: 'background', paint: { 'background-color': OFFLINE ? '#DCEEF8' : '#ffffff' } }];
  if (!OFFLINE) {
    sources.osm = {
      type: 'raster', tileSize: 256, maxzoom: 19,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    };
    layers.push({ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.35, 'raster-opacity': 0.9 } });
    layers.push({ id: 'island-line', type: 'line', source: 'island', paint: { 'line-color': '#0068A8', 'line-width': 1.5, 'line-opacity': 0.5 } });
  } else {
    layers.push({ id: 'island-fill', type: 'fill', source: 'island', paint: { 'fill-color': '#F6F1E7' } });
    layers.push({ id: 'island-line', type: 'line', source: 'island', paint: { 'line-color': '#0068A8', 'line-width': 2.5 } });
  }
  return { version: 8, sources, layers };
}

export default function MapView({ events, selectedId, onSelect, favs }) {
  const box = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    map.current = new maplibregl.Map({
      container: box.current, style: style(), center: ISLAND_CENTER, zoom: 8.6,
      maxBounds: [[-16.3, 27.45], [-14.9, 28.45]], attributionControl: { compact: true },
    });
    map.current.fitBounds(ISLAND_BOUNDS, { padding: { top: 30, left: 20, right: 20, bottom: 190 }, duration: 0 });
    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left');
    if (OFFLINE) {
      ZONES.forEach(z => {
        const el = document.createElement('div'); el.className = 'zone-label'; el.textContent = z.label;
        new maplibregl.Marker({ element: el }).setLngLat(ZONE_CENTERS[z.id]).addTo(map.current);
      });
    }
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    markers.current.forEach(m => m.remove());
    markers.current = [];
    const seen = {};
    events.forEach(ev => {
      const key = `${ev.lat.toFixed(3)},${ev.lng.toFixed(3)}`;
      const n = (seen[key] = (seen[key] || 0) + 1) - 1;
      // separa un poco los eventos que comparten sitio
      const ang = n * 2.4, r = n ? 0.0016 * Math.sqrt(n) : 0;
      const cat = CATEGORY_BY_ID[ev.category];
      const el = document.createElement('button');
      el.className = 'pin-wrap' + (ev.id === selectedId ? ' sel' : '');
      el.setAttribute('aria-label', ev.title);
      const shape = document.createElement('div');
      shape.className = 'pin' + (favs.both.has(ev.id) ? ' match' : favs.mine.has(ev.id) ? ' fav' : '');
      shape.style.setProperty('--c', cat?.color || '#0068A8');
      const ico = document.createElement('span'); ico.textContent = cat?.emoji || '📍';
      shape.appendChild(ico); el.appendChild(shape);
      el.addEventListener('click', (e) => { e.stopPropagation(); onSelect(ev.id); });
      markers.current.push(new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([ev.lng + r * Math.cos(ang), ev.lat + r * Math.sin(ang)]).addTo(map.current));
    });
  }, [events, selectedId, favs, onSelect]);

  useEffect(() => {
    const ev = events.find(e => e.id === selectedId);
    if (ev && map.current) map.current.easeTo({ center: [ev.lng, ev.lat - 0.03], zoom: Math.max(map.current.getZoom(), 10.5), duration: 500 });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={box} className="map" />;
}
