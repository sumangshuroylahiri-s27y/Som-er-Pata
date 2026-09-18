import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { searchPublishedWritings, getPublishedWritings } from '../content/writings';
import { Writing } from '../types';
import { Link } from '../utils/router';
import { CATEGORY_MAP } from '../data/categories';
import { formatBengaliDate } from '../utils/date';
import { EmptyState } from './EmptyState';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Writing[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const allPublishedCount = getPublishedWritings().length;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const matches = searchPublishedWritings(query);
    setResults(matches);
  }, [query]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#211F1C]/40 backdrop-blur-2xs flex items-start justify-center p-4 pt-16 sm:pt-24"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="রচনা অনুসন্ধান করুন"
    >
      <div 
        id="search-modal-dialog"
        className="w-full max-w-xl bg-[#F8F5EF] border border-[#DDD6CC] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#DDD6CC] bg-[#F8F5EF]">
          <Search className="w-5 h-5 text-[#6F6961] mr-3 shrink-0" />
          <input
            ref={inputRef}
            id="search-input-field"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="কবিতা, গল্প বা প্রবন্ধ খুঁজুন..."
            className="w-full bg-transparent text-[#211F1C] text-base placeholder-[#6F6961]/70 focus:outline-hidden font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#6F6961] hover:text-[#211F1C] mr-2"
              aria-label="মুছে ফেলুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            id="search-modal-close-btn"
            onClick={onClose}
            className="px-2 py-1 text-xs text-[#6F6961] hover:text-[#211F1C] hover:bg-[#F1ECE4] rounded"
          >
            Esc
          </button>
        </div>

        {/* Results / Empty Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
          {allPublishedCount === 0 ? (
            <div className="py-8 text-center text-sm text-[#6F6961]">
              <p className="font-serif text-base text-[#211F1C] mb-1">
                সংগ্রহশালায় এখনও কোনো প্রকাশিত রচনা নেই
              </p>
              <p>নতুন লেখা যুক্ত হওয়ার পর এখানে অনুসন্ধান করা যাবে।</p>
            </div>
          ) : query.trim() && results.length === 0 ? (
            <EmptyState
              type="search"
              searchQuery={query}
              onClearSearch={() => setQuery('')}
            />
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <div className="text-xs text-[#6F6961] mb-2 font-medium">
                {results.length} টি রচনা পাওয়া গেছে:
              </div>
              {results.map((w) => {
                const cat = CATEGORY_MAP[w.category];
                return (
                  <div
                    key={w.id}
                    className="p-3 rounded hover:bg-[#F1ECE4] transition-colors border-b border-[#DDD6CC]/40 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#6F6961] mb-1">
                      <span className="font-medium text-[#7A3E2B]">{cat?.label}</span>
                      <span>•</span>
                      <span>{formatBengaliDate(w.date)}</span>
                    </div>
                    <Link
                      to={`/${w.category}/${w.slug}`}
                      onClick={onClose}
                      className="text-lg font-serif text-[#211F1C] hover:text-[#7A3E2B] font-medium block"
                    >
                      {w.title}
                    </Link>
                    {w.excerpt && (
                      <p className="text-xs text-[#6F6961] mt-1 line-clamp-2">
                        {w.excerpt}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#6F6961]">
              যেকোনো শিরোনাম, বিভাগ বা রচনার শব্দ লিখে অনুসন্ধান করুন।
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
