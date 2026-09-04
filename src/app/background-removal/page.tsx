import type { Metadata } from 'next';
import { BackgroundRemoval } from '@/components/BackgroundRemoval';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Background Removal',
  description:
    'Cut a subject free in your browser — a photo tool in SnapShark, next to the dive logbook and underwater colour fix.',
  keywords: [
    'background removal',
    'dive photos',
    'transparent background',
    'SnapShark',
  ],
  openGraph: {
    title: 'Background Removal | SnapShark',
    description:
      'Cut a subject free in your browser — a photo tool in SnapShark, next to the dive logbook and underwater colour fix.',
    type: 'website',
    url: 'https://www.snap-shark.com/background-removal',
  },
  alternates: {
    canonical: 'https://www.snap-shark.com/background-removal',
  },
};

export default function BackgroundRemovalPage() {
  return (
    <div className="mx-auto max-w-6xl py-6 sm:py-10">
      <PageHeader
        eyebrow="Photo tools"
        title="Background removal"
        description="Cut a subject free in your browser — useful when you need a clean PNG."
      />
      <BackgroundRemoval />
    </div>
  );
}
