import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Photo credits',
  description:
    'Attribution and licence notes for photography used on SnapShark.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PhotoCreditsPage() {
  return (
    <div className="mx-auto max-w-2xl py-10 text-slate-200">
      <h1 className="font-landing-display text-3xl tracking-tight text-white sm:text-4xl">
        Photo credits
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate-300">
        Marketing photos on SnapShark come from{' '}
        <a
          href="https://unsplash.com"
          className="text-[#7ec8c0] underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          Unsplash
        </a>
        . They are <strong className="font-medium text-white">not</strong>{' '}
        “open source” in the software sense. They are free to use under the{' '}
        <a
          href="https://unsplash.com/license"
          className="text-[#7ec8c0] underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          Unsplash License
        </a>
        : personal and commercial use is allowed without asking permission, and
        attribution is appreciated but not required.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-white">Used on SnapShark</h2>
      <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
        <li>
          <span className="text-white">Homepage hero</span> — Unsplash image{' '}
          <code className="text-slate-400">photo-1544551763-46a013bb70d5</code>
          <br />
          <a
            href="https://images.unsplash.com/photo-1544551763-46a013bb70d5"
            className="text-[#7ec8c0] underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Source image
          </a>
        </li>
        <li>
          <span className="text-white">Logbook section</span> — Unsplash image{' '}
          <code className="text-slate-400">photo-1544552866-d3ed42536cfd</code>
          <br />
          <a
            href="https://images.unsplash.com/photo-1544552866-d3ed42536cfd"
            className="text-[#7ec8c0] underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Source image
          </a>
        </li>
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-white">What to watch</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        You may not sell Unsplash photos as a competing stock product. For
        identifiable people or visible brands in a photo, Unsplash still asks
        you to consider model/property rights for sensitive commercial uses.
        Website marketing like ours is a normal permitted use; when in doubt,
        swap the image or contact the photographer.
      </p>

      <p className="mt-10 text-sm text-slate-400">
        <Link href="/" className="text-[#7ec8c0] underline underline-offset-2">
          Back home
        </Link>
      </p>
    </div>
  );
}
