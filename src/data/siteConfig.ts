import { SiteConfig } from '../types';
import authorLogoImage from '../assets/author.jpg';

/**
 * Site & Author Configuration
 * 
 * You can edit your personal information, author statement, and links here.
 * The UPI ID must remain: sumangshuroylahiri-1@okhdfcbank
 */
export const siteConfig: SiteConfig = {
  authorName: 'সোম রায় লাহিড়ী',
  authorBirth: '২৭শে ফেব্রুয়ারি, ২০০৪',
  authorBio: `উত্তরবঙ্গের বিখ্যাত শহর জলপাইগুড়িতে বেড়ে ওঠা। ফণীন্দ্রদেব ইনষ্টিটিউশন থেকে প্রথমে মাধ্যমিক, জলপাইগুড়ি জিলা স্কুল থেকে উচ্চমাধ্যমিক এবং জলপাইগুড়ি ইআইআইএল ক্যাম্পাস থেকে বিবিএ মার্কেটিং নিয়ে স্নাতক করেছে সে। বর্তমানে কলকাতায় সে একেল ক্যাম্পাস থেকে এমবিএ(ক্লাউড ইআরপি)-র দ্বিতীয় বর্ষের ছাত্র। পড়াশোনার ফাঁকে লেখালেখি করতে সে বেজায় ভালোবাসে। লেখালেখির সাথে সাথে ভালোবাসে গান, ভয়েস-আর্ট ইত্যাদি। আনুষ্ঠানিক ভাবে সংস্কৃতি জগতে প্রবেশ ২০২৩ সালে। এখনো অব্দি তাঁর দুটো বই প্রকাশ পেয়েছে আন্তর্জাতিক বইমেলায়। বর্তমানে লেখালেখির সাথে বরাবর যুক্ত সে।`,
  siteName: 'বাংলা সাহিত্য ও রচনা',
  tagline: 'একটি শান্ত ব্যক্তিগত সাহিত্য অঙ্গন',
  description: 'কবিতা, গল্প, ছোট লেখা, প্রবন্ধ ও আলোচনার একটি নিভৃত ডিজিটাল পাঠাগার।',
  profileImage: authorLogoImage,
  logoUrl: authorLogoImage,
  socialLinks: {
    email: 'somroylahiri@gmail.com',
    twitter: '',
    facebook: '',
    github: '',
  },
  upiId: 'sumangshuroylahiri-1@okhdfcbank', // Required UPI ID
  upiPayeeName: 'Som Roy Lahiri',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-yawugcg6fkzd2dqtb6hybl-35377283211.asia-east1.run.app',
};
