'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

type RevealDirection = 'up' | 'left' | 'right' | 'scale';

function useInView<T extends HTMLElement>(
  threshold = 0.18,
  rootMargin = '0px 0px -8% 0px'
) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}

function Reveal({
  children,
  className = '',
  direction = 'up',
  delayMs = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  delayMs?: number;
  as?: 'div' | 'section' | 'figure' | 'p' | 'h2' | 'header';
}) {
  const { ref, visible } = useInView<HTMLElement>(0.15);

  return (
    <Tag
      ref={ref as never}
      className={`home-reveal home-reveal-${direction} ${
        visible ? 'is-visible' : ''
      } ${className}`}
      style={{ '--home-reveal-delay': `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

export function HomeLanding() {
  return (
    <div className="home-landing -mx-4 -mt-6">
      {/* Hero — one composition: brand, line, support, CTAs, full-bleed ocean */}
      <section className="relative left-1/2 right-1/2 min-h-[100svh] w-screen max-w-[100vw] -ml-[50vw] -mr-[50vw] overflow-hidden bg-[#031820]">
        <Image
          src="/marketing/hero-dive.jpg"
          alt="Scuba diver beside a school of bluestripe snappers on a coral reef"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center] sm:object-center home-landing-hero-image"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#031820] via-[#031820]/55 to-[#031820]/25"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#031820]/80 via-[#031820]/35 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-6 pb-16 pt-28 sm:px-10 sm:pb-20 lg:px-16 lg:pb-24">
          <div className="max-w-2xl">
            <p className="home-landing-hero-line font-landing-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] tracking-tight text-[#f3faf8]">
              Snap
              <span className="text-[#7ec8c0]">Shark</span>
            </p>
            <h1 className="home-landing-hero-line home-landing-hero-line-2 mt-5 max-w-xl font-landing-display text-[clamp(1.5rem,3.4vw,2.35rem)] font-medium leading-snug tracking-tight text-[#e8f4f1]">
              Your dives. Worth coming back to.
            </h1>
            <p className="home-landing-hero-line home-landing-hero-line-3 mt-4 max-w-md text-base leading-relaxed text-[#b7d4cf] sm:text-lg">
              A quiet logbook for the places you dive, and a colour fix that
              brings the reds back to your photos.
            </p>
            <div className="home-landing-hero-line home-landing-hero-line-4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/logbook"
                className="inline-flex items-center justify-center bg-[#e8f4f1] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#06262f] transition hover:bg-white"
              >
                Open the logbook
              </Link>
              <Link
                href="/underwater"
                className="inline-flex items-center justify-center border border-[#7ec8c0]/50 px-6 py-3.5 text-sm font-semibold tracking-wide text-[#e8f4f1] transition hover:border-[#7ec8c0] hover:bg-[#7ec8c0]/10"
              >
                Fix a dive photo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Logbook */}
      <section className="relative left-1/2 right-1/2 w-screen max-w-[100vw] -ml-[50vw] -mr-[50vw] bg-[#f4f7f6] text-[#0b2a32]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f6f6a]">
                The logbook
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="mt-3 font-landing-display text-3xl leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Map the places.
                <br />
                Keep the dive.
              </h2>
            </Reveal>
            <Reveal delayMs={160}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[#3d565c] sm:text-lg">
                Pin sites on the map, group trips, and save the details that
                matter — depth, bottom time, buddy, notes, and the photos you
                want to remember.
              </p>
            </Reveal>
            <Reveal delayMs={240}>
              <Link
                href="/logbook"
                className="mt-8 inline-flex text-sm font-semibold tracking-wide text-[#0b2a32] underline decoration-[#7ec8c0] decoration-2 underline-offset-4 transition hover:text-[#2f6f6a]"
              >
                Start your first pin
              </Link>
            </Reveal>
          </div>
          <Reveal direction="right" delayMs={120} className="w-full">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#0b2a32]">
              <Image
                src="/marketing/reef-detail.jpg"
                alt="Clownfish among anemone tentacles on a coral reef"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover home-landing-float-image"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Underwater colour */}
      <section className="relative left-1/2 right-1/2 w-screen max-w-[100vw] -ml-[50vw] -mr-[50vw] bg-[#06262f] text-[#e8f4f1]">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7ec8c0]">
              Underwater colour
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <h2 className="mt-3 max-w-xl font-landing-display text-3xl leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Photos that look like what you saw.
            </h2>
          </Reveal>
          <Reveal delayMs={160}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#9bb8b3] sm:text-lg">
              Blue-green cast gone in the browser — no upload required. Then
              save the corrected shot straight into a dive entry.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6">
            <Reveal direction="left" delayMs={80} as="figure" className="space-y-3">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#031820]">
                <Image
                  src="/examples/underwater-before.jpeg"
                  alt="Underwater photo before colour correction"
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="text-sm text-[#7a9a95]">
                Straight from the camera
              </figcaption>
            </Reveal>
            <Reveal direction="right" delayMs={180} as="figure" className="space-y-3">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#031820]">
                <Image
                  src="/examples/underwater-after.jpg"
                  alt="Underwater photo after SnapShark colour correction"
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="text-sm text-[#7a9a95]">
                After SnapShark colour fix
              </figcaption>
            </Reveal>
          </div>

          <Reveal delayMs={260}>
            <Link
              href="/underwater"
              className="mt-10 inline-flex items-center justify-center bg-[#7ec8c0] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#06262f] transition hover:bg-[#9ad6cf]"
            >
              Correct a photo
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Close */}
      <section className="relative left-1/2 right-1/2 w-screen max-w-[100vw] -ml-[50vw] -mr-[50vw] bg-[#031820] text-[#e8f4f1]">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-10 lg:py-32">
          <Reveal direction="scale">
            <h2 className="font-landing-display text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Built for divers and snorkellers.
            </h2>
          </Reveal>
          <Reveal delayMs={100}>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#9bb8b3] sm:text-lg">
              Free to start. Private photo tools in your browser. A logbook that
              follows you between devices.
            </p>
          </Reveal>
          <Reveal delayMs={180}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/logbook"
                className="inline-flex w-full items-center justify-center bg-[#e8f4f1] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#06262f] transition hover:bg-white sm:w-auto"
              >
                Open the logbook
              </Link>
              <Link
                href="/about"
                className="inline-flex w-full items-center justify-center border border-[#7ec8c0]/40 px-6 py-3.5 text-sm font-semibold tracking-wide text-[#e8f4f1] transition hover:border-[#7ec8c0] sm:w-auto"
              >
                How it works
              </Link>
            </div>
          </Reveal>
          <Reveal delayMs={260}>
            <p className="mt-14 text-sm text-[#5f7d78]">
              Still need a general image converter?{' '}
              <Link
                href="/convert"
                className="underline decoration-[#5f7d78] underline-offset-2 transition hover:text-[#9bb8b3]"
              >
                Photo tools
              </Link>
            </p>
          </Reveal>
          <Reveal delayMs={320}>
            <p className="mt-8 text-xs leading-relaxed text-[#4a6661]">
              Hero and reef photos via{' '}
              <a
                href="https://unsplash.com"
                className="underline underline-offset-2 hover:text-[#7a9a95]"
                target="_blank"
                rel="noreferrer"
              >
                Unsplash
              </a>
              . Free for commercial use under the Unsplash License — see{' '}
              <Link
                href="/legal/photo-credits"
                className="underline underline-offset-2 hover:text-[#7a9a95]"
              >
                photo credits
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
