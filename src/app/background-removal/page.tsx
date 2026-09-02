import type { Metadata } from 'next';
import { BackgroundRemoval } from '@/components/BackgroundRemoval';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Background Removal',
  description:
    'Remove backgrounds from images instantly with AI. Privacy-first processing in your browser.',
  keywords: [
    'background removal',
    'AI image editing',
    'remove background',
    'transparent background',
    'image cutout',
  ],
  openGraph: {
    title: 'Background Removal | SnapShark',
    description:
      'Remove backgrounds from images instantly with AI. Privacy-first processing in your browser.',
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
