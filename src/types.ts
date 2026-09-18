export type WritingCategory = 
  | 'kobita' 
  | 'golpo' 
  | 'choto-lekha' 
  | 'probandho' 
  | 'alochona';

export interface CategoryInfo {
  id: WritingCategory;
  label: string;
  slug: string;
  description: string;
}

export interface Writing {
  id: string;
  title: string;
  slug: string;
  category: WritingCategory;
  content: string;
  excerpt?: string;
  date: string; // YYYY-MM-DD
  updatedDate?: string;
  published: boolean;
  image?: string;
  tags?: string[];
}

export interface SocialLinks {
  twitter?: string;
  facebook?: string;
  email?: string;
  github?: string;
}

export interface SiteConfig {
  authorName: string;
  authorBirth?: string;
  authorBio?: string;
  siteName: string;
  tagline: string;
  description: string;
  profileImage?: string;
  logoUrl?: string;
  socialLinks: SocialLinks;
  upiId: string;
  upiPayeeName: string;
  siteUrl: string;
}
