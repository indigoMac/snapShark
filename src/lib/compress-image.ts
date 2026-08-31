/**
 * Compress an image for logbook storage (data URL MVP).
 * Keeps memories lightweight until object storage is wired up.
 */
export async function compressImageForLogbook(
  source: Blob | string,
  options: { maxWidth?: number; quality?: number; maxBytes?: number } = {}
): Promise<string> {
  const maxWidth = options.maxWidth ?? 1200;
  const quality = options.quality ?? 0.72;
  const maxBytes = options.maxBytes ?? 900_000;

  const objectUrl =
    typeof source === 'string' ? source : URL.createObjectURL(source);

  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxWidth / img.width);
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not prepare image canvas');
    ctx.drawImage(img, 0, 0, width, height);

    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    let q = quality;
    while (approxDataUrlBytes(dataUrl) > maxBytes && q > 0.4) {
      q -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', q);
    }

    if (approxDataUrlBytes(dataUrl) > maxBytes) {
      throw new Error('Photo is still too large after compression. Try a smaller image.');
    }

    return dataUrl;
  } finally {
    if (typeof source !== 'string') {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function approxDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}
