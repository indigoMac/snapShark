import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dive logbook',
  description:
    'Map dive sites, group trips, and keep depth, time, buddy, notes, and photos together in one logbook.',
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
