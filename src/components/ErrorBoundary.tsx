'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="max-w-md mx-auto mt-8 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <CardTitle className="text-red-700 dark:text-red-400">
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-red-600 dark:text-red-300 text-sm">
              An unexpected error occurred while processing your image or video.
            </p>
            
            {this.state.error && (
              <details className="text-left bg-red-100 dark:bg-red-900/30 p-3 rounded text-xs">
                <summary className="cursor-pointer font-medium text-red-700 dark:text-red-400 mb-2">
                  Error Details
                </summary>
                <code className="text-red-800 dark:text-red-200 whitespace-pre-wrap">
                  {this.state.error.message}
                </code>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for processing-specific errors
interface ProcessingErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

export function ProcessingErrorBoundary({ children, onReset }: ProcessingErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log processing-specific error details
    console.error('Processing error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  const fallbackUI = (
    <Card className="max-w-md mx-auto mt-8 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-orange-500" />
        </div>
        <CardTitle className="text-orange-700 dark:text-orange-400">
          Processing Error
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-orange-600 dark:text-orange-300 text-sm">
          There was an error processing your file. This could be due to:
        </p>
        
        <ul className="text-left text-orange-600 dark:text-orange-300 text-sm space-y-1">
          <li>• File format not fully supported</li>
          <li>• File too large or corrupted</li>
          <li>• Temporary processing issue</li>
        </ul>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Different File
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary fallback={fallbackUI} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

