import React, { useState } from 'react';
import { RouterProvider, useRouter, parsePath } from './utils/router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { WritingPage } from './pages/WritingPage';
import { AuthorPage } from './pages/AuthorPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

function AppContent() {
  const { path } = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const route = parsePath(path);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#211F1C]">
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      <div className="flex-1">
        {route.type === 'home' && <HomePage />}
        {route.type === 'admin' && <AdminPage />}
        {route.type === 'author' && <AuthorPage />}
        {route.type === 'category' && route.categorySlug && (
          <CategoryPage categorySlug={route.categorySlug} />
        )}
        {route.type === 'writing' && route.categorySlug && route.writingSlug && (
          <WritingPage 
            categorySlug={route.categorySlug} 
            writingSlug={route.writingSlug} 
          />
        )}
        {route.type === 'not-found' && <NotFoundPage />}
      </div>

      <Footer />

      {/* Global Client-side Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
