import type { Metadata } from 'next';
import ConvertClient from './ConvertClient';

export const metadata: Metadata = {
  title: 'Image Processor',
  description:
    'Convert and resize images directly in your browser. No uploads, complete privacy.',
};

export default function ConvertPage() {
  return <ConvertClient />;
}
