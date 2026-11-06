import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`      → web normal para Vercel/Netlify (carpeta dist/)
// `npm run build:demo` → un único HTML con mapa sin conexión (vista previa)
export default defineConfig(({ mode }) => ({
  plugins: mode === 'demo' ? [react(), viteSingleFile()] : [react()],
  base: mode === 'demo' ? './' : '/',
  build: mode === 'demo' ? { outDir: 'dist-demo', copyPublicDir: false, assetsInlineLimit: 100000000 } : {},
  worker: { format: 'es' },
}));
