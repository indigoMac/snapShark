/**
 * ZIP file creation for batch downloads
 */

export interface ZipFile {
  name: string;
  blob: Blob;
}

export async function createZip(files: ZipFile[]): Promise<Blob> {
  try {
    // Lazy load JSZip to reduce bundle size
    const JSZip = (await import('jszip')).default;

    const zip = new JSZip();

    files.forEach((file, index) => {
      if (!file.name || !file.blob) {
        throw new Error(`Invalid file at index ${index}: missing name or blob`);
      }
      zip.file(file.name, file.blob);
    });

    return await zip.generateAsync({ type: 'blob' });
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw new Error(`Failed to create ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function downloadZip(
  zipBlob: Blob,
  filename: string = 'converted-images.zip'
) {
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Mobile device detection utility
function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Enhanced download function with mobile sharing support
export async function downloadFile(
  blob: Blob,
  filename: string
): Promise<void> {
  const isMobile = isMobileDevice();
  const canShare = 'share' in navigator && 'canShare' in navigator;

  // For images on mobile, try to use Share API first (saves to camera roll)
  if (isMobile && canShare && blob.type.startsWith('image/')) {
    try {
      // Create a File object from the blob (required for sharing)
      const file = new File([blob], filename, { type: blob.type });

      // Check if we can share this file
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'SnapShark - Save Image',
          text: 'Choose "Save to Photos" to add to your camera roll',
          files: [file],
        });
        return; // Successfully shared, exit early
      }
    } catch (error: any) {
      // Share failed or was cancelled by user
      if (error.name === 'AbortError') {
        // User cancelled, that's fine
        return;
      }
      // Other errors - fall back to download
      console.log('Share API failed, falling back to download:', error);
    }
  }

  // Fallback to traditional download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Dedicated function for when users explicitly want to save to photos
export async function saveToPhotoLibrary(
  blob: Blob,
  filename: string
): Promise<boolean> {
  const isMobile = isMobileDevice();
  const canShare = 'share' in navigator && 'canShare' in navigator;

  if (!isMobile) {
    // On desktop, just download normally
    await downloadFile(blob, filename);
    return true;
  }

  if (canShare && blob.type.startsWith('image/')) {
    try {
      const file = new File([blob], filename, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Save to Camera Roll',
          text: 'Choose "Save to Photos" to add this image to your camera roll',
          files: [file],
        });
        return true;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return false; // User cancelled
      }
      console.error('Share to photo library failed:', error);
    }
  }

  // Fallback to regular download
  await downloadFile(blob, filename);
  return true;
}
