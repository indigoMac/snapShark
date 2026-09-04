import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  coverPhotoFromShare,
  loadPublicShare,
  type PublicShare,
} from '@/lib/share';
import { absoluteUrl, SITE_NAME } from '@/lib/seo';
import { ShareBar } from '@/components/ShareBar';

type PageProps = { params: { token: string } };

export const dynamic = 'force-dynamic';

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shareDescription(share: PublicShare): string {
  const placeCount = share.places.length;
  const diveCount = share.places.reduce(
    (sum, place) => sum + place.dives.length,
    0
  );
  const photoCount = share.places.reduce(
    (sum, place) =>
      sum + place.dives.reduce((dSum, dive) => dSum + dive.photos.length, 0),
    0
  );
  const bits = [
    placeCount === 1 ? '1 place' : `${placeCount} places`,
    diveCount === 1 ? '1 dive' : `${diveCount} dives`,
  ];
  if (photoCount > 0) {
    bits.push(photoCount === 1 ? '1 photo' : `${photoCount} photos`);
  }
  return `${share.name} — ${bits.join(' · ')}. Shared from ${SITE_NAME}.`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const share = await loadPublicShare(params.token);
  if (!share) {
    return { title: 'Shared dive', robots: { index: false, follow: false } };
  }

  const description = shareDescription(share);
  const url = absoluteUrl(`/s/${share.token}`);

  return {
    title: { absolute: `${share.name} · ${SITE_NAME}` },
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: share.name,
      description,
      type: 'article',
      url,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: share.name,
      description,
    },
    alternates: { canonical: url },
  };
}

export default async function SharedTripPage({ params }: PageProps) {
  const share = await loadPublicShare(params.token);
  if (!share) notFound();

  const cover = coverPhotoFromShare(share);
  const shareUrl = absoluteUrl(`/s/${share.token}`);
  const dateLabel = share.startDate
    ? share.endDate && share.endDate !== share.startDate
      ? `${formatDay(share.startDate)} – ${formatDay(share.endDate)}`
      : formatDay(share.startDate)
    : null;

  return (
    <div className="home-landing -mx-4 -mt-6 w-[calc(100%+2rem)] max-w-none bg-[#031820] text-[#e8f4f1]">
      <section className="relative min-h-[48svh] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#06262f]" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#031820] via-[#031820]/55 to-[#031820]/20"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex min-h-[48svh] max-w-3xl flex-col justify-end px-5 pb-10 pt-24 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7ec8c0]">
            {share.kind === 'trip' ? 'A shared trip' : 'A shared dive place'}
          </p>
          <h1 className="mt-3 font-landing-display text-[clamp(1.75rem,6vw,3rem)] leading-tight tracking-tight">
            {share.name}
          </h1>
          {dateLabel && (
            <p className="mt-2 text-sm text-[#b7d4cf]">{dateLabel}</p>
          )}
          {share.description && (
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#c5ddd8]">
              {share.description}
            </p>
          )}
          <div className="mt-6">
            <ShareBar
              url={shareUrl}
              title={share.name}
              text={`Look at this dive ${share.kind === 'trip' ? 'trip' : 'site'} on SnapShark`}
              imageUrl={cover?.url ?? null}
              tone="ocean"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-12 px-5 py-12 sm:px-8 sm:py-16">
        {share.places.length === 0 && (
          <p className="text-[#9bb8b3]">No places on this trip yet.</p>
        )}
        {share.places.map((place) => (
          <section key={place.id} className="space-y-5">
            <header>
              <h2 className="font-landing-display text-2xl tracking-tight">
                {place.name}
              </h2>
              <p className="mt-1 text-sm text-[#7a9a95]">
                {[place.region, place.country].filter(Boolean).join(', ') ||
                  `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`}
                {' · '}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=14/${place.latitude}/${place.longitude}`}
                  className="underline underline-offset-2 hover:text-[#9ad6cf]"
                  target="_blank"
                  rel="noreferrer"
                >
                  Map
                </a>
              </p>
            </header>

            {place.dives.length === 0 ? (
              <p className="text-sm text-[#7a9a95]">No dives logged here.</p>
            ) : (
              <div className="space-y-8">
                {place.dives.map((dive) => (
                  <article key={dive.id} className="space-y-3">
                    <p className="text-sm font-medium text-[#9bb8b3]">
                      {formatDay(dive.diveDate)}
                      {dive.depthMeters != null
                        ? ` · ${dive.depthMeters} m`
                        : ''}
                      {dive.bottomTimeMinutes != null
                        ? ` · ${dive.bottomTimeMinutes} min`
                        : ''}
                    </p>
                    {dive.notes && (
                      <p className="text-base leading-relaxed text-[#c5ddd8]">
                        {dive.notes}
                      </p>
                    )}
                    {dive.photos.length > 0 && (
                      <div
                        className={`grid gap-2 ${
                          dive.photos.length === 1
                            ? 'grid-cols-1'
                            : 'grid-cols-2'
                        }`}
                      >
                        {dive.photos.map((photo) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={photo.id}
                            src={photo.url}
                            alt={photo.caption || `Photo from ${place.name}`}
                            className="w-full object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}

        <section className="border-t border-[rgb(126_200_192_/_0.16)] pt-10 text-center">
          <p className="font-landing-display text-xl tracking-tight">
            Log your own dives.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#9bb8b3]">
            Fix a photo, drop it on the map, send the trip. Free to start.
          </p>
          <a
            href="/"
            className="brand-cta mt-6 inline-flex bg-[#e8f4f1] text-[#06262f] hover:bg-white"
          >
            Open SnapShark
          </a>
        </section>
      </div>
    </div>
  );
}
