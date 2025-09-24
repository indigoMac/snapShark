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
import { Check, Crown, Zap, Shield, Sparkles } from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';
import { STRIPE_CONFIG } from '@/lib/stripe';

export default function PricingPage() {
  const { upgradeToPro, isPro } = usePaywall();

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    const priceId =
      plan === 'yearly'
        ? STRIPE_CONFIG.PRO_YEARLY_PRICE_ID
        : STRIPE_CONFIG.PRO_PRICE_ID;

    if (!priceId) {
      alert(
        'Pricing configuration error. Please try again or contact support.'
      );
      return;
    }

    upgradeToPro(priceId, plan === 'yearly');
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start free and upgrade when you need more power. No hidden fees,
          cancel anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <CardTitle>Free</CardTitle>
            </div>
            <CardDescription>
              Perfect for personal use and trying out the app
            </CardDescription>
            <div className="pt-4">
              <span className="text-3xl font-bold">£0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Single image processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Basic formats (JPG, PNG, WebP)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Resize & scale images</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Quality control</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">100% privacy (no uploads)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">PWA installable</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">One-time trial (3 files batch)</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-primary shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">
              <Crown className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
          </div>

          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>Pro</CardTitle>
            </div>
            <CardDescription>
              For professionals and power users who need advanced features
            </CardDescription>
            <div className="pt-4 space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">£3</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-green-600">
                  £15/year
                </span>
                <Badge variant="secondary" className="text-xs">
                  Save 58%
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                Everything in Free, plus:
              </div>

              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Batch process up to 50 images</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  Smart print packages (auto-generates 7-10+ sizes)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  Advanced formats (AVIF, HEIC/HEIF)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">ZIP download for batches</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Metadata stripping (privacy)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Custom preset saving</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">Priority support</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handleUpgrade('yearly')}
                className="w-full"
                disabled={isPro}
              >
                <Crown className="w-4 h-4 mr-2" />
                {isPro ? 'Already Pro' : 'Get Pro - £15/year'}
              </Button>
              <Button
                onClick={() => handleUpgrade('monthly')}
                variant="outline"
                className="w-full"
                size="sm"
                disabled={isPro}
              >
                {isPro ? 'Current Plan' : 'Monthly - £3/month'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Comparison */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Feature Comparison</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Feature</th>
                <th className="text-center p-4">Free</th>
                <th className="text-center p-4">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">Single image processing</td>
                <td className="text-center p-4">
                  <Check className="w-4 h-4 text-green-500 mx-auto" />
                </td>
                <td className="text-center p-4">
                  <Check className="w-4 h-4 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Batch processing</td>
                <td className="text-center p-4 text-muted-foreground">
                  Trial only
                </td>
                <td className="text-center p-4">
                  <Check className="w-4 h-4 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Max files per batch</td>
                <td className="text-center p-4 text-muted-foreground">
                  3 (trial)
                </td>
                <td className="text-center p-4">50</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Output formats</td>
                <td className="text-center p-4">JPG, PNG, WebP</td>
                <td className="text-center p-4">JPG, PNG, WebP, AVIF</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Input formats</td>
                <td className="text-center p-4">JPG, PNG, WebP</td>
                <td className="text-center p-4">JPG, PNG, WebP, HEIC/HEIF</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Professional presets</td>
                <td className="text-center p-4 text-muted-foreground">
                  Limited
                </td>
                <td className="text-center p-4">
                  <Check className="w-4 h-4 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">ZIP download</td>
                <td className="text-center p-4 text-muted-foreground">No</td>
                <td className="text-center p-4">
                  <Check className="w-4 h-4 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Metadata stripping</td>
                <td className="text-center p-4 text-muted-foreground">No</td>
                <td className="text-center p-4">
                  <Check className="w-4 h-4 text-green-500 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is my data safe?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Absolutely! All image processing happens directly in your
                browser. No files are ever uploaded to our servers. Your images
                never leave your device.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your Pro subscription at any time. You'll
                continue to have access to Pro features until the end of your
                billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                What happens to my custom presets if I cancel?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Custom presets are saved locally in your browser, so they'll
                remain available even if you cancel your Pro subscription.
                However, you won't be able to create new ones.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We offer a 30-day money-back guarantee. If you're not satisfied
                with Pro features, contact us within 30 days for a full refund.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
