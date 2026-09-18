import React from 'react';
import { Writing } from '../types';
import { Link } from '../utils/router';
import { CATEGORY_MAP } from '../data/categories';
import { formatBengaliDate } from '../utils/date';

interface WritingPreviewProps {
  writing: Writing;
  showCategory?: boolean;
}

export const WritingPreview: React.FC<WritingPreviewProps> = ({ writing, showCategory = true }) => {
  const categoryInfo = CATEGORY_MAP[writing.category];
  const url = `/${writing.category}/${writing.slug}`;

  return (
    <article id={`writing-preview-${writing.slug}`} className="py-6 border-b border-[#DDD6CC]/60 last:border-b-0 group">
      <div className="flex items-baseline gap-3 text-xs text-[#6F6961] mb-1.5">
        {showCategory && categoryInfo && (
          <Link
            to={`/${categoryInfo.slug}`}
            className="hover:text-[#7A3E2B] font-medium tracking-wide"
          >
            {categoryInfo.label}
          </Link>
        )}
        {showCategory && categoryInfo && <span className="opacity-40">•</span>}
        <time dateTime={writing.date} className="tracking-wide">
          {formatBengaliDate(writing.date)}
        </time>
      </div>

      <h3 className="text-xl sm:text-2xl font-serif font-normal text-[#211F1C] group-hover:text-[#7A3E2B] transition-colors mb-2">
        <Link to={url} className="block">
          {writing.title}
        </Link>
      </h3>

      {writing.excerpt && (
        <p className="text-[#6F6961] text-base leading-relaxed line-clamp-2 font-sans font-normal">
          {writing.excerpt}
        </p>
      )}

      <div className="mt-3">
        <Link
          to={url}
          className="inline-flex items-center text-xs tracking-wider text-[#7A3E2B] hover:text-[#211F1C] font-medium transition-colors"
        >
          সম্পূর্ণ পড়ুন &rarr;
        </Link>
      </div>
    </article>
  );
};
