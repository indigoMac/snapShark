# SnapShark - Privacy-First Image Converter

A modern, client-side image converter and resizer built with Next.js. Convert between formats, resize images, and process batches - all without uploading your files to any server.

## 🚀 Features

### Free Tier

- ✅ Single image processing
- ✅ Basic formats (JPG, PNG, WebP)
- ✅ Resize by dimensions or scale percentage
- ✅ Quality control for lossy formats
- ✅ 100% privacy (no uploads)
- ✅ PWA installable
- ✅ One-time trial (3 files batch)

### Pro Tier (£3/month or £15/year)

- ✅ Batch process up to 50 images
- ✅ Professional presets & templates
- ✅ Advanced formats (AVIF output, HEIC/HEIF input)
- ✅ ZIP download for batches
- ✅ Metadata stripping for privacy
- ✅ Custom preset saving
- ✅ Priority support

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React hooks
- **Image Processing**: HTML Canvas + Pica (WASM)
- **Workers**: Web Workers for CPU-heavy operations
- **Authentication**: Clerk (TODO)
- **Payments**: Stripe (TODO)
- **PWA**: next-pwa (TODO)
- **Testing**: Playwright + Vitest
- **Deployment**: Vercel

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser with Web Workers support

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd snapshark
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your keys (optional for basic functionality)
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run e2e
npm run test:setup  # First time only
```

## 🔧 Environment Variables

Create a `.env.local` file for local development:

```env
# Clerk Authentication (Optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe (Optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_HEIC=true
NEXT_PUBLIC_ENABLE_AVIF=true
NEXT_PUBLIC_ENABLE_PICA=true
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (marketing)/        # Marketing pages (pricing)
│   ├── account/           # Account management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home converter page
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── Dropzone.tsx      # File upload component
│   ├── SettingsPanel.tsx # Image processing settings
│   ├── PreviewGrid.tsx   # Results display
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useImageProcessor.ts
│   ├── usePresets.ts
│   └── usePaywall.ts
├── lib/                  # Utility libraries
│   ├── canvas.ts         # Canvas operations
│   ├── formats.ts        # Format definitions
│   ├── presets.ts        # Built-in presets
│   └── ...
└── workers/              # Web Workers
    └── imageWorker.ts    # Image processing worker
```

## 🎨 Key Components

### Image Processing Pipeline

1. **File Upload**: Drag & drop with format validation
2. **Settings**: Format, quality, dimensions, presets
3. **Web Worker**: CPU-intensive processing in background
4. **Download**: Individual files or ZIP batches

### Privacy Features

- No server uploads - all processing is client-side
- Web Workers prevent UI blocking
- Local storage for settings and presets
- Optional metadata stripping

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run start
```

## 🔒 Security & Privacy

- **Client-side only**: No image data leaves your browser
- **No tracking**: Minimal analytics, privacy-focused
- **GDPR compliant**: Only billing data stored server-side
- **Local storage**: Settings saved in browser only

## 🛣️ Roadmap

### Phase 1 (Current)

- [x] Basic image conversion and resizing
- [x] Web Worker integration
- [x] Freemium paywall system
- [ ] Auth integration (Clerk)
- [ ] Payment integration (Stripe)
- [ ] PWA configuration

### Phase 2

- [ ] HEIC/HEIF WASM decoder
- [ ] Advanced AVIF support
- [ ] AI upscaling (WASM ESRGAN)
- [ ] Cloud preset sync

### Phase 3

- [ ] Team collaboration features
- [ ] API for developers
- [ ] Desktop app (Tauri)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@snapshark.app
- 💬 Discord: [Join our community](https://discord.gg/snapshark)
- 📖 Docs: [docs.snapshark.app](https://docs.snapshark.app)

---

Built with ❤️ for privacy-conscious users who want powerful image processing without compromising their data.

# snapShark
