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
        description: entry.description ?? api?.description ?? 'No description available',
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
