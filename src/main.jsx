import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);

// Service worker (avisos push). No se registra en la vista previa empaquetada.
if ('serviceWorker' in navigator && import.meta.env.VITE_OFFLINE_MAP !== '1') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
