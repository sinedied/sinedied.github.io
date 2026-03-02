import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * Reader mode toggle — disables CRT effects and switches to a
 * reading-friendly font. Only used on blog post pages.
 *
 * Pre-hydration state is driven by CSS custom properties inherited from
 * html[data-reader-mode] (set by a blocking <head> script). The component
 * suppresses its own aria-pressed styling until [ready] is set in
 * firstUpdated(), at which point the correct state is known from the DOM.
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

    /* Before hydration: suppress internal aria-pressed styling and use
       inherited CSS custom properties from html[data-reader-mode] instead.
       --rt-active-color / --rt-active-border are set in BaseLayout. */
    :host(:not([ready])) .toggle {
      color: var(--rt-active-color, var(--term-dim, #555));
      border-color: var(--rt-active-border, var(--term-border, #333));
    }
    :host(:not([ready])) .toggle[aria-pressed="true"] {
      color: var(--rt-active-color, var(--term-dim, #555));
      border-color: var(--rt-active-border, var(--term-border, #333));
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

  @state() active = true;

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.documentElement.removeAttribute('data-reader-mode');
  }

  firstUpdated() {
    // Read state from the DOM attribute (already set by the blocking <head> script)
    const hasReaderMode = document.documentElement.hasAttribute('data-reader-mode');
    const stored = localStorage.getItem('reader-mode');
    // If stored preference exists, use it; otherwise default on for blog pages
    this.active = stored !== null ? stored !== 'false' : hasReaderMode;
    this._apply();
    // Reveal the button now that the correct state is known
    this.setAttribute('ready', '');
  }

  private _toggle() {
    this.active = !this.active;
    localStorage.setItem('reader-mode', String(this.active));
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
