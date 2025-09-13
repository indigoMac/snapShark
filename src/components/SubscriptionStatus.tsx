'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Crown,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
} from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';

interface SubscriptionStatusProps {
  onManageSubscription?: () => void;
  onUpgrade?: () => void;
  onRetryPayment?: () => void;
}

export function SubscriptionStatus({
  onManageSubscription,
  onUpgrade,
  onRetryPayment,
}: SubscriptionStatusProps) {
  const {
    isPro,
    subscriptionStatus,
    cancelAtPeriodEnd,
    cancelAt,
    lastPaymentFailed,
  } = usePaywall();

  // Helper function to get status info
  const getStatusInfo = () => {
    if (!subscriptionStatus) {
      return {
        status: 'free',
        color: 'secondary' as const,
        icon: <Crown className="w-3 h-3" />,
        label: 'Free',
        description: 'Basic image processing features',
        severity: 'info' as const,
      };
    }

    switch (subscriptionStatus) {
      case 'active':
        if (cancelAtPeriodEnd) {
          return {
            status: 'canceling',
            color: 'outline' as const,
            icon: <Clock className="w-3 h-3" />,
            label: 'Canceling',
            description: `Pro access until ${
              cancelAt
                ? new Date(cancelAt).toLocaleDateString()
                : 'end of billing period'
            }`,
            severity: 'warning' as const,
          };
        }
        return {
          status: 'active',
          color: 'default' as const,
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Pro Active',
          description: 'All Pro features available',
          severity: 'success' as const,
        };

      case 'past_due':
        return {
          status: 'past_due',
          color: 'destructive' as const,
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'Payment Due',
          description: 'Update your payment method to continue Pro access',
          severity: 'error' as const,
        };

      case 'canceled':
        return {
          status: 'canceled',
          color: 'secondary' as const,
          icon: <XCircle className="w-3 h-3" />,
          label: 'Canceled',
          description: 'Subscription has been canceled',
          severity: 'info' as const,
        };

      case 'incomplete':
        return {
          status: 'incomplete',
          color: 'outline' as const,
          icon: <Clock className="w-3 h-3" />,
          label: 'Incomplete',
          description: 'Please complete your subscription setup',
          severity: 'warning' as const,
        };

      case 'incomplete_expired':
        return {
          status: 'incomplete_expired',
          color: 'destructive' as const,
          icon: <XCircle className="w-3 h-3" />,
          label: 'Setup Expired',
          description: 'Subscription setup expired. Please try again',
          severity: 'error' as const,
        };

      case 'unpaid':
        return {
          status: 'unpaid',
          color: 'destructive' as const,
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'Unpaid',
          description: 'Invoice is overdue. Please update payment method',
          severity: 'error' as const,
        };

      default:
        return {
          status: 'unknown',
          color: 'outline' as const,
          icon: <Crown className="w-3 h-3" />,
          label: subscriptionStatus,
          description: 'Contact support if you have questions',
          severity: 'warning' as const,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const hasPaymentIssue = ['past_due', 'unpaid'].includes(
    subscriptionStatus || ''
  );
  const needsAttention = [
    'past_due',
    'unpaid',
    'incomplete',
    'incomplete_expired',
  ].includes(subscriptionStatus || '');
  const showPaymentFailedAlert = lastPaymentFailed && !hasPaymentIssue;

  return (
    <div className="space-y-4">
      {/* Main Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Current Plan:</span>
              <Badge
                variant={statusInfo.color}
                className="flex items-center gap-1"
              >
                {statusInfo.icon}
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {statusInfo.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isPro && (subscriptionStatus === 'active' || hasPaymentIssue) ? (
            <>
              {hasPaymentIssue && onRetryPayment && (
                <Button
                  onClick={onRetryPayment}
                  variant="default"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Update Payment
                </Button>
              )}
              {onManageSubscription && (
                <Button onClick={onManageSubscription} variant="outline">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
            </>
          ) : (
            onUpgrade && (
              <Button onClick={onUpgrade}>
                <Crown className="w-4 h-4 mr-2" />
                {subscriptionStatus === 'canceled' ||
                subscriptionStatus === 'incomplete_expired'
                  ? 'Reactivate Pro'
                  : 'Upgrade to Pro'}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {needsAttention && (
        <Alert
          variant={statusInfo.severity === 'error' ? 'destructive' : 'default'}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {hasPaymentIssue && (
              <div>
                <strong>Action Required:</strong> Your payment method has
                failed. Update your payment information to maintain Pro access
                and avoid service interruption.
              </div>
            )}
            {subscriptionStatus === 'incomplete' && (
              <div>
                <strong>Setup Required:</strong> Complete your subscription
                setup to activate Pro features.
              </div>
            )}
            {subscriptionStatus === 'incomplete_expired' && (
              <div>
                <strong>Setup Expired:</strong> Your subscription setup has
                expired. Please start a new subscription to access Pro features.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Failed Alert (for recent failures on otherwise active accounts) */}
      {showPaymentFailedAlert && (
        <Alert variant="destructive">
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            <strong>Recent Payment Failure:</strong> We couldn't process your
            last payment on {new Date(lastPaymentFailed).toLocaleDateString()}.
            Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Grace Period Info */}
      {subscriptionStatus === 'past_due' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-2">
            ⏰ Grace Period Active
          </h4>
          <p className="text-sm text-amber-700">
            You still have Pro access while we attempt to collect payment.
            Update your payment method now to avoid losing Pro features.
          </p>
        </div>
      )}

      {/* Pro Features List (when active) */}
      {isPro && subscriptionStatus === 'active' && !cancelAtPeriodEnd && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">✨ Pro Features Active</h4>
          <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>✓ Batch processing (up to 50 files)</div>
            <div>✓ Professional packages</div>
            <div>✓ AVIF & HEIC support</div>
            <div>✓ ZIP download</div>
            <div>✓ Advanced upscaling</div>
            <div>✓ Metadata control</div>
          </div>
        </div>
      )}
    </div>
  );
}
