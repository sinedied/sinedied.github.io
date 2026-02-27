import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Reader mode toggle — disables CRT effects and switches to a
 * reading-friendly font. Only used on blog post pages.
 */
@customElement('reader-toggle')
export class ReaderToggle extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: none;
      border: 1px solid var(--term-border, #333);
      color: var(--term-dim, #555);
      font-family: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      padding: 3px 8px;
      border-radius: 3px;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
      white-space: nowrap;
    }

    .toggle:hover {
      color: var(--term-fg, #eee);
      border-color: var(--term-fg, #eee);
    }

    .toggle[aria-pressed="true"] {
      color: var(--term-accent, #0f0);
      border-color: var(--term-accent, #0f0);
    }

    .toggle:focus-visible {
      outline: 2px solid var(--term-accent, #0f0);
      outline-offset: 1px;
    }

    .icon {
      display: inline-flex;
      align-items: center;
      font-size: 0.9em;
    }
  `;

  @property({ type: Boolean, reflect: true }) active = true;

  connectedCallback() {
    super.connectedCallback();
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('reader-mode');
      this.active = stored !== null ? stored !== 'false' : true;
    }
    this._apply();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-reader-mode');
    }
  }

  protected firstUpdated() {
    this._apply();
  }

  private _toggle() {
    this.active = !this.active;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('reader-mode', String(this.active));
    }
    this._apply();
  }

  private _apply() {
    if (typeof document !== 'undefined') {
      document.documentElement.toggleAttribute('data-reader-mode', this.active);
    }
  }

  render() {
    return html`
      <button
        class="toggle"
        type="button"
        aria-pressed=${this.active ? 'true' : 'false'}
        @click=${this._toggle}
        title=${this.active ? 'Switch to terminal mode' : 'Switch to reader mode'}
      >
        <span class="icon">📖</span>
        <span>reader</span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'reader-toggle': ReaderToggle;
  }
}
