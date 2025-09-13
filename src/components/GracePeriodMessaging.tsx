'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  CheckCircle,
  Calendar,
  RefreshCcw,
  Info,
} from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';

interface GracePeriodMessagingProps {
  onManageSubscription?: () => void;
  onRetryPayment?: () => void;
}

export function GracePeriodMessaging({
  onManageSubscription,
  onRetryPayment,
}: GracePeriodMessagingProps) {
  const {
    subscriptionStatus,
    lastPaymentFailed,
    currentPeriodEnd,
    currentPeriodStart,
    cancelAt,
    cancelAtPeriodEnd,
  } = usePaywall();

  // Helper function to calculate days remaining
  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to get grace period info
  const getGracePeriodInfo = () => {
    const now = new Date();

    if (subscriptionStatus === 'past_due') {
      const daysRemaining = currentPeriodEnd
        ? getDaysRemaining(currentPeriodEnd)
        : null;

      return {
        type: 'critical' as const,
        title: 'Payment Required - Grace Period Active',
        timeframe: daysRemaining
          ? `${daysRemaining} days remaining`
          : 'Limited time',
        message:
          daysRemaining && daysRemaining > 0
            ? `You have ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} to update your payment method before Pro access is suspended.`
            : 'Your Pro access will be suspended soon. Update your payment method immediately.',
        actionRequired: true,
        severity: 'high' as const,
      };
    }

    if (cancelAtPeriodEnd && cancelAt) {
      const daysRemaining = getDaysRemaining(cancelAt);

      return {
        type: 'canceling' as const,
        title: 'Subscription Ending Soon',
        timeframe: daysRemaining
          ? `${daysRemaining} days remaining`
          : 'Ending soon',
        message:
          daysRemaining && daysRemaining > 0
            ? `Your Pro subscription will end in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. You can reactivate anytime before then.`
            : 'Your Pro subscription ends today. Reactivate now to maintain Pro access.',
        actionRequired: false,
        severity: 'medium' as const,
      };
    }

    if (subscriptionStatus === 'unpaid') {
      return {
        type: 'critical' as const,
        title: 'Payment Overdue - Immediate Action Required',
        timeframe: 'Overdue',
        message:
          'Your payment is significantly overdue. Update your payment method now to restore Pro access.',
        actionRequired: true,
        severity: 'high' as const,
      };
    }

    if (lastPaymentFailed && subscriptionStatus === 'active') {
      const failureDate = new Date(lastPaymentFailed);
      const daysSinceFailure = Math.floor(
        (now.getTime() - failureDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        type: 'warning' as const,
        title: 'Recent Payment Issue Resolved',
        timeframe: `${daysSinceFailure} day${daysSinceFailure === 1 ? '' : 's'} ago`,
        message:
          'Your payment issue has been resolved and your Pro subscription is active. Thank you for updating your payment method.',
        actionRequired: false,
        severity: 'low' as const,
      };
    }

    return null;
  };

  const gracePeriodInfo = getGracePeriodInfo();

  if (!gracePeriodInfo) return null;

  const getAlertVariant = () => {
    switch (gracePeriodInfo.severity) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'default' as const;
      case 'low':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  const getStatusIcon = () => {
    switch (gracePeriodInfo.type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />;
      case 'canceling':
        return <Clock className="h-5 w-5" />;
      case 'warning':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-amber-400">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">{gracePeriodInfo.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {gracePeriodInfo.timeframe}
                </Badge>
                {gracePeriodInfo.actionRequired && (
                  <Badge variant="destructive" className="text-xs">
                    Action Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert variant={getAlertVariant()}>
          <AlertDescription>{gracePeriodInfo.message}</AlertDescription>
        </Alert>

        {/* Timeline Display */}
        {(currentPeriodEnd || cancelAt) && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h4>
            <div className="space-y-2 text-sm">
              {currentPeriodStart && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Billing period started:
                  </span>
                  <span>
                    {new Date(currentPeriodStart).toLocaleDateString()}
                  </span>
                </div>
              )}
              {currentPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {subscriptionStatus === 'past_due'
                      ? 'Grace period ends:'
                      : 'Current period ends:'}
                  </span>
                  <span className="font-medium">
                    {new Date(currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              {cancelAt && cancelAtPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subscription ends:
                  </span>
                  <span className="font-medium text-red-600">
                    {new Date(cancelAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {gracePeriodInfo.actionRequired && (
          <div className="flex flex-col sm:flex-row gap-3">
            {onRetryPayment && (
              <Button
                onClick={onRetryPayment}
                className="bg-red-600 hover:bg-red-700 flex-1"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Update Payment Method
              </Button>
            )}
            {onManageSubscription && (
              <Button
                onClick={onManageSubscription}
                variant="outline"
                className="flex-1"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-1">
            What happens next?
          </h5>
          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            {subscriptionStatus === 'past_due' && (
              <>
                <p>• Pro features remain active during the grace period</p>
                <p>• We'll attempt to collect payment automatically</p>
                <p>
                  • Update your payment method to avoid service interruption
                </p>
              </>
            )}
            {cancelAtPeriodEnd && (
              <>
                <p>• Pro features remain active until the end date</p>
                <p>• You can reactivate your subscription anytime</p>
                <p>• Your settings and data are preserved</p>
              </>
            )}
            {subscriptionStatus === 'unpaid' && (
              <>
                <p>• Pro features are currently suspended</p>
                <p>• Update payment to restore immediate access</p>
                <p>• Contact support if you need assistance</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
