/**
 * Builds a square photo card for Instagram / camera roll sharing.
 * Runs in the browser so we can reuse the already-loaded cover image.
 */
export async function composeShareCard(opts: {
  title: string;
  imageUrl: string | null;
}): Promise<Blob> {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw a share image');

  ctx.fillStyle = '#031820';
  ctx.fillRect(0, 0, size, size);

  if (opts.imageUrl) {
    try {
      const img = await loadImage(opts.imageUrl);
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    } catch {
      // Fall through to the colour block.
    }
  }

  const gradient = ctx.createLinearGradient(0, size * 0.45, 0, size);
  gradient.addColorStop(0, 'rgba(3,24,32,0)');
  gradient.addColorStop(0.45, 'rgba(3,24,32,0.45)');
  gradient.addColorStop(1, 'rgba(3,24,32,0.92)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#7ec8c0';
  ctx.font = '600 28px system-ui, sans-serif';
  ctx.fillText('SNAPSHARK', 64, size - 200);

  ctx.fillStyle = '#e8f4f1';
  ctx.font = '600 64px Georgia, serif';
  wrapText(ctx, opts.title, 64, size - 130, size - 128, 72);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((next) => resolve(next), 'image/jpeg', 0.88)
  );
  if (!blob) throw new Error('Could not export the share image');
  return blob;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load cover photo'));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  const shown = lines.slice(0, 3);
  shown.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}
