/**
 * GitHub API helpers — fetch repo metadata at build time.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

export interface RepoEntry {
  repo: string;
  description?: string;
}

export interface ProjectsData {
  active: RepoEntry[];
  legacy: RepoEntry[];
}

export interface RepoInfo {
  slug: string;
  name: string;
  description: string;
  stars: number;
  lastCommit: string;
  url: string;
  language: string | null;
  section: 'active' | 'legacy';
}

const GITHUB_API = 'https://api.github.com';

/** Map of GitHub emoji shortcodes to Unicode emoji */
const emojiMap: Record<string, string> = {
  // Common GitHub repo description emoji
  sweat_drops: '💦', droplet: '💧', dash: '💨', fire: '🔥', rocket: '🚀', star: '⭐',
  sparkles: '✨', zap: '⚡', boom: '💥', tada: '🎉', trophy: '🏆',
  bulb: '💡', wrench: '🔧', hammer: '🔨', gear: '⚙️', package: '📦',
  lock: '🔒', key: '🔑', shield: '🛡️', warning: '⚠️', bug: '🐛',
  memo: '📝', book: '📖', books: '📚', pencil: '✏️', pencil2: '✏️',
  clipboard: '📋', pushpin: '📌', bookmark: '🔖', label: '🏷️',
  heart: '❤️', blue_heart: '💙', green_heart: '💚', yellow_heart: '💛',
  purple_heart: '💜', white_heart: '🤍', heartbeat: '💓',
  thumbsup: '👍', thumbsdown: '👎', clap: '👏', wave: '👋',
  point_right: '👉', point_left: '👈', point_up: '👆', point_down: '👇',
  raised_hands: '🙌', muscle: '💪', eyes: '👀',
  robot: '🤖', skull: '💀', ghost: '👻', alien: '👽',
  earth_americas: '🌎', earth_africa: '🌍', earth_asia: '🌏', globe_with_meridians: '🌐',
  sun_with_face: '🌞', cloud: '☁️', rainbow: '🌈', snowflake: '❄️',
  coffee: '☕', beer: '🍺', pizza: '🍕', hamburger: '🍔',
  construction: '🚧', traffic_light: '🚦', checkered_flag: '🏁',
  white_check_mark: '✅', heavy_check_mark: '✔️', x: '❌',
  heavy_plus_sign: '➕', heavy_minus_sign: '➖',
  arrow_right: '➡️', arrow_left: '⬅️', arrow_up: '⬆️', arrow_down: '⬇️',
  art: '🎨', musical_note: '🎵', microphone: '🎤', headphones: '🎧',
  video_camera: '📹', camera: '📷', computer: '💻', iphone: '📱',
  electric_plug: '🔌', battery: '🔋', satellite: '📡',
  link: '🔗', chains: '⛓️', mag: '🔍', mag_right: '🔎',
  chart_with_upwards_trend: '📈', chart_with_downwards_trend: '📉',
  inbox_tray: '📥', outbox_tray: '📤', envelope: '✉️',
  bell: '🔔', loudspeaker: '📢', triangular_flag_on_post: '🚩',
  test_tube: '🧪', microscope: '🔬', telescope: '🔭',
  seedling: '🌱', evergreen_tree: '🌲', deciduous_tree: '🌳', herb: '🌿', four_leaf_clover: '🍀',
  penguin: '🐧', snake: '🐍', spider_web: '🕸️', bee: '🐝',
  gem: '💎', crown: '👑', dark_sunglasses: '🕶️',
  scroll: '📜', page_facing_up: '📄', file_folder: '📁',
  thinking: '🤔', nerd_face: '🤓', sunglasses: '😎',
  100: '💯', infinity: '♾️', recycle: '♻️',
  hammer_and_wrench: '🛠️', toolbox: '🧰',
  spider: '🕷️', crab: '🦀', dolphin: '🐬',
};

/**
 * Replace GitHub emoji shortcodes (:name:) with Unicode emoji.
 * Unknown shortcodes are left unchanged.
 */
export function replaceEmojiShortcodes(text: string): string {
  return text.replace(/:([a-z0-9_+-]+):/g, (match, name: string) => {
    return emojiMap[name] ?? match;
  });
}

async function fetchRepo(slug: string): Promise<{
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
  html_url: string;
  language: string | null;
} | null> {
  const token = process.env.GITHUB_TOKEN ?? import.meta.env?.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'sinedied.github.io',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${GITHUB_API}/repos/${slug}`, { headers });
    if (!res.ok) {
      console.warn(`[github] Failed to fetch ${slug}: ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[github] Error fetching ${slug}:`, err);
    return null;
  }
}

export function loadProjectsYaml(): ProjectsData {
  const yamlPath = path.resolve('src/data/projects.yaml');
  const raw = fs.readFileSync(yamlPath, 'utf-8');
  return parseYaml(raw) as ProjectsData;
}

export async function getProjectsWithGitHubData(): Promise<RepoInfo[]> {
  const data = loadProjectsYaml();
  const results: RepoInfo[] = [];

  const fetchAll = async (entries: RepoEntry[], section: 'active' | 'legacy') => {
    const promises = entries.map(async (entry) => {
      const api = await fetchRepo(entry.repo);
      const [, name] = entry.repo.split('/');
      results.push({
        slug: entry.repo,
        name: name ?? entry.repo,
        description: replaceEmojiShortcodes(entry.description ?? api?.description ?? 'No description available'),
        stars: api?.stargazers_count ?? 0,
        lastCommit: api?.pushed_at ?? new Date().toISOString(),
        url: api?.html_url ?? `https://github.com/${entry.repo}`,
        language: api?.language ?? null,
        section,
      });
    });
    await Promise.all(promises);
  };

  await Promise.all([
    fetchAll(data.active ?? [], 'active'),
    fetchAll(data.legacy ?? [], 'legacy'),
  ]);

  // Sort by stars descending within each section
  const active = results.filter((r) => r.section === 'active').sort((a, b) => b.stars - a.stars);
  const legacy = results.filter((r) => r.section === 'legacy').sort((a, b) => b.stars - a.stars);

  return [...active, ...legacy];
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];

  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}
