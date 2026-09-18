/**
 * Server-side GitHub API integration
 * Handles reading and committing content files directly to the GitHub repository.
 * Tokens and secrets NEVER leave the server.
 */

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export function getGitHubConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repoEnv = process.env.GITHUB_REPO || '';
  const ownerEnv = process.env.GITHUB_OWNER || '';
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token) {
    return null;
  }

  let owner = ownerEnv;
  let repo = repoEnv;

  if (repoEnv.includes('/')) {
    const parts = repoEnv.split('/');
    owner = parts[0];
    repo = parts[1];
  }

  if (!owner || !repo) {
    return null;
  }

  return { token, owner, repo, branch };
}

export async function getFileFromGitHub(filePath: string) {
  const config = getGitHubConfig();
  if (!config) return null;

  const cleanPath = filePath.replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${cleanPath}?ref=${config.branch}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Bangla-Sahitya-CMS/1.0',
      },
    });

    if (res.status === 404) {
      return { exists: false, sha: null, content: null };
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitHub API error (${res.status}): ${errText}`);
    }

    const data = await res.json() as { sha: string; content: string; encoding: string };
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return {
      exists: true,
      sha: data.sha,
      content,
    };
  } catch (error) {
    console.error(`[GitHub API] Failed to fetch ${cleanPath}:`, error);
    throw error;
  }
}

export async function commitFileToGitHub(
  filePath: string,
  contentStr: string,
  commitMessage: string
) {
  const config = getGitHubConfig();
  if (!config) {
    throw new Error('GitHub configuration missing. Please provide GITHUB_TOKEN and GITHUB_REPO in environment variables.');
  }

  const cleanPath = filePath.replace(/^\/+/, '');

  // Look up existing file SHA if present to allow updating
  let currentSha: string | null = null;
  try {
    const existing = await getFileFromGitHub(cleanPath);
    if (existing?.exists) {
      currentSha = existing.sha;
    }
  } catch (err) {
    console.warn(`[GitHub API] Could not verify existing file SHA for ${cleanPath}:`, err);
  }

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${cleanPath}`;
  const base64Content = Buffer.from(contentStr, 'utf-8').toString('base64');

  const body: Record<string, unknown> = {
    message: commitMessage,
    content: base64Content,
    branch: config.branch,
  };

  if (currentSha) {
    body.sha = currentSha;
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Bangla-Sahitya-CMS/1.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub commit failed (${res.status}): ${errText}`);
  }

  const result = await res.json() as {
    commit?: { sha?: string; html_url?: string };
    content?: { path?: string; sha?: string };
  };

  return {
    success: true,
    commitSha: result.commit?.sha || null,
    commitUrl: result.commit?.html_url || null,
    branch: config.branch,
  };
}
