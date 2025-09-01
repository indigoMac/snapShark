'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye } from 'lucide-react';
import { ProcessedImage } from '@/hooks/useImageProcessor';
import { formatFileSize } from '@/lib/utils';
import { FORMAT_NAMES } from '@/lib/formats';
import { downloadFile } from '@/lib/zip';

interface ImageCardProps {
  image: ProcessedImage;
  onPreview?: (image: ProcessedImage) => void;
}

export function ImageCard({ image, onPreview }: ImageCardProps) {
  const handleDownload = () => {
    downloadFile(image.blob, image.filename);
  };

  const handlePreview = () => {
    onPreview?.(image);
  };

  const previewUrl = URL.createObjectURL(image.blob);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative overflow-hidden">
        <img 
          src={previewUrl}
          alt={image.filename}
          className="w-full h-full object-cover"
          onLoad={() => URL.revokeObjectURL(previewUrl)}
        />
        
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
      
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm truncate flex-1">{image.filename}</h4>
            {image.fallbackUsed && (
              <Badge variant="outline" className="text-xs">
                Fallback
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Size:</span> {image.width} × {image.height}
            </div>
            <div>
              <span className="font-medium">Format:</span> {FORMAT_NAMES[image.actualFormat]}
            </div>
            <div>
              <span className="font-medium">File size:</span> {formatFileSize(image.blob.size)}
            </div>
            <div>
              <span className="font-medium">Original:</span> {formatFileSize(image.originalFile.size)}
            </div>
          </div>
          
          {image.fallbackUsed && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Format fallback used: your browser doesn't support the requested format
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
