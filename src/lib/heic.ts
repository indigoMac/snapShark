/**
 * HEIC/HEIF support via WASM decoder
 * TODO: Implement libheif-js integration for non-Safari browsers
 */

export async function isHEICSupported(): Promise<boolean> {
  // Safari has native HEIC support
  if (typeof window !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
    return true;
  }
  
  // TODO: Check if libheif-js is available and loaded
  return false;
}

export async function maybeDecodeHEIC(file: File): Promise<ImageBitmap | File> {
  const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' || 
                 file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif');
  
  if (!isHEIC) {
    return file;
  }
  
  // Check native support first (Safari)
  if (await isHEICSupported()) {
    try {
      return await createImageBitmap(file);
    } catch (error) {
      console.warn('Native HEIC decoding failed:', error);
    }
  }
  
  // TODO: Implement WASM decoder fallback
  // For now, throw error for unsupported HEIC files
  throw new Error('HEIC format is not supported in this browser. Please convert to JPEG or PNG first.');
}

export async function loadLibHeif(): Promise<any> {
  // TODO: Lazy load libheif-js WASM module
  // return import('libheif-js');
  throw new Error('HEIC WASM decoder not yet implemented');
}
