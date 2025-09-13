import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Navigation } from '@/components/Navigation';
import { GlobalGracePeriodAlert } from '@/components/GlobalGracePeriodAlert';
import { LogoIcon } from '@/components/Logo';
import { ThemeProvider } from '@/components/theme-provider';
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
  icons: {
    icon: [
      { url: '/snapshark-icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/snapshark-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/snapshark-icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/snapshark-icon-256.png', sizes: '256x256', type: 'image/png' },
      { url: '/snapshark-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/snapshark-icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/snapshark-icon-256.png', sizes: '256x256', type: 'image/png' },
      { url: '/snapshark-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/snapshark-icon-32.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SnapShark',
    startupImage: '/snapshark-icon-512.png',
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
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Modern favicon configuration */}
          <link rel="icon" href="/favicon.ico" sizes="32x32" />
          <link
            rel="icon"
            href="/snapshark-icon-16.png"
            sizes="16x16"
            type="image/png"
          />
          <link
            rel="icon"
            href="/snapshark-icon-32.png"
            sizes="32x32"
            type="image/png"
          />
          <link rel="apple-touch-icon" href="/snapshark-icon-128.png" />

          {/* Modern mobile web app capability */}
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className={inter.className} suppressHydrationWarning={true}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange={false}
          >
            <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
              <Navigation />
              <GlobalGracePeriodAlert />

              <main className="container mx-auto px-4 py-6">{children}</main>

              <footer className="border-t border-blue-200/30 dark:border-blue-800/30 bg-blue-50/50 dark:bg-slate-800/50 mt-16">
                <div className="container mx-auto px-4 py-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <LogoIcon size="md" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        <span>Snap</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          Shark
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                      <span>🔒 100% Privacy - No uploads</span>
                      <span>🚀 Powered by your browser</span>
                      <span>⚡ Lightning fast</span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
