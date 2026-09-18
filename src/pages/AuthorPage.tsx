import React, { useEffect, useState } from 'react';
import { Link } from '../utils/router';
import { siteConfig } from '../data/siteConfig';
import { updatePageMeta } from '../utils/seo';
import { Mail, Check, Copy, BookOpen, GraduationCap, Music } from 'lucide-react';

export const AuthorPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    updatePageMeta({
      title: `লেখক পরিচিতি — ${siteConfig.authorName}`,
      description: `সোম রায় লাহিড়ী — লেখক পরিচিতি, শিক্ষাজীবন, সাংস্কৃতিক যাত্রা ও প্রকাশিত গ্রন্থাবলী।`,
    });
    window.scrollTo(0, 0);
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('somroylahiri@gmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <main id="author-page-main" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Breadcrumbs */}
      <nav id="author-breadcrumb" aria-label="ব্রেডক্রাম্ব" className="mb-8 text-sm text-[#6F6961]">
        <Link to="/" className="hover:text-[#211F1C] transition-colors">
          মূলপাতা
        </Link>
        <span className="mx-2 text-[#DDD6CC]">/</span>
        <span className="text-[#211F1C] font-medium">লেখক পরিচিতি</span>
      </nav>

      {/* Main Author Header */}
      <header id="author-header" className="pb-8 mb-10 border-b border-[#DDD6CC]/60 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        {siteConfig.profileImage && (
          <div className="shrink-0">
            <img
              id="author-profile-photo"
              src={siteConfig.profileImage}
              alt={siteConfig.authorName}
              referrerPolicy="no-referrer"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-[#DDD6CC] p-1 bg-[#F8F5EF] shadow-sm"
            />
          </div>
        )}
        <div className="flex-1">
          <span className="text-xs uppercase tracking-widest text-[#7A3E2B] font-medium mb-2 block">
            লেখক ও স্রষ্টা পরিচিতি
          </span>
          <h1 
            id="author-name-title" 
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal text-[#211F1C] tracking-tight mb-2"
          >
            {siteConfig.authorName}
          </h1>
          {siteConfig.authorBirth && (
            <p id="author-birth-info" className="text-base sm:text-lg text-[#6F6961] font-sans">
              (জন্ম : {siteConfig.authorBirth})
            </p>
          )}
        </div>
      </header>

      {/* Literary Bio Content */}
      <article id="author-biography" className="reading-column">
        {/* The Exact Author Paragraph */}
        <div 
          id="author-bio-paragraph"
          className="text-lg sm:text-xl text-[#211F1C] leading-[1.95] sm:leading-[2.1] font-sans space-y-6"
        >
          <p className="indent-0">
            উত্তরবঙ্গের বিখ্যাত শহর জলপাইগুড়িতে বেড়ে ওঠা। ফণীন্দ্রদেব ইনষ্টিটিউশন থেকে প্রথমে মাধ্যমিক, জলপাইগুড়ি জিলা স্কুল থেকে উচ্চমাধ্যমিক এবং জলপাইগুড়ি ইআইআইএল ক্যাম্পাস থেকে বিবিএ মার্কেটিং নিয়ে স্নাতক করেছে সে। বর্তমানে কলকাতায় সে একেল ক্যাম্পাস থেকে এমবিএ(ক্লাউড ইআরপি)-র দ্বিতীয় বর্ষের ছাত্র। পড়াশোনার ফাঁকে লেখালেখি করতে সে বেজায় ভালোবাসে। লেখালেখির সাথে সাথে ভালোবাসে গান, ভয়েস-আর্ট ইত্যাদি। আনুষ্ঠানিক ভাবে সংস্কৃতি জগতে প্রবেশ ২০২৩ সালে। এখনো অব্দি তাঁর দুটো বই প্রকাশ পেয়েছে আন্তর্জাতিক বইমেলায়। বর্তমানে লেখালেখির সাথে বরাবর যুক্ত সে।
          </p>
        </div>

        {/* Quiet Milestone Cards */}
        <div className="my-12 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#DDD6CC]/60">
          <div className="bg-[#F1ECE4]/50 border border-[#DDD6CC]/70 rounded p-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[#7A3E2B] mb-1">
              <GraduationCap className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">শিক্ষা ও কর্মজীবন</span>
            </div>
            <p className="text-sm text-[#211F1C] font-serif">
              এমবিএ (ক্লাউড ইআরপি), একেল ক্যাম্পাস
            </p>
            <p className="text-xs text-[#6F6961] mt-0.5">
              প্রাক্তন: ফণীন্দ্রদেব, জলপাইগুড়ি জিলা স্কুল ও ইআইআইএল
            </p>
          </div>

          <div className="bg-[#F1ECE4]/50 border border-[#DDD6CC]/70 rounded p-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[#7A3E2B] mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">গ্রন্থ প্রকাশনা</span>
            </div>
            <p className="text-sm text-[#211F1C] font-serif">
              ২টি প্রকাশিত গ্রন্থ
            </p>
            <p className="text-xs text-[#6F6961] mt-0.5">
              আন্তর্জাতিক বইমেলায় আত্মপ্রকাশ
            </p>
          </div>

          <div className="bg-[#F1ECE4]/50 border border-[#DDD6CC]/70 rounded p-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[#7A3E2B] mb-1">
              <Music className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">সাংস্কৃতিক অনুরাগ</span>
            </div>
            <p className="text-sm text-[#211F1C] font-serif">
              সাহিত্য, সঙ্গীত ও ভয়েস-আর্ট
            </p>
            <p className="text-xs text-[#6F6961] mt-0.5">
              সাংস্কৃতিক জগতে প্রবেশ: ২০২৩
            </p>
          </div>
        </div>

        {/* Direct Contact Section */}
        <section 
          id="author-contact-section" 
          aria-label="যোগাযোগ"
          className="mt-12 p-6 sm:p-8 bg-[#F1ECE4]/40 border border-[#DDD6CC]/80 rounded-lg text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <h3 className="text-base sm:text-lg font-serif text-[#211F1C] mb-1">
              যোগাযোগ করা যেতে পারে :
            </h3>
            <p className="text-sm text-[#6F6961]">
              পাঠকের প্রতিক্রিয়া, সাহিত্য বিষয়ক ভাবনা বা যেকোনো আলোচনার জন্য
            </p>
            <a 
              href="mailto:somroylahiri@gmail.com" 
              className="inline-block mt-2 text-base sm:text-lg font-mono text-[#7A3E2B] hover:underline"
            >
              somroylahiri@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              id="author-send-email-btn"
              href="mailto:somroylahiri@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A3E2B] text-[#F8F5EF] text-sm font-medium rounded hover:bg-[#683323] transition-colors shadow-xs"
            >
              <Mail className="w-4 h-4" />
              <span>ইমেইল পাঠান</span>
            </a>

            <button
              id="author-copy-email-btn"
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F8F5EF] text-[#211F1C] border border-[#DDD6CC] hover:bg-[#DDD6CC]/40 text-sm font-medium rounded transition-colors cursor-pointer"
              title="ইমেইল অ্যাড্রেস কপি করুন"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-700" />
                  <span className="text-green-700 text-xs">কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#6F6961]" />
                  <span className="text-xs">কপি</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Back Link */}
        <div className="mt-14 text-center">
          <Link
            to="/"
            id="author-back-to-home-link"
            className="inline-flex items-center gap-2 text-sm text-[#7A3E2B] hover:text-[#211F1C] transition-colors"
          >
            <span>&larr; মূলপাতায় ফিরে যান</span>
          </Link>
        </div>
      </article>
    </main>
  );
};
