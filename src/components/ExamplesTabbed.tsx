'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type TabType = 'colour' | 'logbook' | 'tools';

const tabs: Array<{
  id: TabType;
  label: string;
  description: string;
}> = [
  {
    id: 'colour',
    label: 'Colour fix',
    description: 'Bring reds back to dive photos',
  },
  {
    id: 'logbook',
    label: 'Logbook',
    description: 'Pin places and keep dive memories',
  },
  {
    id: 'tools',
    label: 'Photo tools',
    description: 'Convert, resize, and tidy files',
  },
];

export function ExamplesTabbed() {
  const [activeTab, setActiveTab] = useState<TabType>('colour');

  return (
    <div className="space-y-10">
      <div
        className="flex flex-wrap gap-2 border-b border-slate-700/80 pb-1"
        role="tablist"
        aria-label="Examples"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-left transition-colors ${
                active
                  ? 'border-b-2 border-[#7ec8c0] text-[#e8f4f1]'
                  : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-sm font-semibold tracking-wide">
                {tab.label}
              </div>
              <div className="hidden text-xs text-slate-500 sm:block">
                {tab.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="min-h-[28rem]">
        {activeTab === 'colour' && <ColourFixExample />}
        {activeTab === 'logbook' && <LogbookExample />}
        {activeTab === 'tools' && <PhotoToolsExample />}
      </div>

      <SampleDivePhotos />
    </div>
  );
}

function ColourFixExample() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h2 className="font-landing-display text-3xl tracking-tight text-white sm:text-4xl">
          Underwater colour correction
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          Most dive photos lose reds underwater. SnapShark restores them in your
          browser — no upload, no watermark — then you can save the result to a
          dive in your logbook.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <figure className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
            <Image
              src="/examples/underwater-before.jpeg"
              alt="Underwater turtle photo before colour correction"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <figcaption className="text-sm text-slate-400">
            Straight from the camera — blue-green cast
          </figcaption>
        </figure>
        <figure className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
            <Image
              src="/examples/underwater-after.jpg"
              alt="Underwater turtle photo after SnapShark colour correction"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <figcaption className="text-sm text-slate-400">
            After SnapShark colour fix
          </figcaption>
        </figure>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3">
        {[
          'Open Colour Fix and drop in a dive photo.',
          'Tune intensity until the colours feel true.',
          'Download, or save straight into a logbook dive.',
        ].map((step, index) => (
          <li
            key={step}
            className="border border-slate-700/80 bg-slate-900/40 p-5 text-sm leading-relaxed text-slate-300"
          >
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#7ec8c0]">
              Step {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <Link
        href="/underwater"
        className="inline-flex bg-[#7ec8c0] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#06262f] transition hover:bg-[#9ad6cf]"
      >
        Try colour fix
      </Link>
    </div>
  );
}

function LogbookExample() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h2 className="font-landing-display text-3xl tracking-tight text-white sm:text-4xl">
          A logbook worth revisiting
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          Pin the sites you dive, group them into trips, and keep notes,
          buddies, depth, and photos together — including shots you corrected in
          Colour Fix.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Places',
            body: 'Search or drop a pin on the map. Rename sites so they match how you talk about them.',
          },
          {
            title: 'Dives',
            body: 'Add a memory with optional depth, bottom time, visibility, water temp, and buddy.',
          },
          {
            title: 'Trips',
            body: 'Group dives from a holiday or liveaboard so the whole week stays in one place.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="border border-slate-700/80 bg-slate-900/40 p-5"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7ec8c0]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      <div className="border border-[#7ec8c0]/25 bg-[#06262f] p-6 sm:p-8">
        <h3 className="font-landing-display text-2xl tracking-tight text-[#e8f4f1]">
          The loop that matters
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9bb8b3] sm:text-base">
          Correct a photo → open the logbook → attach it to the dive. That is
          the SnapShark habit: the picture and the place stay together.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/logbook"
            className="inline-flex justify-center bg-[#e8f4f1] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#06262f] transition hover:bg-white"
          >
            Open the logbook
          </Link>
          <Link
            href="/underwater"
            className="inline-flex justify-center border border-[#7ec8c0]/45 px-6 py-3.5 text-sm font-semibold tracking-wide text-[#e8f4f1] transition hover:border-[#7ec8c0]"
          >
            Fix a photo first
          </Link>
        </div>
      </div>
    </div>
  );
}

function PhotoToolsExample() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h2 className="font-landing-display text-3xl tracking-tight text-white sm:text-4xl">
          Still handy for files
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          SnapShark started as browser-based image tools. They are still here —
          useful when you need to resize a shot for a club newsletter, convert
          HEIC, or tidy a batch — but they are not the heart of the product.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Convert & resize',
            body: 'JPEG, PNG, WebP, and more — privately in your browser.',
            href: '/convert',
            cta: 'Open image processor',
          },
          {
            title: 'Background removal',
            body: 'Cut a subject free when you need a clean PNG.',
            href: '/background-removal',
            cta: 'Try background removal',
          },
          {
            title: 'Colour fix',
            body: 'The dive-first tool — still the one to reach for after a trip.',
            href: '/underwater',
            cta: 'Open colour fix',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex flex-col border border-slate-700/80 bg-slate-900/40 p-5"
          >
            <h3 className="text-base font-semibold text-white">{item.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-300">
              {item.body}
            </p>
            <Link
              href={item.href}
              className="mt-5 text-sm font-semibold text-[#7ec8c0] underline decoration-[#7ec8c0]/40 underline-offset-4 hover:text-[#9ad6cf]"
            >
              {item.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function SampleDivePhotos() {
  return (
    <section className="border-t border-slate-700/80 pt-10">
      <h2 className="font-landing-display text-2xl tracking-tight text-white sm:text-3xl">
        Try with a sample dive photo
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
        Download a blue-tinted sample, run it through Colour Fix, then attach
        the result to a dive in your logbook.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="border border-slate-700/80 bg-slate-900/40 p-5">
          <div className="relative mb-4 aspect-[4/3] overflow-hidden bg-slate-950">
            <Image
              src="/examples/underwater-before.jpeg"
              alt="Sample underwater photo with green-blue cast"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <h3 className="font-semibold text-white">Underwater sample</h3>
          <p className="mt-2 text-sm text-slate-400">
            Ideal for testing colour correction.
          </p>
          <a
            href="/examples/underwater-before.jpeg"
            download
            className="mt-4 inline-flex bg-[#7ec8c0] px-4 py-2.5 text-sm font-semibold text-[#06262f] transition hover:bg-[#9ad6cf]"
          >
            Download sample
          </a>
        </div>

        <div className="border border-slate-700/80 bg-slate-900/40 p-5">
          <div className="relative mb-4 aspect-[4/3] overflow-hidden bg-slate-950">
            <Image
              src="/examples/underwater-after.jpg"
              alt="Sample underwater photo after colour correction"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <h3 className="font-semibold text-white">Corrected reference</h3>
          <p className="mt-2 text-sm text-slate-400">
            Roughly what a good fix can look like — your slider may differ.
          </p>
          <Link
            href="/underwater"
            className="mt-4 inline-flex border border-[#7ec8c0]/45 px-4 py-2.5 text-sm font-semibold text-[#e8f4f1] transition hover:border-[#7ec8c0]"
          >
            Open colour fix
          </Link>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Link
          href="/logbook"
          className="inline-flex bg-[#e8f4f1] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#06262f] transition hover:bg-white"
        >
          Open the logbook
        </Link>
        <Link
          href="/about"
          className="inline-flex border border-slate-600 px-6 py-3.5 text-sm font-semibold tracking-wide text-slate-200 transition hover:border-slate-400"
        >
          About SnapShark
        </Link>
      </div>
    </section>
  );
}
