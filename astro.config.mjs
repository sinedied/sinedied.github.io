import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';

export default defineConfig({
  site: 'https://sinedied.github.io',
  output: 'static',
  integrations: [lit()],
  vite: {
    ssr: {
      noExternal: ['lit', '@lit/reactive-element', 'lit-html', 'lit-element'],
    },
  },
});
