import type { CollectionEntry } from 'astro:content';

/**
 * Derive the URL slug for a blog post.
 * Uses the frontmatter `slug` if set, otherwise falls back to the
 * filename (last path segment of the content-collection entry ID).
 */
export function getBlogSlug(post: CollectionEntry<'blog'>): string {
  if (post.data.slug) return post.data.slug;
  const segments = post.id.split('/');
  return segments[segments.length - 1];
}
