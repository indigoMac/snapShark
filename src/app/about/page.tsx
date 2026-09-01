import type { Metadata } from 'next';
import { AboutTabbed } from '@/components/AboutTabbed';

const description =
  'SnapShark is a dive logbook and underwater photo toolkit: map the places you have dived, record the details that matter, and correct dive photos in your browser.';

export const metadata: Metadata = {
  title: 'About SnapShark - Dive Logbook & Photo Tools',
  description,
  keywords: [
    'about snapshark',
    'dive logbook',
    'scuba diving log',
    'underwater photo correction',
    'privacy-first',
  ],
  openGraph: {
    title: 'About SnapShark - Dive Logbook & Photo Tools',
    description,
    type: 'website',
    url: 'https://www.snap-shark.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About SnapShark - Dive Logbook & Photo Tools',
    description,
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
            A dive logbook worth revisiting, and photo tools that run in your
            browser
          </p>
        </div>

        {/* Tabbed Interface */}
        <AboutTabbed />
      </div>
    </div>
  );
}
