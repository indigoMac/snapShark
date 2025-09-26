/**
 * Simple error tracking utility for SnapShark
 * Can be enhanced with Sentry or other services later
 */

export interface ErrorContext {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'payment' | 'processing' | 'api' | 'ui' | 'system';
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  context: ErrorContext;
}

/**
 * Log error for monitoring and debugging
 * In production, this would send to a monitoring service
 */
export function trackError(
  error: Error | string,
  context: Partial<ErrorContext> = {}
): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' ? error.stack : undefined;

  const errorReport: ErrorReport = {
    message: errorMessage,
    stack,
    context: {
      timestamp: new Date().toISOString(),
      severity: context.severity || 'medium',
      category: context.category || 'system',
      url: typeof window !== 'undefined' ? window.location.href : context.url,
      userAgent:
        typeof window !== 'undefined' ? navigator.userAgent : context.userAgent,
      ...context,
    },
  };

  // Console logging for development/debugging
  if (process.env.NODE_ENV === 'development') {
    console.group(
      `🚨 Error Tracked [${errorReport.context.severity.toUpperCase()}]`
    );
    console.error('Message:', errorReport.message);
    console.log('Context:', errorReport.context);
    if (errorReport.stack) {
      console.log('Stack:', errorReport.stack);
    }
    console.groupEnd();
  }

  // Production logging (can be enhanced with external services)
  if (process.env.NODE_ENV === 'production') {
    // For now, log to server console
    console.error('[ERROR_TRACKING]', JSON.stringify(errorReport));

    // TODO: Send to external monitoring service
    // Example: Sentry, LogRocket, DataDog, etc.
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { contexts: { custom: errorReport.context } });
    // }
  }
}

/**
 * Track API errors specifically
 */
export function trackAPIError(
  error: Error | string,
  endpoint: string,
  userId?: string,
  additionalData?: Record<string, any>
): void {
  trackError(error, {
    category: 'api',
    severity: 'high',
    userId,
    additionalData: {
      endpoint,
      ...additionalData,
    },
  });
}

/**
 * Track payment-related errors (critical for business)
 */
export function trackPaymentError(
  error: Error | string,
  userId?: string,
  stripeSessionId?: string,
  additionalData?: Record<string, any>
): void {
  trackError(error, {
    category: 'payment',
    severity: 'critical',
    userId,
    additionalData: {
      stripeSessionId,
      ...additionalData,
    },
  });
}

/**
 * Track authentication errors
 */
export function trackAuthError(
  error: Error | string,
  userId?: string,
  additionalData?: Record<string, any>
): void {
  trackError(error, {
    category: 'auth',
    severity: 'high',
    userId,
    additionalData,
  });
}

/**
 * Track image processing errors
 */
export function trackProcessingError(
  error: Error | string,
  userId?: string,
  fileInfo?: { name: string; size: number; type: string },
  additionalData?: Record<string, any>
): void {
  trackError(error, {
    category: 'processing',
    severity: 'medium',
    userId,
    additionalData: {
      fileInfo,
      ...additionalData,
    },
  });
}

/**
 * Track UI errors (JavaScript errors in components)
 */
export function trackUIError(
  error: Error | string,
  componentName?: string,
  userAction?: string,
  additionalData?: Record<string, any>
): void {
  trackError(error, {
    category: 'ui',
    severity: 'low',
    additionalData: {
      componentName,
      userAction,
      ...additionalData,
    },
  });
}

/**
 * Performance monitoring helper
 */
export function trackPerformance(
  metricName: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' = 'ms',
  additionalData?: Record<string, any>
): void {
  const performanceData = {
    metric: metricName,
    value,
    unit,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    ...additionalData,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `📊 Performance [${metricName}]:`,
      `${value}${unit}`,
      performanceData
    );
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('[PERFORMANCE_TRACKING]', JSON.stringify(performanceData));
  }
}

/**
 * Global error handler for unhandled errors
 * Call this in your root layout or _app.tsx
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      trackUIError(event.error || event.message, undefined, 'unhandled_error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      trackError(event.reason?.message || 'Unhandled promise rejection', {
        category: 'system',
        severity: 'high',
        additionalData: {
          reason: event.reason,
        },
      });
    });
  }
}

/**
 * Helper to safely execute functions with error tracking
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T> | T,
  context: Partial<ErrorContext> = {}
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    trackError(error as Error, context);
    return null;
  }
}
