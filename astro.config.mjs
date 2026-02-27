import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://sinedied.github.io',
  output: 'static',
  scopedStyleStrategy: 'class',
  integrations: [lit()],
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
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
