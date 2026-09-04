import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dive logbook',
  description:
    'Map dive sites, attach photos, and send a trip link. Depth and time are optional.',
  alternates: {
    canonical: '/logbook',
  },
};

export default function LogbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
