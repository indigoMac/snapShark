import type { Metadata } from 'next';
import { AboutTabbed } from '@/components/AboutTabbed';
import { PageHeader } from '@/components/PageHeader';

const description =
  'SnapShark is a dive logbook and underwater photo toolkit: map the places you have dived, record the details that matter, and correct dive photos in your browser.';

export const metadata: Metadata = {
  title: 'About',
  description,
  keywords: [
    'about snapshark',
    'dive logbook',
    'scuba diving log',
    'underwater photo correction',
    'privacy-first',
  ],
  openGraph: {
    title: 'About SnapShark',
    description,
    type: 'website',
    url: 'https://www.snap-shark.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About SnapShark',
    description,
  },
  alternates: {
    canonical: 'https://www.snap-shark.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-10">
      <PageHeader
        eyebrow="About"
        title={
          <>
            Snap<span className="text-[#7ec8c0]">Shark</span>
          </>
        }
        description="A dive logbook worth revisiting, and photo tools that run in your browser."
      />
      <AboutTabbed />
    </div>
  );
}
