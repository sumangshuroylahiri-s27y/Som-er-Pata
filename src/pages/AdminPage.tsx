import React, { useState, useEffect, useId, useCallback } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  LogOut, 
  GitBranch, 
  FileText, 
  Save, 
  ArrowLeft, 
  Search, 
  BookOpen,
  Info,
  RefreshCw,
  Clock,
  Tag,
  Image as ImageIcon,
  Shield
} from 'lucide-react';
import { Link, useRouter } from '../utils/router';
import { Writing, WritingCategory } from '../types';
import { CATEGORIES } from '../data/categories';
import { updateLocalWritings } from '../content/writings';

interface StatusResponse {
  authenticated: boolean;
  expired?: boolean;
  remainingSeconds?: number;
  isDefaultPassword?: boolean;
  githubConfigured: boolean;
  repo: string | null;
  branch: string | null;
}

interface WritingFormData {
  id?: string;
  title: string;
  slug: string;
  category: WritingCategory;
  date: string;
  excerpt: string;
  content: string;
  published: boolean;
  tags: string;
  image: string;
}

const emptyForm: WritingFormData = {
  title: '',
  slug: '',
  category: 'kobita',
  date: new Date().toISOString().split('T')[0],
  excerpt: '',
  content: '',
  published: true,
  tags: '',
  image: '',
};

export const AdminPage: React.FC = () => {
  const { navigate } = useRouter();
  const passwordInputId = useId();

  // Session state handled strictly in volatile React component memory (never in localStorage/sessionStorage)
  const [token, setToken] = useState<string>('');
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Admin status & GitHub config
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [showGithubGuide, setShowGithubGuide] = useState(false);

  // Writings list state
  const [writings, setWritings] = useState<Writing[]>([]);
  const [loadingWritings, setLoadingWritings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Editor mode
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [formData, setFormData] = useState<WritingFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string; commitSha?: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sanitize browser storage on mount to eliminate any residual sensitive tokens
  useEffect(() => {
    try {
      sessionStorage.removeItem('som_admin_token');
      localStorage.removeItem('som_admin_token');
      localStorage.removeItem('admin_token');
    } catch {
      // Storage access blocked or restricted
    }
  }, []);

  // Format seconds to mm:ss
  const formatRemainingTime = (totalSecs: number): string => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.floor(Math.max(0, totalSecs) % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Trigger graceful session expiration
  const handleSessionExpired = useCallback(() => {
    if (token) {
      try {
        fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token }),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
    // Wipe all in-memory data
    setToken('');
    setSessionExpiresAt(null);
    setRemainingSeconds(0);
    setViewMode('list');
    setFormData(emptyForm);
    setFormFeedback(null);
    setWritings([]);
    setStatus(null);
    setLogoutNotice('নিরাপত্তাজনিত কারণে আপনার অ্যাডমিন সেশনের মেয়াদ শেষ হয়েছে। মেমোরি থেকে সেশন নিরাপদে প্রত্যাহার করা হয়েছে। অনুগ্রহ করে পুনরায় প্রবেশ করুন।');
  }, [token]);

  // Secure Manual Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    const currentToken = token;
    if (currentToken) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ token: currentToken }),
        });
      } catch {
        // network failure on logout tolerated
      }
    }
    // Purge in-memory states immediately
    setToken('');
    setSessionExpiresAt(null);
    setRemainingSeconds(0);
    setViewMode('list');
    setFormData(emptyForm);
    setFormFeedback(null);
    setWritings([]);
    setStatus(null);
    setIsLoggingOut(false);
    setLogoutNotice('আপনি সফলভাবে অ্যাডমিন প্যানেল থেকে লগআউট করেছেন। সমস্ত সংবেদনশীল ডেটা মেমোরি থেকে নিরাপদে মুছে ফেলা হয়েছে।');
  };

  // Keepalive / Extend session
  const refreshSession = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/auth/keepalive', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.expiresAt) {
          setSessionExpiresAt(data.expiresAt);
          setRemainingSeconds(data.remainingSeconds ?? Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
        }
      } else if (res.status === 401) {
        handleSessionExpired();
      }
    } catch {
      // ignore transient network glitch
    }
  };

  // Session countdown interval in memory
  useEffect(() => {
    if (!token || !sessionExpiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((sessionExpiresAt - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        handleSessionExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token, sessionExpiresAt, handleSessionExpired]);

  // User activity tracker: keeps session refreshed while admin is actively working
  useEffect(() => {
    if (!token) return;

    let lastPing = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      // Throttle ping to once every 60 seconds
      if (now - lastPing > 60 * 1000) {
        lastPing = now;
        refreshSession();
      }
    };

    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('mousedown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [token]);

  // Fetch status and check if token is valid
  const checkStatus = async (authToken?: string) => {
    try {
      const activeToken = authToken !== undefined ? authToken : token;
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
      const res = await fetch('/api/admin/status', { headers });
      if (res.ok) {
        const data = (await res.json()) as StatusResponse;
        setStatus(data);
        if (data.remainingSeconds !== undefined && data.remainingSeconds > 0) {
          setRemainingSeconds(data.remainingSeconds);
          setSessionExpiresAt(Date.now() + data.remainingSeconds * 1000);
        }
        return data.authenticated;
      } else if (res.status === 401 && activeToken) {
        handleSessionExpired();
      }
    } catch {
      // Offline or dev server starting
    }
    return false;
  };

  useEffect(() => {
    if (token) {
      checkStatus(token);
    }
  }, [token]);

  // Fetch writings when authenticated
  const fetchWritings = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    setLoadingWritings(true);
    try {
      const res = await fetch('/api/admin/writings', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.writings && Array.isArray(data.writings)) {
          setWritings(data.writings);
          updateLocalWritings(data.writings);
        }
      } else if (res.status === 401) {
        handleSessionExpired();
      }
    } catch (err) {
      console.error('Failed to fetch writings:', err);
    } finally {
      setLoadingWritings(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWritings(token);
    }
  }, [token]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setAuthLoading(true);
    setAuthError('');
    setLogoutNotice(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        // Keep in memory ONLY
        setToken(data.token);
        const expiry = data.expiresAt || (Date.now() + (data.timeoutSeconds || 1800) * 1000);
        setSessionExpiresAt(expiry);
        setRemainingSeconds(data.timeoutSeconds || 1800);
        setPasswordInput('');
        await checkStatus(data.token);
        await fetchWritings(data.token);
      } else {
        setAuthError(data.error || 'ভুল পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch {
      setAuthError('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auto generate slug from Bengali or English title
  const handleTitleChange = (newTitle: string) => {
    const updated = { ...formData, title: newTitle };
    // Only auto-generate if slug is empty or was previously auto-generated
    if (!formData.id && (!formData.slug || formData.slug === slugify(formData.title))) {
      updated.slug = slugify(newTitle);
    }
    setFormData(updated);
  };

  const slugify = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[\s\/\\]+/g, '-')
      .replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '')
      .replace(/^-+|-+$/g, '');
  };

  // Open editor for new writing
  const handleOpenNew = () => {
    setFormData({
      ...emptyForm,
      date: new Date().toISOString().split('T')[0],
    });
    setFormFeedback(null);
    setViewMode('editor');
  };

  // Open editor to edit an existing writing
  const handleOpenEdit = (writing: Writing) => {
    setFormData({
      id: writing.id,
      title: writing.title,
      slug: writing.slug,
      category: writing.category,
      date: writing.date,
      excerpt: writing.excerpt || '',
      content: writing.content,
      published: writing.published,
      tags: Array.isArray(writing.tags) ? writing.tags.join(', ') : '',
      image: writing.image || '',
    });
    setFormFeedback(null);
    setViewMode('editor');
  };

  // Submit writing form (Save Draft or Publish)
  const handleSubmitWriting = async (publishState: boolean) => {
    if (!formData.title.trim()) {
      setFormFeedback({ type: 'error', message: 'অনুগ্রহ করে রচনার শিরোনাম প্রদান করুন।' });
      return;
    }
    if (!formData.content.trim()) {
      setFormFeedback({ type: 'error', message: 'অনুগ্রহ করে রচনার মূল পাঠ্য লিখুন।' });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback(null);

    const payload = {
      ...formData,
      published: publishState,
      slug: formData.slug.trim() || slugify(formData.title),
      tags: formData.tags.trim()
        ? formData.tags.split(/[,،]+/).map((t) => t.trim()).filter(Boolean)
        : undefined,
      image: formData.image.trim() || undefined,
    };

    try {
      const res = await fetch('/api/admin/writings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setFormFeedback({
          type: 'success',
          message: data.message || (publishState ? 'রচনাটি সফলভাবে প্রকাশিত হয়েছে!' : 'ড্রাফট হিসেবে সংরক্ষিত হয়েছে!'),
          commitSha: data.commitSha,
        });
        // Refresh writings list
        await fetchWritings();
        // Return to list after short delay
        setTimeout(() => {
          setViewMode('list');
          setFormFeedback(null);
        }, 1500);
      } else {
        setFormFeedback({
          type: 'error',
          message: data.error || 'লেখা সংরক্ষণ করতে ব্যর্থ হয়েছে।',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'সার্ভার সংযোগে ত্রুটি ঘটেছে।';
      setFormFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle publish / unpublish
  const handleTogglePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/writings/${id}/toggle-publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        await fetchWritings();
      } else if (res.status === 401) {
        handleSessionExpired();
      }
    } catch (err) {
      console.error('Toggle publish failed:', err);
    }
  };

  // Delete writing
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/writings/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        await fetchWritings();
      } else if (res.status === 401) {
        handleSessionExpired();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Filtered writings
  const filteredWritings = writings.filter((w) => {
    const matchesCategory = filterCategory === 'all' || w.category === filterCategory;
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'published' && w.published) || 
      (filterStatus === 'draft' && !w.published);

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      w.title.toLowerCase().includes(q) || 
      w.content.toLowerCase().includes(q) || 
      w.slug.toLowerCase().includes(q);

    return matchesCategory && matchesStatus && matchesQuery;
  });

  // ----------------------------------------------------
  // Render: LOGIN SCREEN
  // ----------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-[#FAF7F2] border border-[#DDD6CC] rounded-lg p-8 shadow-xs">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#7A3E2B]/10 text-[#7A3E2B] mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif text-[#211F1C] tracking-tight">
              সাহিত্য প্রশাসন প্রবেশদ্বার
            </h1>
            <p className="text-xs sm:text-sm text-[#6F6961] mt-1.5 font-sans">
              নতুন রচনা প্রকাশ, সম্পাদনা ও সংকলন ব্যবস্থাপনার জন্য পাসওয়ার্ড দিন
            </p>
          </div>

          {/* Session Expiration or Logout Notice */}
          {logoutNotice && (
            <div className="mb-5 p-3 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs rounded-md flex items-start gap-2.5 leading-relaxed">
              <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{logoutNotice}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor={passwordInputId} className="block text-xs font-medium text-[#211F1C] mb-1">
                অ্যাডমিন পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  id={passwordInputId}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F6961] hover:text-[#211F1C]"
                  tabIndex={-1}
                  aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || !passwordInput.trim()}
              className="w-full py-2.5 px-4 bg-[#7A3E2B] hover:bg-[#602F20] text-white text-sm font-medium rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {authLoading ? 'যাচাই করা হচ্ছে...' : 'প্রবেশ করুন'}
            </button>
          </form>

          {/* Pure In-Memory Security Assurance Banner */}
          <div className="mt-5 p-3 bg-white/70 border border-[#DDD6CC] rounded text-[11px] text-[#6F6961] flex items-start gap-2 leading-relaxed">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#211F1C] font-semibold">ইন-মেমোরি নিরাপত্তা ব্যবস্থা:</strong> ব্রাউজারের কোনো লোকাল স্টোরেজে (localStorage/sessionStorage) টোকেন বা পাসওয়ার্ড রাখা হয় না। নিষ্ক্রিয়তা বা ট্যাব বন্ধের সাথে সাথে সেশন নিরাপদে বিনষ্ট হয়।
            </div>
          </div>

          {status?.isDefaultPassword && (
            <div className="mt-4 pt-3 border-t border-[#DDD6CC]/60 text-xs text-[#6F6961] leading-relaxed">
              <span className="font-semibold text-[#211F1C] block mb-1">প্রথমবার সেটআপ সহায়তা:</span>
              পরিবেশ ভেরিয়েবলে <code className="bg-[#DDD6CC]/40 px-1 py-0.5 rounded">ADMIN_PASSWORD</code> সেট না থাকলে প্রাথমিক ডিফল্ট পাসওয়ার্ড: <code className="bg-[#DDD6CC]/40 px-1 py-0.5 rounded font-mono text-[#7A3E2B]">som-sahitya-admin</code>। Vercel বা হোস্টিং-এর সেটিংস থেকে আপনার নিজস্ব পাসওয়ার্ড নির্ধারণ করুন।
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: ADMIN DASHBOARD & WRITINGS MANAGER
  // ----------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DDD6CC] mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-[#211F1C]">
              সাহিত্য সংকলন প্রশাসন
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6F6961]">
            ওয়েবসাইটে সরাসরি নতুন রচনা সংযোজন, খসড়া সংরক্ষণ, সম্পাদনা ও প্রকাশনা
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-[#6F6961] hover:text-[#211F1C] border border-[#DDD6CC] px-2.5 py-1.5 rounded transition-colors bg-white shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মূলপাতায় ফিরুন</span>
          </Link>

          {/* In-Memory Active Session Indicator */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FAF7F2] border border-[#DDD6CC] text-[#211F1C] text-xs rounded shadow-xs"
            title="ইন-মেমোরি সক্রিয় সেশন (নিষ্ক্রিয় থাকলে ৩০ মিনিট পর স্বয়ংক্রিয়ভাবে শেষ হবে)"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline text-[#6F6961]">সেশন:</span>
            <span className={`font-mono font-medium ${remainingSeconds <= 120 ? 'text-red-700 font-bold animate-pulse' : 'text-[#7A3E2B]'}`}>
              {formatRemainingTime(remainingSeconds)}
            </span>
          </div>

          {/* Secure Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded transition-colors bg-red-50/60 hover:bg-red-100/60 cursor-pointer disabled:opacity-50 shadow-xs font-medium"
            title="নিরাপদে লগআউট করুন এবং মেমোরি থেকে সেশন টোকেন মুছে ফেলুন"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? 'লগআউট হচ্ছে...' : 'লগআউট'}</span>
          </button>
        </div>
      </div>

      {/* Imminent Session Expiration Warning Banner */}
      {remainingSeconds > 0 && remainingSeconds <= 120 && (
        <div className="mb-6 p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>নিষ্ক্রিয়তার সতর্কবার্তা:</strong> আপনার অ্যাডমিন সেশনের মেয়াদ আর মাত্র <strong>{formatRemainingTime(remainingSeconds)}</strong>-এ শেষ হবে।
            </span>
          </div>
          <button
            onClick={refreshSession}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>সেশন বাড়ান</span>
          </button>
        </div>
      )}

      {/* GitHub Sync Status Banner */}
      <div className="mb-8 p-3.5 bg-white border border-[#DDD6CC] rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#7A3E2B] shrink-0" />
          {status?.githubConfigured ? (
            <div>
              <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                গিটহাব স্বয়ংক্রিয় সিঙ্ক সক্রিয়
              </span>
              <span className="text-[#6F6961] ml-2">
                ({status.repo} • শাখা: <code className="font-mono">{status.branch}</code>)
              </span>
            </div>
          ) : (
            <div>
              <span className="font-medium text-amber-700 inline-flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                লোকাল ফাইল সিস্টেম মোড
              </span>
              <span className="text-[#6F6961] ml-2">
                (Vercel/Netlify স্বয়ংক্রিয় রিডিপ্লয়ের জন্য গিটহাব টোকেন কনফিগার করুন)
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowGithubGuide(!showGithubGuide)}
          className="text-[#7A3E2B] hover:text-[#211F1C] font-medium underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showGithubGuide ? 'গাইড বন্ধ করুন' : 'কনফিগারেশন গাইড'}</span>
        </button>
      </div>

      {/* GitHub Configuration Guide Accordion */}
      {showGithubGuide && (
        <div className="mb-8 p-5 bg-[#FAF7F2] border border-[#DDD6CC] rounded-lg text-xs text-[#6F6961] leading-relaxed space-y-3">
          <h3 className="font-semibold text-[#211F1C] text-sm flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#7A3E2B]" />
            গিটহাব ও Vercel/Netlify স্বয়ংক্রিয় প্রকাশনা কীভাবে কাজ করে?
          </h3>
          <p>
            ১. আপনি অ্যাডমিন প্যানেল থেকে <strong>"প্রকাশ করুন"</strong> বাটনে ক্লিক করলে আমাদের সুরক্ষিত সার্ভার-সাইড ফাংশন সরাসরি গিটহাব রিপোজিটরির <code className="bg-[#DDD6CC]/40 px-1 py-0.5 rounded font-mono">src/content/writings.json</code> ফাইলে কমিট করে।
          </p>
          <p>
            ২. গিটহাবে নতুন কমিট পড়ামাত্রই Vercel বা Netlify স্বয়ংক্রিয়ভাবে ওয়েবসাইট পুনরায় বিল্ড (Redeploy) করে। এর ফলে কোনো ডাটাবেস ছাড়াই সমস্ত ভিজিটরদের কাছে আপনার লেখা স্থায়ীভাবে উন্মুক্ত হয়।
          </p>
          <div className="p-3 bg-white border border-[#DDD6CC] rounded font-mono text-[11px] text-[#211F1C] space-y-1">
            <div className="font-sans font-semibold text-xs mb-1 text-[#7A3E2B]">Vercel / Netlify Environment Variables:</div>
            <div>ADMIN_PASSWORD="আপনার_গোপন_পাসওয়ার্ড"</div>
            <div>GITHUB_TOKEN="ghp_আপনার_পার্সোনাল_অ্যাকসেস_টোকেন"</div>
            <div>GITHUB_REPO="username/repository-name"</div>
            <div>GITHUB_BRANCH="main"</div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          VIEW 1: WRITING EDITOR (ADD / EDIT)
          ---------------------------------------------------- */}
      {viewMode === 'editor' && (
        <div className="bg-white border border-[#DDD6CC] rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DDD6CC]">
            <div>
              <h2 className="text-xl font-serif text-[#211F1C]">
                {formData.id ? 'রচনা সম্পাদনা' : 'নতুন রচনা যুক্ত করুন'}
              </h2>
              <p className="text-xs text-[#6F6961] mt-0.5">
                কবিতা, গল্প, ছোট লেখা, প্রবন্ধ ও আলোচনার সাহিত্যিক প্রকাশনা
              </p>
            </div>
            <button
              onClick={() => setViewMode('list')}
              className="text-xs text-[#6F6961] hover:text-[#211F1C] flex items-center gap-1 border border-[#DDD6CC] px-3 py-1.5 rounded cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>তালিকায় ফিরুন</span>
            </button>
          </div>

          {formFeedback && (
            <div
              className={`p-4 mb-6 rounded text-xs flex items-start gap-2 border ${
                formFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {formFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div>{formFeedback.message}</div>
                {formFeedback.commitSha && (
                  <div className="mt-1 font-mono text-[11px] opacity-80">
                    GitHub Commit: {formFeedback.commitSha.slice(0, 7)}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#211F1C] mb-2">
                সাহিত্য বিভাগ নির্বাচন করুন *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`px-3 py-2 rounded text-xs font-medium text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#7A3E2B] text-white border-[#7A3E2B] shadow-xs'
                          : 'bg-[#FAF7F2] text-[#211F1C] border-[#DDD6CC] hover:border-[#7A3E2B]/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#211F1C] mb-1">
                রচনার শিরোনাম *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="যেমন: রক্তকরবীর প্রহর, জলতরঙ্গের শব্দ..."
                className="w-full px-3 py-2 text-base font-serif bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C]"
              />
            </div>

            {/* Date & Slug Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#211F1C] mb-1">
                  রচনার তারিখ (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#211F1C] mb-1">
                  ইউআরএল স্লাগ (URL Slug)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-slug"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C]"
                />
                <span className="text-[10px] text-[#6F6961] mt-0.5 block">
                  ঠিকানা হবে: /{formData.category}/{formData.slug || 'slug'}
                </span>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-semibold text-[#211F1C] mb-1">
                সংক্ষিপ্তসার বা এক-দুই লাইনের ভূমিকা (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="পাঠকের জন্য সংক্ষেপিত ভাব বা প্রারম্ভিক পঙ্‌ক্তি..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C]"
              />
            </div>

            {/* Tags (Optional) */}
            <div>
              <label className="text-xs font-semibold text-[#211F1C] mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#7A3E2B]" />
                <span>ট্যাগসমূহ (ঐচ্ছিক — কমা দিয়ে আলাদা করুন)</span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="যেমন: সাহিত্য, প্রেম, বর্ষা, স্মৃতিচারণ"
                className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C]"
              />
              {formData.tags.trim() && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.split(/[,،]+/).map((t, idx) => {
                    const clean = t.trim();
                    if (!clean) return null;
                    return (
                      <span key={idx} className="px-2 py-0.5 bg-[#FAF7F2] border border-[#DDD6CC] text-[#7A3E2B] text-[11px] rounded">
                        #{clean}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Feature Image URL (Optional) */}
            <div>
              <label className="text-xs font-semibold text-[#211F1C] mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#7A3E2B]" />
                <span>প্রচ্ছদ বা সংশ্লিষ্ট ছবির লিঙ্ক (ঐচ্ছিক)</span>
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://... ছবির ওয়েব লিঙ্ক"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C]"
              />
              {formData.image.trim() && (
                <div className="mt-2 flex items-center gap-3 p-2.5 bg-[#FAF7F2] border border-[#DDD6CC] rounded">
                  <img
                    src={formData.image}
                    alt="প্রিভিউ"
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 object-cover rounded border border-[#DDD6CC]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[11px] text-[#6F6961]">ছবির প্রিভিউ</span>
                </div>
              )}
            </div>

            {/* Full Bengali Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#211F1C]">
                  সম্পূর্ণ রচনা পাঠ্য (Bengali Text) *
                </label>
                <span className="text-[11px] text-[#6F6961]">
                  {formData.content.trim().length} অক্ষর • {formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0} শব্দ
                </span>
              </div>
              <textarea
                rows={16}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="এখানে আপনার সম্পূর্ণ কবিতা, গল্প, অনুচ্ছেদ বা প্রবন্ধ লিখুন... কবিতার ক্ষেত্রে লাইন ব্রেক ও স্তবক স্বাভাবিকভাবে রাখুন।"
                className="w-full p-4 text-base leading-relaxed font-serif bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C] placeholder:font-sans placeholder:text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#DDD6CC]">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="w-full sm:w-auto px-4 py-2 border border-[#DDD6CC] text-xs font-medium text-[#6F6961] hover:text-[#211F1C] rounded cursor-pointer"
              >
                বাতিল করুন
              </button>

              <div className="w-full sm:w-auto flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitWriting(false)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-medium rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ড্রাফট হিসেবে সংরক্ষণ</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitWriting(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-[#7A3E2B] hover:bg-[#602F20] text-white text-xs font-medium rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{formData.id ? 'পরিবর্তন প্রকাশ করুন' : 'সরাসরি প্রকাশ করুন'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          VIEW 2: WRITINGS ARCHIVE LIST
          ---------------------------------------------------- */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Header Controls: Filters & New Writing Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs bg-white border border-[#DDD6CC] rounded px-3 py-1.5 text-[#211F1C] focus:outline-none focus:border-[#7A3E2B]"
              >
                <option value="all">সকল বিভাগ ({writings.length})</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({writings.filter((w) => w.category === c.id).length})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
                className="text-xs bg-white border border-[#DDD6CC] rounded px-3 py-1.5 text-[#211F1C] focus:outline-none focus:border-[#7A3E2B]"
              >
                <option value="all">সকল অবস্থা</option>
                <option value="published">প্রকাশিত ({writings.filter((w) => w.published).length})</option>
                <option value="draft">ড্রাফট ({writings.filter((w) => !w.published).length})</option>
              </select>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6F6961]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DDD6CC] rounded focus:outline-none focus:border-[#7A3E2B] text-[#211F1C]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchWritings()}
                disabled={loadingWritings}
                title="রিফ্রেশ করুন"
                className="p-1.5 border border-[#DDD6CC] bg-white rounded text-[#6F6961] hover:text-[#211F1C] cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingWritings ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleOpenNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7A3E2B] hover:bg-[#602F20] text-white text-xs font-medium rounded transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন রচনা লিখুন</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          {loadingWritings ? (
            <div className="py-16 text-center text-xs text-[#6F6961]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#7A3E2B]" />
              <span>রচনাসমূহ লোড করা হচ্ছে...</span>
            </div>
          ) : filteredWritings.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#DDD6CC] rounded-lg p-8">
              <FileText className="w-8 h-8 text-[#6F6961]/50 mx-auto mb-3" />
              <h3 className="text-base font-serif text-[#211F1C] mb-1">
                {writings.length === 0 ? 'এখনও কোনো রচনা যোগ করা হয়নি' : 'কোনো রচনা পাওয়া যায়নি'}
              </h3>
              <p className="text-xs text-[#6F6961] max-w-sm mx-auto mb-4">
                {writings.length === 0
                  ? 'আপনার প্রথম কবিতা, গল্প বা প্রবন্ধ প্রকাশ করতে উপরের "নতুন রচনা লিখুন" বাটনে ক্লিক করুন।'
                  : 'অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।'}
              </p>
              {writings.length === 0 && (
                <button
                  onClick={handleOpenNew}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#7A3E2B] text-white text-xs rounded hover:bg-[#602F20] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>প্রথম লেখা যোগ করুন</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWritings.map((writing) => {
                const categoryObj = CATEGORIES.find((c) => c.id === writing.category);
                const isConfirmingDelete = deleteConfirmId === writing.id;

                return (
                  <div
                    key={writing.id}
                    className="p-4 sm:p-5 bg-white border border-[#DDD6CC] rounded-lg transition-shadow hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-[#F1ECE4] text-[#7A3E2B] text-[10px] font-medium rounded">
                          {categoryObj?.label || writing.category}
                        </span>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded flex items-center gap-1 ${
                            writing.published
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {writing.published ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>প্রকাশিত</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>খসড়া (ড্রাফট)</span>
                            </>
                          )}
                        </span>

                        <span className="text-[11px] text-[#6F6961]">
                          {writing.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-serif text-[#211F1C] tracking-tight truncate">
                          {writing.title}
                        </h3>
                        {writing.image && (
                          <span className="shrink-0 text-[10px] text-[#7A3E2B] bg-[#F1ECE4] px-1.5 py-0.5 rounded flex items-center gap-1" title="ছবি সংবলিত">
                            <ImageIcon className="w-3 h-3" />
                            <span>ছবি</span>
                          </span>
                        )}
                      </div>

                      {writing.excerpt && (
                        <p className="text-xs text-[#6F6961] mt-1 line-clamp-1 font-sans">
                          {writing.excerpt}
                        </p>
                      )}

                      {writing.tags && writing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {writing.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] text-[#7A3E2B] bg-[#F8F5EF] border border-[#DDD6CC]/60 px-1.5 py-0.2 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {writing.published && (
                        <Link
                          to={`/${writing.category}/${writing.slug}`}
                          className="p-1.5 text-[#6F6961] hover:text-[#211F1C] border border-[#DDD6CC] rounded"
                          title="সাইটে দেখুন"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}

                      <button
                        onClick={() => handleTogglePublish(writing.id)}
                        className={`p-1.5 rounded border transition-colors cursor-pointer ${
                          writing.published
                            ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                            : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                        title={writing.published ? 'অপ্রকাশিত (ড্রাফট) করুন' : 'প্রকাশ করুন'}
                      >
                        {writing.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(writing)}
                        className="p-1.5 text-[#7A3E2B] hover:text-[#211F1C] border border-[#DDD6CC] rounded hover:bg-[#F8F5EF] cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {isConfirmingDelete ? (
                        <div className="inline-flex items-center gap-1 pl-1">
                          <button
                            onClick={() => handleDelete(writing.id)}
                            className="px-2 py-1 bg-red-600 text-white text-[11px] rounded hover:bg-red-700 cursor-pointer"
                          >
                            নিশ্চিত মুছুন
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 border border-[#DDD6CC] text-[11px] rounded text-[#6F6961] hover:text-[#211F1C] cursor-pointer"
                          >
                            বাতিল
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(writing.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
