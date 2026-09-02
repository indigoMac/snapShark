import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Fraunces, Manrope } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { GlobalGracePeriodAlert } from '@/components/GlobalGracePeriodAlert';
import { LogoIcon } from '@/components/Logo';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorTrackingProvider } from '@/components/ErrorTrackingProvider';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const appFont = localFont({
  src: '../../public/fonts/Inter-Regular.woff2',
  variable: '--font-app',
  weight: '400',
  display: 'swap',
});

const landingDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-landing-display',
  display: 'swap',
});

const landingBody = Manrope({
  subsets: ['latin'],
  variable: '--font-landing-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SnapShark — Dive logbook & underwater photo tools',
    template: '%s | SnapShark',
  },
  description:
    'A dive logbook worth revisiting, and underwater colour correction that runs in your browser. Built for divers and snorkellers.',
  keywords: [
    'dive logbook',
    'scuba diving log',
    'snorkeling log',
    'underwater photo correction',
    'dive photos',
    'SnapShark',
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
    statusBarStyle: 'black-translucent',
    title: 'SnapShark',
    startupImage: '/snapshark-icon-512.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#031820',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
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
        <body
          className={`${appFont.className} ${landingDisplay.variable} ${landingBody.variable}`}
          suppressHydrationWarning={true}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ErrorTrackingProvider />
            <div className="min-h-screen bg-slate-900">
              <Navigation />
              <GlobalGracePeriodAlert />

              <main className="container mx-auto px-4 py-6">{children}</main>

              <footer className="border-t border-blue-800/30 bg-slate-800/50 mt-8">
                <div className="container mx-auto px-4 py-8">
                  <div className="flex flex-col gap-6">
                    {/* Main footer content */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <LogoIcon size="md" />
                        <span className="font-medium text-slate-200">
                          <span>Snap</span>
                          <span className="text-blue-400">Shark</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
                        <span>Dive logbook</span>
                        <span>Underwater colour fix</span>
                        <span>Photo tools in your browser</span>
                      </div>
                    </div>

                    {/* Legal links and copyright */}
                    <div className="border-t border-blue-800/30 pt-4">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-400">
                          <Link
                            href="/legal/privacy"
                            className="hover:text-blue-400 transition-colors"
                          >
                            Privacy Policy
                          </Link>
                          <Link
                            href="/legal/terms"
                            className="hover:text-blue-400 transition-colors"
                          >
                            Terms of Service
                          </Link>
                          <Link
                            href="/about"
                            className="hover:text-blue-400 transition-colors"
                          >
                            Contact
                          </Link>
                        </div>
                        <div className="text-sm text-slate-400">
                          © {new Date().getFullYear()} SnapShark. For divers.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
