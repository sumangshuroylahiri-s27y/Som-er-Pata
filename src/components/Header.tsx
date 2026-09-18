import React, { useState } from 'react';
import { Link, useRouter } from '../utils/router';
import { CATEGORIES } from '../data/categories';
import { siteConfig } from '../data/siteConfig';
import { Search, Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const { path } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header id="site-header" className="border-b border-[#DDD6CC]/70 bg-[#F8F5EF]/95 backdrop-blur-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Site / Author Branding */}
          <div className="flex items-center gap-3">
            {siteConfig.logoUrl && (
              <Link to="/" id="header-logo-link" className="shrink-0 group block" aria-label="মূলপাতা">
                <img
                  id="header-author-logo"
                  src={siteConfig.logoUrl}
                  alt={siteConfig.authorName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#DDD6CC] group-hover:border-[#7A3E2B] transition-colors shadow-xs"
                />
              </Link>
            )}
            <div className="flex flex-col">
              <Link 
                to="/" 
                id="header-brand-link" 
                className="text-xl sm:text-2xl font-serif tracking-tight text-[#211F1C] hover:text-[#7A3E2B] transition-colors"
              >
                {siteConfig.authorName || siteConfig.siteName}
              </Link>
              <span className="text-xs text-[#6F6961] font-sans">
                {siteConfig.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav id="desktop-navigation" className="hidden md:flex items-center space-x-1 sm:space-x-2" aria-label="প্রধান নেভিগেশন">
            <Link
              to="/"
              id="nav-link-home"
              className={`px-3 py-1.5 text-base rounded transition-colors ${
                path === '/' 
                  ? 'text-[#7A3E2B] font-medium bg-[#F1ECE4]' 
                  : 'text-[#211F1C] hover:text-[#7A3E2B] hover:bg-[#F1ECE4]/60'
              }`}
            >
              মূলপাতা
            </Link>

            {CATEGORIES.map((cat) => {
              const isActive = path === `/${cat.slug}` || path.startsWith(`/${cat.slug}/`);
              return (
                <Link
                  key={cat.id}
                  to={`/${cat.slug}`}
                  id={`nav-link-${cat.slug}`}
                  className={`px-3 py-1.5 text-base rounded transition-colors ${
                    isActive
                      ? 'text-[#7A3E2B] font-medium bg-[#F1ECE4]'
                      : 'text-[#211F1C] hover:text-[#7A3E2B] hover:bg-[#F1ECE4]/60'
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}

            <Link
              to="/lekhok-porichiti"
              id="nav-link-author"
              className={`px-3 py-1.5 text-base rounded transition-colors ${
                path === '/lekhok-porichiti'
                  ? 'text-[#7A3E2B] font-medium bg-[#F1ECE4]'
                  : 'text-[#211F1C] hover:text-[#7A3E2B] hover:bg-[#F1ECE4]/60'
              }`}
            >
              লেখক পরিচিতি
            </Link>

            <button
              id="header-search-btn"
              onClick={onOpenSearch}
              aria-label="রচনা খুঁজুন"
              className="ml-2 p-2 text-[#6F6961] hover:text-[#211F1C] hover:bg-[#F1ECE4] rounded transition-colors cursor-pointer"
              title="খুঁজুন"
            >
              <Search className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile Actions */}
          <div className="flex items-center md:hidden space-x-1">
            <button
              id="mobile-search-btn"
              onClick={onOpenSearch}
              aria-label="রচনা খুঁজুন"
              className="p-2 text-[#6F6961] hover:text-[#211F1C] rounded transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="মেনু খুলুন"
              className="p-2 text-[#211F1C] hover:bg-[#F1ECE4] rounded transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav 
            id="mobile-navigation" 
            className="md:hidden py-4 border-t border-[#DDD6CC]/60 flex flex-col space-y-1"
            aria-label="মোবাইল নেভিগেশন"
          >
            <Link
              to="/"
              id="mobile-nav-home"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-base rounded transition-colors ${
                path === '/' ? 'text-[#7A3E2B] font-medium bg-[#F1ECE4]' : 'text-[#211F1C]'
              }`}
            >
              মূলপাতা
            </Link>
            {CATEGORIES.map((cat) => {
              const isActive = path === `/${cat.slug}` || path.startsWith(`/${cat.slug}/`);
              return (
                <Link
                  key={cat.id}
                  to={`/${cat.slug}`}
                  id={`mobile-nav-${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-base rounded transition-colors ${
                    isActive ? 'text-[#7A3E2B] font-medium bg-[#F1ECE4]' : 'text-[#211F1C]'
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
            <Link
              to="/lekhok-porichiti"
              id="mobile-nav-author"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-base rounded transition-colors ${
                path === '/lekhok-porichiti' ? 'text-[#7A3E2B] font-medium bg-[#F1ECE4]' : 'text-[#211F1C]'
              }`}
            >
              লেখক পরিচিতি
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};
