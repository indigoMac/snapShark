import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Examples & Tutorials - SnapShark',
  description:
    'Learn how to use SnapShark with step-by-step tutorials and real examples. See how to create logo packages, process underwater photos, and more.',
  keywords: [
    'snapshark examples',
    'image processing tutorials',
    'logo package tutorial',
    'underwater photo correction',
    'image resize guide',
  ],
  openGraph: {
    title: 'Examples & Tutorials - SnapShark',
    description:
      'Learn how to use SnapShark with step-by-step tutorials and real examples.',
    type: 'website',
    url: 'https://www.snap-shark.com/examples',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Examples & Tutorials - SnapShark',
    description:
      'Learn how to use SnapShark with step-by-step tutorials and real examples.',
  },
  alternates: {
    canonical: 'https://www.snap-shark.com/examples',
  },
};

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Examples & Tutorials
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Learn how to use SnapShark's tools with real examples and
            step-by-step guides
          </p>
        </div>

        <div className="grid gap-12">
          {/* Logo Package Tutorial */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-8">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                🌐 Web Developer Logo/Icon Package
              </h2>

              <div className="mb-6">
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  Turn any image into a complete web-ready logo or icon with all
                  the sizes you need for websites, PWAs, and mobile apps.
                </p>
              </div>

              {/* Step-by-step process */}
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    📥 Step 1: Start with any image
                  </h3>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <Image
                      src="/examples/logo-with-background.jpg"
                      alt="Logo with background - before processing"
                      width={300}
                      height={200}
                      className="w-full h-48 object-contain rounded"
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI-generated logo that needs background removal and web
                    formatting
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    ✂️ Step 2: Remove background (if needed)
                  </h3>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <Image
                      src="/examples/single-logo.png"
                      alt="Clean logo without background"
                      width={300}
                      height={200}
                      className="w-full h-48 object-contain rounded"
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Clean logo ready for web package generation
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    📦 Step 3: Generate logo package
                  </h3>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-700 rounded border-2 border-dashed border-slate-300 dark:border-slate-600 p-3 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          📤 Upload clean logo
                        </p>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-slate-500">↓</span>
                      </div>
                      <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        📦 Logo Package
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload the transparent logo and click "Logo Package" to
                    generate all 11 formats
                  </p>
                </div>
              </div>

              {/* What you get */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
                  📦 Complete package - 11 files in one click:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  {/* Favicons Column */}
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      🌐 Favicons
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
                        <span>favicon.ico (32×32)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
                        <span>favicon-16.png</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
                        <span>favicon-32.png</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
                        <span>favicon-48.png</span>
                      </div>
                    </div>
                  </div>

                  {/* App Icons Column */}
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      📱 App Icons
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded border border-blue-600"></div>
                        <span>apple-touch-icon-180.png</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded border border-blue-600"></div>
                        <span>icon-192.png (PWA)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded border border-blue-600"></div>
                        <span>icon-512.png (PWA)</span>
                      </div>
                    </div>
                  </div>

                  {/* Website Logos Column */}
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      🖼️ Website Logos
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-3 bg-blue-500 rounded border border-blue-600"></div>
                        <span>logo-200.png</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 bg-blue-500 rounded border border-blue-600"></div>
                        <span>logo-400.png</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-5 bg-blue-500 rounded border border-blue-600"></div>
                        <span>logo-800.png</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded border border-blue-600"></div>
                        <span>logo.svg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual Output Examples */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  📸 Real Output Examples
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Here's what the actual generated files look like:
                </p>

                {/* Favicons & Icons */}
                <div className="mb-8">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    🌐 Favicons & Icons (Square formats with transparent
                    padding)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2">
                        <img
                          src="/examples/logo-package-output/favicon-16_16x16.png"
                          alt="16x16 favicon"
                          className="mx-auto"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        favicon-16.png
                        <br />
                        16×16
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2">
                        <img
                          src="/examples/logo-package-output/favicon-32_32x32.png"
                          alt="32x32 favicon"
                          className="mx-auto"
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        favicon-32.png
                        <br />
                        32×32
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2">
                        <img
                          src="/examples/logo-package-output/icon-192_192x192.png"
                          alt="192x192 icon"
                          className="mx-auto w-8 h-8"
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        icon-192.png
                        <br />
                        192×192
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2">
                        <img
                          src="/examples/logo-package-output/apple-touch-icon-180_180x180.png"
                          alt="180x180 apple touch icon"
                          className="mx-auto w-8 h-8"
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        apple-touch-icon.png
                        <br />
                        180×180
                      </p>
                    </div>
                  </div>
                </div>

                {/* Website Logos */}
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    🖼️ Website Logos (Aspect ratio preserved)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2">
                        <img
                          src="/examples/logo-package-output/logo-200_200x266.png"
                          alt="Website logo 200px"
                          className="mx-auto h-16 w-auto"
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        logo-200.png
                        <br />
                        200×266
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2">
                        <img
                          src="/examples/logo-package-output/logo-400_400x531.png"
                          alt="Website logo 400px"
                          className="mx-auto h-16 w-auto"
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        logo-400.png
                        <br />
                        400×531
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2">
                        <img
                          src="/examples/logo-package-output/logo-800_800x1062.png"
                          alt="Website logo 800px"
                          className="mx-auto h-16 w-auto"
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        logo-800.png
                        <br />
                        800×1062
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2">
                        <img
                          src="/examples/logo-package-output/logo_800x1062.svg"
                          alt="Scalable SVG logo"
                          className="mx-auto h-16 w-auto"
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        logo.svg
                        <br />
                        800×1062
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 p-6">
                <a
                  href="/"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Try Logo Package
                </a>
                <a
                  href="/background-removal"
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Remove Background First
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Print Package Tutorial */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-8">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                🖨️ Professional Print Package
              </h2>

              <div className="mb-6">
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  Automatically generate 7-10+ print-ready sizes from any photo
                  with professional 300 PPI resolution and intelligent
                  upscaling.
                </p>
              </div>

              {/* Before/After Demonstration */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    📥 Input: Any Image (Any Size)
                  </h3>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <Image
                      src="/examples/artwork-landscape.png"
                      alt="Landscape artwork before print package processing"
                      width={400}
                      height={300}
                      className="w-full h-48 object-contain rounded"
                    />
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg text-sm">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      <strong>Example Input:</strong> Landscape artwork at web
                      resolution
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    📦 Output: Complete Print Collection
                  </h3>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-slate-700 rounded p-2 text-center">
                        <div className="w-full h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded mb-1"></div>
                        <span className="text-xs">4×6" Print</span>
                      </div>
                      <div className="bg-white dark:bg-slate-700 rounded p-2 text-center">
                        <div className="w-full h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded mb-1"></div>
                        <span className="text-xs">8×10" Print</span>
                      </div>
                      <div className="bg-white dark:bg-slate-700 rounded p-2 text-center">
                        <div className="w-full h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded mb-1"></div>
                        <span className="text-xs">11×14" Print</span>
                      </div>
                      <div className="bg-white dark:bg-slate-700 rounded p-2 text-center">
                        <div className="w-full h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded mb-1"></div>
                        <span className="text-xs">16×20" Print</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-sm">
                    <p className="text-green-800 dark:text-green-200">
                      <strong>Smart Output:</strong> 7+ sizes at 300 PPI,
                      perfectly sized for printing
                    </p>
                  </div>
                </div>
              </div>

              {/* What Makes It Special */}
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4">
                  🎯 AI-Powered Smart Sizing
                </h3>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                      🔍 Aspect Ratio Detection
                    </h4>
                    <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded"></div>
                        <span>Square (1:1) → 4×4" to 24×24"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-4 bg-purple-500 rounded"></div>
                        <span>Portrait (3:4) → 6×8" to 18×24"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-3 bg-purple-500 rounded"></div>
                        <span>Landscape (3:2) → 6×4" to 30×20"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-3 bg-purple-500 rounded"></div>
                        <span>Wide (16:9) → 8×4.5" to 32×18"</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                      ⚡ Advanced Upscaling
                    </h4>
                    <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                      <div>
                        • <strong>Bicubic interpolation</strong> for smooth
                        scaling
                      </div>
                      <div>
                        • <strong>Edge enhancement</strong> to preserve details
                      </div>
                      <div>
                        • <strong>Quality preservation</strong> during size
                        changes
                      </div>
                      <div>
                        • <strong>300 PPI injection</strong> for professional
                        printing
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                      📐 Perfect Print Dimensions
                    </h4>
                    <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                      <div>
                        • <strong>Standard sizes:</strong> 4×6", 5×7", 8×10"
                      </div>
                      <div>
                        • <strong>Large format:</strong> 11×14", 16×20", 20×30"
                      </div>
                      <div>
                        • <strong>Poster sizes:</strong> 24×36", 30×40"
                      </div>
                      <div>
                        • <strong>International:</strong> A4, A3 standards
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-purple-900/50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
                    📊 Try Our Sample Images - See Both Aspect Ratios:
                  </h4>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                        🖼️ Landscape Artwork (3:2 ratio):
                      </h5>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                          <div className="font-medium">
                            landscape-6x4.jpg → 1800×1200px @ 300 PPI
                          </div>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                          <div className="font-medium">
                            landscape-12x8.jpg → 3600×2400px @ 300 PPI
                          </div>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                          <div className="font-medium">
                            landscape-18x12.jpg → 5400×3600px @ 300 PPI
                          </div>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                          <div className="font-medium">
                            + 4 more sizes up to 30×20"
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                        📐 Portrait Artwork (3:4 ratio):
                      </h5>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                          <div className="font-medium">
                            portrait-6x8.jpg → 1800×2400px @ 300 PPI
                          </div>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                          <div className="font-medium">
                            portrait-9x12.jpg → 2700×3600px @ 300 PPI
                          </div>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                          <div className="font-medium">
                            portrait-12x16.jpg → 3600×4800px @ 300 PPI
                          </div>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-800/50 p-2 rounded">
                          <div className="font-medium">
                            + 4 more sizes up to 18×24"
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded p-2">
                    💡 Download our sample artworks below to test both aspect
                    ratios!
                  </div>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4">
                  💰 Replaces Expensive Software
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                      This Feature Normally Costs:
                    </h4>
                    <ul className="space-y-1 text-sm text-purple-700 dark:text-purple-300">
                      <li>• Adobe Photoshop: $20.99/month</li>
                      <li>• Canva Pro: $12.99/month</li>
                      <li>• PrintShop: $49.99 one-time</li>
                      <li>• Professional design services: $50-200 per batch</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                      SnapShark Pro:
                    </h4>
                    <div className="bg-white dark:bg-purple-900/50 rounded p-3">
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        £3/month
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-300">
                        + All other pro features
                        <br />
                        + Unlimited print packages
                        <br />+ No per-use charges
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Try Print Package
                </a>
                <a
                  href="/pricing"
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Get Pro Access
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Underwater Photo Correction */}
          <Card className="border-cyan-200 dark:border-cyan-800">
            <CardContent className="p-8">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                🌊 Underwater Photo Correction
              </h2>

              <div className="mb-6">
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  Fix the green/blue tint in underwater photos and restore
                  natural colors - no watermarks, completely free.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    🟢 Before: Green/Blue Tinted
                  </h3>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <Image
                      src="/examples/underwater-before.jpeg"
                      alt="Underwater photo with green tint before correction"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover rounded"
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Typical underwater photo with blue/green color cast
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    ✨ After: Color Corrected
                  </h3>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <Image
                      src="/examples/underwater-after.jpg"
                      alt="Underwater photo with green tint before correction"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover rounded"
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Natural colors with improved contrast and clarity
                  </p>
                </div>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-950/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-cyan-900 dark:text-cyan-100 mb-4">
                  🎯 How it works:
                </h3>
                <ul className="space-y-2 text-cyan-800 dark:text-cyan-200">
                  <li>
                    • <strong>Upload your underwater photo</strong> - any format
                    works
                  </li>
                  <li>
                    • <strong>Adjust intensity slider</strong> - see real-time
                    preview
                  </li>
                  <li>
                    • <strong>Download corrected image</strong> - no watermarks
                    ever
                  </li>
                  <li>
                    • <strong>Free alternative</strong> to expensive underwater
                    software
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/underwater"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Try Underwater Correction
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Basic Image Processing */}
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-8">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                ⚡ Quick Image Processing
              </h2>

              <div className="mb-6">
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  Resize, convert formats, adjust quality, and more - all the
                  everyday tasks without opening heavyweight software.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-6 mb-4">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      📏 Resize & Scale
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Set exact dimensions or scale by percentage. Lock aspect
                      ratio or free resize.
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-6 mb-4">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      🔄 Format Convert
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Convert between JPEG, PNG, WebP, AVIF. Adjust quality and
                      compression.
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-6 mb-4">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      🎨 Optimize
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Set PPI for printing, strip metadata, high-quality
                      upscaling.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
                  🚀 Common use cases:
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800 dark:text-green-200">
                  <ul className="space-y-1">
                    <li>• Resize for social media posts</li>
                    <li>• Convert HEIC to JPEG</li>
                    <li>• Compress images for web</li>
                    <li>• Create thumbnails</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>• Set 300 PPI for printing</li>
                    <li>• Strip EXIF data for privacy</li>
                    <li>• Upscale small images</li>
                    <li>• Quick format changes</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Try Image Processing
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Sample Images Download */}
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-8">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                📸 Try With Sample Images
              </h2>

              <div className="mb-6">
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  Don't have images handy? Download our sample images to test
                  all the features.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 border">
                    <Image
                      src="/examples/artwork-landscape.png"
                      alt="Landscape artwork sample"
                      width={200}
                      height={150}
                      className="w-full h-32 object-contain rounded"
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Landscape Artwork
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Perfect for testing print package generation (landscape
                    sizes)
                  </p>
                  <a
                    href="/examples/artwork-landscape.png"
                    download
                    className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Download Sample
                  </a>
                </div>

                <div className="text-center">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 border">
                    <Image
                      src="/examples/artwork-portrait.png"
                      alt="Portrait artwork sample"
                      width={200}
                      height={150}
                      className="w-full h-32 object-contain rounded"
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Portrait Artwork
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Ideal for testing print package generation (portrait sizes)
                  </p>
                  <a
                    href="/examples/artwork-portrait.png"
                    download
                    className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Download Sample
                  </a>
                </div>

                <div className="text-center">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 border">
                    <Image
                      src="/examples/logo-with-background.png"
                      alt="Sample logo with background"
                      width={200}
                      height={150}
                      className="w-full h-32 object-contain rounded"
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Logo Sample
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Perfect for testing background removal and logo packages
                  </p>
                  <a
                    href="/examples/logo-with-background.png"
                    download
                    className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Download Sample
                  </a>
                </div>

                <div className="text-center">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 border">
                    <Image
                      src="/examples/sample-photo.jpg"
                      alt="Sample photography"
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Photography Sample
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Real photograph perfect for general image processing and
                    resizing
                  </p>
                  <a
                    href="/examples/sample-photo.jpg"
                    download
                    className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Download Sample
                  </a>
                </div>

                <div className="text-center">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 border">
                    <Image
                      src="/examples/underwater-before.jpeg"
                      alt="Sample underwater photo"
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Underwater Photo
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Test underwater color correction with this green-tinted
                    photo
                  </p>
                  <a
                    href="/examples/underwater-before.jpeg"
                    download
                    className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Download Sample
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center py-8">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Ready to try SnapShark?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Start with free tools or upgrade to Pro for advanced features and
              professional packages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Processing Images
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
