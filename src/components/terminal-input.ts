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
      cursor: text;
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
      width: 0;
      max-width: 100%;
      background: none;
      border: none;
      outline: none;
      color: var(--term-fg);
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      padding: 0;
      margin: 0;
      caret-color: transparent;
    }

    .input-fill {
      flex: 1;
      min-width: 0;
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

    .cursor {
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

  @query('input') private _input!: HTMLInputElement;

  private _history: string[] = [];
  private _historyIndex = -1;
  private _loadTime = Date.now();

  /** Map of page aliases to their hrefs */
  private readonly _pages: Record<string, string> = {
    '~': '/',
    '/': '/',
    'about': '/',
    'home': '/',
    'projects': '/projects/',
    'events': '/events/',
    'man': '/help/',
    'help': '/help/',
  };

  render() {
    return html`
      <span class="prompt">
        ${this._hasError ? html`<span class="prompt-error">✘</span> ` : ''}
        <span class="prompt-user">visitor</span><span class="prompt-at">@</span><span class="prompt-host">sinedied</span><span class="prompt-path">:${this.termPath}$</span>&nbsp;
      </span>
      <span class="input-area">
        <input
          type="text"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          aria-label="Terminal input"
          @keydown=${this._onKeydown}
          @input=${this._onInput}
          @click=${this._onClick}
        /><span class="cursor"></span><span class="input-fill"></span>
      </span>
      ${this._output ? html`<span class="output">${this._output}</span>` : ''}
    `;
  }

  /** Focus input when clicking anywhere on the component */
  private _onClick() {
    this._input?.focus();
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._onClick.bind(this));
  }

  /** Resize input to fit its content */
  private _onInput() {
    this._resizeInput();
  }

  private _resizeInput() {
    if (this._input) {
      this._input.style.width = `${this._input.value.length}ch`;
    }
  }

  private _onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const raw = this._input.value.trim();
      this._input.value = '';
      this._resizeInput();
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
        this._resizeInput();
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
      this._resizeInput();
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

    // ── man ──
    if (cmd === 'man' || cmd === 'help') {
      window.location.href = '/help/';
      return;
    }

    // ── clear ──
    if (cmd === 'clear') {
      this._output = '';
      this._hasError = false;
      return;
    }

    // ── reboot ──
    if (cmd === 'reboot') {
      this._crtReboot();
      return;
    }

    // ── exit ──
    if (cmd === 'exit') {
      this._output = 'There is no escape.';
      return;
    }

    // ── date ──
    if (cmd === 'date') {
      this._output = new Date().toString();
      return;
    }

    // ── uptime ──
    if (cmd === 'uptime') {
      const elapsed = Math.floor((Date.now() - this._loadTime) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      const parts = [];
      if (h > 0) parts.push(`${h}h`);
      if (m > 0 || h > 0) parts.push(`${m}m`);
      parts.push(`${s}s`);
      this._output = `up ${parts.join(' ')}, 1 user`;
      return;
    }

    // ── uname ──
    if (cmd === 'uname') {
      this._output = 'sinedied-web 1.0.0 x86_64 Astro/Lit';
      return;
    }

    // ── echo ──
    if (cmd === 'echo') {
      this._output = args.join(' ');
      return;
    }

    // ── hostname ──
    if (cmd === 'hostname') {
      this._output = 'sinedied.github.io';
      return;
    }

    // ── top ──
    if (cmd === 'top') {
      this._output = 'PID 1 visitor 100% browsing sinedied.github.io';
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

  /** Reboot: shutdown → pause → macOS boot sound → power on animation */
  private _crtReboot() {
    const terminalWindow = document.querySelector('.terminal-window') as HTMLElement;
    if (!terminalWindow) return;

    document.documentElement.classList.remove('crt-skip');
    terminalWindow.classList.add('crt-shutdown');

    terminalWindow.addEventListener('animationend', (e) => {
      if ((e as AnimationEvent).animationName !== 'crtOff') return;

      // Black screen
      terminalWindow.style.display = 'none';
      document.body.style.background = '#000';

      // Wait, then play boot sound and power on
      setTimeout(() => {
        // Synthesize a Mac-like boot chime with Web Audio API
        this._playBootChime();

        // Restore and replay CRT on animation
        terminalWindow.classList.remove('crt-shutdown');
        terminalWindow.style.display = '';
        document.body.style.background = '';

        // Re-trigger crt-on animation
        terminalWindow.classList.remove('crt-on');
        // Force reflow to restart animation
        void terminalWindow.offsetWidth;
        terminalWindow.classList.add('crt-on');

        // Re-show the glow overlay
        const glow = terminalWindow.querySelector('.crt-glow') as HTMLElement;
        if (glow) {
          glow.style.display = '';
          glow.style.animation = 'none';
          void glow.offsetWidth;
          glow.style.animation = '';
        }
      }, 1000);
    }, { once: true });
  }

  /** Synthesize a Mac-like boot chime using the Web Audio API. */
  private _playBootChime() {
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const duration = 4;

      // F# major chord — the classic Mac startup chime
      const notes = [
        { freq: 185.00, vol: 0.15 },  // F#3
        { freq: 233.08, vol: 0.12 },  // A#3
        { freq: 277.18, vol: 0.12 },  // C#4
        { freq: 369.99, vol: 0.10 },  // F#4
      ];

      for (const { freq, vol } of notes) {
        // Fundamental
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);

        // 2nd harmonic (gentle, for warmth)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;
        gain2.gain.setValueAtTime(vol * 0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + duration * 0.6);
      }

      setTimeout(() => ctx.close(), (duration + 0.5) * 1000);
    } catch {
      // Web Audio API not available
    }
  }
}
