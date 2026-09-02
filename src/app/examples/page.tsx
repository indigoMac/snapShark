import type { Metadata } from 'next';
import { ExamplesTabbed } from '@/components/ExamplesTabbed';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Examples',
  description:
    'See SnapShark in action: underwater colour correction, dive logbook flow, and browser photo tools for divers and snorkellers.',
  keywords: [
    'dive logbook examples',
    'underwater photo correction',
    'scuba diving log',
    'snapshark examples',
  ],
  openGraph: {
    title: 'Examples | SnapShark',
    description:
      'Colour fix, logbook flow, and photo tools — how SnapShark works for divers.',
    type: 'website',
    url: 'https://www.snap-shark.com/examples',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Examples | SnapShark',
    description:
      'Colour fix, logbook flow, and photo tools — how SnapShark works for divers.',
  },
  alternates: {
    canonical: 'https://www.snap-shark.com/examples',
  },
};

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-10">
      <PageHeader
        eyebrow="Examples"
        title="How SnapShark fits a dive trip"
        description="Colour the photos, pin the places, keep the details — here is what that looks like in practice."
      />

      <ExamplesTabbed />
    </div>
  );
}
