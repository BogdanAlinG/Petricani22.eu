import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSlugContext } from '../contexts/SlugContext';
import { getEquivalentPath } from '../hooks/useLocalizedPath';

interface SEOConfig {
  title: string;
  description: string;
}

const PAGE_SEO: Record<string, Record<string, SEOConfig>> = {
  RO: {
    '/ro': {
      title: 'Petricani 22 - Închirieri & Servicii Premium',
      description: 'Închirieri spații premium în Petricani 22. Rezervări online, meniu room service și servicii de calitate.',
    },
    '/ro/inchirieri': {
      title: 'Unități de Închiriat - Petricani 22',
      description: 'Descoperă unitățile noastre. Spații și camere confortabile cu toate dotările necesare.',
    },
    '/ro/meniu': {
      title: 'Meniu Room Service - Petricani 22',
      description: 'Comanda mancare delicioasa direct in camera ta. Meniu variat cu livrare la usa.',
    },
    '/ro/inspiratie': {
      title: 'Inspiratie & Articole - Petricani 22',
      description: 'Articole despre zona, activitati si recomandari pentru o sedere perfecta.',
    },
    '/ro/cos': {
      title: 'Cos de Cumparaturi - Petricani 22',
      description: 'Revizuieste si finalizeaza comanda ta.',
    },
  },
  EN: {
    '/en': {
      title: 'Petricani 22 - Premium Rentals & Services',
      description: 'Premium rentals at Petricani 22. Online bookings, room service menu and quality services.',
    },
    '/en/rentals': {
      title: 'Rentals - Petricani 22',
      description: 'Discover our rental units. Comfortable spaces and rooms with all necessary amenities.',
    },
    '/en/menu': {
      title: 'Room Service Menu - Petricani 22',
      description: 'Order delicious food delivered to your room. Varied menu with door-to-door delivery.',
    },
    '/en/inspiration': {
      title: 'Inspiration & Articles - Petricani 22',
      description: 'Articles about the area, activities and recommendations for a perfect stay.',
    },
    '/en/cart': {
      title: 'Shopping Cart - Petricani 22',
      description: 'Review and complete your order.',
    },
  },
};

function getPageSEO(pathname: string, language: string): SEOConfig {
  const langSeo = PAGE_SEO[language] || PAGE_SEO.RO;
  if (langSeo[pathname]) return langSeo[pathname];
  const basePath = pathname.replace(/\/[^/]+$/, '');
  if (langSeo[basePath]) return langSeo[basePath];
  return language === 'RO'
    ? { title: 'Petricani 22', description: 'Închirieri premium și servicii de calitate.' }
    : { title: 'Petricani 22', description: 'Premium rentals and quality services.' };
}

function setOrCreateMeta(name: string, content: string, attribute = 'name') {
  let el = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setOrCreateLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = extra
    ? `link[rel="${rel}"][${Object.entries(extra).map(([k, v]) => `${k}="${v}"`).join('][')}]`
    : `link[rel="${rel}"]`;
  let el = document.querySelector(selector) as HTMLLinkElement;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (extra) Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.href = href;
}

export default function SEOHead() {
  const { language } = useLanguage();
  const { currentSlugPair } = useSlugContext();
  const location = useLocation();

  useEffect(() => {
    const baseUrl = window.location.origin;
    const currentPath = location.pathname;
    const alternateLang = language === 'RO' ? 'EN' : 'RO';
    const alternatePath = getEquivalentPath(currentPath, alternateLang, currentSlugPair || undefined);

    document.documentElement.lang = language === 'RO' ? 'ro' : 'en';

    const seo = getPageSEO(currentPath, language);
    document.title = seo.title;
    setOrCreateMeta('description', seo.description);

    setOrCreateMeta('og:title', seo.title, 'property');
    setOrCreateMeta('og:description', seo.description, 'property');
    setOrCreateMeta('og:type', 'website', 'property');
    setOrCreateMeta('og:url', `${baseUrl}${currentPath}`, 'property');
    setOrCreateMeta('og:site_name', 'Petricani 22', 'property');

    setOrCreateMeta('twitter:card', 'summary');
    setOrCreateMeta('twitter:title', seo.title);
    setOrCreateMeta('twitter:description', seo.description);

    const roPath = language === 'RO' ? currentPath : alternatePath;
    const enPath = language === 'EN' ? currentPath : alternatePath;

    setOrCreateLink('alternate', `${baseUrl}${roPath}`, { hreflang: 'ro' });
    setOrCreateLink('alternate', `${baseUrl}${enPath}`, { hreflang: 'en' });
    setOrCreateLink('alternate', `${baseUrl}${roPath}`, { hreflang: 'x-default' });
    setOrCreateLink('canonical', `${baseUrl}${currentPath}`);
  }, [language, location.pathname, currentSlugPair]);

  return null;
}
