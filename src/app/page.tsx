import type { Metadata } from 'next';
import { HomeLanding } from '@/components/HomeLanding';
import {
  HOME_DESCRIPTION,
  HOME_KEYWORDS,
  HOME_TITLE,
  OG_IMAGE,
  SITE_URL,
} from '@/lib/seo';

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  keywords: [...HOME_KEYWORDS],
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    type: 'website',
    url: SITE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function HomePage() {
  return <HomeLanding />;
}
