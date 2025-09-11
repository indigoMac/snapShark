'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogoIcon } from '@/components/Logo';
import { Crown, Check, Zap } from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function PaywallDialog({
  open,
  onOpenChange,
  feature,
}: PaywallDialogProps) {
  const { hasTrialAvailable, useTrial, upgradeToPro } = usePaywall();

  const handleTrial = () => {
    if (useTrial()) {
      onOpenChange(false);
    }
  };

  const handleUpgrade = () => {
    // Redirect to pricing page for upgrade
    window.location.href = '/pricing';
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 mb-2">
            <LogoIcon size="xl" />
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <DialogTitle>Upgrade to Pro</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-center">
            {feature ? `${feature} requires` : 'Unlock'} Pro features for
            powerful batch processing and advanced tools.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Batch process multiple images</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Professional presets & templates</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">AVIF format support</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">ZIP download for batches</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">HEIC/HEIF support</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Metadata stripping</span>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Pro Plan</h4>
              <Badge variant="secondary">Best Value</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">£3</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-green-600">
                  £15
                </span>
                <span className="text-muted-foreground">/year</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Save 58%
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {hasTrialAvailable && (
            <Button variant="outline" onClick={handleTrial} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Try Free (3 files)
            </Button>
          )}
          <Button onClick={handleUpgrade} className="flex-1">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
