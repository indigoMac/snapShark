import type { Metadata } from 'next';
import ConvertClient from './ConvertClient';

export const metadata: Metadata = {
  title: 'Photo tools',
  description:
    'Convert and resize photos in your browser — a secondary toolkit alongside the SnapShark dive logbook.',
  alternates: {
    canonical: '/convert',
  },
};

export default function ConvertPage() {
  return <ConvertClient />;
}
