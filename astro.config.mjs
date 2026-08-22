// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  // Sin bloque "image": las imágenes son todas remotas (Sanity CDN) y ya se redimensionan
  // vía query string con thumb()/thumbSrcSet() (src/lib/image.ts) — el optimizador nativo de
  // Astro (astro:assets) no se usa en ningún componente, así que este remotePatterns quedaba
  // configurado sin que nada lo activara.
  vite: {
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
  },
});
