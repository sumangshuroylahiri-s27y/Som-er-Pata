import React from 'react';
import { Link } from '../utils/router';
import { Feather, BookOpen, SearchX } from 'lucide-react';

interface EmptyStateProps {
  type: 'home' | 'category' | 'search';
  categoryTitle?: string;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  categoryTitle,
  searchQuery,
  onClearSearch,
}) => {
  if (type === 'home') {
    return (
      <div id="home-empty-state" className="py-20 text-center max-w-lg mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F1ECE4] text-[#7A3E2B] mb-5">
          <Feather className="w-5 h-5 opacity-80" />
        </div>
        <h3 className="text-xl sm:text-2xl font-serif text-[#211F1C] mb-3">
          সাহিত্য সংগ্রহশালা এখনও প্রস্তুত হচ্ছে
        </h3>
        <p className="text-base text-[#6F6961] leading-relaxed font-sans mb-6">
          এই মুহূর্তে কোনো লেখা সর্বসমক্ষে প্রকাশিত হয়নি। রচনার পাণ্ডুলিপি সংকলন ও সম্পাদনার কাজ চলছে। শীঘ্রই এখানে নতুন কবিতা, গল্প ও প্রবন্ধ প্রকাশিত হবে।
        </p>
        <div className="inline-block p-4 border border-[#DDD6CC] bg-[#F1ECE4]/40 rounded text-left text-xs text-[#6F6961]">
          <span className="font-semibold text-[#211F1C] block mb-1">লেখকের জন্য নির্দেশিকা:</span>
          নতুন রচনা যুক্ত, সম্পাদনা বা প্রকাশ করতে সরাসরি <Link to="/admin" className="text-[#7A3E2B] font-medium underline hover:text-[#211F1C]">অ্যাডমিন প্যানেল (/admin)</Link>-এ প্রবেশ করুন।
        </div>
      </div>
    );
  }

  if (type === 'category') {
    return (
      <div id="category-empty-state" className="py-20 text-center max-w-lg mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F1ECE4] text-[#7A3E2B] mb-5">
          <BookOpen className="w-5 h-5 opacity-80" />
        </div>
        <h3 className="text-xl sm:text-2xl font-serif text-[#211F1C] mb-3">
          {categoryTitle ? `"${categoryTitle}" বিভাগে এখনও কোনো লেখা নেই` : 'এই বিভাগে এখনও কোনো লেখা নেই'}
        </h3>
        <p className="text-base text-[#6F6961] leading-relaxed font-sans mb-6">
          এই নির্দিষ্ট সাহিত্য ধারায় এখনও কোনো রচনা প্রকাশিত হয়নি। অন্যান্য বিভাগগুলো পরিদর্শন করতে পারেন।
        </p>
        <Link
          to="/"
          id="empty-state-home-link"
          className="inline-flex items-center justify-center px-4 py-2 border border-[#DDD6CC] text-sm text-[#211F1C] hover:bg-[#F1ECE4] rounded transition-colors"
        >
          মূলপাতায় ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div id="search-empty-state" className="py-12 text-center max-w-md mx-auto">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F1ECE4] text-[#7A3E2B] mb-4">
        <SearchX className="w-5 h-5 opacity-80" />
      </div>
      <h4 className="text-lg font-serif text-[#211F1C] mb-2">
        কোনো মিল খুঁজে পাওয়া যায়নি
      </h4>
      <p className="text-sm text-[#6F6961] mb-4">
        {searchQuery ? `"${searchQuery}" এর জন্য কোনো প্রকাশিত রচনা পাওয়া যায়নি।` : 'অন্য কোনো শব্দ দিয়ে পুনরায় অনুসন্ধান করুন।'}
      </p>
      {onClearSearch && (
        <button
          id="clear-search-btn"
          onClick={onClearSearch}
          className="text-xs text-[#7A3E2B] underline hover:text-[#211F1C] cursor-pointer"
        >
          অনুসন্ধান মুছুন
        </button>
      )}
    </div>
  );
};
