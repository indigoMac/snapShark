'use client';

import { useCallback, useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatFileSize } from '@/lib/utils';
import { isInputFormatSupported } from '@/lib/formats';

interface DroppedFile {
  file: File;
  id: string;
  preview?: string;
}

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  accept?: string;
}

export function Dropzone({
  onFilesSelected,
  maxFiles = 10,
  disabled = false,
  accept = 'image/*',
}: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: DroppedFile[] = [];
      const validFiles: File[] = [];
      let errorMessage = '';

      Array.from(fileList).forEach((file) => {
        // Check file type
        if (
          !isInputFormatSupported(file.type) &&
          !file.name.match(/\.(heic|heif)$/i)
        ) {
          errorMessage = `${file.name} is not a supported image format`;
          return;
        }

        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          errorMessage = `${file.name} is too large (max 50MB)`;
          return;
        }

        const droppedFile: DroppedFile = {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
        };

        // Create preview for supported formats
        if (
          file.type.startsWith('image/') &&
          file.type !== 'image/heic' &&
          file.type !== 'image/heif'
        ) {
          droppedFile.preview = URL.createObjectURL(file);
        }

        newFiles.push(droppedFile);
        validFiles.push(file);
      });

      if (errorMessage) {
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
      }

      if (newFiles.length > 0) {
        const totalFiles = files.length + newFiles.length;
        if (totalFiles > maxFiles) {
          setError(`Maximum ${maxFiles} files allowed`);
          return;
        }

        setFiles((prev) => [...prev, ...newFiles]);
        onFilesSelected(validFiles);
      }
    },
    [files.length, maxFiles, onFilesSelected]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    },
    [disabled, processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles);
      }
    },
    [disabled, processFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      const fileToRemove = prev.find((f) => f.id === id);

      // Revoke preview URL
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  }, [files]);

  return (
    <div className="space-y-4 w-full">
      <Card
        className={cn(
          'relative border-2 border-dashed transition-colors cursor-pointer',
          dragActive && !disabled ? 'dropzone-active' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 text-center">
          <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Drop images here or tap to browse
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Supports PNG, JPG, WebP, and HEIC formats
          </p>
          <p className="text-xs text-muted-foreground px-2">
            Max {maxFiles} files, 50MB each • Privacy-first: files never leave
            your device
          </p>
        </div>
      </Card>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-medium">Selected Files ({files.length})</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="w-full sm:w-auto"
            >
              Clear All
            </Button>
          </div>

          <div className="grid gap-2 w-full">
            {files.map((file) => (
              <Card key={file.id} className="p-3 w-full">
                <div className="flex items-center gap-3 w-full min-w-0">
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <FileImage className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file.size)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
