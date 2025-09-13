import type { Metadata } from 'next';
import { BackgroundRemoval } from '@/components/BackgroundRemoval';

export const metadata: Metadata = {
  title: 'AI Background Removal - SnapShark',
  description:
    'Remove backgrounds from images instantly with AI. Professional-quality results in seconds. Privacy-first processing.',
  keywords: [
    'background removal',
    'AI image editing',
    'remove background',
    'transparent background',
    'image cutout',
    'photo editing',
    'privacy-first',
  ],
  openGraph: {
    title: 'AI Background Removal - SnapShark',
    description:
      'Remove backgrounds from images instantly with AI. Professional-quality results in seconds.',
    type: 'website',
    url: 'https://www.snap-shark.com/background-removal',
    siteName: 'SnapShark',
    images: [
      {
        url: 'https://www.snap-shark.com/snapshark-icon-512.png',
        width: 512,
        height: 512,
        alt: 'SnapShark Background Removal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@snapshark',
    creator: '@snapshark',
    title: 'AI Background Removal - SnapShark',
    description:
      'Remove backgrounds from images instantly with AI. Professional-quality results in seconds.',
    images: ['https://www.snap-shark.com/snapshark-icon-512.png'],
  },
  alternates: {
    canonical: 'https://www.snap-shark.com/background-removal',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function BackgroundRemovalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <BackgroundRemoval />
      </div>
    </div>
  );
}
