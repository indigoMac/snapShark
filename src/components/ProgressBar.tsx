'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  current: number;
  total: number;
  currentFileName?: string;
  className?: string;
}

export function ProgressBar({ current, total, currentFileName, className }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const isComplete = current >= total && total > 0;

  if (total === 0) return null;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {!isComplete && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="font-medium">
                {isComplete ? 'Complete!' : 'Processing images...'}
              </span>
            </div>
            <span className="text-muted-foreground">
              {current} / {total}
            </span>
          </div>
          
          <Progress value={percentage} className="h-2" />
          
          {currentFileName && !isComplete && (
            <p className="text-xs text-muted-foreground truncate">
              Current: {currentFileName}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
