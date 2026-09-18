import { siteConfig } from '../data/siteConfig';
import { Writing } from '../types';

interface MetaOptions {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article';
  writing?: Writing;
}

export function updatePageMeta(options: MetaOptions): void {
  if (typeof document === 'undefined') return;

  const fullTitle = options.title 
    ? `${options.title} — ${siteConfig.siteName}` 
    : `${siteConfig.siteName} — ${siteConfig.authorName}`;

  document.title = fullTitle;

  const description = options.description || siteConfig.description;
  const canonicalUrl = options.canonicalUrl || window.location.href;
  const ogType = options.type || 'website';

  // Standard description
  setMetaTag('name', 'description', description);

  // OpenGraph
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:site_name', siteConfig.siteName);

  // Twitter
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', description);

  // Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // Structured Data (JSON-LD)
  updateStructuredData(options);
}

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function updateStructuredData(options: MetaOptions): void {
  const SCRIPT_ID = 'json-ld-structured-data';
  let scriptEl = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

  if (options.writing) {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': options.writing.title,
      'datePublished': options.writing.date,
      'dateModified': options.writing.updatedDate || options.writing.date,
      'author': {
        '@type': 'Person',
        'name': siteConfig.authorName,
      },
      'inLanguage': 'bn',
      'description': options.writing.excerpt || options.writing.title,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': window.location.href,
      },
    };

    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = SCRIPT_ID;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);
  } else {
    // Website structured data
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': siteConfig.siteName,
      'url': window.location.origin,
      'description': siteConfig.description,
      'inLanguage': 'bn',
      'author': {
        '@type': 'Person',
        'name': siteConfig.authorName,
      },
    };

    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = SCRIPT_ID;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);
  }
}
