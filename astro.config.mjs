// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';


// Dev only: the chapter pages POST a rendered frame here and it lands in public/journey/posters.
// Used to make the posters (first paint and OG image) from the real scenes. Never part of the build.
function posterSink() {
  return {
    name: 'poster-sink',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__poster', (req, res) => {
        const name = new URL(req.url, 'http://x').searchParams.get('name') || '';
        if (req.method !== 'POST' || !/^[a-z0-9-]+$/.test(name)) { res.statusCode = 400; return res.end('bad request'); }
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', async () => {
          const fs = await import('node:fs/promises');
          const b64 = body.replace(/^data:image\/jpeg;base64,/, '');
          await fs.mkdir('public/journey/posters', { recursive: true });
          await fs.writeFile(`public/journey/posters/${name}.jpg`, Buffer.from(b64, 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  vite: { plugins: [posterSink()] },
  site: 'https://chinchilla.design',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') && !page.endsWith('/thanks') })],
  image: {
    // Originals are large (some 7000px wide). Everything is resized at build time.
    service: { entrypoint: 'astro/assets/services/sharp', config: { limitInputPixels: false } },
  },
});
