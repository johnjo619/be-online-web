import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Host canónico. Staging hoy (basic auth + noindex). Mantener alineado
  // con SITE_URL en src/lib/schema.ts y con public/robots.txt.
  site: 'https://beonline.celink.mx',
  output: 'static',
  integrations: [
    react(),
    tailwind(),
    sitemap({
      filter: (page) =>
        !['/stripe-success', '/pago-exitoso', '/pago-pendiente'].some((p) =>
          page.includes(p),
        ),
    }),
  ],
  build: { format: 'directory' },
  vite: {
    build: {
      // CSS chunking de Astro estaba creando index.css + codigo-practicas.css duplicados
      // (~64KB cada uno de Tailwind base) → 650ms render-blocking adicional en home.
      // Single CSS file = una sola descarga, un solo bloqueo.
      cssCodeSplit: false,
    },
    server: {
      proxy: {
        '/api-proxy': {
          // Mismo backend que nginx en beonline.celink.mx (tenant Be Online,
          // company_id=1). Antes apuntaba a apirelease.celink.mx, que es el
          // middleware de Celink: el QA local corria contra otro tenant.
          target: 'https://api-crm.igou.mx',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        },
        // Proxy a SEPOMEX (sepomex.nitrostudio.com.mx) — la API no tiene CORS,
        // así que el browser no puede hacer fetch directo. En dev proxy via Vite;
        // en prod va via endpoint backend server-side (TODO middleware-api).
        '/sepomex-proxy': {
          target: 'https://sepomex.nitrostudio.com.mx',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sepomex-proxy/, ''),
        },
      },
    },
  },
});
