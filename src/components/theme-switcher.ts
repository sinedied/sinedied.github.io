import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';


/**
 * Theme switcher component — selects between terminal themes.
 * Stores preference in localStorage only when user explicitly changes theme.
 * Collapses into a dropdown on small screens.
 */
@customElement('theme-switcher')
export class ThemeSwitcher extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: var(--font-size-sm, 0.85rem);
      position: relative;
    }

    .label {
      color: var(--term-dim, #555);
      user-select: none;
    }

    /* ── Inline mode (desktop) ── */
    .themes {
      display: inline-flex;
      gap: 4px;
      padding: 2px;
      border: none;
      border-radius: 4px;
      background: none;
    }

    button {
      background: none;
      border: 1px solid transparent;
      color: var(--term-dim, #555);
      font-family: inherit;
      font-size: inherit;
      padding: 3px 8px;
      cursor: pointer;
      border-radius: 3px;
      transition: color 0.2s, background 0.2s, border-color 0.2s;
      white-space: nowrap;
    }

    button:hover {
      color: var(--term-fg, #fff);
      background: var(--term-surface-hover, #222);
    }

    button.active {
      color: var(--term-accent, #0f0);
      border-color: var(--term-accent, #0f0);
      background: var(--term-surface-hover, #222);
    }

    button:focus-visible {
      outline: 2px solid var(--term-accent, #0f0);
      outline-offset: 1px;
    }

    .icon {
      display: inline-flex;
      align-items: center;
      margin-left: 0;
      vertical-align: middle;
      position: relative;
      top: -0.5px;
    }

    .icon svg {
      width: 0.85em;
      height: 0.85em;
      fill: currentColor;
    }

    /* ── Dropdown mode (mobile) ── */
    .dropdown-toggle {
      background: none;
      border: 1px solid var(--term-border, #333);
      border-radius: 4px;
      color: var(--term-accent, #0f0);
      font-family: inherit;
      font-size: inherit;
      padding: 3px 8px;
      cursor: pointer;
      display: none;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .dropdown-toggle:hover {
      background: var(--term-surface-hover, #222);
    }

    .dropdown-toggle .arrow {
      font-size: 0.7em;
      transition: transform 0.2s;
    }

    .dropdown-toggle.open .arrow {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--term-surface, #111);
      border: 1px solid var(--term-border, #333);
      border-radius: 4px;
      overflow: hidden;
      z-index: 200;
      min-width: 120px;
    }

    .dropdown-menu.open {
      display: flex;
      flex-direction: column;
    }

    .dropdown-menu button {
      border-radius: 0;
      padding: 6px 12px;
      text-align: left;
      width: 100%;
    }

    .dropdown-menu button + button {
      box-shadow: 0 -1px 0 var(--term-border, #333);
    }

    .dropdown-menu button.active {
      position: relative;
      z-index: 1;
    }

    /* Before hydration: ::part() from the page styles the correct active
       button based on data-theme. We reset internal .active so it doesn't
       conflict with the external ::part() rules. */
    :host(:not([ready])) button.active {
      color: var(--term-dim, #555);
      border-color: transparent;
      background: none;
    }

    /* Icon (sun/moon) depends on JS state — hide until hydrated */
    :host(:not([ready])) .icon {
      visibility: hidden;
    }

    /* Dropdown shows current label from JS — hide until hydrated */
    :host(:not([ready])) .dropdown-toggle {
      visibility: hidden;
    }

    @media (max-width: 640px) {
      .label { display: none; }
      .themes { display: none; }
      .dropdown-toggle { display: inline-flex; }
    }
  `;

  static themes = [
    { id: 'modern-minimal', label: 'Code' },
    { id: 'cyberpunk-neon', label: 'Neon' },
    { id: 'green-phosphor', label: 'Phosphor' },
  ] as const;

  @state() current = 'modern-minimal';
  @state() private _dropdownOpen = false;
  private _userChose = false;
  private _mediaQuery: MediaQueryList | null = null;

  private _closeHandler = (e: Event) => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._dropdownOpen = false;
    }
  };

  private _systemThemeHandler = (e: MediaQueryListEvent) => {
    // Only react to system changes if user hasn't explicitly chosen a theme
    if (localStorage.getItem('theme')) return;
    const themeId = e.matches ? 'modern-minimal' : 'modern-minimal-light';
    document.documentElement.setAttribute('data-theme', themeId);
    this.current = themeId;
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._closeHandler);
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaQuery.addEventListener('change', this._systemThemeHandler);
  }

  firstUpdated() {
    // Read the theme from the DOM attribute (already set by the blocking <head> script)
    const applied = document.documentElement.getAttribute('data-theme');
    if (applied) {
      this.current = applied;
    } else {
      const stored = localStorage.getItem('theme');
      if (stored) {
        this.current = stored;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.current = prefersDark ? 'modern-minimal' : 'modern-minimal-light';
      }
      document.documentElement.setAttribute('data-theme', this.current);
    }
    this._userChose = !!localStorage.getItem('theme');
    // Reveal the theme buttons now that the correct state is known
    this.setAttribute('ready', '');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._closeHandler);
    this._mediaQuery?.removeEventListener('change', this._systemThemeHandler);
  }

  private _applyTheme(themeId: string, persist = true) {
    document.documentElement.setAttribute('data-theme', themeId);
    if (persist) {
      localStorage.setItem('theme', themeId);
    } else {
      localStorage.removeItem('theme');
    }
    this._userChose = persist;
    this.current = themeId;
  }

  private _handleClick(themeId: string) {
    if (themeId === 'modern-minimal') {
      const currentIsMinimalLight = this.current === 'modern-minimal-light';
      const currentIsMinimalDark = this.current === 'modern-minimal';
      if (currentIsMinimalDark) {
        this._applyTheme('modern-minimal-light');
        return;
      } else if (currentIsMinimalLight) {
        this._applyTheme('modern-minimal');
        return;
      }
      // Coming from another theme: use system preference, don't persist
      this._applyTheme(this._prefersDark ? 'modern-minimal' : 'modern-minimal-light', false);
      return;
    }
    this._applyTheme(themeId);
  }

  private _handleDropdownClick(themeId: string) {
    this._handleClick(themeId);
    this._dropdownOpen = false;
  }

  private _toggleDropdown(e: Event) {
    e.stopPropagation();
    this._dropdownOpen = !this._dropdownOpen;
  }

  private get _currentLabel(): string {
    const theme = ThemeSwitcher.themes.find(
      (t) => t.id === this.current || (t.id === 'modern-minimal' && this.current === 'modern-minimal-light')
    );
    return theme?.label ?? 'Theme';
  }

  private _isActive(themeId: string): boolean {
    return this.current === themeId ||
      (themeId === 'modern-minimal' && this.current === 'modern-minimal-light');
  }

  private get _prefersDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private get _codeIsLight(): boolean {
    if (this._isActive('modern-minimal')) {
      return this.current === 'modern-minimal-light';
    }
    return !this._prefersDark;
  }

  private get _codeIcon() {
    return this._codeIsLight
      ? html`<svg viewBox="0 0 24 24"><path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414-2.121-2.121zm2.121-14.85l1.414 1.415-2.121 2.121-1.414-1.414 2.121-2.121zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414 2.121-2.121zM23 11v2h-3v-2h3zM4 11v2H1v-2h3z"/></svg>`
      : html`<svg viewBox="0 0 24 24"><path d="M10 7a7 7 0 0 0 12 4.9v.1c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2h.1A6.98 6.98 0 0 0 10 7z"/></svg>`;
  }

  private _renderLabel(theme: typeof ThemeSwitcher.themes[number]) {
    if (theme.id === 'modern-minimal') {
      return html`${theme.label} <span class="icon">${this._codeIcon}</span>`;
    }
    return theme.label;
  }

  render() {
    return html`
      <span class="label">theme:</span>
      <div class="themes" role="radiogroup" aria-label="Select theme">
        ${ThemeSwitcher.themes.map(
          (t) => html`
            <button
              role="radio"
              part="btn btn-${t.id}"
              aria-checked=${String(this._isActive(t.id))}
              class="${this._isActive(t.id) ? 'active' : ''}"
              @click=${() => this._handleClick(t.id)}
            >${this._renderLabel(t)}</button>
          `
        )}
      </div>
      <button
        class="dropdown-toggle${this._dropdownOpen ? ' open' : ''}"
        @click=${this._toggleDropdown}
        aria-haspopup="true"
        aria-expanded=${String(this._dropdownOpen)}
      >${this._currentLabel} <span class="arrow">▼</span></button>
      <div class="dropdown-menu${this._dropdownOpen ? ' open' : ''}">
        ${ThemeSwitcher.themes.map(
          (t) => html`
            <button
              part="menu-btn menu-btn-${t.id}"
              class="${this._isActive(t.id) ? 'active' : ''}"
              @click=${() => this._handleDropdownClick(t.id)}
            >${this._renderLabel(t)}</button>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'theme-switcher': ThemeSwitcher;
  }
}
