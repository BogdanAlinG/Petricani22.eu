import { useLanguage } from '../contexts/LanguageContext';

type Language = 'RO' | 'EN';

interface RouteConfig {
  ro: string;
  en: string;
}

export interface SlugPair {
  slug: string;
  slug_ro: string;
}

const routes: Record<string, RouteConfig> = {
  home: { ro: '', en: '' },
  accommodations: { ro: 'cazare', en: 'accommodations' },
  accommodationDetail: { ro: 'cazare', en: 'accommodations' },
  book: { ro: 'rezerva', en: 'book' },
  menu: { ro: 'meniu', en: 'menu' },
  menuCategory: { ro: 'meniu/categorie', en: 'menu/category' },
  menuProduct: { ro: 'meniu/produs', en: 'menu/product' },
  inspiration: { ro: 'inspiratie', en: 'inspiration' },
  cart: { ro: 'cos', en: 'cart' },
  checkout: { ro: 'finalizare-comanda', en: 'checkout' },
  orderConfirmation: { ro: 'confirmare-comanda', en: 'order-confirmation' },
};

function resolveSlug(param: string | SlugPair, language: Language): string {
  if (typeof param === 'string') return param;
  return language === 'RO' ? param.slug_ro : param.slug;
}

export function getLocalizedPath(routeKey: string, language: Language, param?: string | SlugPair): string {
  const langPrefix = language === 'RO' ? 'ro' : 'en';
  const route = routes[routeKey];

  if (!route) {
    return `/${langPrefix}`;
  }

  const path = language === 'RO' ? route.ro : route.en;
  const basePath = path ? `/${langPrefix}/${path}` : `/${langPrefix}`;

  if (param) {
    return `${basePath}/${resolveSlug(param, language)}`;
  }

  return basePath;
}

export function useLocalizedPath() {
  const { language } = useLanguage();

  const getPath = (routeKey: string, param?: string | SlugPair): string => {
    return getLocalizedPath(routeKey, language, param);
  };

  const homePath = getPath('home');
  const accommodationsPath = getPath('accommodations');
  const menuPath = getPath('menu');
  const inspirationPath = getPath('inspiration');
  const cartPath = getPath('cart');
  const checkoutPath = getPath('checkout');

  const getCategoryPath = (slugs: SlugPair) => getPath('menuCategory', slugs);
  const getProductPath = (slugs: SlugPair) => getPath('menuProduct', slugs);
  const getArticlePath = (id: string) => getPath('inspiration', id);
  const getOrderConfirmationPath = (orderNumber: string) => getPath('orderConfirmation', orderNumber);
  const getAccommodationPath = (slugs: SlugPair) => getPath('accommodationDetail', slugs);
  const getBookingPath = (slugs: SlugPair) => getPath('book', slugs);

  return {
    getPath,
    homePath,
    accommodationsPath,
    menuPath,
    inspirationPath,
    cartPath,
    checkoutPath,
    getCategoryPath,
    getProductPath,
    getArticlePath,
    getOrderConfirmationPath,
    getAccommodationPath,
    getBookingPath,
  };
}

const routeMappingToRo: Record<string, string> = {
  '/accommodations': '/cazare',
  '/book': '/rezerva',
  '/menu/category': '/meniu/categorie',
  '/menu/product': '/meniu/produs',
  '/menu': '/meniu',
  '/inspiration': '/inspiratie',
  '/cart': '/cos',
  '/checkout': '/finalizare-comanda',
  '/order-confirmation': '/confirmare-comanda',
};

const routeMappingToEn: Record<string, string> = {
  '/cazare': '/accommodations',
  '/rezerva': '/book',
  '/meniu/categorie': '/menu/category',
  '/meniu/produs': '/menu/product',
  '/meniu': '/menu',
  '/inspiratie': '/inspiration',
  '/cos': '/cart',
  '/finalizare-comanda': '/checkout',
  '/confirmare-comanda': '/order-confirmation',
};

export function getEquivalentPath(currentPath: string, targetLang: Language, slugMap?: SlugPair): string {
  const langPrefix = targetLang === 'RO' ? 'ro' : 'en';
  const otherPrefix = targetLang === 'RO' ? 'en' : 'ro';

  const pathWithoutLang = currentPath.replace(new RegExp(`^/(${otherPrefix}|${langPrefix.toLowerCase()})`), '');

  const mapping = targetLang === 'RO' ? routeMappingToRo : routeMappingToEn;

  const sortedEntries = Object.entries(mapping).sort(
    ([a], [b]) => b.length - a.length
  );

  let translatedPath = pathWithoutLang;
  let matchedRouteSegment = '';

  for (const [from, to] of sortedEntries) {
    if (translatedPath.startsWith(from)) {
      matchedRouteSegment = from;
      translatedPath = translatedPath.replace(from, to);
      break;
    }
  }

  if (slugMap && matchedRouteSegment) {
    const afterRoute = pathWithoutLang.slice(matchedRouteSegment.length);
    if (afterRoute.startsWith('/')) {
      const currentSlug = afterRoute.slice(1).split('/')[0].split('?')[0].split('#')[0];
      const sourceLang = targetLang === 'RO' ? 'EN' : 'RO';
      const sourceSlug = sourceLang === 'RO' ? slugMap.slug_ro : slugMap.slug;
      if (currentSlug === sourceSlug) {
        const targetSlug = targetLang === 'RO' ? slugMap.slug_ro : slugMap.slug;
        const translatedRouteSegment = mapping[matchedRouteSegment] || matchedRouteSegment;
        const rest = afterRoute.slice(1 + currentSlug.length);
        translatedPath = translatedRouteSegment + '/' + targetSlug + rest;
      }
    }
  }

  return `/${langPrefix}${translatedPath}`;
}
