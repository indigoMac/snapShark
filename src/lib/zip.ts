/**
 * ZIP file creation for batch downloads
 */

export interface ZipFile {
  name: string;
  blob: Blob;
}

export async function createZip(files: ZipFile[]): Promise<Blob> {
  // Lazy load JSZip to reduce bundle size
  const JSZip = (await import('jszip')).default;
  
  const zip = new JSZip();
  
  files.forEach(file => {
    zip.file(file.name, file.blob);
  });
  
  return await zip.generateAsync({ type: 'blob' });
}

export function downloadZip(zipBlob: Blob, filename: string = 'converted-images.zip') {
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
