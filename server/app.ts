import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getGitHubConfig } from './github';
import {
  loadWritings,
  saveWritingItem,
  deleteWritingContent,
  WritingItem,
  WritingCategory,
  VALID_CATEGORIES,
} from './contentManager';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Helper to check admin password / authorization
function getAdminPassword(): string {
  // If ADMIN_PASSWORD is set in environment, use that
  return process.env.ADMIN_PASSWORD || 'som-sahitya-admin';
}

// In-memory session tracking interface
interface AdminSession {
  token: string;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

// In-memory active sessions store (held only in server RAM, never persisted to disk)
const activeSessions = new Map<string, AdminSession>();

// Inactivity timeout: 30 minutes (1800000 ms)
const SESSION_INACTIVITY_MS = 30 * 60 * 1000;
// Maximum total session lifetime: 4 hours (14400000 ms)
const SESSION_MAX_LIFETIME_MS = 4 * 60 * 60 * 1000;

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
}

// Periodically clean up expired sessions from memory
const cleanupTimer = setInterval(cleanupExpiredSessions, 2 * 60 * 1000);
if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

interface AuthResult {
  authenticated: boolean;
  expired?: boolean;
  session?: AdminSession;
  remainingSeconds?: number;
}

function verifyAuthDetails(req: Request): AuthResult {
  cleanupExpiredSessions();
  const adminPassword = getAdminPassword();
  const customHeader = req.headers['x-admin-password'];

  // 1. Direct custom header (for automated scripts/integrations)
  if (customHeader && typeof customHeader === 'string' && customHeader === adminPassword) {
    return {
      authenticated: true,
      remainingSeconds: Math.floor(SESSION_INACTIVITY_MS / 1000),
    };
  }

  const token = extractBearerToken(req);
  if (!token) {
    return { authenticated: false };
  }

  // 2. Active in-memory session token
  const session = activeSessions.get(token);
  if (session) {
    const now = Date.now();
    if (now > session.expiresAt) {
      activeSessions.delete(token);
      return { authenticated: false, expired: true };
    }
    // Touch session: extend sliding expiration window
    session.lastActiveAt = now;
    session.expiresAt = Math.min(
      now + SESSION_INACTIVITY_MS,
      session.createdAt + SESSION_MAX_LIFETIME_MS
    );
    const remainingSeconds = Math.max(0, Math.floor((session.expiresAt - now) / 1000));
    return { authenticated: true, session, remainingSeconds };
  }

  // 3. Fallback direct password token for CLI/curl
  if (token === adminPassword) {
    return {
      authenticated: true,
      remainingSeconds: Math.floor(SESSION_INACTIVITY_MS / 1000),
    };
  }

  return { authenticated: false };
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = verifyAuthDetails(req);
  if (!auth.authenticated) {
    if (auth.expired) {
      res.status(401).json({
        error: 'নিরাপত্তাজনিত কারণে আপনার অ্যাডমিন সেশনের মেয়াদ শেষ হয়েছে। পুনরায় লগইন করুন।',
        code: 'SESSION_EXPIRED',
      });
      return;
    }
    res.status(401).json({
      error: 'অননুমোদিত প্রবেশাধিকার। সঠিক অ্যাডমিন পাসওয়ার্ড দিন।',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  next();
}

/**
 * Health check
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Admin Status
 * Returns authentication status and GitHub sync status (NO secrets exposed).
 */
app.get('/api/admin/status', (req, res) => {
  const auth = verifyAuthDetails(req);
  const ghConfig = getGitHubConfig();

  res.json({
    authenticated: auth.authenticated,
    expired: auth.expired || false,
    remainingSeconds: auth.remainingSeconds,
    isDefaultPassword: !process.env.ADMIN_PASSWORD,
    githubConfigured: !!ghConfig,
    repo: ghConfig ? `${ghConfig.owner}/${ghConfig.repo}` : null,
    branch: ghConfig ? ghConfig.branch : null,
  });
});

/**
 * Admin Session info check
 */
app.get('/api/admin/auth/session', (req, res) => {
  const auth = verifyAuthDetails(req);
  res.json({
    authenticated: auth.authenticated,
    expired: auth.expired || false,
    remainingSeconds: auth.remainingSeconds || 0,
    expiresAt: auth.session ? auth.session.expiresAt : null,
  });
});

/**
 * Admin Session Keepalive (touch session when user is actively editing/working)
 */
app.post('/api/admin/auth/keepalive', (req, res) => {
  const auth = verifyAuthDetails(req);
  if (!auth.authenticated) {
    res.status(401).json({
      authenticated: false,
      expired: auth.expired || false,
      error: 'সেশন সক্রিয় নেই বা মেয়াদ উত্তীর্ণ হয়েছে।',
    });
    return;
  }
  res.json({
    success: true,
    remainingSeconds: auth.remainingSeconds,
    expiresAt: auth.session ? auth.session.expiresAt : null,
  });
});

/**
 * Admin Login
 * Issues a cryptographically secure in-memory session token
 */
app.post('/api/admin/auth/login', (req, res) => {
  const { password } = req.body || {};
  const adminPassword = getAdminPassword();

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'পাসওয়ার্ড প্রদান করা প্রয়োজন।' });
    return;
  }

  if (password !== adminPassword) {
    res.status(401).json({ error: 'ভুল পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' });
    return;
  }

  // Generate cryptographically secure random session token
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_INACTIVITY_MS;

  activeSessions.set(token, {
    token,
    createdAt: now,
    lastActiveAt: now,
    expiresAt,
  });

  res.json({
    success: true,
    token,
    expiresAt,
    timeoutSeconds: Math.floor(SESSION_INACTIVITY_MS / 1000),
    message: 'প্রবেশাধিকার সফল হয়েছে।',
  });
});

/**
 * Admin Logout
 * Invalidates the in-memory session token on the server immediately
 */
app.post('/api/admin/auth/logout', (req, res) => {
  const token =
    extractBearerToken(req) ||
    (req.body && typeof req.body.token === 'string' ? req.body.token.trim() : null);

  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }

  res.json({
    success: true,
    message: 'সফলভাবে লগআউট সম্পন্ন হয়েছে। সেশন টোকেন মেমোরি থেকে মুছে ফেলা হয়েছে।',
  });
});

/**
 * Get all writings (both published and drafts)
 */
app.get('/api/admin/writings', requireAdmin, async (_req, res) => {
  try {
    const writings = await loadWritings();
    res.json({ success: true, writings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'রচনাসমূহ লোড করা সম্ভব হয়নি।';
    res.status(500).json({ error: msg });
  }
});

/**
 * Helper to sanitize or generate slug
 */
function generateSlug(rawSlug: string, title: string, id: string): string {
  const base = rawSlug.trim() || title.trim();
  const sanitized = base
    .toLowerCase()
    .replace(/[\s\/\\]+/g, '-')
    .replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '')
    .replace(/^-+|-+$/g, '');

  return sanitized || `writing-${id.slice(0, 8)}`;
}

/**
 * Add or Edit writing
 */
app.post('/api/admin/writings', requireAdmin, async (req, res) => {
  try {
    const { id, title, slug, category, content, excerpt, date, published, tags, image } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'রচনার শিরোনাম প্রয়োজন।' });
      return;
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'একটি বৈধ সাহিত্য বিভাগ নির্বাচন করুন (কবিতা, গল্প, ছোট লেখা, প্রবন্ধ, আলোচনা)।' });
      return;
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'রচনার সম্পূর্ণ পাঠ্য লিখুন।' });
      return;
    }

    const writings = await loadWritings();
    const isEdit = Boolean(id);
    const targetId = id && typeof id === 'string' ? id : `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const finalSlug = generateSlug(slug || '', title, targetId);
    const finalDate = date && typeof date === 'string' && date.trim() ? date.trim() : new Date().toISOString().split('T')[0];

    // Find previous category and slug if editing
    let previousCategory: string | undefined;
    let previousSlug: string | undefined;
    if (isEdit) {
      const existingItem = writings.find((w) => w.id === targetId);
      if (existingItem) {
        previousCategory = existingItem.category;
        previousSlug = existingItem.slug;
      }
    }

    // Process tags
    let processedTags: string[] | undefined;
    if (Array.isArray(tags)) {
      processedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim()) {
      processedTags = tags.split(/[,،]+/).map((t) => t.trim()).filter(Boolean);
    }

    const writingItem: WritingItem = {
      id: targetId,
      title: title.trim(),
      slug: finalSlug,
      category,
      content: content.trim(),
      excerpt: excerpt && typeof excerpt === 'string' && excerpt.trim() ? excerpt.trim() : undefined,
      date: finalDate,
      updatedDate: new Date().toISOString().split('T')[0],
      published: Boolean(published),
      tags: processedTags && processedTags.length > 0 ? processedTags : undefined,
      image: image && typeof image === 'string' && image.trim() ? image.trim() : undefined,
    };

    const actionSummary = isEdit 
      ? `update "${writingItem.title}" (${writingItem.published ? 'published' : 'draft'})`
      : `add "${writingItem.title}" (${writingItem.published ? 'published' : 'draft'})`;

    const saveResult = await saveWritingItem(
      writingItem,
      previousCategory,
      previousSlug,
      actionSummary
    );

    res.json({
      success: true,
      writing: writingItem,
      isEdit,
      githubCommitted: saveResult.githubCommitted,
      commitSha: saveResult.commitSha,
      commitUrl: saveResult.commitUrl,
      branch: saveResult.branch,
      message: saveResult.githubCommitted
        ? 'গিটহাবে এবং ক্যাটাগরি ফোল্ডারে সফলভাবে সংরক্ষিত হয়েছে। Vercel/Netlify স্বয়ংক্রিয়ভাবে সাইট রিডিপ্লয় করছে।'
        : 'সফলভাবে ক্যাটাগরি ফোল্ডারে সংরক্ষিত হয়েছে।',
    });
  } catch (err: unknown) {
    console.error('[Admin API] Error saving writing:', err);
    const msg = err instanceof Error ? err.message : 'লেখা সংরক্ষণ করা সম্ভব হয়নি।';
    res.status(500).json({ error: msg });
  }
});

/**
 * Toggle Publish / Unpublish status
 */
app.post('/api/admin/writings/:id/toggle-publish', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const writings = await loadWritings();
    const item = writings.find((w) => w.id === id);

    if (!item) {
      res.status(404).json({ error: 'নির্দিষ্ট রচনাটি খুঁজে পাওয়া যায়নি।' });
      return;
    }

    const newPublished = !item.published;
    item.published = newPublished;
    item.updatedDate = new Date().toISOString().split('T')[0];

    const actionSummary = `${newPublished ? 'publish' : 'unpublish'} "${item.title}"`;
    const saveResult = await saveWritingItem(item, item.category, item.slug, actionSummary);

    res.json({
      success: true,
      writing: item,
      githubCommitted: saveResult.githubCommitted,
      commitSha: saveResult.commitSha,
      message: newPublished ? 'রচনাটি সফলভাবে প্রকাশিত হয়েছে।' : 'রচনাটি অপ্রকাশিত (ড্রাফট) করা হয়েছে।',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'অবস্থা পরিবর্তন করা সম্ভব হয়নি।';
    res.status(500).json({ error: msg });
  }
});

/**
 * Delete writing
 */
app.delete('/api/admin/writings/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const writings = await loadWritings();
    const itemToDelete = writings.find((w) => w.id === id);

    if (!itemToDelete) {
      res.status(404).json({ error: 'নির্দিষ্ট রচনাটি খুঁজে পাওয়া যায়নি।' });
      return;
    }

    const remainingWritings = writings.filter((w) => w.id !== id);
    const deleteResult = await deleteWritingContent(itemToDelete, remainingWritings);

    res.json({
      success: true,
      deletedId: id,
      githubCommitted: deleteResult.githubDeleted,
      commitSha: deleteResult.commitSha,
      message: 'রচনাটি সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (err: unknown) {
    console.error('[Admin API] Error deleting writing:', err);
    const msg = err instanceof Error ? err.message : 'লেখা মুছে ফেলা সম্ভব হয়নি।';
    res.status(500).json({ error: msg });
  }
});

export default app;
