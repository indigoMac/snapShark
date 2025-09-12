'use client';

// import Image from 'next/image'; // Removed to avoid optimization issues with static icons
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  variant?: 'icon' | 'full' | 'embedded';
  className?: string;
  priority?: boolean;
}

const sizeMap = {
  xs: { width: 16, height: 16 },
  sm: { width: 24, height: 24 },
  md: { width: 40, height: 40 },
  lg: { width: 56, height: 56 },
  xl: { width: 80, height: 80 },
  '2xl': { width: 120, height: 120 },
  '3xl': { width: 160, height: 160 },
  '4xl': { width: 200, height: 200 },
  '5xl': { width: 280, height: 280 },
};

export function Logo({
  size = 'md',
  variant = 'icon',
  className,
  priority = false,
}: LogoProps) {
  const dimensions = sizeMap[size];

  // Choose the appropriate logo based on variant and size
  const getLogoSrc = () => {
    if (variant === 'embedded') {
      return '/snapshark-logo-embedded.svg';
    }

    if (variant === 'full') {
      return '/snapshark-logo@2x.png';
    }

    // For icon variant, choose the best size
    const iconSize = dimensions.width;
    if (iconSize <= 16) return '/snapshark-icon-16.png';
    if (iconSize <= 32) return '/snapshark-icon-32.png';
    if (iconSize <= 128) return '/snapshark-icon-128.png';
    if (iconSize <= 256) return '/snapshark-icon-256.png';
    if (iconSize <= 512) return '/snapshark-icon-512.png';
    return '/snapshark-icon-1024.png';
  };

  const logoSrc = getLogoSrc();
  const isVectorLogo = variant === 'embedded';

  return (
    <div className={cn('flex-shrink-0', className)}>
      {/* Use regular img tag for static icons to avoid Next.js optimization issues */}
      <img
        src={logoSrc}
        alt="SnapShark Logo"
        width={dimensions.width}
        height={dimensions.height}
        className={cn(
          'object-contain'
          // Note: SVG logos should not be inverted as they have their own colors
        )}
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      />
    </div>
  );
}

// Convenience components for common use cases
export function LogoIcon({
  size = 'md',
  className,
  priority,
}: Omit<LogoProps, 'variant'>) {
  return (
    <Logo
      variant="icon"
      size={size}
      className={className}
      priority={priority}
    />
  );
}

export function LogoFull({
  size = 'lg',
  className,
  priority,
}: Omit<LogoProps, 'variant'>) {
  return (
    <Logo
      variant="full"
      size={size}
      className={className}
      priority={priority}
    />
  );
}

export function LogoEmbedded({
  size = 'lg',
  className,
  priority,
}: Omit<LogoProps, 'variant'>) {
  return (
    <Logo
      variant="embedded"
      size={size}
      className={className}
      priority={priority}
    />
  );
}
