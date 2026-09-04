'use client';

import { useState } from 'react';
import {
  Compass,
  Layers,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'overview' | 'features' | 'privacy' | 'contact';

type Tab = {
  id: TabType;
  label: string;
  description: string;
  icon: LucideIcon;
};

const TABS: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'What SnapShark is and who it is for',
    icon: Compass,
  },
  {
    id: 'features',
    label: 'What’s Included',
    description: 'Current tools, and Free vs Pro',
    icon: Layers,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'How your images and logbook are handled',
    icon: ShieldCheck,
  },
  {
    id: 'contact',
    label: 'Contact',
    description: 'Feedback and support',
    icon: Mail,
  },
];

function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`brand-panel p-6 sm:p-8 ${className}`}>{children}</div>
  );
}

export function AboutTabbed() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div className="space-y-10">
      <div
        role="tablist"
        aria-label="About SnapShark"
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-[rgb(126_200_192_/_0.16)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`brand-tab flex shrink-0 items-center gap-2 ${
                isActive ? 'brand-tab-active' : ''
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>
                <span className="block text-sm font-semibold tracking-wide">
                  {tab.label}
                </span>
                <span className="hidden text-xs text-[#7a9a95] sm:block">
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'features' && <FeaturesTab />}
        {activeTab === 'privacy' && <PrivacyTab />}
        {activeTab === 'contact' && <ContactTab />}
      </div>

      <Panel className="text-center">
        <h3 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          Start with your next dive
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-[#9bb8b3]">
          Correct an underwater photo, or pin your first dive on the map. Both
          are free to use.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/logbook"
            className="inline-flex justify-center bg-[#e8f4f1] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#06262f] transition hover:bg-white"
          >
            Open the Logbook
          </Link>
          <Link
            href="/underwater"
            className="inline-flex justify-center border border-[rgb(126_200_192_/_0.45)] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#e8f4f1] transition hover:border-[#7ec8c0]"
          >
            Correct a Photo
          </Link>
        </div>

        <p className="mt-6 text-sm text-[#7a9a95]">
          Pro is free for your first month with the code{' '}
          <span className="font-mono text-[#7ec8c0]">EARLYSHARK</span> at
          checkout.{' '}
          <Link href="/pricing" className="underline underline-offset-2 hover:text-[#e8f4f1]">
            See what Pro adds
          </Link>
          .
        </p>
      </Panel>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Panel>
        <h2 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          A logbook and photo toolkit for divers
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#c5ddd8] sm:text-lg">
          SnapShark helps you keep a record of the diving you have actually
          done. Pin the places you have been on a map, write down what you
          remember, add the photos, and record the details that matter to you,
          from depth and bottom time to who you dived with.
        </p>
        <p className="mt-4 text-base leading-relaxed text-[#c5ddd8] sm:text-lg">
          Alongside the logbook, the underwater colour correction tool fixes the
          blue-green cast that ruins most dive photos, with no watermarks and
          nothing to install. Corrected photos can be saved straight into a dive
          entry.
        </p>
      </Panel>

      <Panel>
        <h2 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          Who it is for
        </h2>
        <ul className="mt-4 space-y-2 text-[#c5ddd8]">
          <li>
            • Recreational divers who want their dives somewhere better than a
            drawer or a spreadsheet
          </li>
          <li>
            • Underwater photographers who need quick, honest colour correction
          </li>
          <li>
            • Anyone who logs seriously and wants depth, times, and conditions
            recorded properly, without being forced to fill them in
          </li>
        </ul>
      </Panel>

      <Panel>
        <h2 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          Who builds it
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#c5ddd8] sm:text-lg">
          SnapShark is built and run by one developer, Mac Cox, in the UK. It
          started as a set of image tools built to solve everyday problems, and
          has grown into something more focused: keeping a dive logbook that is
          genuinely worth revisiting.
        </p>
        <p className="mt-4 text-base leading-relaxed text-[#c5ddd8] sm:text-lg">
          It is still early, and features are shaped by what divers actually ask
          for.
        </p>
      </Panel>
    </div>
  );
}

function FeaturesTab() {
  return (
    <div className="space-y-6">
      <Panel>
        <h2 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          What works today
        </h2>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7ec8c0]">
            Dive logbook
          </h3>
          <ul className="space-y-1 text-[#c5ddd8]">
            <li>• Search for a place, or drop and drag a pin on the map</li>
            <li>• Log dives with a note and photos — details are optional</li>
            <li>
              • Optional extras: dive type, max depth, bottom time, buddy,
              visibility, and water temperature
            </li>
            <li>• Group places into trips</li>
            <li>
              • Share a trip or a place as a link for WhatsApp, Messages, or
              Instagram
            </li>
            <li>• Full-screen view of any dive entry</li>
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7ec8c0]">
            Photo tools
          </h3>
          <ul className="space-y-1 text-[#c5ddd8]">
            <li>• Underwater colour correction, without watermarks</li>
            <li>• Format conversion between JPG, PNG, WebP, AVIF and HEIC</li>
            <li>• Resizing with aspect ratio control and compression</li>
            <li>• Background removal</li>
            <li>• Batch processing for multiple images at once</li>
          </ul>
        </div>
      </Panel>

      <Panel>
        <h2 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          Free and Pro
        </h2>
        <p className="mt-4 text-[#c5ddd8]">
          The logbook, colour-fix for a few photos, and trip sharing are free.
          Pro is for when you come back with a full card: batch colour-fix and
          more photo storage. Converter extras (AVIF, print packages) stay on
          Pro too. There are no watermarks on either plan.
        </p>
        <p className="mt-3 text-[#c5ddd8]">
          Pro is £3 per month. There are no watermarks on either plan.
        </p>
      </Panel>
    </div>
  );
}

function PrivacyTab() {
  return (
    <div className="space-y-6">
      <Panel>
        <h2 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          Photo tools run on your device
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#c5ddd8] sm:text-lg">
          Conversion, resizing, background removal, and underwater correction
          all happen inside your browser. Those images are never uploaded, so
          there is nothing on a server for anyone, including me, to look at.
        </p>
      </Panel>

      <Panel>
        <h2 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          The logbook is stored on your account
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#c5ddd8] sm:text-lg">
          A logbook is only useful if it follows you between devices, so
          anything you save there is stored on our servers: places, dives,
          notes, details, and photos. Photos are held in private storage and are
          only sent back to you after we check you are signed in — unless you
          turn sharing on for a trip or place, in which case anyone with that
          link can view it. Turn sharing off and the old link stops working.
        </p>
        <p className="mt-4 text-base leading-relaxed text-[#c5ddd8] sm:text-lg">
          You can download everything, or permanently delete it, from your{' '}
          <Link
            href="/account"
            className="text-[#7ec8c0] underline underline-offset-2 hover:text-[#9ad6cf]"
          >
            account page
          </Link>
          . Deleting your account deletes your logbook with it. The{' '}
          <Link
            href="/legal/privacy"
            className="text-[#7ec8c0] underline underline-offset-2 hover:text-[#9ad6cf]"
          >
            Privacy Policy
          </Link>{' '}
          sets out exactly what is stored, who processes it, and for how long.
        </p>
      </Panel>
    </div>
  );
}

function ContactTab() {
  return (
    <div className="space-y-6">
      <Panel>
        <h2 className="brand-display text-2xl tracking-tight text-[#e8f4f1]">
          Feedback shapes what gets built
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#c5ddd8] sm:text-lg">
          SnapShark is early, and the roadmap comes from what divers say is
          missing. If something is broken, awkward, or simply not there yet, I
          would like to hear about it.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://forms.gle/2W6yWzWV1T3nY4WU7"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#7ec8c0] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#06262f] transition hover:bg-[#9ad6cf]"
          >
            Take the feedback survey
          </a>
          <a
            href="mailto:snapshark2025@gmail.com"
            className="inline-flex items-center justify-center border border-[rgb(126_200_192_/_0.35)] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#e8f4f1] transition hover:border-[#7ec8c0]"
          >
            Email snapshark2025@gmail.com
          </a>
        </div>
        <p className="mt-4 text-sm text-[#7a9a95]">
          The survey takes under a minute. Emails are usually answered within 48
          hours.
        </p>
      </Panel>
    </div>
  );
}
