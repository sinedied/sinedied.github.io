import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * Boot sequence animation — simulates terminal startup.
 * Shown once per session, then the real content appears.
 */
@customElement('boot-sequence')
export class BootSequence extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .boot-container {
      font-size: var(--font-size-sm, 0.85rem);
      line-height: 1.8;
    }

    .boot-line {
      opacity: 0;
      color: var(--term-dim, #555);
    }

    .boot-line.visible {
      opacity: 1;
    }

    .ok {
      color: var(--term-success, #0f0);
      font-weight: 700;
    }

    .hidden {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .boot-line {
        opacity: 1;
      }
    }
  `;

  private static BOOT_LINES = [
    { prefix: 'OK', text: 'Loading kernel modules...' },
    { prefix: 'OK', text: 'Initializing network interfaces...' },
    { prefix: 'OK', text: 'Mounting /home/visitor...' },
    { prefix: 'OK', text: 'Starting web terminal service...' },
    { prefix: '>>',  text: 'Welcome to sinedied.github.io' },
  ];

  @state() private _visibleLines = 0;
  @state() private _done = false;

  connectedCallback() {
    super.connectedCallback();

    // Skip if already seen this session
    if (sessionStorage.getItem('boot-done')) {
      this._done = true;
      this._visibleLines = BootSequence.BOOT_LINES.length;
      this.dispatchEvent(new CustomEvent('boot-complete', { bubbles: true, composed: true }));
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this._visibleLines = BootSequence.BOOT_LINES.length;
      this._done = true;
      sessionStorage.setItem('boot-done', '1');
      this.dispatchEvent(new CustomEvent('boot-complete', { bubbles: true, composed: true }));
      return;
    }

    this._animateLines();
  }

  private async _animateLines() {
    for (let i = 0; i < BootSequence.BOOT_LINES.length; i++) {
      await new Promise((r) => setTimeout(r, 150 + Math.random() * 100));
      this._visibleLines = i + 1;
    }
    await new Promise((r) => setTimeout(r, 400));
    this._done = true;
    sessionStorage.setItem('boot-done', '1');
    this.dispatchEvent(new CustomEvent('boot-complete', { bubbles: true, composed: true }));
  }

  render() {
    if (this._done) {
      return html``;
    }

    return html`
      <div class="boot-container">
        ${BootSequence.BOOT_LINES.map(
          (line, i) => html`
            <div class="boot-line ${i < this._visibleLines ? 'visible' : ''}">
              [<span class="ok">${line.prefix}</span>] ${line.text}
            </div>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'boot-sequence': BootSequence;
  }
}
