import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Blog post item component — displays a single blog post in a listing.
 */
@customElement('blog-post-item')
export class BlogPostItem extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-bottom: var(--space-sm, 0.5rem);
    }

    .post {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      padding: 0.5rem 0;
      font-size: var(--font-size-sm, 0.85rem);
      flex-wrap: wrap;
      line-height: 1.6;
    }

    .date {
      color: var(--term-dim, #555);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .date::before {
      content: '[';
    }

    .date::after {
      content: ']';
    }

    .title-link {
      color: var(--term-fg, #eee);
      text-decoration: none;
      font-weight: 700;
      transition: color 0.2s;
    }

    .title-link:hover {
      color: var(--term-accent, #0f0);
      text-shadow: 0 0 8px var(--term-glow, rgba(0, 255, 65, 0.4));
    }

    .title-link:focus-visible {
      outline: 2px solid var(--term-accent, #0f0);
      outline-offset: 2px;
    }

    .description {
      width: 100%;
      color: var(--term-dim, #555);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: 1.5;
      padding-left: 0;
    }

    .tags {
      display: inline-flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .tag {
      color: var(--term-dim, #555);
      font-size: var(--font-size-xs, 0.75rem);
      border: 1px solid var(--term-border, #333);
      padding: 1px 6px;
      border-radius: 3px;
    }
  `;

  @property({ type: String }) date = '';
  @property({ type: String }) title = '';
  @property({ type: String }) href = '';
  @property({ type: String }) description = '';
  @property({ type: String }) tags = '';

  render() {
    const tagList = this.tags
      ? this.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    return html`
      <div class="post">
        <span class="date">${this.date}</span>
        <a class="title-link" href=${this.href}>${this.title}</a>
        ${tagList.length > 0
          ? html`<span class="tags">${tagList.map((tag) => html`<span class="tag">${tag}</span>`)}</span>`
          : ''}
        ${this.description
          ? html`<div class="description">${this.description}</div>`
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blog-post-item': BlogPostItem;
  }
}
