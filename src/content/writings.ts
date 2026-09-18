import { Writing } from '../types';
import { parseMarkdown, convertToWriting } from '../utils/markdownParser';
import writingsJsonData from './writings.json';

// File-based Content Management System
// Automatically discovers and loads:
// 1. Static writings from /src/content/writings.json (updated via /admin and GitHub)
// 2. /content/{category}/*.md (Organized by category, e.g. /content/kobita/my-poem.md)
// 3. /src/content/writings/{category}/*.md

// Explicit static writings (loaded from writings.json)
let staticWritings: Writing[] = Array.isArray(writingsJsonData) ? (writingsJsonData as Writing[]) : [];

// Dynamic glob import of Markdown files across the content directories
const markdownModules = import.meta.glob(
  ['/content/**/*.md', '/src/content/writings/**/*.md'],
  { query: '?raw', eager: true }
) as Record<string, { default?: string } | string>;

/**
 * Parses all discovered markdown files and compiles the writing archive.
 */
function loadMarkdownWritings(): Writing[] {
  const loadedList: Writing[] = [];

  for (const [filePath, moduleExport] of Object.entries(markdownModules)) {
    // Ignore template or README files
    if (filePath.endsWith('README.md') || filePath.endsWith('template.md')) {
      continue;
    }

    const raw = typeof moduleExport === 'string' 
      ? moduleExport 
      : (moduleExport?.default || '');

    if (!raw.trim()) continue;

    // Infer category from directory if possible (e.g. /content/kobita/my-poem.md)
    const matchCat = filePath.match(/(?:content|writings)\/([^/]+)\/[^/]+\.md$/);
    const categoryFromPath = matchCat ? matchCat[1] : undefined;

    const parsed = parseMarkdown(raw);
    const fallbackId = filePath
      .replace(/^\/(?:src\/)?(?:content\/)?/, '')
      .replace(/\.md$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-');

    const writing = convertToWriting(parsed, fallbackId, categoryFromPath);
    if (writing) {
      loadedList.push(writing);
    }
  }

  return loadedList;
}

// Cached list of all combined writings
let cachedWritings: Writing[] | null = null;

export function getAllWritings(): Writing[] {
  if (!cachedWritings) {
    const mdWritings = loadMarkdownWritings();
    // Merge static and markdown writings, deduplicating by slug + category
    const map = new Map<string, Writing>();

    for (const w of staticWritings) {
      map.set(`${w.category}/${w.slug}`, w);
    }
    for (const w of mdWritings) {
      map.set(`${w.category}/${w.slug}`, w);
    }

    cachedWritings = Array.from(map.values());
  }
  return cachedWritings;
}

/**
 * Updates in-memory writings cache when edited in admin during the same session.
 */
export function updateLocalWritings(newList: Writing[]): void {
  staticWritings = newList;
  cachedWritings = null;
  // Trigger re-read
  getAllWritings();
}

/**
 * Get all published writings, sorted by date descending.
 */
export function getPublishedWritings(): Writing[] {
  return getAllWritings()
    .filter((w) => w.published === true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get published writings by category.
 */
export function getWritingsByCategory(categorySlug: string): Writing[] {
  return getPublishedWritings().filter((w) => w.category === categorySlug);
}

/**
 * Find a published writing by its category and slug.
 */
export function getWritingBySlug(categorySlug: string, slug: string): Writing | undefined {
  return getAllWritings().find(
    (w) => w.published === true && w.category === categorySlug && w.slug === slug
  );
}

/**
 * Search published writings by query in title, category, or content.
 */
export function searchPublishedWritings(query: string): Writing[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return getPublishedWritings().filter((w) => {
    const titleMatch = w.title.toLowerCase().includes(normalized);
    const categoryMatch = w.category.toLowerCase().includes(normalized);
    const contentMatch = w.content.toLowerCase().includes(normalized);
    const excerptMatch = w.excerpt ? w.excerpt.toLowerCase().includes(normalized) : false;
    const tagMatch = w.tags ? w.tags.some((t) => t.toLowerCase().includes(normalized)) : false;

    return titleMatch || categoryMatch || contentMatch || excerptMatch || tagMatch;
  });
}
