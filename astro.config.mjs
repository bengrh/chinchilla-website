// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://chinchilla.design',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') && !page.endsWith('/thanks') })],
  image: {
    // Originals are large (some 7000px wide). Everything is resized at build time.
    service: { entrypoint: 'astro/assets/services/sharp', config: { limitInputPixels: false } },
  },
});
