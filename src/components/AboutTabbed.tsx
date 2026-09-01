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
import { Card, CardContent } from '@/components/ui/card';

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

export function AboutTabbed() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div className="space-y-8">
      <div
        role="tablist"
        aria-label="About SnapShark"
        className="flex flex-wrap justify-center gap-2"
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
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-left font-medium transition-colors ${
                isActive
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>
                <span className="block font-semibold">{tab.label}</span>
                <span className="hidden text-xs opacity-75 sm:block">
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

      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Start with your next dive
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Correct an underwater photo, or pin your first dive on the map.
              Both are free to use.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/logbook"
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Open the Logbook
            </Link>
            <Link
              href="/underwater"
              className="rounded-lg bg-slate-700 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800"
            >
              Correct a Photo
            </Link>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-950/30">
            <p className="text-blue-900 dark:text-blue-200">
              Pro is free for your first month with the code{' '}
              <span className="rounded bg-blue-100 px-2 py-1 font-mono dark:bg-blue-900/60">
                EARLYSHARK
              </span>{' '}
              at checkout.{' '}
              <Link href="/pricing" className="underline hover:no-underline">
                See what Pro adds
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            A logbook and photo toolkit for divers
          </h2>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            SnapShark helps you keep a record of the diving you have actually
            done. Pin the places you have been on a map, write down what you
            remember, add the photos, and record the details that matter to
            you, from depth and bottom time to who you dived with.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Alongside the logbook, the underwater colour correction tool fixes
            the blue-green cast that ruins most dive photos, with no watermarks
            and nothing to install. Corrected photos can be saved straight into
            a dive entry.
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Who it is for
          </h2>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            <li>
              • Recreational divers who want their dives somewhere better than a
              drawer or a spreadsheet
            </li>
            <li>
              • Underwater photographers who need quick, honest colour
              correction
            </li>
            <li>
              • Anyone who logs seriously and wants depth, times, and conditions
              recorded properly, without being forced to fill them in
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Who builds it
          </h2>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            SnapShark is built and run by one developer, Mac Cox, in the UK. It
            started as a set of image tools built to solve everyday problems,
            and has grown into something more focused: keeping a dive logbook
            that is genuinely worth revisiting.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            It is still early, and features are shaped by what divers actually
            ask for.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FeaturesTab() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="space-y-6 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            What works today
          </h2>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Dive logbook
            </h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li>• Search for a place, or drop and drag a pin on the map</li>
              <li>• Log dives with notes and photos</li>
              <li>
                • Optional details: dive type, max depth, bottom time, buddy,
                visibility, and water temperature
              </li>
              <li>• Group places into trips</li>
              <li>• Full-screen view of any dive entry</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Photo tools
            </h3>
            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
              <li>• Underwater colour correction, without watermarks</li>
              <li>• Format conversion between JPG, PNG, WebP, AVIF and HEIC</li>
              <li>• Resizing with aspect ratio control and compression</li>
              <li>• Background removal</li>
              <li>• Batch processing for multiple images at once</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="space-y-3 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Free and Pro
          </h2>
          <p className="text-slate-700 dark:text-slate-300">
            The logbook and every core tool are free. Pro adds convenience
            rather than unlocking basics: batch processing, instant multi-size
            packages, and the extra formats. You can do most of it on the free
            plan, one image at a time.
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            Pro is £3 per month. There are no watermarks on either plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacyTab() {
  return (
    <div className="space-y-6">
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Photo tools run on your device
          </h2>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Conversion, resizing, background removal, and underwater correction
            all happen inside your browser. Those images are never uploaded, so
            there is nothing on a server for anyone, including me, to look at.
          </p>
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            The logbook is stored on your account
          </h2>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            A logbook is only useful if it follows you between devices, so
            anything you save there is stored on our servers: places, dives,
            notes, details, and photos. Photos are held in private storage and
            are only ever sent back to you after we check you are signed in and
            that they belong to your account.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            You can download everything, or permanently delete it, from your{' '}
            <Link
              href="/account"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              account page
            </Link>
            . Deleting your account deletes your logbook with it. The{' '}
            <Link
              href="/legal/privacy"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Privacy Policy
            </Link>{' '}
            sets out exactly what is stored, who processes it, and for how long.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactTab() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Feedback shapes what gets built
          </h2>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            SnapShark is early, and the roadmap comes from what divers say is
            missing. If something is broken, awkward, or simply not there yet, I
            would like to hear about it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://forms.gle/2W6yWzWV1T3nY4WU7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Take the feedback survey
            </a>
            <a
              href="mailto:snapshark2025@gmail.com"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Email snapshark2025@gmail.com
            </a>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The survey takes under a minute. Emails are usually answered within
            48 hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
