import { LEGAL } from '@/lib/legal';

export const SITE_URL = LEGAL.siteUrl;

export const SITE_NAME = 'SnapShark';

/** Exact string we want in Google for the homepage (do not apply the title template). */
export const HOME_TITLE =
  'SnapShark - Dive Logbook & Underwater Photo Tools';

export const HOME_DESCRIPTION =
  'Log your dives on a map, keep the details that matter, and restore colour to underwater photos in your browser. Built for divers and snorkellers. Free to start.';

export const HOME_KEYWORDS = [
  'dive logbook',
  'scuba diving log',
  'snorkeling log',
  'underwater photo correction',
  'dive photos',
  'SnapShark',
] as const;

export const OG_IMAGE = {
  url: '/marketing/hero-dive.jpg',
  width: 2400,
  height: 1600,
  alt: 'Scuba diver beside a school of bluestripe snappers',
} as const;

export function absoluteUrl(path = '/') {
  if (path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: HOME_DESCRIPTION,
};

export const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  description: HOME_DESCRIPTION,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GBP',
  },
};
