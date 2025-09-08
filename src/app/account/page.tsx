'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Crown,
  Settings,
  CreditCard,
  Shield,
  Download,
  X,
  AlertTriangle,
} from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';
import { useUser, RedirectToSignIn } from '@clerk/nextjs';
import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function AccountPageContent() {
  const {
    isPro,
    upgradeToPro,
    manageSubscription,
    cancelSubscription,
    subscriptionStatus,
    subscriptionId,
    cancelAtPeriodEnd,
    cancelAt,
  } = usePaywall();
  const { user: clerkUser, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  // Cancel subscription dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelAtPeriodEndChoice, setCancelAtPeriodEndChoice] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Handle successful payment return
  useEffect(() => {
    if (success === 'true' && clerkUser) {
      // Force Clerk to refresh user data instead of page reload
      const refreshUserData = async () => {
        try {
          await clerkUser.reload();
          console.log('✅ Clerk user data refreshed');
        } catch (error) {
          console.error('❌ Failed to refresh user data:', error);
        }
      };

      // Try refreshing user data after webhook processing time
      setTimeout(refreshUserData, 2000);
    }
  }, [success, clerkUser]);

  const handleManageSubscription = () => {
    manageSubscription();
  };

  const handleUpgrade = () => {
    // Redirect to pricing page for upgrade
    window.location.href = '/pricing';
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!subscriptionId) {
      setMessage({ type: 'error', text: 'No subscription found to cancel' });
      return;
    }

    setIsCanceling(true);
    setMessage(null);
    try {
      await cancelSubscription(subscriptionId, cancelAtPeriodEndChoice);
      setShowCancelDialog(false);

      if (cancelAtPeriodEndChoice) {
        setMessage({
          type: 'success',
          text: "Your subscription will be canceled at the end of your current billing period. You'll continue to have Pro access until then.",
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Your subscription has been canceled immediately. You no longer have Pro access.',
        });
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
      setMessage({
        type: 'error',
        text: `Failed to cancel subscription: ${error.message}`,
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleCancelDialogClose = () => {
    if (isCanceling) return; // Prevent closing during cancellation
    setShowCancelDialog(false);
    setCancelAtPeriodEndChoice(true); // Reset to default
  };

  if (!isLoaded) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!clerkUser) {
    return <RedirectToSignIn />;
  }

  const user = {
    email: clerkUser?.emailAddresses[0]?.emailAddress || 'No email',
    name: clerkUser?.fullName || clerkUser?.firstName || 'User',
    joinDate: clerkUser?.createdAt?.toLocaleDateString() || 'Recently',
    plan: isPro ? 'Pro' : 'Free',
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your subscription and account preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <p>{message.text}</p>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Member Since</label>
                <p className="text-sm text-muted-foreground">{user.joinDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </CardTitle>
            <CardDescription>
              Manage your SnapShark subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Current Plan:</span>
                    <Badge
                      variant={isPro ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {isPro && <Crown className="w-3 h-3" />}
                      {user.plan}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPro
                      ? cancelAtPeriodEnd
                        ? `Pro access until ${cancelAt ? new Date(cancelAt).toLocaleDateString() : 'end of billing period'} - will not renew`
                        : 'Access to all Pro features and unlimited batch processing'
                      : 'Free plan with basic image processing features'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {isPro ? (
                  <>
                    <Button
                      onClick={handleManageSubscription}
                      variant="outline"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </Button>
                    <Button
                      onClick={handleCancelClick}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={cancelAtPeriodEnd}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {cancelAtPeriodEnd ? 'Will Cancel' : 'Cancel'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleUpgrade}>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>

            {isPro && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Pro Features Active</h4>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>✓ Batch processing (up to 50 files)</div>
                  <div>✓ Professional presets</div>
                  <div>✓ AVIF & HEIC support</div>
                  <div>✓ ZIP download</div>
                  <div>✓ Metadata stripping</div>
                  <div>✓ Priority support</div>
                </div>
              </div>
            )}

            {subscriptionStatus === 'canceled' && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">
                  Subscription Canceled
                </h4>
                <p className="text-sm text-orange-700">
                  Your subscription has been canceled. You may still have Pro
                  access until the end of your billing period.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>
              Your data and privacy are our top priority
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">100% Client-Side Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    All image processing happens in your browser. No files are
                    ever uploaded to our servers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Local Storage Only</h4>
                  <p className="text-sm text-muted-foreground">
                    Settings and presets are saved locally in your browser. We
                    never see your data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">GDPR Compliant</h4>
                  <p className="text-sm text-muted-foreground">
                    We only collect the minimum data necessary for billing and
                    account management.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              App Data
            </CardTitle>
            <CardDescription>
              Manage your local app data and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Custom Presets</h4>
                <p className="text-sm text-muted-foreground">
                  Your saved custom presets are stored locally
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Export Presets
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">App Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Clear all local app data and reset to defaults
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Reset App Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={handleCancelDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your SnapShark Pro subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">
                What happens when you cancel:
              </h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• You'll lose access to batch processing (50+ files)</li>
                <li>• Professional presets will be disabled</li>
                <li>• AVIF & HEIC support will be removed</li>
                <li>• ZIP download functionality will be disabled</li>
              </ul>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="cancelType"
                  checked={cancelAtPeriodEndChoice}
                  onChange={() => setCancelAtPeriodEndChoice(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">
                    Cancel at end of billing period (Recommended)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Keep Pro access until your current billing period ends
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="cancelType"
                  checked={!cancelAtPeriodEndChoice}
                  onChange={() => setCancelAtPeriodEndChoice(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">Cancel immediately</div>
                  <div className="text-sm text-muted-foreground">
                    Lose Pro access right away (no refund)
                  </div>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDialogClose}
              disabled={isCanceling}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isCanceling}
            >
              {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
