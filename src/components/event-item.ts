import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Event item component — displays a single conference talk.
 */
@customElement('event-item')
export class EventItem extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-bottom: 0.35rem;
    }

    .event {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      padding: 0.4rem 0;
      font-size: var(--font-size-sm, 0.85rem);
      flex-wrap: wrap;
      line-height: 1.5;
    }

    .date {
      color: var(--term-dim, #555);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .date::before {
      content: '[';
    }

    .date::after {
      content: ']';
    }

    .conference {
      color: var(--term-accent, #0f0);
      font-weight: 700;
      white-space: nowrap;
    }

    .separator {
      color: var(--term-dim, #555);
    }

    .title {
      color: var(--term-fg, #eee);
    }

    .co-speaker {
      color: var(--term-dim, #555);
      font-size: var(--font-size-xs, 0.75rem);
    }

    .co-speaker::before {
      content: 'w/ ';
    }

    .links {
      display: inline-flex;
      gap: 0.5rem;
      margin-left: 0.25rem;
    }

    .link {
      color: var(--term-dim, #555);
      text-decoration: none;
      transition: color 0.2s;
      font-size: var(--font-size-xs, 0.75rem);
      border: 1px solid var(--term-border, #333);
      padding: 1px 6px;
      border-radius: 3px;
    }

    .link:hover {
      color: var(--term-accent, #0f0);
      border-color: var(--term-accent, #0f0);
    }

    .link:focus-visible {
      outline: 2px solid var(--term-accent, #0f0);
      outline-offset: 1px;
    }

    .lang {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--term-dim, #555);
      margin-left: 0.15rem;
    }

    .emoji {
      filter: var(--emoji-filter, none);
    }
  `;

  @property({ type: String }) date = '';
  @property({ type: String }) conference = '';
  @property({ type: String }) title = '';
  @property({ type: String, attribute: 'co-speaker' }) coSpeaker = '';
  @property({ type: String }) youtube = '';
  @property({ type: String }) slides = '';
  @property({ type: String }) workshop = '';
  @property({ type: String }) language = '';

  /** Wrap emoji characters in styled spans for theme filtering. */
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
      <div class="event">
        <span class="date">${this.date}</span>
        <span class="conference">${this.conference}</span>
        <span class="separator">▸</span>
        <span class="title">${this._renderWithEmoji(this.title)}</span>
        ${this.language === 'fr' ? html`<span class="lang"><span class="emoji">🇫🇷</span></span>` : ''}
        ${this.coSpeaker ? html`<span class="co-speaker">${this.coSpeaker}</span>` : ''}
        ${this.youtube || this.slides || this.workshop ? html`
          <span class="links">
            ${this.youtube ? html`<a class="link" href=${this.youtube} target="_blank" rel="noopener noreferrer">▶ video</a>` : ''}
            ${this.slides ? html`<a class="link" href=${this.slides} target="_blank" rel="noopener noreferrer">◧ slides</a>` : ''}
            ${this.workshop ? html`<a class="link" href=${this.workshop} target="_blank" rel="noopener noreferrer">⚡ workshop</a>` : ''}
          </span>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'event-item': EventItem;
  }
}
