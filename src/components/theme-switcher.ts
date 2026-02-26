import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';


/**
 * Theme switcher component — selects between terminal themes.
 * Stores preference in localStorage and applies data-theme attribute.
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
      border: 1px solid var(--term-border, #333);
      border-radius: 4px;
      background: var(--term-surface, #111);
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

    @media (max-width: 640px) {
      .label { display: none; }
      .themes { display: none; }
      .dropdown-toggle { display: inline-flex; }
    }
  `;

  static themes = [
    { id: 'green-phosphor', label: 'Phosphor' },
    { id: 'amber-phosphor', label: 'Amber' },
    { id: 'modern-minimal', label: 'Minimal' },
    { id: 'cyberpunk-neon', label: 'Neon' },
  ] as const;

  @state() current = 'green-phosphor';
  @state() private _dropdownOpen = false;

  private _closeHandler = (e: Event) => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._dropdownOpen = false;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._closeHandler);
  }

  firstUpdated() {
    // Read the theme from the DOM attribute (already set by the blocking <head> script)
    // This runs after Lit hydration is complete, so state updates will trigger re-renders.
    const applied = document.documentElement.getAttribute('data-theme');
    if (applied) {
      this.current = applied;
    } else {
      const stored = localStorage.getItem('theme');
      if (stored) {
        this.current = stored;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.current = prefersDark ? 'green-phosphor' : 'modern-minimal-light';
      }
      this._applyTheme(this.current);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._closeHandler);
  }

  private _applyTheme(themeId: string) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('theme', themeId);
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

  render() {
    return html`
      <span class="label">theme:</span>
      <div class="themes" role="radiogroup" aria-label="Select theme">
        ${ThemeSwitcher.themes.map(
          (t) => html`
            <button
              role="radio"
              aria-checked=${String(this._isActive(t.id))}
              class="${this._isActive(t.id) ? 'active' : ''}"
              @click=${() => this._handleClick(t.id)}
            >${t.label}</button>
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
              class="${this._isActive(t.id) ? 'active' : ''}"
              @click=${() => this._handleDropdownClick(t.id)}
            >${t.label}</button>
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
