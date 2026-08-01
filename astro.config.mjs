// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }, { protocol: 'https', hostname: 'picsum.photos' }],
  },
});
