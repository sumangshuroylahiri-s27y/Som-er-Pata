import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (to === window.location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Link: React.FC<LinkProps> = ({ to, children, className, id, onClick, ...props }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    // Allow standard browser handling for modifiers (open in new tab, etc.)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className} id={id} {...props}>
      {children}
    </a>
  );
};

export interface ParsedRoute {
  type: 'home' | 'category' | 'writing' | 'author' | 'admin' | 'not-found';
  categorySlug?: string;
  writingSlug?: string;
}

const VALID_CATEGORIES = new Set(['kobita', 'golpo', 'choto-lekha', 'probandho', 'alochona']);

export function parsePath(pathname: string): ParsedRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') {
    return { type: 'home' };
  }

  const segments = clean.split('/').filter(Boolean);

  if (segments.length === 1) {
    const slug = segments[0];
    if (slug === 'admin') {
      return { type: 'admin' };
    }
    if (slug === 'lekhok-porichiti' || slug === 'author' || slug === 'about') {
      return { type: 'author' };
    }
    if (VALID_CATEGORIES.has(slug)) {
      return { type: 'category', categorySlug: slug };
    }
    return { type: 'not-found' };
  }

  if (segments.length === 2) {
    const [cat, slug] = segments;
    if (VALID_CATEGORIES.has(cat)) {
      return { type: 'writing', categorySlug: cat, writingSlug: slug };
    }
    return { type: 'not-found' };
  }

  return { type: 'not-found' };
}
