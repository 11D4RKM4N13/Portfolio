// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { globSync } from 'node:fs';

// Mientras no haya artículos, las páginas del blog no se incluyen en el sitemap
const hasPosts = globSync('src/content/blog/**/*.md').length > 0;

// https://astro.build/config
export default defineConfig({
  // URL pública del sitio (GitHub Pages). Necesaria para sitemap, RSS y hreflang
  site: 'https://11d4rkm4n13.github.io',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false }, // español en /, inglés en /en/
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-CO', en: 'en-US' } },
      filter: (page) => hasPosts || !/^\/(en\/)?blog\//.test(new URL(page).pathname),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
