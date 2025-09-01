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
import { Crown, Settings, CreditCard, Shield, Download } from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';
import { useUser, RedirectToSignIn } from '@clerk/nextjs';

export default function AccountPage() {
  const { isPro, upgradeToProMock } = usePaywall();
  const { user: clerkUser, isLoaded } = useUser();

  const handleManageSubscription = () => {
    // TODO: Integrate with Stripe Customer Portal
    console.log('Opening Stripe Customer Portal...');
  };

  const handleUpgrade = () => {
    upgradeToProMock();
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
                      ? 'Access to all Pro features and unlimited batch processing'
                      : 'Free plan with basic image processing features'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {isPro ? (
                  <Button onClick={handleManageSubscription} variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
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
    </div>
  );
}
