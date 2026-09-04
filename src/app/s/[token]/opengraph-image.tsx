import { ImageResponse } from 'next/og';
import {
  coverPhotoFromShare,
  loadPublicShare,
  photoBelongsToShare,
} from '@/lib/share';
import { readLogbookPhotoBytes } from '@/lib/photo-file';

export const runtime = 'nodejs';
export const alt = 'Shared dive on SnapShark';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: { token: string } };

export default async function Image({ params }: Props) {
  const share = await loadPublicShare(params.token);
  const title = share?.name ?? 'A dive on SnapShark';
  const kindLabel =
    share?.kind === 'place' ? 'Dive place' : 'Dive trip';

  let photoSrc: string | null = null;
  const cover = share ? coverPhotoFromShare(share) : null;
  if (cover && share) {
    const owned = await photoBelongsToShare(share.token, cover.id);
    if (owned) {
      const bytes = await readLogbookPhotoBytes(owned.storageRef);
      if (bytes && bytes.buffer.length < 700_000) {
        photoSrc = `data:${bytes.contentType};base64,${bytes.buffer.toString('base64')}`;
      }
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#031820',
          color: '#e8f4f1',
          fontFamily: 'Georgia, serif',
        }}
      >
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(3,24,32,0.92) 0%, rgba(3,24,32,0.35) 55%, rgba(3,24,32,0.2) 100%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '64px',
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#7ec8c0',
              marginBottom: 16,
            }}
          >
            {kindLabel}
          </div>
          <div
            style={{
              fontSize: title.length > 42 ? 48 : 64,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: 24, fontSize: 22, color: '#9bb8b3' }}>
            SnapShark
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
