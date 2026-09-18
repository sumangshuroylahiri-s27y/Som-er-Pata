import React, { useEffect } from 'react';
import { Link } from '../utils/router';
import { updatePageMeta } from '../utils/seo';

interface NotFoundPageProps {
  message?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ 
  message = 'কাঙ্ক্ষিত পৃষ্ঠা বা রচনাটি খুঁজে পাওয়া যায়নি।' 
}) => {
  useEffect(() => {
    updatePageMeta({
      title: 'পৃষ্ঠা পাওয়া যায়নি (৪০৪)',
      description: 'অনুসন্ধানকৃত পৃষ্ঠাটি উপস্থিত নেই বা স্থানান্তরিত হয়েছে।',
    });
  }, []);

  return (
    <main id="not-found-page" className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="font-serif text-5xl sm:text-6xl text-[#7A3E2B] mb-4 opacity-80">
        ৪০৪
      </div>
      <h1 className="text-2xl sm:text-3xl font-serif text-[#211F1C] mb-4">
        পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
      </h1>
      <p className="text-base text-[#6F6961] mb-8 leading-relaxed font-sans">
        {message} হয়তো লিঙ্কটি পরিবর্তিত হয়েছে অথবা লেখাটি সরিয়ে নেওয়া হয়েছে।
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          id="not-found-home-link"
          className="px-5 py-2.5 bg-[#211F1C] text-[#F8F5EF] hover:bg-[#7A3E2B] text-sm rounded transition-colors"
        >
          মূলপাতায় ফিরে যান
        </Link>
      </div>
    </main>
  );
};
