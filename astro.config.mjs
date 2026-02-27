import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  site: 'https://sinedied.github.io',
  output: 'static',
  scopedStyleStrategy: 'class',
  integrations: [lit()],
  markdown: {
    remarkPlugins: [remarkGfm],
    shikiConfig: {
      theme: 'github-dark-default',
    },
  },
  vite: {
    ssr: {
      noExternal: ['lit', '@lit/reactive-element', 'lit-html', 'lit-element'],
    },
  },
});
