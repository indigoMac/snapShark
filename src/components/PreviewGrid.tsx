'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Package } from 'lucide-react';
import { ImageCard } from './ImageCard';
import { ProcessedImage } from '@/hooks/useImageProcessor';
import { downloadFile, createZip, downloadZip } from '@/lib/zip';
import { usePaywall } from '@/hooks/usePaywall';

interface PreviewGridProps {
  images: ProcessedImage[];
  onClear?: () => void;
}

export function PreviewGrid({ images, onClear }: PreviewGridProps) {
  const [previewImage, setPreviewImage] = useState<ProcessedImage | null>(null);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const { isPro, requestFeatureAccess } = usePaywall();

  const handlePreview = (image: ProcessedImage) => {
    setPreviewImage(image);
  };

  const handleDownloadAll = async () => {
    if (images.length === 1) {
      await downloadFile(images[0].blob, images[0].filename);
      return;
    }

    // Check if batch download requires Pro
    if (
      !isPro &&
      !requestFeatureAccess('zip-export', 'Batch download as ZIP')
    ) {
      return;
    }

    setIsCreatingZip(true);
    try {
      const zipFiles = images.map((img) => ({
        name: img.filename,
        blob: img.blob,
      }));

      const zipBlob = await createZip(zipFiles);
      downloadZip(zipBlob, `converted-images-${Date.now()}.zip`);
    } catch (error) {
      // Failed to create ZIP
    } finally {
      setIsCreatingZip(false);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mobile-optimized header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">
            Converted Images ({images.length})
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleDownloadAll}
              disabled={isCreatingZip}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {images.length === 1 ? (
                <>
                  <Download className="h-4 w-4" />
                  Download
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  {isCreatingZip ? 'Creating ZIP...' : 'Download All'}
                </>
              )}
            </Button>
            {onClear && (
              <Button
                variant="outline"
                onClick={onClear}
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Show favicon quality disclaimer if small images are present */}
        {images.some((img) => Math.max(img.width, img.height) <= 64) && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">About Small Favicon Quality</p>
                <p>
                  Tiny favicons (16px-48px) may appear blurry in this preview
                  due to browser scaling. However, they are professionally
                  optimized for actual use in browser tabs and bookmarks.
                  <span className="font-medium">
                    {' '}
                    The downloaded files are crisp at their intended size.
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Responsive grid - optimized for mobile first */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <ImageCard key={image.id} image={image} onPreview={handlePreview} />
          ))}
        </div>
      </div>

      {/* Mobile-optimized Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{previewImage?.filename}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={URL.createObjectURL(previewImage.blob)}
                  alt={previewImage.filename}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Dimensions:</span>
                  <br />
                  {previewImage.width} × {previewImage.height}
                </div>
                <div>
                  <span className="font-medium">Format:</span>
                  <br />
                  {previewImage.actualFormat.split('/')[1].toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">File Size:</span>
                  <br />
                  {(previewImage.blob.size / 1024).toFixed(1)} KB
                </div>
                <div>
                  <span className="font-medium">Original Size:</span>
                  <br />
                  {(previewImage.originalFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <Button
                onClick={async () =>
                  await downloadFile(previewImage.blob, previewImage.filename)
                }
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download This Image
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
