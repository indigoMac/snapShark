'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Clock, X } from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';
import { useState, useEffect } from 'react';

export function GlobalGracePeriodAlert() {
  const {
    subscriptionStatus,
    manageSubscription,
    currentPeriodEnd,
    cancelAt,
    cancelAtPeriodEnd,
  } = usePaywall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // Helper function to calculate days remaining
  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Determine if we should show the alert
  useEffect(() => {
    if (isDismissed) {
      setShowAlert(false);
      return;
    }

    // Show for critical payment issues
    if (subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid') {
      setShowAlert(true);
      return;
    }

    // Show for imminent cancellation (3 days or less)
    if (cancelAtPeriodEnd && cancelAt) {
      const daysRemaining = getDaysRemaining(cancelAt);
      if (daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0) {
        setShowAlert(true);
        return;
      }
    }

    setShowAlert(false);
  }, [subscriptionStatus, cancelAtPeriodEnd, cancelAt, isDismissed]);

  // Reset dismissal when status changes to critical
  useEffect(() => {
    if (subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid') {
      setIsDismissed(false);
    }
  }, [subscriptionStatus]);

  if (!showAlert) return null;

  const getAlertInfo = () => {
    if (subscriptionStatus === 'past_due') {
      const daysRemaining = currentPeriodEnd
        ? getDaysRemaining(currentPeriodEnd)
        : null;
      return {
        type: 'critical' as const,
        title: 'Payment Required',
        message:
          daysRemaining && daysRemaining > 0
            ? `Pro access ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} without payment.`
            : 'Pro access will be suspended soon. Update payment now.',
        actionText: 'Update Payment',
        canDismiss: false,
      };
    }

    if (subscriptionStatus === 'unpaid') {
      return {
        type: 'critical' as const,
        title: 'Payment Overdue',
        message:
          'Your Pro access is suspended. Update your payment method to restore access.',
        actionText: 'Fix Payment Issue',
        canDismiss: false,
      };
    }

    if (cancelAtPeriodEnd && cancelAt) {
      const daysRemaining = getDaysRemaining(cancelAt);
      return {
        type: 'warning' as const,
        title: 'Subscription Ending Soon',
        message:
          daysRemaining && daysRemaining > 0
            ? `Pro subscription ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`
            : 'Pro subscription ends today.',
        actionText: 'Reactivate Pro',
        canDismiss: true,
      };
    }

    return null;
  };

  const alertInfo = getAlertInfo();
  if (!alertInfo) return null;

  return (
    <div className="sticky top-16 z-60 mx-4 mt-4">
      <Alert
        variant={alertInfo.type === 'critical' ? 'destructive' : 'default'}
        className="border-l-4 border-l-amber-400"
      >
        <div className="flex items-center gap-2">
          {alertInfo.type === 'critical' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-2">
                <strong>{alertInfo.title}:</strong>
                <span>{alertInfo.message}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => manageSubscription()}
                  className={
                    alertInfo.type === 'critical'
                      ? 'bg-white text-red-600 hover:bg-red-50 border border-red-200'
                      : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
                  }
                >
                  <CreditCard className="w-3 h-3 mr-1" />
                  {alertInfo.actionText}
                </Button>
                {alertInfo.canDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsDismissed(true)}
                    className="text-gray-600 hover:bg-gray-50 p-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
