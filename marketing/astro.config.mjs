import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://serveiq.io',
  integrations: [sitemap()],
});
