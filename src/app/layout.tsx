import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Navigation } from '@/components/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SnapShark - Privacy-First Image Converter',
  description:
    'Convert and resize images directly in your browser. No uploads, complete privacy.',
  keywords: [
    'image converter',
    'image resizer',
    'privacy',
    'client-side',
    'webp',
    'avif',
  ],
  authors: [{ name: 'SnapShark' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SnapShark',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-background">
            <Navigation />

            <main className="container mx-auto px-4 py-8">{children}</main>

            <footer className="border-t bg-muted/50 mt-16">
              <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        S
                      </span>
                    </div>
                    <span className="font-medium">SnapShark</span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>🔒 100% Privacy - No uploads</span>
                    <span>🚀 Powered by your browser</span>
                    <span>⚡ Lightning fast</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
