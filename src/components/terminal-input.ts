import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

/**
 * Interactive terminal input — easter egg in the footer.
 * Accepts typed commands on a single non-overflowing line.
 */
@customElement('terminal-input')
export class TerminalInput extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      font-family: inherit;
      font-size: inherit;
      line-height: 1.6;
    }

    .prompt {
      flex-shrink: 0;
      white-space: nowrap;
      user-select: none;
    }

    .prompt-error {
      color: var(--term-error, #ff3333);
      font-weight: 700;
    }

    .prompt-user {
      color: var(--term-fg);
      font-weight: 700;
    }

    .prompt-at {
      color: var(--term-dim);
    }

    .prompt-host {
      color: var(--term-accent);
      font-weight: 700;
    }

    .prompt-path {
      color: var(--term-accent);
    }

    .input-area {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      overflow: hidden;
    }

    input {
      flex: 1;
      min-width: 0;
      background: none;
      border: none;
      outline: none;
      color: var(--term-fg);
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      padding: 0;
      margin: 0;
      caret-color: var(--term-fg);
    }

    input::selection {
      background: var(--term-accent);
      color: var(--term-bg);
    }

    .output {
      flex-shrink: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--term-dim);
      margin-left: 0.5em;
    }

    .cursor-idle {
      display: inline-block;
      width: 0.6em;
      height: 1.15em;
      background: var(--term-fg);
      vertical-align: text-bottom;
      animation: blink 1.06s step-end infinite;
      flex-shrink: 0;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `;

  /** Current terminal path, e.g. "~" or "~/projects" */
  @property({ type: String, attribute: 'term-path' })
  termPath = '~';

  /** Whether the last command resulted in an error */
  @state() private _hasError = false;

  /** Output text to display inline after the input */
  @state() private _output = '';

  /** Whether we're currently focused */
  @state() private _focused = false;

  @query('input') private _input!: HTMLInputElement;

  private _history: string[] = [];
  private _historyIndex = -1;

  /** Map of page aliases to their hrefs */
  private readonly _pages: Record<string, string> = {
    '~': '/',
    '/': '/',
    'about': '/',
    'home': '/',
    'projects': '/projects/',
    'events': '/events/',
  };

  render() {
    return html`
      <span class="prompt">
        ${this._hasError ? html`<span class="prompt-error">✘</span> ` : ''}
        <span class="prompt-user">visitor</span><span class="prompt-at">@</span><span class="prompt-host">sinedied</span><span class="prompt-path">:${this.termPath}$</span>&nbsp;
      </span>
      <span class="input-area">
        ${!this._focused ? html`<span class="cursor-idle"></span>` : ''}
        <input
          type="text"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          aria-label="Terminal input"
          @keydown=${this._onKeydown}
          @focus=${() => { this._focused = true; }}
          @blur=${() => { this._focused = false; }}
        />
      </span>
      ${this._output ? html`<span class="output">${this._output}</span>` : ''}
    `;
  }

  private _onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const raw = this._input.value.trim();
      this._input.value = '';
      this._output = '';
      this._hasError = false;

      if (!raw) return;

      this._history.push(raw);
      this._historyIndex = this._history.length;

      this._execute(raw);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this._historyIndex > 0) {
        this._historyIndex--;
        this._input.value = this._history[this._historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this._historyIndex < this._history.length - 1) {
        this._historyIndex++;
        this._input.value = this._history[this._historyIndex];
      } else {
        this._historyIndex = this._history.length;
        this._input.value = '';
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      // Ctrl+L — clear output
      e.preventDefault();
      this._output = '';
      this._hasError = false;
    }
  }

  private _execute(raw: string) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // ── cd <page> ──
    if (cmd === 'cd') {
      const target = (args[0] || '~').toLowerCase().replace(/^~?\/?/, '').replace(/\/$/, '') || '~';
      const href = this._pages[target];
      if (href) {
        window.location.href = href;
      } else {
        this._hasError = true;
        this._output = `bash: cd: ${args[0]}: No such file or directory`;
      }
      return;
    }

    // ── rm -rf / | shutdown ──
    if ((cmd === 'rm' && raw.includes('-rf') && (raw.includes(' /') || raw.includes(' ~'))) || cmd === 'shutdown') {
      this._crtShutdown();
      return;
    }

    // ── whoami ──
    if (cmd === 'whoami') {
      this._output = 'visitor';
      return;
    }

    // ── ls ──
    if (cmd === 'ls') {
      this._output = 'about  projects  events';
      return;
    }

    // ── pwd ──
    if (cmd === 'pwd') {
      this._output = this.termPath.replace('~', '/home/visitor');
      return;
    }

    // ── sudo ──
    if (cmd === 'sudo') {
      this._output = 'Nice try.';
      return;
    }

    // ── exit ──
    if (cmd === 'exit') {
      this._output = 'There is no escape.';
      return;
    }

    // ── Unknown ──
    this._hasError = true;
    this._output = `bash: ${cmd}: command not found`;
  }

  /** Trigger the CRT shutdown animation on the terminal window. */
  private _crtShutdown() {
    const terminalWindow = document.querySelector('.terminal-window');
    if (!terminalWindow) return;

    // Remove crt-skip so the shutdown animation is not blocked
    document.documentElement.classList.remove('crt-skip');

    terminalWindow.classList.add('crt-shutdown');

    terminalWindow.addEventListener('animationend', (e) => {
      if ((e as AnimationEvent).animationName !== 'crtOff') return;
      // Keep screen black until refresh
      document.body.style.background = '#000';
      (terminalWindow as HTMLElement).style.display = 'none';
    }, { once: true });
  }
}
