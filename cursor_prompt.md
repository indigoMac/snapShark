# Cursor Prompt — Image Converter & Resizer (Freemium, Client-Side)

## Goal

Build a **privacy-first, client-side** image converter/resizer web app with a **freemium** model. Users can drag & drop images, convert between formats, resize by width/height or scale %, and download results. All core processing should happen **locally in the browser** (no uploads). Paid tier unlocks batch tools, presets, and advanced formats.

## Tech Stack (use these unless technically infeasible)

- **Framework:** Next.js (App Router, TypeScript)
- **Styling/UI:** Tailwind CSS + shadcn/ui + lucide-react
- **State/Utils:** React hooks, Zustand or simple Context where helpful
- **Build/Deploy:** Vercel
- **Payments/Auth (Pro):** Stripe Checkout + Stripe Customer Portal, auth via Clerk (or Supabase Auth if simpler). Start with Clerk.
- **PWA:** `next-pwa` or the official Next.js PWA plugin; offline & installable
- **Image Processing (client-side):**
  - HTML Canvas + `toBlob` for `image/jpeg`, `image/png`, `image/webp`, `image/avif` (feature-detect avif and gracefully fallback to webp/jpeg)
  - **High-quality resize:** `pica` (WASM/worker-capable) for better downscaling
  - **HEIC/HEIF (input) in non-Safari browsers:** lazy-load `libheif-js` (WASM) or `heic-decode` equivalent
- **Workers:** Web Worker for CPU-heavy image operations; consider OffscreenCanvas
- **Storage:** LocalStorage/IndexedDB for user presets, recent settings
- **Testing:** Playwright (e2e) + Vitest (unit)
- **Analytics:** lightweight (e.g., Vercel Analytics or Umami)

## Key Principles

- **Zero-upload privacy:** do not send image data to the server.
- **Speed & simplicity:** drag › tweak › download, with minimal clicks.
- **Feature detection & graceful fallback:** AVIF/HEIC support depends on browser; fall back automatically.
- **Freemium:** useful free tier; Pro unlocks meaningful time-savers.

---

## Product Scope (MVP)

### Free Tier (MVP)

- Drag & drop single image (PNG/JPG/WebP; HEIC if supported by browser or via WASM decoder when user enables it)
- Resize:
  - Set width/height (lock aspect toggle)
  - Scale by % slider (5–400%)
- Format convert: **JPG, PNG, WebP**
- Quality slider for lossy formats
- Instant download
- PWA installable, offline operation for free features
- Clear “local-only” privacy messaging

### Pro Tier (MVP+)

- **Batch processing**: multiple files at once
- **Presets**:
  - Social: Instagram post, IG story, FB cover, LinkedIn banner
  - Web: 4k/1440p/1080p/720p, app icon set (16/32/64/128/256/512)
  - Print: A4/A3 poster presets with recommended pixel sizes
- **Advanced formats**:
  - Output: **AVIF** (if not supported, auto fallback to WebP)
  - Input: **HEIC/HEIF** via lazy-loaded WASM decoder
- **Metadata control**: strip EXIF toggle
- **Zip download** for multi-file export
- **Saved custom presets** (local)

### Future (not required in initial code but scaffold for)

- AI upscale (WASM ESRGAN/light model)
- TIFF/JPEG XL via optional WASM codecs
- Cloud sync of presets (DB) and teams

---

## Pages & Routes

- `/` – Converter workspace (free features active; Pro features visible but gated)
- `/pricing` – Free vs Pro matrix, CTA to upgrade
- `/account` – Manage subscription, link to Stripe Customer Portal
- `/api/stripe/*` – Checkout session, webhook, portal routes (server-side)

---

## Component & Hook Design

```
/src
  /app
    /(marketing)/pricing/page.tsx
    /(app)/page.tsx                  // Converter
    /account/page.tsx
    /api/stripe/checkout/route.ts
    /api/stripe/portal/route.ts
    /api/stripe/webhook/route.ts
  /components
    Dropzone.tsx
    ImageCard.tsx
    PreviewGrid.tsx
    SettingsPanel.tsx
    FormatSelect.tsx
    QualitySlider.tsx
    SizeControls.tsx
    PresetsSelect.tsx
    BatchToolbar.tsx
    ProBadge.tsx
    PaywallDialog.tsx
    ProgressBar.tsx
  /hooks
    useImageProcessor.ts              // orchestrates worker, pica, encode/decode
    usePresets.ts                     // built-ins + user-defined
    usePaywall.ts                     // checks session/entitlements
  /lib
    canvas.ts                         // draw, toBlob, feature tests, avif check
    heic.ts                           // lazy load libheif-js; decode to ImageBitmap
    zip.ts                            // lazy load jszip for multi-download
    formats.ts                        // supported MIME lists, helpers
    analytics.ts
    stripe.ts                         // helper to call API routes
  /workers
    imageWorker.ts                    // resize/convert; pica integration; OffscreenCanvas if supported
  /styles
    globals.css
```

**Key behaviors**

- `useImageProcessor`:
  - Accepts files + settings; spins up a Worker
  - Worker decodes, resizes (pica if enabled), encodes to target MIME
  - Returns progress updates and final Blobs/File objects
- `canvas.ts`:
  - `canEncode(mime)`, `toBlobSafe(canvas, mime, quality)`
  - AVIF feature detection; fallback order: AVIF → WebP → JPEG
- `heic.ts`:
  - `maybeDecodeHEIC(file)`: if HEIC and no native support, lazy-load wasm, return ImageBitmap
- `usePresets`:
  - Built-in presets (social/web/print) + user-defined saved in localStorage
- `usePaywall`:
  - `isPro`: derived from auth session or local entitlement
  - Gate batch, presets, HEIC/AVIF toggle, zip export

---

## UI/UX Requirements

- Drag file(s) onto a clear drop zone → show previews (filename, original WxH, size)
- Settings panel: size controls (width, height, lock, %), format select, quality slider
- **Convert** button:
  - Free: processes single file
  - Pro: supports batch & zip
- **Presets** dropdown (visible to all; Pro presets marked with “Pro” badge)
- **Status**: progress bar for batch, toast notifications on success/error
- **Accessibility**: keyboard navigable, proper labels, focus states, color-contrast

---

## Freemium Gating (MVP)

- If multiple files selected and user is not Pro → show PaywallDialog (explain benefits + CTA)
- If using Pro presets or HEIC/AVIF advanced toggle and not Pro → PaywallDialog
- Keep **one free Pro trial action** (e.g., first batch up to 3 files) to encourage conversion

---

## Payments & Auth

- Add Clerk for auth (email + OAuth)
- Stripe:
  - `/api/stripe/checkout`: creates Checkout session for Pro monthly (£3/mo) and yearly (£15/yr)
  - `/api/stripe/portal`: opens Customer Portal
  - `/api/stripe/webhook`: listens for `checkout.session.completed`, `customer.subscription.updated/deleted` to mark user as Pro (store in Clerk metadata or a lightweight DB if necessary; for MVP you can rely on Clerk public metadata)
- Show “Pro” status on `/account`

---

## PWA

- Configure manifest (name, icons), service worker to cache static assets and app shell
- Make free features work offline (conversion/resize is local)
- Indicate “Offline Ready” in the UI when SW is active

---

## Supported Formats (initial)

- **Input:** png, jpg, jpeg, webp (HEIC/HEIF via optional WASM; Safari HEIC supported natively)
- **Output:** jpg, png, webp; **avif** if supported, else fallback to webp/jpeg
- Add a clear note in UI about fallback behavior

---

## Acceptance Criteria (Critical)

1. **Performance:** Converting a single 4000×3000 photo to WebP 85% completes in < 2s on a modern laptop (web worker).
2. **Privacy:** No image bytes leave the browser. Network tab shows no upload of image content.
3. **Fallbacks:** If `toBlob('image/avif')` is unsupported, automatically use WebP and inform the user inline (non-blocking).
4. **Batch (Pro):** User selects 10 images, picks preset “Logo pack” (multiple sizes), and downloads a zip of results with correct filenames.
5. **Presets:** Built-in presets render correct dimensions; changing a preset updates size controls visibly.
6. **PWA:** App is installable; free features are usable offline.
7. **Paywall:** Non-Pro users blocked from Pro features with a friendly modal and CTA to upgrade (Stripe flow works end-to-end in test mode).
8. **Accessibility:** All interactive controls reachable by keyboard; labels announced by screen reader.
9. **Tests:** At least one Playwright test (drag/drop + single convert) and a unit test for `formats.ts` or `canvas.ts`.

---

## Developer Experience

- `README.md` with:
  - setup (env for Clerk + Stripe)
  - `npm run dev`, `npm run build`, `npm run test`, `npm run e2e`
  - how to switch Stripe to live
- Strict TypeScript
- ESLint + Prettier
- Simple feature flags (env or constants) for HEIC/AVIF/pica

---

## Implementation Notes

- Start with **single workspace page** that works without auth; layer paywall later.
- Image pipeline:
  - Decode (native → ImageBitmap) → resize (pica if enabled) → encode via `canvas.toBlob(mime, quality)` → download
- File naming: `${basename}_${width}x${height}.${ext}`
- Consider `JSZip` for zip packaging when doing batch downloads

---

## Deliverables

- Working Next.js app with the structure above
- Styled UI (Tailwind + shadcn) with clean, minimal aesthetic
- Web Worker wired for heavy operations
- Clerk + Stripe test-mode integration for Pro
- PWA configured
- Basic tests (Playwright + Vitest)
- Deployed preview (Vercel) ready

---

## Nice-to-Haves (if time permits)

- Drag a **folder** (Directory Upload API) for batch
- “Auto-fit to size” option (fit within WxH, pad/crop options later)
- Simple **sharpen** toggle after downscaling

---

**Please generate the codebase accordingly**: scaffold the Next.js project, wire the components/hooks/workers, include stubs where needed (e.g., HEIC decode, Stripe webhook), and implement at least one working end-to-end flow (single-file convert). Add clear TODOs where advanced pieces (HEIC/Pro/Zip) are partial but plumbed.

---
