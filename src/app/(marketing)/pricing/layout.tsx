import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'SnapShark is free to start for divers. Pro unlocks extra photo tools when you need them.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
