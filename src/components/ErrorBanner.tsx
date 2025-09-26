'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  error: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            If this persists, contact support: snapshark2025@gmail.com
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-800/50 rounded transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}
