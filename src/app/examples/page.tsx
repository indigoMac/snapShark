import type { Metadata } from 'next';
import { ExamplesTabbed } from '@/components/ExamplesTabbed';

export const metadata: Metadata = {
  title: 'Examples & Tutorials - SnapShark',
  description:
    'Learn how to use SnapShark with step-by-step tutorials and real examples. See how to create logo packages, process underwater photos, and more.',
  keywords: [
    'snapshark examples',
    'image processing tutorials',
    'logo package tutorial',
    'underwater photo correction',
    'image resize guide',
  ],
  openGraph: {
    title: 'Examples & Tutorials - SnapShark',
    description:
      'Learn how to use SnapShark with step-by-step tutorials and real examples.',
    type: 'website',
    url: 'https://www.snap-shark.com/examples',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Examples & Tutorials - SnapShark',
    description:
      'Learn how to use SnapShark with step-by-step tutorials and real examples.',
  },
  alternates: {
    canonical: 'https://www.snap-shark.com/examples',
  },
};

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Examples & Tutorials
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Learn how to use SnapShark's tools with real examples and step-by-step guides
          </p>
        </div>

        {/* Tabbed Interface */}
        <ExamplesTabbed />
      </div>
    </div>
  );
}
