import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Typing animation component — reveals text character by character.
 * Usage: <typing-text text="Hello world" speed="40" delay="0"></typing-text>
 */
@customElement('typing-text')
export class TypingText extends LitElement {
  static styles = css`
    :host {
      display: inline;
    }

    .cursor {
      display: inline-block;
      width: 0.55em;
      height: 1.1em;
      background: var(--term-fg, #00ff41);
      vertical-align: text-bottom;
      margin-left: 1px;
      animation: blink 1.06s step-end infinite;
    }

    .cursor--hidden {
      display: none;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .cursor { animation: none; }
    }
  `;

  @property({ type: String }) text = '';
  @property({ type: Number }) speed = 40;
  @property({ type: Number }) delay = 0;
  @property({ type: Boolean, attribute: 'show-cursor' }) showCursor = true;
  @property({ type: Boolean, attribute: 'hide-cursor-on-done' }) hideCursorOnDone = false;

  @state() private _displayed = '';
  @state() private _done = false;
  private _timeout?: ReturnType<typeof setTimeout>;
  private _rafId?: number;

  connectedCallback() {
    super.connectedCallback();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this._displayed = this.text;
      this._done = true;
      return;
    }
    this._timeout = setTimeout(() => this._startTyping(), this.delay);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timeout) clearTimeout(this._timeout);
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  private _startTyping() {
    let i = 0;
    const type = () => {
      if (i < this.text.length) {
        this._displayed = this.text.slice(0, i + 1);
        i++;
        this._timeout = setTimeout(() => {
          this._rafId = requestAnimationFrame(type);
        }, this.speed);
      } else {
        this._done = true;
        this.dispatchEvent(new CustomEvent('typing-done', { bubbles: true, composed: true }));
      }
    };
    type();
  }

  render() {
    const cursorClass = this._done && this.hideCursorOnDone ? 'cursor cursor--hidden' : 'cursor';
    return html`<span>${this._displayed}</span>${this.showCursor ? html`<span class=${cursorClass}></span>` : ''}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'typing-text': TypingText;
  }
}
