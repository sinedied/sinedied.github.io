# sinedied.github.io

Personal website of Yohan Lasorsa — Developer Advocate at Microsoft. Terminal-themed static site built with Astro and Lit v3 web components.

## Overview

- Static personal website deployed on GitHub Pages at https://sinedied.github.io
- Terminal/CLI aesthetic with multiple selectable color themes
- Sections: Home (about/neofetch-style), Projects (GitHub repos), Events (conference talks)
- Blog section planned but not yet implemented
- Projects page fetches live data from the GitHub API at build time

## Project Structure

```
src/
├── components/       # Lit v3 web components (TypeScript)
├── data/             # YAML data files (projects, events)
├── layouts/          # Astro layouts (BaseLayout)
├── lib/              # Shared utilities (config, GitHub API)
├── pages/            # Astro pages (index, projects, events)
└── styles/           # CSS: base, animations, themes/
public/               # Static assets (.nojekyll)
.github/workflows/    # GitHub Actions deploy pipeline
```

## Key Technologies and Frameworks

- **Astro** — static site generator (output: static)
- **Lit v3** — web components (`@astrojs/lit` integration)
- **TypeScript** — with legacy decorators (`experimentalDecorators: true`, `useDefineForClassFields: false`)
- **Vite** — bundler (via Astro)
- **JetBrains Mono** — primary font (`@fontsource/jetbrains-mono`)
- **Node.js 22+** — required runtime

## Constraints and Requirements

- Lit components must be imported with PascalCase named imports in Astro pages (e.g., `import { ThemeSwitcher } from '../components/theme-switcher.ts'`) and used as `<ThemeSwitcher client:load />` for Astro's Lit SSR renderer to match them
- Components use `client:load` directive for hydration
- The `tsconfig.json` uses `experimentalDecorators: true` and `useDefineForClassFields: false` — do NOT switch to TC39 decorators
- All CSS colors use custom properties defined in `src/styles/base.css` and overridden by theme files in `src/styles/themes/`
- All animations must respect `prefers-reduced-motion: reduce`
- GitHub API data is fetched at build time in `src/lib/github.ts`; the `GITHUB_TOKEN` env var is used for auth when available

## Development Workflow

```bash
npm run dev       # Start dev server (http://localhost:4321)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

- Add/edit projects: `src/data/projects.yaml` (repo slugs; stars/dates fetched via GitHub API)
- Add/edit events: `src/data/events.yaml` (YAML array of talk objects)
- Edit social links & personal info: `src/lib/config.ts`
- Deployment: automatic via GitHub Actions on push to `main`

## Coding Guidelines

- Use ES modules (`"type": "module"` in package.json)
- Lit components: one class per file, `@customElement` decorator, Shadow DOM with `static styles = css\`...\``
- Export the class from each component file for Astro imports
- CSS: use CSS custom properties (`--term-*`) for all colors; never hardcode colors in components
- Astro pages: import components in frontmatter, use PascalCase JSX-style tags
- Keep data in YAML files under `src/data/`

## Themes

Four selectable themes stored in `localStorage` and applied via `data-theme` attribute on `<html>`:

- `green-phosphor` — classic CRT green
- `amber-phosphor` — 80s amber terminal
- `modern-minimal` / `modern-minimal-light` — clean dark/light mode
- `cyberpunk-neon` — neon cyan/magenta

A blocking inline script in `<head>` applies the theme before first paint to prevent flash.

## Security Considerations

- No server-side code; fully static output
- `GITHUB_TOKEN` is only used at build time and passed via GitHub Actions secrets
- All external links use `target="_blank" rel="noopener noreferrer"`
