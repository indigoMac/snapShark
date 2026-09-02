import type { Metadata } from 'next';
import { HomeLanding } from '@/components/HomeLanding';

export const metadata: Metadata = {
  title: 'SnapShark — Dive logbook & underwater photo tools',
  description:
    'A dive logbook worth revisiting, and underwater colour correction that runs in your browser. Built for divers and snorkellers.',
  keywords: [
    'dive logbook',
    'scuba diving log',
    'snorkeling log',
    'underwater photo correction',
    'dive photos',
    'SnapShark',
  ],
  openGraph: {
    title: 'SnapShark — Dive logbook & underwater photo tools',
    description:
      'Map your dives, keep the details that matter, and bring the colour back to your underwater photos.',
    type: 'website',
    url: 'https://www.snap-shark.com',
    images: [
      {
        url: '/marketing/hero-dive.jpg',
        width: 2400,
        height: 1600,
        alt: 'Scuba diver beside a school of bluestripe snappers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapShark — Dive logbook & underwater photo tools',
    description:
      'A dive logbook worth revisiting, and underwater colour correction in your browser.',
  },
  alternates: {
    canonical: 'https://www.snap-shark.com',
  },
};

export default function HomePage() {
  return <HomeLanding />;
}
