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
  threshold = 0.12,
  rootMargin = '0px 0px -6% 0px'
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
  const { ref, visible } = useInView<HTMLElement>(0.12);

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

const sectionClass = 'relative w-full overflow-hidden';

export function HomeLanding() {
  return (
    <div className="home-landing -mx-4 -mt-6 w-[calc(100%+2rem)] max-w-none">
      {/* Hero — one composition: brand, line, support, CTAs, full-bleed ocean */}
      <section className={`${sectionClass} min-h-[100svh] bg-[#031820]`}>
        <Image
          src="/marketing/hero-dive.jpg"
          alt="Scuba diver beside a school of bluestripe snappers on a coral reef"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center] sm:object-center home-landing-hero-image"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#031820] via-[#031820]/60 to-[#031820]/30"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#031820]/85 via-[#031820]/40 to-transparent sm:via-[#031820]/35"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-24 sm:px-10 sm:pb-20 lg:px-16 lg:pb-24">
          <div className="max-w-2xl">
            <p className="home-landing-hero-line font-landing-display text-[clamp(2.5rem,11vw,5.5rem)] leading-[0.95] tracking-tight text-[#f3faf8]">
              Snap
              <span className="text-[#7ec8c0]">Shark</span>
            </p>
            <h1 className="home-landing-hero-line home-landing-hero-line-2 mt-4 max-w-xl font-landing-display text-[clamp(1.35rem,5.5vw,2.35rem)] font-medium leading-snug tracking-tight text-[#e8f4f1] sm:mt-5">
              Fix the photo. Drop it on the map. Send the trip.
            </h1>
            <p className="home-landing-hero-line home-landing-hero-line-3 mt-4 max-w-md text-[0.95rem] leading-relaxed text-[#b7d4cf] sm:text-lg">
              A private logbook for the places you dive, a colour fix that
              brings the reds back, and a link you can paste into WhatsApp.
            </p>
            <div className="home-landing-hero-line home-landing-hero-line-4 mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/logbook"
                className="brand-cta w-full bg-[#e8f4f1] text-[#06262f] hover:bg-white sm:w-auto"
              >
                Open the logbook
              </Link>
              <Link
                href="/underwater"
                className="brand-cta w-full border border-[#7ec8c0]/50 text-[#e8f4f1] hover:border-[#7ec8c0] hover:bg-[#7ec8c0]/10 sm:w-auto"
              >
                Fix a dive photo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Logbook */}
      <section className={`${sectionClass} bg-[#f4f7f6] text-[#0b2a32]`}>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:gap-10 sm:px-10 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f6f6a]">
                The logbook
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <h2 className="mt-3 font-landing-display text-[1.75rem] leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Map the places.
                <br />
                Keep the dive.
              </h2>
            </Reveal>
            <Reveal delayMs={160}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[#3d565c] sm:text-lg">
                Pin a site, attach the shot, and you are done. Depth and time
                can wait. When you want someone else to see it, send a link —
                not another social app.
              </p>
            </Reveal>
            <Reveal delayMs={240}>
              <Link
                href="/logbook"
                className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold tracking-wide text-[#0b2a32] underline decoration-[#7ec8c0] decoration-2 underline-offset-4 transition hover:text-[#2f6f6a]"
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
      <section className={`${sectionClass} bg-[#06262f] text-[#e8f4f1]`}>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-10 sm:py-20 lg:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7ec8c0]">
              Underwater colour
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <h2 className="mt-3 max-w-xl font-landing-display text-[1.75rem] leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Photos that look like what you saw.
            </h2>
          </Reveal>
          <Reveal delayMs={160}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#9bb8b3] sm:text-lg">
              Blue-green cast gone in the browser — no upload required. Then
              save the corrected shot straight into a dive entry.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
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
              className="brand-cta mt-8 w-full bg-[#7ec8c0] text-[#06262f] hover:bg-[#9ad6cf] sm:mt-10 sm:w-auto"
            >
              Correct a photo
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Share */}
      <section className={`${sectionClass} bg-[#f4f7f6] text-[#0b2a32]`}>
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-10 sm:py-20 lg:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f6f6a]">
              Send the trip
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <h2 className="mt-3 font-landing-display text-[1.75rem] leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Paste a link. Not another login.
            </h2>
          </Reveal>
          <Reveal delayMs={160}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#3d565c] sm:text-lg">
              Turn sharing on for a trip or a place and you get a page that
              looks right in WhatsApp, Messages, or an Instagram story. Your
              logbook stays private until you choose.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Close */}
      <section className={`${sectionClass} bg-[#031820] text-[#e8f4f1]`}>
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-10 sm:py-24 lg:py-32">
          <Reveal direction="scale">
            <h2 className="font-landing-display text-[1.75rem] leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Built for divers and snorkellers.
            </h2>
          </Reveal>
          <Reveal delayMs={100}>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#9bb8b3] sm:text-lg">
              Free to start. Colour-fix in your browser. A logbook that follows
              you — and a link when you want to show someone.
            </p>
          </Reveal>
          <Reveal delayMs={180}>
            <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center">
              <Link
                href="/logbook"
                className="brand-cta w-full bg-[#e8f4f1] text-[#06262f] hover:bg-white sm:w-auto"
              >
                Open the logbook
              </Link>
              <Link
                href="/about"
                className="brand-cta w-full border border-[#7ec8c0]/40 text-[#e8f4f1] hover:border-[#7ec8c0] sm:w-auto"
              >
                How it works
              </Link>
            </div>
          </Reveal>
          <Reveal delayMs={260}>
            <p className="mt-12 text-sm text-[#5f7d78] sm:mt-14">
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
