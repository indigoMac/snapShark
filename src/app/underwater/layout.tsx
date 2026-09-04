import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Underwater colour fix',
  description:
    'Restore reds and correct the blue-green cast on dive photos in your browser. No upload required.',
  alternates: {
    canonical: '/underwater',
  },
};

export default function UnderwaterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
