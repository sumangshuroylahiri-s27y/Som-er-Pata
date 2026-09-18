import React, { useEffect } from 'react';
import Markdown from 'react-markdown';
import { getWritingBySlug } from '../content/writings';
import { CATEGORY_MAP } from '../data/categories';
import { siteConfig } from '../data/siteConfig';
import { formatBengaliDate } from '../utils/date';
import { updatePageMeta } from '../utils/seo';
import { Link } from '../utils/router';
import { DonationSection } from '../components/DonationSection';
import { ShareButtons } from '../components/ShareButtons';
import { NotFoundPage } from './NotFoundPage';

interface WritingPageProps {
  categorySlug: string;
  writingSlug: string;
}

export const WritingPage: React.FC<WritingPageProps> = ({ categorySlug, writingSlug }) => {
  const writing = getWritingBySlug(categorySlug, writingSlug);

  if (!writing) {
    return <NotFoundPage message="কাঙ্ক্ষিত রচনাটি খুঁজে পাওয়া যায়নি।" />;
  }

  const category = CATEGORY_MAP[writing.category];

  useEffect(() => {
    updatePageMeta({
      title: writing.title,
      description: writing.excerpt || `${category?.label || 'রচনা'} — ${writing.title}`,
      type: 'article',
      writing,
    });
  }, [writing, category]);

  const isPoetry = writing.category === 'kobita';

  return (
    <main id={`writing-article-${writing.slug}`} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <article className="reading-column">
        {/* Article Breadcrumb / Category header */}
        <div className="mb-6 flex items-center gap-2 text-sm text-[#6F6961]">
          {category && (
            <Link
              to={`/${category.slug}`}
              id="writing-category-breadcrumb"
              className="text-[#7A3E2B] hover:text-[#211F1C] font-medium transition-colors"
            >
              {category.label}
            </Link>
          )}
          <span>/</span>
          <time dateTime={writing.date} className="text-xs">
            {formatBengaliDate(writing.date)}
          </time>
          {writing.updatedDate && (
            <>
              <span>•</span>
              <span className="text-xs text-[#6F6961]/75">
                পরিমার্জিত: {formatBengaliDate(writing.updatedDate)}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal text-[#211F1C] tracking-tight leading-snug mb-8">
          {writing.title}
        </h1>

        {/* Author byline */}
        <div className="pb-6 mb-8 border-b border-[#DDD6CC]/60 flex items-center justify-between text-xs sm:text-sm text-[#6F6961]">
          <span>লেখক: <span className="font-medium text-[#211F1C]">{siteConfig.authorName}</span></span>
        </div>

        {/* Optional Image */}
        {writing.image && (
          <div className="my-8">
            <img
              src={writing.image}
              alt={writing.title}
              className="w-full h-auto rounded border border-[#DDD6CC]"
              loading="lazy"
            />
          </div>
        )}

        {/* Writing Body Content */}
        <div
          id="writing-body-content"
          className={`prose-literary ${
            isPoetry 
              ? 'poetry-reading-flow font-serif' 
              : 'prose-reading-flow font-sans'
          }`}
        >
          <div className="markdown-body text-lg sm:text-xl text-[#211F1C]">
            <Markdown>{writing.content}</Markdown>
          </div>
        </div>

        {/* Social Share Controls */}
        <ShareButtons title={writing.title} />

        {/* Quiet UPI Donation Section */}
        <DonationSection />

        {/* Back navigation */}
        <div className="mt-12 text-center">
          <Link
            to={category ? `/${category.slug}` : '/'}
            id="back-to-category-link"
            className="inline-flex items-center gap-1 text-sm text-[#7A3E2B] hover:text-[#211F1C] transition-colors"
          >
            &larr; {category ? `আরও ${category.label} পড়ুন` : 'মূলপাতায় ফিরে যান'}
          </Link>
        </div>
      </article>
    </main>
  );
};
