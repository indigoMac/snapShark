import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About SnapShark - Professional Image Processing',
  description:
    'Learn about SnapShark, a privacy-first image processing tool built by developers for developers, designers, and professionals.',
  keywords: [
    'about snapshark',
    'image processing',
    'developer',
    'privacy-first',
    'client-side processing',
  ],
  openGraph: {
    title: 'About SnapShark - Professional Image Processing',
    description:
      'Learn about SnapShark, a privacy-first image processing tool built by developers for developers, designers, and professionals.',
    type: 'website',
    url: 'https://www.snap-shark.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About SnapShark - Professional Image Processing',
    description:
      'Learn about SnapShark, a privacy-first image processing tool built by developers for developers, designers, and professionals.',
  },
  alternates: {
    canonical: 'https://www.snap-shark.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            About{' '}
            <span className="text-slate-900 dark:text-slate-100">Snap</span>
            <span className="text-blue-600 dark:text-blue-400">Shark</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Simple tools for everyday image tasks - no heavyweight software
            required
          </p>
        </div>

        <div className="grid gap-8 md:gap-12">
          {/* Mission Statement */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                🎯 Why{' '}
                <span className="text-slate-900 dark:text-slate-100">Snap</span>
                <span className="text-blue-600 dark:text-blue-400">
                  Shark
                </span>{' '}
                Exists
              </h2>
              <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                SnapShark was born from everyday frustrations. Why should simple
                image tasks require opening heavyweight software like Photoshop
                or GIMP? Why isn't there an easy way to get all the logo sizes
                you need for a website? Why do underwater photo tools cost money
                or add watermarks? We believe common image tasks should be
                simple, fast, and accessible to everyone.
              </p>
            </CardContent>
          </Card>

          {/* Where We're At */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                🚧 Where We're At
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p className="text-lg leading-relaxed">
                  SnapShark is brand new — and we're still adding features. So
                  far, it can handle conversions, resizing, upscaling, color
                  correction, compression, and metadata stripping. But this is
                  just the beginning.
                </p>
                <p className="text-lg leading-relaxed">
                  Current tools include smart print packages that automatically
                  generate all the sizes you need, AI-powered background removal
                  for perfect logos, and underwater photo correction that
                  actually works. Everything processes directly in your browser
                  for privacy and speed.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    What's Working Right Now:
                  </p>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                    <li>
                      • Multi-format conversion (JPG, PNG, WebP, AVIF, HEIC)
                    </li>
                    <li>• Smart resizing with aspect ratio control</li>
                    <li>• AI background removal for clean logos</li>
                    <li>• Underwater color correction without watermarks</li>
                    <li>
                      • Auto-generated print packages (7-10+ sizes at 300 PPI)
                    </li>
                    <li>• Batch processing up to 50 images</li>
                    <li>• Mobile-optimized with direct camera roll saving</li>
                  </ul>
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-slate-200 mb-2 text-sm">
                    💰 About Pro vs Free:
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    All core features are available to everyone! Pro mainly adds
                    <strong> convenience</strong> — you can create print
                    packages, logo sets, and process multiple images using free
                    presets, but you'd need to do them one at a time. Pro lets
                    you generate entire packages instantly and process up to 50
                    images in batches.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Shape the Future */}
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                🚀 Help Shape the Future
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p className="text-lg leading-relaxed">
                  We'd love your feedback as one of our first testers. Try it
                  out, see what works (or doesn't), and let us know what you
                  think.
                </p>
                <div className="bg-green-50 dark:bg-green-950/30 p-6 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <p className="font-medium text-green-900 dark:text-green-200 mb-4">
                      Your input directly shapes what we build next!
                    </p>
                    <a
                      href="https://forms.gle/2W6yWzWV1T3nY4WU7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Take the Feedback Survey
                      <span className="ml-2">→</span>
                    </a>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      Takes less than 1 minute
                    </p>
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                      <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                        Prefer email? Send your thoughts to:
                      </p>
                      <a
                        href="mailto:snapshark2025@gmail.com"
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                      >
                        snapshark2025@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About the Developer */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                👨‍💻 My Story
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p className="text-lg leading-relaxed">
                  Hi! I'm a solo web developer with a couple of years of
                  professional experience, and SnapShark came from my own daily
                  frustrations.
                </p>
                <p className="text-lg leading-relaxed">
                  As a web developer, I constantly needed different logo sizes
                  for projects. AI would generate logos with backgrounds that
                  needed removing. When I wanted to sell my artwork as prints on
                  Etsy, getting all the different sizes at the right PPI and
                  quality was annoyingly tedious - especially with no batch
                  processing options.
                </p>
                <p className="text-lg leading-relaxed">
                  The existing solutions felt like overkill: Photoshop, GIMP, or
                  Photopea have learning curves for simple tasks. For underwater
                  photos, the good tools cost money or add watermarks. I wanted
                  something simple that just worked.
                </p>
                <p className="text-lg leading-relaxed">
                  So I built SnapShark - a collection of focused tools that
                  solve these everyday problems quickly and efficiently,
                  designed for developers, designers, entrepreneurs, and anyone
                  who regularly works with images.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Why SnapShark */}
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
                🚀 What Makes{' '}
                <span className="text-slate-900 dark:text-slate-100">Snap</span>
                <span className="text-blue-600 dark:text-blue-400">
                  Shark
                </span>{' '}
                Different
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">🎯</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        Solves Real Problems
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Built for actual daily tasks developers, designers, and
                        creators face.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 text-xl">⚡</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        Simple & Fast
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        No learning curve. Just upload, process, download. Works
                        instantly in your browser.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-500 text-xl">📦</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        Batch Processing
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Generate entire logo packages, print sets, or
                        marketplace images at once.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-500 text-xl">🎨</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        Professional Quality
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Proper PPI settings, high-quality algorithms, formats
                        that actually work.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-red-500 text-xl">🌊</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        Specialized Tools
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Underwater correction without watermarks, AI background
                        removal for logos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-indigo-500 text-xl">💰</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        Fair Pricing
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Free for basic use, £3/month for Pro. No hidden costs or
                        watermarks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                🛠️ How It Works
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p className="text-lg leading-relaxed">
                  SnapShark is built with modern web technologies including
                  Next.js, TypeScript, and advanced Canvas APIs. All processing
                  happens directly in your browser using Web Workers, so it's
                  fast and your images stay on your device. As a bonus, this
                  means your images never get uploaded anywhere - they're
                  processed locally.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium text-slate-900 dark:text-white mb-2">
                    Built for Developers & Creators:
                  </p>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>
                      • All processing happens in your browser (no waiting for
                      uploads)
                    </li>
                    <li>
                      • Professional algorithms and proper format handling
                    </li>
                    <li>• Batch processing for efficiency</li>
                    <li>• Real-world formats and sizes people actually need</li>
                    <li>• Growing tool collection based on user feedback</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Feedback */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                📧 Contact & Feedback
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p className="text-lg leading-relaxed">
                  I'm always looking to improve SnapShark based on real user
                  needs. I have plans for new tools and improvements to current
                  ones. But if you have feedback, feature requests, or just want
                  to say hi, I'd love to hear from you!
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                  <p className="font-medium text-amber-900 dark:text-amber-200 mb-2">
                    Get in touch:
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-amber-800 dark:text-amber-300">
                      • Use the feedback form on any page
                    </p>
                    <p className="text-amber-800 dark:text-amber-300">
                      • Report issues or suggest features
                    </p>
                    <p className="text-amber-800 dark:text-amber-300">
                      • Share your use cases and workflows
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center py-8">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Ready to process some images?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Start with our free tools or upgrade to Pro for advanced features
              and professional packages.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700 mb-6">
              <p className="text-blue-900 dark:text-blue-200 font-medium mb-2">
                🎯 Early Bird Special: Try Pro Free for a Month!
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Use promo code at checkout to unlock all Pro features:
              </p>
              <div className="bg-blue-100 dark:bg-blue-900/50 px-3 py-2 rounded font-mono text-blue-800 dark:text-blue-200 inline-block">
                EARLYSHARK
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Try Free Tools
              </a>
              <a
                href="/pricing"
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                View Pro Features
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
