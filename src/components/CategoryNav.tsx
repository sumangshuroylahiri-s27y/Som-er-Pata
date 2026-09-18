import React from 'react';
import { Link, useRouter } from '../utils/router';
import { CATEGORIES } from '../data/categories';

export const CategoryNav: React.FC = () => {
  const { path } = useRouter();

  return (
    <nav id="category-navigation" aria-label="সাহিত্য বিভাগসমূহ" className="my-8">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-3 border-y border-[#DDD6CC]/60">
        {CATEGORIES.map((cat) => {
          const isActive = path === `/${cat.slug}` || path.startsWith(`/${cat.slug}/`);
          return (
            <Link
              key={cat.id}
              to={`/${cat.slug}`}
              id={`cat-nav-btn-${cat.slug}`}
              className={`px-3.5 py-1.5 text-sm sm:text-base rounded transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#7A3E2B] text-[#F8F5EF] font-medium'
                  : 'bg-[#F1ECE4] text-[#211F1C] hover:bg-[#DDD6CC]/60'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
