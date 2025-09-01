'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      downloadFile(images[0].blob, images[0].filename);
      return;
    }

    // Check if batch download requires Pro
    if (!isPro && !requestFeatureAccess('zip-export', 'Batch download as ZIP')) {
      return;
    }

    setIsCreatingZip(true);
    try {
      const zipFiles = images.map(img => ({
        name: img.filename,
        blob: img.blob
      }));
      
      const zipBlob = await createZip(zipFiles);
      downloadZip(zipBlob, `converted-images-${Date.now()}.zip`);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Converted Images ({images.length})
          </h3>
          <div className="flex gap-2">
            <Button 
              onClick={handleDownloadAll}
              disabled={isCreatingZip}
              className="flex items-center gap-2"
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
              <Button variant="outline" onClick={onClear}>
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onPreview={handlePreview}
            />
          ))}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
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
                  <span className="font-medium">Dimensions:</span><br />
                  {previewImage.width} × {previewImage.height}
                </div>
                <div>
                  <span className="font-medium">Format:</span><br />
                  {previewImage.actualFormat.split('/')[1].toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">File Size:</span><br />
                  {(previewImage.blob.size / 1024).toFixed(1)} KB
                </div>
                <div>
                  <span className="font-medium">Original Size:</span><br />
                  {(previewImage.originalFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <Button 
                onClick={() => downloadFile(previewImage.blob, previewImage.filename)}
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
