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
import {
  HOME_DESCRIPTION,
  HOME_KEYWORDS,
  HOME_TITLE,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  webAppJsonLd,
  websiteJsonLd,
} from '@/lib/seo';
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
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: HOME_TITLE,
    template: '%s | SnapShark',
  },
  description: HOME_DESCRIPTION,
  keywords: [...HOME_KEYWORDS],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
  },
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
  viewportFit: 'cover' as const,
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
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([websiteJsonLd, webAppJsonLd]),
            }}
          />
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
            <div className="brand-shell min-h-screen overflow-x-clip">
              <Navigation />
              <GlobalGracePeriodAlert />

              <main className="container mx-auto min-w-0 max-w-full px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                {children}
              </main>

              <footer className="mt-8 border-t border-[rgb(126_200_192_/_0.14)] bg-[#02141a]">
                <div className="container mx-auto px-4 py-10">
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                      <div className="flex items-center gap-3">
                        <LogoIcon size="md" />
                        <span className="brand-display text-lg tracking-tight">
                          <span className="text-[#e8f4f1]">Snap</span>
                          <span className="text-[#7ec8c0]">Shark</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#7a9a95]">
                        <Link href="/logbook" className="hover:text-[#e8f4f1]">
                          Logbook
                        </Link>
                        <Link href="/underwater" className="hover:text-[#e8f4f1]">
                          Colour Fix
                        </Link>
                        <Link href="/examples" className="hover:text-[#e8f4f1]">
                          Examples
                        </Link>
                        <Link href="/about" className="hover:text-[#e8f4f1]">
                          About
                        </Link>
                      </div>
                    </div>

                    <div className="border-t border-[rgb(126_200_192_/_0.12)] pt-6">
                      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#7a9a95] sm:gap-6">
                          <Link
                            href="/legal/privacy"
                            className="hover:text-[#7ec8c0]"
                          >
                            Privacy Policy
                          </Link>
                          <Link
                            href="/legal/terms"
                            className="hover:text-[#7ec8c0]"
                          >
                            Terms of Service
                          </Link>
                          <Link
                            href="/legal/photo-credits"
                            className="hover:text-[#7ec8c0]"
                          >
                            Photo credits
                          </Link>
                          <Link href="/about" className="hover:text-[#7ec8c0]">
                            Contact
                          </Link>
                        </div>
                        <div className="text-sm text-[#5f7d78]">
                          © {new Date().getFullYear()} SnapShark. For divers
                          and snorkellers.
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
