import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Project card component — displays a single GitHub repository.
 */
@customElement('project-card')
export class ProjectCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-bottom: 0.75rem;
    }

    .card {
      padding: 0.75rem 1rem;
      border: 1px solid var(--term-border, #333);
      border-radius: 4px;
      background: var(--term-surface, #111);
      transition: border-color 0.2s, background 0.2s;
    }

    .card:hover {
      border-color: var(--term-accent, #0f0);
      background: var(--term-surface-hover, #1a1a1a);
    }

    :host([legacy]) .card {
      opacity: 0.55;
      border-style: dashed;
    }

    :host([legacy]) .card:hover {
      opacity: 0.8;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .name {
      color: var(--term-accent, #0f0);
      font-weight: 700;
      text-decoration: none;
      font-size: var(--font-size-md, 0.9rem);
    }

    .name:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .badge {
      font-size: var(--font-size-xs, 0.75rem);
      padding: 1px 6px;
      border-radius: 3px;
      border: 1px solid var(--term-border, #333);
      color: var(--term-dim, #555);
    }

    .badge--legacy {
      color: var(--term-warning, #cc0);
      border-color: var(--term-warning, #cc0);
    }

    .description {
      color: var(--term-fg, #eee);
      margin-top: 0.35rem;
      font-size: var(--font-size-sm, 0.85rem);
    }

    .meta {
      display: flex;
      gap: 1rem;
      margin-top: 0.4rem;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--term-dim, #555);
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .star-icon {
      color: var(--term-warning, #cc0);
    }

    .lang-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--term-accent, #0f0);
    }
  `;

  @property({ type: String }) name = '';
  @property({ type: String }) slug = '';
  @property({ type: String }) description = '';
  @property({ type: Number }) stars = 0;
  @property({ type: String, attribute: 'last-commit' }) lastCommit = '';
  @property({ type: String }) url = '';
  @property({ type: String }) language = '';
  @property({ type: String }) section = 'active';

  render() {
    const isLegacy = this.section === 'legacy';

    return html`
      <div class="card">
        <div class="header">
          <a class="name" href=${this.url} target="_blank" rel="noopener noreferrer">
            ${this.slug}
          </a>
          ${isLegacy ? html`<span class="badge badge--legacy">unmaintained</span>` : ''}
        </div>
        <div class="description">${this.description}</div>
        <div class="meta">
          <span class="meta-item">
            <span class="star-icon">★</span>
            ${this.stars}
          </span>
          ${this.language ? html`
            <span class="meta-item">
              <span class="lang-dot"></span>
              ${this.language}
            </span>
          ` : ''}
          <span class="meta-item">
            updated ${this.lastCommit}
          </span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'project-card': ProjectCard;
  }
}
