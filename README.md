# SnapShark - Professional Image Processing Suite

A privacy-first, AI-powered image processing platform built with Next.js. Convert formats, remove backgrounds, fix underwater photos, create print packages, and more - all while keeping your images secure on your device.

**Live Demo**: [snap-shark.com](https://snap-shark.com)

## Features

### Core Image Processing

- **Multi-format support**: JPG, PNG, WebP, HEIC/HEIF input; JPG, PNG, WebP, AVIF output
- **Smart resizing**: By dimensions, scale percentage, or intelligent presets
- **Quality optimization**: Lossy format quality control with real-time preview
- **Batch processing**: Process up to 50 images simultaneously (Pro)
- **Print packages**: Auto-generate 7-10+ print sizes with 300 PPI optimization

### Specialized Tools

- **AI Background Removal**: Professional-grade subject isolation with MediaPipe
- **Underwater Color Correction**: Fix green/blue tints in underwater photography
- **Smart Print Packages**: Automatic aspect ratio detection and optimal print sizing
- **Logo Package Generator**: Complete favicon and icon sets for websites/apps

### Advanced Features

- **Client-side processing**: 100% private - images never leave your device
- **Web Workers**: Non-blocking UI with background processing
- **Progressive enhancement**: Mobile-optimized with hybrid processing
- **Real-time preview**: See changes instantly as you adjust settings
- **Custom presets**: Save and reuse your favorite processing settings

### Pro Features (£3/month)

- **Batch processing**: Up to 50 images at once
- **Advanced formats**: AVIF output, enhanced processing options
- **Premium presets**: Professional templates for common use cases
- **Print optimization**: Auto-upscaling and 300 PPI conversion
- **Priority processing**: Faster rendering and enhanced algorithms
- **ZIP downloads**: Convenient batch downloads

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Image Processing**: HTML Canvas + Pica (WASM) + MediaPipe AI
- **Background Processing**: Web Workers for CPU-intensive operations
- **Authentication**: Clerk with secure user management
- **Payments**: Stripe with webhook automation
- **AI/ML**: MediaPipe for background removal, custom algorithms for color correction
- **Testing**: Vitest + Playwright E2E testing
- **Deployment**: Vercel with serverless functions
- **Mobile Optimization**: Responsive design with progressive enhancement

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/snapshark.git
cd snapshark

# Install dependencies
npm install

# Set up environment variables (optional for core features)
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

SnapShark works out of the box without any environment variables for core image processing. For full functionality:

```env
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Payments (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Navigation & Pages

### Main Tools

- **/** - Main image processor with smart presets and batch processing
- **/background-removal** - AI-powered background removal tool
- **/underwater** - Underwater photo color correction
- **/examples** - Interactive tutorials and example outputs

### User Features

- **/account** - User dashboard and subscription management
- **/pricing** - Pro plan details and subscription
- **/about** - Project information and contact

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (marketing)/              # Marketing pages
│   ├── api/                      # Serverless API routes
│   │   ├── stripe/               # Payment webhooks
│   │   └── debug/                # Development utilities
│   ├── background-removal/       # AI background removal tool
│   ├── underwater/               # Underwater color correction
│   ├── examples/                 # Interactive tutorials
│   ├── account/                  # User dashboard
│   └── page.tsx                  # Main image processor
├── components/                    # React components
│   ├── ui/                       # shadcn/ui base components
│   ├── BackgroundRemoval.tsx     # AI background removal
│   ├── Dropzone.tsx             # File upload with validation
│   ├── SettingsPanel.tsx        # Processing configuration
│   ├── Navigation.tsx           # Responsive navigation
│   └── ...
├── hooks/                        # Custom React hooks
│   ├── useImageProcessor.ts     # Main processing logic
│   ├── usePaywall.ts           # Pro feature access
│   └── usePresets.ts           # Preset management
├── lib/                         # Utility libraries
│   ├── canvas.ts               # Canvas operations
│   ├── formats.ts              # Image format definitions
│   ├── background-removal.ts   # AI processing utilities
│   ├── vtracer.ts             # SVG vectorization
│   └── ...
└── workers/                    # Web Workers
    └── imageWorker.ts         # Background image processing
```

## Key Features Deep Dive

### Smart Image Processing

- **Format Intelligence**: Automatic format recommendations based on image content
- **Quality Optimization**: Real-time quality preview with size estimates
- **Preset System**: Built-in presets for social media, print, web, and mobile
- **Batch Optimization**: Intelligent processing order and progress tracking

### AI Background Removal

- **MediaPipe Integration**: Google's production-grade segmentation model
- **Edge Detection**: Precise subject isolation with smooth edges
- **Transparent Output**: Perfect PNG transparency for logos and portraits
- **Fallback System**: Graceful degradation if AI processing fails

### Underwater Color Correction

- **Advanced Algorithm**: Custom color matrix transformation
- **Histogram Analysis**: Intelligent red channel restoration
- **Real-time Adjustment**: Live preview with intensity slider
- **Mobile Optimized**: Debounced processing for smooth mobile experience

### Print Package Generation

- **Aspect Ratio Detection**: Automatic landscape/portrait optimization
- **Smart Sizing**: Generates 7-10+ optimal print sizes (4"×6" to 24"×30")
- **300 PPI Standard**: Professional print resolution with upscaling
- **ZIP Download**: Convenient batch download of all sizes

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run e2e

# Run all tests in CI mode
npm run test:ci
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in the Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run start
```

## Privacy & Security

- **Client-side Processing**: Images never leave your browser
- **Zero-Knowledge Architecture**: No server-side image storage
- **Mobile Optimized**: Secure processing on all devices
- **GDPR Compliant**: Minimal data collection, user consent
- **No Tracking**: Privacy-first analytics approach

## Performance Optimizations

- **Web Workers**: Non-blocking UI during processing
- **Progressive Enhancement**: Mobile-first with desktop optimization
- **Lazy Loading**: Efficient image and component loading
- **Responsive Images**: Next.js Image optimization
- **Smart Caching**: Efficient browser storage usage

## Current Status

**PRODUCTION READY** - Fully deployed and operational

### Completed Features

- Core image processing with all formats
- AI background removal with MediaPipe
- Underwater color correction
- Print package generation with auto-sizing
- User authentication and Pro subscriptions
- Stripe payment integration with webhooks
- Mobile-optimized responsive design
- Comprehensive testing suite
- Production deployment on Vercel

### Recent Updates

- Enhanced mobile responsiveness for all tools
- Performance optimizations for underwater processing
- SVG optimization (92% file size reduction)
- Improved navigation with Tools dropdown
- Examples page with interactive tutorials

## Upcoming Features

### Short Term

- Server-side processing for better mobile performance
- Enhanced preset management system
- Advanced batch processing templates
- Additional AI-powered tools

### Medium Term

- Desktop app (Tauri-based)
- Advanced AI upscaling (ESRGAN)
- Team collaboration features
- API for developers

### Long Term

- Enterprise white-labeling
- Advanced AI features (object removal, style transfer)
- Mobile app (React Native)
- Advanced analytics dashboard

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Email**: [your-email@domain.com]
- **Issues**: [GitHub Issues](https://github.com/your-username/snapshark/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/snapshark/discussions)

---

**Built with care for privacy-conscious users who demand professional-grade image processing without compromising their data security.**

Made by [Your Name] | [Website](https://yourwebsite.com) | [Twitter](https://twitter.com/yourusername)
