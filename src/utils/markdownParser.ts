import { Writing, WritingCategory } from '../types';

export interface ParsedFrontmatter {
  title?: string;
  slug?: string;
  category?: WritingCategory | string;
  date?: string;
  published?: boolean;
  excerpt?: string;
  tags?: string[];
  image?: string;
  updatedDate?: string;
  [key: string]: unknown;
}

export interface ParsedMarkdown {
  metadata: ParsedFrontmatter;
  content: string;
}

/**
 * Robust zero-dependency frontmatter parser for Markdown files.
 * Handles standard YAML frontmatter bounded by `---` at the beginning of the file.
 */
export function parseMarkdown(rawContent: string): ParsedMarkdown {
  const normalized = rawContent.replace(/\r\n/g, '\n');
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
  const match = normalized.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: {},
      content: normalized.trim(),
    };
  }

  const rawYaml = match[1];
  const bodyContent = match[2];
  const metadata = parseYamlLines(rawYaml);

  return {
    metadata,
    content: bodyContent.trim(),
  };
}

/**
 * Parses simple YAML key-value pairs and lists.
 */
function parseYamlLines(yamlText: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = {};
  const lines = yamlText.split('\n');
  let currentListKey: string | null = null;
  let currentList: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines or comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Check for list item (- item)
    if (trimmed.startsWith('- ') && currentListKey) {
      const itemVal = stripQuotes(trimmed.slice(2).trim());
      currentList.push(itemVal);
      result[currentListKey] = [...currentList];
      continue;
    }

    // New key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      // If we were accumulating a list, save it
      currentListKey = null;

      const key = trimmed.slice(0, colonIndex).trim();
      const rawValue = trimmed.slice(colonIndex + 1).trim();

      if (rawValue === '') {
        // Might be a list starting on next line
        currentListKey = key;
        currentList = [];
        result[key] = currentList;
        continue;
      }

      // Inline list: [tag1, tag2]
      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        const inner = rawValue.slice(1, -1).trim();
        const items = inner
          ? inner.split(',').map((s) => stripQuotes(s.trim())).filter(Boolean)
          : [];
        result[key] = items;
        continue;
      }

      // Boolean
      if (rawValue.toLowerCase() === 'true') {
        result[key] = true;
        continue;
      }
      if (rawValue.toLowerCase() === 'false') {
        result[key] = false;
        continue;
      }

      // Number
      if (/^\d+$/.test(rawValue)) {
        result[key] = parseInt(rawValue, 10);
        continue;
      }

      // String with stripped quotes
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
 * Converts parsed Markdown file data into a strictly-typed Writing object.
 */
export function convertToWriting(
  parsed: ParsedMarkdown,
  fallbackId: string,
  categoryFromDir?: string
): Writing | null {
  const { metadata, content } = parsed;

  const title = typeof metadata.title === 'string' ? metadata.title.trim() : '';
  const slug = typeof metadata.slug === 'string' ? metadata.slug.trim() : '';
  const category = (typeof metadata.category === 'string' ? metadata.category.trim() : categoryFromDir) as WritingCategory;
  const date = typeof metadata.date === 'string' ? metadata.date.trim() : '';
  const published = metadata.published === true;

  if (!title || !slug || !category || !date) {
    // Missing mandatory fields
    return null;
  }

  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.map((t) => String(t).trim()).filter(Boolean)
    : undefined;

  return {
    id: fallbackId,
    title,
    slug,
    category,
    content,
    excerpt: typeof metadata.excerpt === 'string' ? metadata.excerpt.trim() : undefined,
    date,
    published,
    tags,
    image: typeof metadata.image === 'string' ? metadata.image.trim() : undefined,
    updatedDate: typeof metadata.updatedDate === 'string' ? metadata.updatedDate.trim() : undefined,
  };
}
