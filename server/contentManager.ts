import fs from 'fs';
import path from 'path';
import { getGitHubConfig, getFileFromGitHub, commitFileToGitHub } from './github';

export interface WritingItem {
  id: string;
  title: string;
  slug: string;
  category: 'kobita' | 'golpo' | 'choto-lekha' | 'probandho' | 'alochona';
  content: string;
  excerpt?: string;
  date: string;
  updatedDate?: string;
  published: boolean;
  tags?: string[];
}

const CONTENT_FILE_PATH = process.env.CONTENT_FILE_PATH || 'src/content/writings.json';

/**
 * Resolves the path to writings.json on the local filesystem if accessible.
 */
function getLocalFilePath(): string {
  return path.resolve(process.cwd(), CONTENT_FILE_PATH);
}

/**
 * Loads all writings from GitHub (if configured) or local filesystem fallback.
 */
export async function loadWritings(): Promise<WritingItem[]> {
  const ghConfig = getGitHubConfig();

  // If GitHub is configured, fetch from GitHub repo first for the most updated state
  if (ghConfig) {
    try {
      const ghFile = await getFileFromGitHub(CONTENT_FILE_PATH);
      if (ghFile && ghFile.exists && ghFile.content) {
        const parsed = JSON.parse(ghFile.content);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[ContentManager] GitHub fetch failed, falling back to local file:', err);
    }
  }

  // Local filesystem fallback
  try {
    const localPath = getLocalFilePath();
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[ContentManager] Local file read failed:', err);
  }

  return [];
}

/**
 * Saves all writings: writes to local disk if writable, and commits to GitHub if configured.
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

  // 1. Try writing to local disk
  try {
    const localPath = getLocalFilePath();
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localPath, formattedJson, 'utf-8');
    localWritten = true;
  } catch (err) {
    // In read-only serverless environments (e.g. Vercel), local filesystem write fails gracefully
    console.info('[ContentManager] Local disk write skipped (read-only environment)');
  }

  // 2. Commit to GitHub if configured
  const ghConfig = getGitHubConfig();
  if (ghConfig) {
    const commitMsg = `content: ${actionSummary} [skip ci]`;
    const commitResult = await commitFileToGitHub(CONTENT_FILE_PATH, formattedJson, commitMsg);
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
