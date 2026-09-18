import { CategoryInfo, WritingCategory } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'kobita',
    label: 'কবিতা',
    slug: 'kobita',
    description: 'ছন্দ, স্তবক ও হৃদয়ের নিভৃত অনুভবের পঙ্‌ক্তিমালা',
  },
  {
    id: 'golpo',
    label: 'গল্প',
    slug: 'golpo',
    description: 'চরিত্র, সময় ও জীবনের বহুমাত্রিক কথাসাহিত্য',
  },
  {
    id: 'choto-lekha',
    label: 'ছোট লেখা',
    slug: 'choto-lekha',
    description: 'সংক্ষিপ্ত অনুভূতি, মুহূর্তচিত্র ও তাৎক্ষণিক ভাবনা',
  },
  {
    id: 'probandho',
    label: 'প্রবন্ধ',
    slug: 'probandho',
    description: 'গভীর মননশীল, তাত্ত্বিক ও সমাজমনস্ক পর্যালোচনা',
  },
  {
    id: 'alochona',
    label: 'আলোচনা',
    slug: 'alochona',
    description: 'শিল্প, সাহিত্য, দর্শন ও সমসাময়িক জিজ্ঞাসা',
  },
];

export const CATEGORY_MAP: Record<WritingCategory, CategoryInfo> = {
  kobita: CATEGORIES[0],
  golpo: CATEGORIES[1],
  'choto-lekha': CATEGORIES[2],
  probandho: CATEGORIES[3],
  alochona: CATEGORIES[4],
};

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}
