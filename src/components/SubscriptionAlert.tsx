'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';
import { useState } from 'react';

export function SubscriptionAlert() {
  const { subscriptionStatus, manageSubscription, lastPaymentFailed } =
    usePaywall();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if dismissed or no issue
  if (isDismissed) return null;

  const hasPaymentIssue = ['past_due', 'unpaid'].includes(
    subscriptionStatus || ''
  );
  const hasRecentFailure = lastPaymentFailed && !hasPaymentIssue;

  // Only show for critical issues
  if (!hasPaymentIssue && !hasRecentFailure) return null;

  const getMessage = () => {
    if (subscriptionStatus === 'past_due') {
      return {
        title: 'Payment Required',
        message:
          'Your payment is overdue. Update your payment method to maintain Pro access.',
        urgent: true,
      };
    }
    if (subscriptionStatus === 'unpaid') {
      return {
        title: 'Invoice Overdue',
        message:
          'Your invoice is overdue. Please update your payment method immediately.',
        urgent: true,
      };
    }
    if (hasRecentFailure) {
      return {
        title: 'Payment Failed',
        message: `Payment failed on ${new Date(lastPaymentFailed).toLocaleDateString()}. Update your payment method to avoid service interruption.`,
        urgent: false,
      };
    }
    return null;
  };

  const messageInfo = getMessage();
  if (!messageInfo) return null;

  return (
    <div className="sticky top-16 z-40 mx-4 mt-4">
      <Alert variant="destructive" className="relative">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between gap-4">
            <div>
              <strong>{messageInfo.title}:</strong> {messageInfo.message}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => manageSubscription()}
                className="bg-white text-red-600 hover:bg-red-50 border border-red-200"
              >
                <CreditCard className="w-3 h-3 mr-1" />
                Update Payment
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDismissed(true)}
                className="text-red-600 hover:bg-red-50 p-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
