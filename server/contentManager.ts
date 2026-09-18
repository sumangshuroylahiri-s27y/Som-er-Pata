import fs from 'fs';
import path from 'path';
import { getGitHubConfig, getFileFromGitHub, commitFileToGitHub, deleteFileFromGitHub } from './github';

export type WritingCategory = 'kobita' | 'golpo' | 'choto-lekha' | 'probandho' | 'alochona';

export const VALID_CATEGORIES: WritingCategory[] = [
  'kobita',
  'golpo',
  'choto-lekha',
  'probandho',
  'alochona',
];

export interface WritingItem {
  id: string;
  title: string;
  slug: string;
  category: WritingCategory;
  content: string;
  excerpt?: string;
  date: string;
  updatedDate?: string;
  published: boolean;
  tags?: string[];
  image?: string;
}

const WRITINGS_JSON_PATH = process.env.CONTENT_FILE_PATH || 'src/content/writings.json';

/**
 * Serializes a writing item into Markdown format with standard YAML frontmatter.
 */
export function serializeWritingToMarkdown(writing: WritingItem): string {
  const lines: string[] = ['---'];
  lines.push(`title: ${JSON.stringify(writing.title)}`);
  lines.push(`slug: ${JSON.stringify(writing.slug)}`);
  lines.push(`category: ${JSON.stringify(writing.category)}`);
  lines.push(`date: ${JSON.stringify(writing.date)}`);
  lines.push(`published: ${writing.published ? 'true' : 'false'}`);

  if (writing.excerpt && writing.excerpt.trim()) {
    lines.push(`excerpt: ${JSON.stringify(writing.excerpt.trim())}`);
  }

  if (writing.image && writing.image.trim()) {
    lines.push(`image: ${JSON.stringify(writing.image.trim())}`);
  }

  if (writing.updatedDate && writing.updatedDate.trim()) {
    lines.push(`updatedDate: ${JSON.stringify(writing.updatedDate.trim())}`);
  }

  if (writing.tags && Array.isArray(writing.tags) && writing.tags.length > 0) {
    lines.push('tags:');
    for (const tag of writing.tags) {
      if (typeof tag === 'string' && tag.trim()) {
        lines.push(`  - ${JSON.stringify(tag.trim())}`);
      }
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(writing.content.trim());
  lines.push('');

  return lines.join('\n');
}

/**
 * Robust YAML frontmatter line parser for markdown files.
 */
function parseYamlLines(yamlText: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yamlText.split('\n');
  let currentListKey: string | null = null;
  let currentList: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- ') && currentListKey) {
      const itemVal = stripQuotes(trimmed.slice(2).trim());
      currentList.push(itemVal);
      result[currentListKey] = [...currentList];
      continue;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      currentListKey = null;
      const key = trimmed.slice(0, colonIndex).trim();
      const rawValue = trimmed.slice(colonIndex + 1).trim();

      if (rawValue === '') {
        currentListKey = key;
        currentList = [];
        result[key] = currentList;
        continue;
      }

      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        const inner = rawValue.slice(1, -1).trim();
        const items = inner
          ? inner.split(',').map((s) => stripQuotes(s.trim())).filter(Boolean)
          : [];
        result[key] = items;
        continue;
      }

      if (rawValue.toLowerCase() === 'true') {
        result[key] = true;
        continue;
      }
      if (rawValue.toLowerCase() === 'false') {
        result[key] = false;
        continue;
      }

      result[key] = stripQuotes(rawValue);
    }
  }

  return result;
}

function stripQuotes(str: string): string {
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Parses markdown text into a structured WritingItem.
 */
export function parseMarkdownWriting(
  rawContent: string,
  fallbackCategory?: string,
  fallbackSlug?: string
): WritingItem | null {
  const normalized = rawContent.replace(/\r\n/g, '\n');
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
  const match = normalized.match(frontmatterRegex);

  if (!match) return null;

  const rawYaml = match[1];
  const bodyContent = match[2].trim();
  const meta = parseYamlLines(rawYaml);

  const title = typeof meta.title === 'string' ? meta.title.trim() : '';
  const slug = typeof meta.slug === 'string' && meta.slug.trim() 
    ? meta.slug.trim() 
    : (fallbackSlug || '');
  const categoryRaw = typeof meta.category === 'string' ? meta.category.trim() : fallbackCategory;
  const category = (VALID_CATEGORIES.includes(categoryRaw as WritingCategory)
    ? categoryRaw
    : 'kobita') as WritingCategory;
  const date = typeof meta.date === 'string' ? meta.date.trim() : new Date().toISOString().split('T')[0];
  const published = meta.published === true;

  if (!title || !slug) {
    return null;
  }

  const tags = Array.isArray(meta.tags)
    ? meta.tags.map((t) => String(t).trim()).filter(Boolean)
    : undefined;

  return {
    id: `${category}-${slug}`,
    title,
    slug,
    category,
    content: bodyContent,
    excerpt: typeof meta.excerpt === 'string' ? meta.excerpt.trim() : undefined,
    date,
    published,
    tags,
    image: typeof meta.image === 'string' ? meta.image.trim() : undefined,
    updatedDate: typeof meta.updatedDate === 'string' ? meta.updatedDate.trim() : undefined,
  };
}

/**
 * Returns the relative file path for a writing in the category folder.
 */
export function getWritingMarkdownPath(category: WritingCategory, slug: string): string {
  return `content/${category}/${slug}.md`;
}

/**
 * Resolves an absolute path on the local filesystem.
 */
function getLocalPath(relPath: string): string {
  return path.resolve(process.cwd(), relPath);
}

/**
 * Loads all writings across the category folders and writings.json.
 */
export async function loadWritings(): Promise<WritingItem[]> {
  const writingsMap = new Map<string, WritingItem>();

  // 1. Read category folders from local disk
  try {
    for (const cat of VALID_CATEGORIES) {
      const catDir = getLocalPath(`content/${cat}`);
      if (fs.existsSync(catDir)) {
        const files = fs.readdirSync(catDir);
        for (const file of files) {
          if (!file.endsWith('.md') || file === 'template.md' || file === 'README.md') {
            continue;
          }
          try {
            const filePath = path.join(catDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const fallbackSlug = file.replace(/\.md$/, '');
            const parsed = parseMarkdownWriting(content, cat, fallbackSlug);
            if (parsed) {
              writingsMap.set(`${parsed.category}/${parsed.slug}`, parsed);
            }
          } catch (err) {
            console.warn(`[ContentManager] Error reading ${cat}/${file}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[ContentManager] Local category directory scan error:', err);
  }

  // 2. Read writings.json from local disk
  try {
    const jsonPath = getLocalPath(WRITINGS_JSON_PATH);
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.slug && item.category) {
            const key = `${item.category}/${item.slug}`;
            // If not already in map or if json has newer updatedDate, use/merge
            if (!writingsMap.has(key)) {
              writingsMap.set(key, item);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[ContentManager] writings.json read error:', err);
  }

  // 3. If local map is empty and GitHub is configured, attempt to load from GitHub repo
  const ghConfig = getGitHubConfig();
  if (writingsMap.size === 0 && ghConfig) {
    try {
      const ghFile = await getFileFromGitHub(WRITINGS_JSON_PATH);
      if (ghFile && ghFile.exists && ghFile.content) {
        const parsed = JSON.parse(ghFile.content);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.slug && item.category) {
              writingsMap.set(`${item.category}/${item.slug}`, item);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[ContentManager] GitHub fallback fetch failed:', err);
    }
  }

  // Convert to array and sort by date descending
  return Array.from(writingsMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Saves a single writing item:
 * 1. Writes markdown to content/${category}/${slug}.md
 * 2. If previous path existed and changed, removes old file
 * 3. Updates src/content/writings.json
 * 4. Commits changes to GitHub if configured
 */
export async function saveWritingItem(
  item: WritingItem,
  previousCategory?: string,
  previousSlug?: string,
  actionSummary?: string
): Promise<{
  success: boolean;
  localWritten: boolean;
  githubCommitted: boolean;
  commitSha?: string | null;
  commitUrl?: string | null;
  branch?: string;
}> {
  const currentList = await loadWritings();

  // Deduplicate and update list
  const targetId = item.id || `${item.category}-${item.slug}`;
  item.id = targetId;

  const updatedList = currentList.filter(
    (w) => w.id !== targetId && !(w.category === item.category && w.slug === item.slug)
  );
  updatedList.unshift(item);

  const markdownContent = serializeWritingToMarkdown(item);
  const newRelMdPath = getWritingMarkdownPath(item.category, item.slug);
  const oldRelMdPath =
    previousCategory && previousSlug && (previousCategory !== item.category || previousSlug !== item.slug)
      ? getWritingMarkdownPath(previousCategory as WritingCategory, previousSlug)
      : null;

  let localWritten = false;

  // 1. Write to local filesystem
  try {
    const newLocalMdPath = getLocalPath(newRelMdPath);
    const newDir = path.dirname(newLocalMdPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }
    fs.writeFileSync(newLocalMdPath, markdownContent, 'utf-8');

    // Remove old markdown file if path changed
    if (oldRelMdPath) {
      const oldLocalMdPath = getLocalPath(oldRelMdPath);
      if (fs.existsSync(oldLocalMdPath)) {
        fs.unlinkSync(oldLocalMdPath);
      }
    }

    // Write updated writings.json
    const jsonLocalPath = getLocalPath(WRITINGS_JSON_PATH);
    const jsonDir = path.dirname(jsonLocalPath);
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }
    fs.writeFileSync(jsonLocalPath, JSON.stringify(updatedList, null, 2) + '\n', 'utf-8');

    localWritten = true;
  } catch (err) {
    console.info('[ContentManager] Local disk write skipped or partially read-only:', err);
  }

  // 2. Commit to GitHub if configured
  const ghConfig = getGitHubConfig();
  if (ghConfig) {
    const summary = actionSummary || `${item.published ? 'Publish' : 'Draft'} "${item.title}"`;
    const commitMsg = `content(${item.category}): ${summary} [skip ci]`;

    let commitResultSha: string | null = null;
    let commitResultUrl: string | null = null;

    try {
      // If old file existed and changed, delete old file from GitHub
      if (oldRelMdPath) {
        try {
          await deleteFileFromGitHub(oldRelMdPath, `content: remove moved file ${oldRelMdPath}`);
        } catch (e) {
          console.warn('[ContentManager] Old GitHub file deletion notice:', e);
        }
      }

      // Commit markdown file in category folder
      const mdCommit = await commitFileToGitHub(newRelMdPath, markdownContent, commitMsg);
      commitResultSha = mdCommit.commitSha;
      commitResultUrl = mdCommit.commitUrl;

      // Also commit updated writings.json
      const jsonFormatted = JSON.stringify(updatedList, null, 2) + '\n';
      await commitFileToGitHub(WRITINGS_JSON_PATH, jsonFormatted, `content(index): update writings index for "${item.title}" [skip ci]`);

      return {
        success: true,
        localWritten,
        githubCommitted: true,
        commitSha: commitResultSha,
        commitUrl: commitResultUrl,
        branch: ghConfig.branch,
      };
    } catch (err) {
      console.error('[ContentManager] GitHub commit failed:', err);
      throw err;
    }
  }

  return {
    success: true,
    localWritten,
    githubCommitted: false,
  };
}

/**
 * Deletes a writing:
 * 1. Unlinks markdown file from category folder on disk
 * 2. Removes from writings.json
 * 3. Deletes file from GitHub repository and updates writings.json
 */
export async function deleteWritingContent(
  item: WritingItem,
  remainingWritings: WritingItem[]
): Promise<{
  success: boolean;
  localDeleted: boolean;
  githubDeleted: boolean;
  commitSha?: string | null;
}> {
  const relMdPath = getWritingMarkdownPath(item.category, item.slug);
  let localDeleted = false;

  // 1. Remove from local disk
  try {
    const localMdPath = getLocalPath(relMdPath);
    if (fs.existsSync(localMdPath)) {
      fs.unlinkSync(localMdPath);
    }

    const jsonLocalPath = getLocalPath(WRITINGS_JSON_PATH);
    fs.writeFileSync(jsonLocalPath, JSON.stringify(remainingWritings, null, 2) + '\n', 'utf-8');
    localDeleted = true;
  } catch (err) {
    console.info('[ContentManager] Local disk delete notice:', err);
  }

  // 2. Delete from GitHub if configured
  const ghConfig = getGitHubConfig();
  if (ghConfig) {
    let commitSha: string | null = null;
    try {
      const delResult = await deleteFileFromGitHub(
        relMdPath,
        `content(${item.category}): delete "${item.title}" [skip ci]`
      );
      commitSha = delResult.commitSha || null;

      // Update writings.json on GitHub
      const jsonFormatted = JSON.stringify(remainingWritings, null, 2) + '\n';
      await commitFileToGitHub(
        WRITINGS_JSON_PATH,
        jsonFormatted,
        `content(index): update index after deleting "${item.title}" [skip ci]`
      );

      return {
        success: true,
        localDeleted,
        githubDeleted: true,
        commitSha,
      };
    } catch (err) {
      console.error('[ContentManager] GitHub delete failed:', err);
      throw err;
    }
  }

  return {
    success: true,
    localDeleted,
    githubDeleted: false,
  };
}

/**
 * Bulk save fallback (updates writings.json and ensures markdown files are created)
 */
export async function saveWritings(
  writings: WritingItem[],
  actionSummary: string
): Promise<{
  success: boolean;
  localWritten: boolean;
  githubCommitted: boolean;
  commitSha?: string | null;
  commitUrl?: string | null;
  branch?: string;
}> {
  const formattedJson = JSON.stringify(writings, null, 2) + '\n';
  let localWritten = false;

  // 1. Write to local disk
  try {
    const localPath = getLocalPath(WRITINGS_JSON_PATH);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localPath, formattedJson, 'utf-8');

    // Also write each writing's markdown file
    for (const w of writings) {
      const mdRelPath = getWritingMarkdownPath(w.category, w.slug);
      const mdLocalPath = getLocalPath(mdRelPath);
      const mdDir = path.dirname(mdLocalPath);
      if (!fs.existsSync(mdDir)) {
        fs.mkdirSync(mdDir, { recursive: true });
      }
      fs.writeFileSync(mdLocalPath, serializeWritingToMarkdown(w), 'utf-8');
    }

    localWritten = true;
  } catch (err) {
    console.info('[ContentManager] Local disk write notice:', err);
  }

  // 2. Commit to GitHub if configured
  const ghConfig = getGitHubConfig();
  if (ghConfig) {
    const commitMsg = `content: ${actionSummary} [skip ci]`;
    const commitResult = await commitFileToGitHub(WRITINGS_JSON_PATH, formattedJson, commitMsg);
    return {
      success: true,
      localWritten,
      githubCommitted: true,
      commitSha: commitResult.commitSha,
      commitUrl: commitResult.commitUrl,
      branch: commitResult.branch,
    };
  }

  return {
    success: true,
    localWritten,
    githubCommitted: false,
  };
}
