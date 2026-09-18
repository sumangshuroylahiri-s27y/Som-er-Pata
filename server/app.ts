import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getGitHubConfig } from './github';
import { loadWritings, saveWritings, WritingItem } from './contentManager';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Helper to check admin password / authorization
function getAdminPassword(): string {
  // If ADMIN_PASSWORD is set in environment, use that
  return process.env.ADMIN_PASSWORD || 'som-sahitya-admin';
}

function verifyAuth(req: Request): boolean {
  const adminPassword = getAdminPassword();
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-admin-password'];

  if (customHeader && typeof customHeader === 'string' && customHeader === adminPassword) {
    return true;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Token can be the password directly or hashed token
    if (token === adminPassword) {
      return true;
    }
    const expectedHash = crypto.createHash('sha256').update(adminPassword).digest('hex');
    if (token === expectedHash) {
      return true;
    }
  }

  return false;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!verifyAuth(req)) {
    res.status(401).json({
      error: 'অননুমোদিত প্রবেশাধিকার। সঠিক অ্যাডমিন পাসওয়ার্ড দিন।',
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
  const isAuthenticated = verifyAuth(req);
  const ghConfig = getGitHubConfig();

  res.json({
    authenticated: isAuthenticated,
    isDefaultPassword: !process.env.ADMIN_PASSWORD,
    githubConfigured: !!ghConfig,
    repo: ghConfig ? `${ghConfig.owner}/${ghConfig.repo}` : null,
    branch: ghConfig ? ghConfig.branch : null,
  });
});

/**
 * Admin Login
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

  // Generate safe session token based on SHA256 of password
  const token = crypto.createHash('sha256').update(adminPassword).digest('hex');
  res.json({
    success: true,
    token,
    message: 'প্রবেশাধিকার সফল হয়েছে।',
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
    const { id, title, slug, category, content, excerpt, date, published } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'রচনার শিরোনাম প্রয়োজন।' });
      return;
    }

    const validCategories = ['kobita', 'golpo', 'choto-lekha', 'probandho', 'alochona'];
    if (!category || !validCategories.includes(category)) {
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
    };

    let updatedList: WritingItem[];
    if (isEdit) {
      const index = writings.findIndex((w) => w.id === targetId);
      if (index !== -1) {
        updatedList = writings.map((w) => (w.id === targetId ? writingItem : w));
      } else {
        updatedList = [writingItem, ...writings];
      }
    } else {
      updatedList = [writingItem, ...writings];
    }

    const actionSummary = isEdit 
      ? `update "${writingItem.title}" (${writingItem.published ? 'published' : 'draft'})`
      : `add "${writingItem.title}" (${writingItem.published ? 'published' : 'draft'})`;

    const saveResult = await saveWritings(updatedList, actionSummary);

    res.json({
      success: true,
      writing: writingItem,
      isEdit,
      githubCommitted: saveResult.githubCommitted,
      commitSha: saveResult.commitSha,
      commitUrl: saveResult.commitUrl,
      branch: saveResult.branch,
      message: saveResult.githubCommitted
        ? 'গিটহাবে সফলভাবে সংরক্ষিত হয়েছে। Vercel/Netlify স্বয়ংক্রিয়ভাবে সাইট রিডিপ্লয় করছে।'
        : 'সফলভাবে সংরক্ষিত হয়েছে।',
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

    const updatedList = writings.map((w) => (w.id === id ? item : w));
    const actionSummary = `${newPublished ? 'publish' : 'unpublish'} "${item.title}"`;
    const saveResult = await saveWritings(updatedList, actionSummary);

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

    const updatedList = writings.filter((w) => w.id !== id);
    const actionSummary = `delete writing "${itemToDelete.title}"`;
    const saveResult = await saveWritings(updatedList, actionSummary);

    res.json({
      success: true,
      deletedId: id,
      githubCommitted: saveResult.githubCommitted,
      commitSha: saveResult.commitSha,
      message: 'রচনাটি সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'লেখা মুছে ফেলা সম্ভব হয়নি।';
    res.status(500).json({ error: msg });
  }
});

export default app;
