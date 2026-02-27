import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  site: 'https://sinedied.github.io',
  output: 'static',
  scopedStyleStrategy: 'class',
  integrations: [lit()],
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append', properties: { class: 'heading-anchor', ariaHidden: true, tabIndex: -1 }, content: { type: 'text', value: ' #' } }],
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
