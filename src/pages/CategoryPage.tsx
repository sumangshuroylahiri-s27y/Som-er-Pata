import React, { useEffect } from 'react';
import { getCategoryBySlug } from '../data/categories';
import { getWritingsByCategory } from '../content/writings';
import { WritingPreview } from '../components/WritingPreview';
import { EmptyState } from '../components/EmptyState';
import { CategoryNav } from '../components/CategoryNav';
import { updatePageMeta } from '../utils/seo';
import { NotFoundPage } from './NotFoundPage';

interface CategoryPageProps {
  categorySlug: string;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ categorySlug }) => {
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return <NotFoundPage />;
  }

  const writings = getWritingsByCategory(category.slug);

  useEffect(() => {
    updatePageMeta({
      title: `${category.label} — বিভাগ`,
      description: `${category.label}: ${category.description}`,
    });
  }, [category]);

  return (
    <main id={`category-page-${category.slug}`} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Category Header */}
      <header className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif font-normal text-[#211F1C] tracking-tight mb-2">
          {category.label}
        </h1>
        {category.description && (
          <p className="text-sm sm:text-base text-[#6F6961] font-sans">
            {category.description}
          </p>
        )}
      </header>

      {/* Category Navigation Pills */}
      <CategoryNav />

      {/* Writings List */}
      <section id="category-writings-list" aria-label={`${category.label} তালিকা`} className="mt-10">
        {writings.length === 0 ? (
          <EmptyState type="category" categoryTitle={category.label} />
        ) : (
          <div className="divide-y divide-[#DDD6CC]/60">
            {writings.map((writing) => (
              <WritingPreview 
                key={writing.id} 
                writing={writing} 
                showCategory={false} 
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
