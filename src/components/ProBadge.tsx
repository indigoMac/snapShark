'use client';

import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface ProBadgeProps {
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
}

export function ProBadge({ className, variant = 'secondary' }: ProBadgeProps) {
  return (
    <Badge variant={variant} className={`text-xs ${className}`}>
      <Crown className="w-3 h-3 mr-1" />
      Pro
    </Badge>
  );
}
