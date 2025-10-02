import type { Metadata } from 'next';
import { AboutTabbed } from '@/components/AboutTabbed';

export const metadata: Metadata = {
  title: 'About SnapShark - Professional Image Processing',
  description:
    'Learn about SnapShark, a privacy-first image processing tool built by developers for developers, designers, and professionals.',
  keywords: [
    'about snapshark',
    'image processing',
    'developer',
    'privacy-first',
    'client-side processing',
  ],
  openGraph: {
    title: 'About SnapShark - Professional Image Processing',
    description:
      'Learn about SnapShark, a privacy-first image processing tool built by developers for developers, designers, and professionals.',
    type: 'website',
    url: 'https://www.snap-shark.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About SnapShark - Professional Image Processing',
    description:
      'Learn about SnapShark, a privacy-first image processing tool built by developers for developers, designers, and professionals.',
  },
  alternates: {
    canonical: 'https://www.snap-shark.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            About{' '}
            <span className="text-slate-900 dark:text-slate-100">Snap</span>
            <span className="text-blue-600 dark:text-blue-400">Shark</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Simple tools for everyday image tasks - no heavyweight software
            required
          </p>
        </div>

        {/* Tabbed Interface */}
        <AboutTabbed />
      </div>
    </div>
  );
}
