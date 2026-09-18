import React from 'react';
import { Link } from '../utils/router';
import { siteConfig } from '../data/siteConfig';
import { CATEGORIES } from '../data/categories';
import { Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="site-footer" className="mt-24 border-t border-[#DDD6CC]/60 py-12 text-[#6F6961]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="font-serif text-lg text-[#211F1C]">
              {siteConfig.authorName}
            </p>
            <p className="text-xs text-[#6F6961] mt-1">
              স্বত্বাধিকার © {currentYear} • সর্বস্বত্ব সংরক্ষিত
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/" id="footer-nav-home" className="hover:text-[#211F1C] transition-colors">
              মূলপাতা
            </Link>
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/${cat.slug}`} 
                id={`footer-nav-${cat.slug}`}
                className="hover:text-[#211F1C] transition-colors"
              >
                {cat.label}
              </Link>
            ))}
            <Link 
              to="/lekhok-porichiti" 
              id="footer-nav-author"
              className="hover:text-[#211F1C] transition-colors"
            >
              লেখক পরিচিতি
            </Link>
            {siteConfig.socialLinks.email && (
              <a
                id="footer-email-link"
                href={`mailto:${siteConfig.socialLinks.email}`}
                className="hover:text-[#211F1C] flex items-center gap-1 transition-colors"
                title="ইমেইল করুন"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>যোগাযোগ</span>
              </a>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-xs text-[#6F6961]/70">
          <span>একটি শান্ত নিভৃত সাহিত্য অঙ্গন</span>
          <span>•</span>
          <Link
            to="/admin"
            id="footer-admin-link"
            className="hover:text-[#211F1C] underline transition-colors opacity-70 hover:opacity-100"
          >
            লেখক প্রশাসন
          </Link>
        </div>
      </div>
    </footer>
  );
};
