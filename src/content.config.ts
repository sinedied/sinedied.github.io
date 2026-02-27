import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './blog' }),
  schema: z.object({
    title: z.string(),
    published: z.boolean(),
    description: z.string(),
    tags: z.string(),
    slug: z.string().optional(),
    cover_image: z.string().nullable().optional(),
    canonical_url: z.string().nullable().optional(),
    id: z.number().optional(),
    date: z.coerce.date(),
    series: z.string().optional(),
  }),
});

export const collections = { blog };
