const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|tiff?)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/i;

function hasUsableMimeType(file: File): boolean {
  return Boolean(file.type) && file.type !== 'application/octet-stream';
}

export function isImageMediaFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  if (hasUsableMimeType(file)) return false;
  return IMAGE_EXTENSIONS.test(file.name);
}

export function isVideoMediaFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  if (hasUsableMimeType(file)) return false;
  return VIDEO_EXTENSIONS.test(file.name);
}
