import React, { useEffect } from 'react';
import { Link } from '../utils/router';
import { siteConfig } from '../data/siteConfig';
import { CategoryNav } from '../components/CategoryNav';
import { WritingPreview } from '../components/WritingPreview';
import { EmptyState } from '../components/EmptyState';
import { getPublishedWritings } from '../content/writings';
import { updatePageMeta } from '../utils/seo';

export const HomePage: React.FC = () => {
  const publishedWritings = getPublishedWritings();

  useEffect(() => {
    updatePageMeta({
      title: siteConfig.siteName,
      description: siteConfig.description,
    });
  }, []);

  return (
    <main id="home-main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Writer Identity Area (Compact, literary, non-promotional) */}
      <section id="writer-identity" aria-label="লেখকের পরিচিতি" className="text-center max-w-2xl mx-auto mb-10">
        {siteConfig.profileImage && (
          <div className="flex justify-center mb-4">
            <Link to="/lekhok-porichiti" id="home-author-avatar-link" className="group block" title="লেখক পরিচিতি">
              <img
                id="home-author-avatar"
                src={siteConfig.profileImage}
                alt={siteConfig.authorName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[#DDD6CC] p-1 bg-[#F8F5EF] group-hover:border-[#7A3E2B] transition-all shadow-xs"
              />
            </Link>
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal text-[#211F1C] tracking-tight mb-3">
          {siteConfig.authorName}
        </h1>
        {siteConfig.description && (
          <p className="text-base sm:text-lg text-[#6F6961] font-sans leading-relaxed max-w-xl mx-auto">
            {siteConfig.description}
          </p>
        )}
        <div className="mt-4">
          <Link
            to="/lekhok-porichiti"
            id="home-author-profile-link"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#7A3E2B] hover:text-[#211F1C] transition-colors font-medium border-b border-[#7A3E2B]/40 hover:border-[#211F1C] pb-0.5"
          >
            <span>লেখক পরিচিতি ও সাহিত্যজীবন</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Category Navigation */}
      <CategoryNav />

      {/* Latest Writings Section */}
      <section id="latest-writings-section" aria-label="সাম্প্রতিক রচনাবলী" className="mt-12">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#DDD6CC]/60">
          <h2 className="text-xl sm:text-2xl font-serif text-[#211F1C]">
            সাম্প্রতিক রচনা
          </h2>
          {publishedWritings.length > 0 && (
            <span className="text-xs text-[#6F6961]">
              মোট {publishedWritings.length} টি রচনা
            </span>
          )}
        </div>

        {publishedWritings.length === 0 ? (
          <EmptyState type="home" />
        ) : (
          <div className="divide-y divide-[#DDD6CC]/60">
            {publishedWritings.map((writing) => (
              <WritingPreview key={writing.id} writing={writing} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
