export const SUPPORTED_INPUT_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
] as const;

export const SUPPORTED_OUTPUT_FORMATS = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/avif'
] as const;

export type InputFormat = typeof SUPPORTED_INPUT_FORMATS[number];
export type OutputFormat = typeof SUPPORTED_OUTPUT_FORMATS[number];

export const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif'
};

export const FORMAT_NAMES: Record<OutputFormat, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG', 
  'image/webp': 'WebP',
  'image/avif': 'AVIF'
};

export const LOSSY_FORMATS: OutputFormat[] = [
  'image/jpeg',
  'image/webp', 
  'image/avif'
];

export function isInputFormatSupported(mimeType: string): mimeType is InputFormat {
  return SUPPORTED_INPUT_FORMATS.includes(mimeType as InputFormat);
}

export function isOutputFormatSupported(mimeType: string): mimeType is OutputFormat {
  return SUPPORTED_OUTPUT_FORMATS.includes(mimeType as OutputFormat);
}

export function isLossyFormat(format: OutputFormat): boolean {
  return LOSSY_FORMATS.includes(format);
}

export function getFileExtension(format: OutputFormat): string {
  return FORMAT_EXTENSIONS[format];
}

export function getMimeTypeFromExtension(extension: string): OutputFormat | null {
  const ext = extension.toLowerCase().replace('.', '');
  const entry = Object.entries(FORMAT_EXTENSIONS).find(([, fileExt]) => fileExt === ext);
  return entry ? (entry[0] as OutputFormat) : null;
}

export function generateFilename(originalName: string, width: number, height: number, format: OutputFormat): string {
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
  const extension = getFileExtension(format);
  return `${baseName}_${width}x${height}.${extension}`;
}
