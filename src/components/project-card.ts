import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Project item component — displays a single GitHub repository on one line.
 */
@customElement('project-card')
export class ProjectCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-bottom: 0.35rem;
    }

    .project {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      padding: 0.4rem 0;
      font-size: var(--font-size-sm, 0.85rem);
      flex-wrap: wrap;
      line-height: 1.5;
    }

    .stars {
      color: var(--term-dim, #555);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .stars::before {
      content: '[';
    }

    .stars::after {
      content: ']';
    }

    .star-icon {
      color: var(--term-warning, #cc0);
      font-size: 1.1em;
    }

    .name {
      color: var(--term-accent, #0f0);
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
    }

    .name:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .separator {
      color: var(--term-dim, #555);
    }

    .description {
      color: var(--term-fg, #eee);
    }

    .language {
      color: var(--term-dim, #555);
      font-size: var(--font-size-xs, 0.75rem);
      border: 1px solid var(--term-border, #333);
      padding: 1px 6px;
      border-radius: 3px;
    }

    .emoji {
      filter: var(--emoji-filter, none);
    }
  `;

  @property({ type: String }) name = '';
  @property({ type: String }) slug = '';
  @property({ type: String }) description = '';
  @property({ type: Number }) stars = 0;
  @property({ type: String }) url = '';
  @property({ type: String }) language = '';
  @property({ type: String }) section = 'active';

  /** Split text into plain strings and emoji wrapped in styled spans. */
  private _renderWithEmoji(text: string): (string | TemplateResult)[] {
    const parts: (string | TemplateResult)[] = [];
    const emojiRegex = /(\p{Extended_Pictographic})/gu;
    let last = 0;
    for (const m of text.matchAll(emojiRegex)) {
      if (m.index! > last) parts.push(text.slice(last, m.index!));
      parts.push(html`<span class="emoji">${m[0]}</span>`);
      last = m.index! + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  }

  render() {
    return html`
      <div class="project">
        <span class="stars"><span class="star-icon">★</span> ${this.stars}</span>
        <a class="name" href=${this.url} target="_blank" rel="noopener noreferrer">
          ${this.name}
        </a>
        <span class="separator">▸</span>
        <span class="description">${this._renderWithEmoji(this.description)}</span>
        ${this.language ? html`<span class="language">${this.language}</span>` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'project-card': ProjectCard;
  }
}
