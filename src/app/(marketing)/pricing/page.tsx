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
    <div className="mx-auto max-w-5xl space-y-12 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl text-center">
        <p className="brand-eyebrow">Pricing</p>
        <h1 className="brand-title mt-3 text-4xl sm:text-5xl">
          Free for diving. Pro when you need more.
        </h1>
        <p className="brand-lede mt-4">
          The logbook and colour fix stay free. Upgrade for batch tools and
          advanced formats — cancel anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <Card className="brand-panel relative border-[rgb(126_200_192_/_0.18)] bg-[rgb(6_38_47_/_0.55)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#7ec8c0]" />
              <CardTitle className="text-[#e8f4f1]">Free</CardTitle>
            </div>
            <CardDescription className="text-[#9bb8b3]">
              Logbook, colour fix, and core photo tools
            </CardDescription>
            <div className="pt-4">
              <span className="brand-display text-3xl text-[#e8f4f1]">£0</span>
              <span className="text-[#7a9a95]">/forever</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">Single image processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">Basic formats (JPG, PNG, WebP)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">Resize & scale images</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">Quality control</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">100% privacy (no uploads)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">PWA installable</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">One-time trial (3 files batch)</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-[rgb(126_200_192_/_0.35)] bg-[rgb(6_38_47_/_0.75)] shadow-none">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="rounded-none bg-[#7ec8c0] text-[#06262f] hover:bg-[#7ec8c0]">
              <Crown className="mr-1 h-3 w-3" />
              Most Popular
            </Badge>
          </div>

          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#7ec8c0]" />
              <CardTitle className="text-[#e8f4f1]">Pro</CardTitle>
            </div>
            <CardDescription className="text-[#9bb8b3]">
              Batch processing and advanced formats when you need them
            </CardDescription>
            <div className="space-y-2 pt-4">
              <div className="flex items-baseline gap-1">
                <span className="brand-display text-3xl text-[#e8f4f1]">£3</span>
                <span className="text-[#7a9a95]">/month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-[#7ec8c0]">
                  £15/year
                </span>
                <Badge
                  variant="secondary"
                  className="rounded-none text-xs"
                >
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
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">Batch process up to 50 images</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">
                  Smart print packages (auto-generates 7-10+ sizes)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">
                  Advanced formats (AVIF, HEIC/HEIF)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">ZIP download for batches</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">Metadata stripping (privacy)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">Custom preset saving</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#7ec8c0]" />
                <span className="text-sm">Priority support</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handleUpgrade('yearly')}
                className="w-full rounded-none bg-[#e8f4f1] text-[#06262f] hover:bg-white"
                disabled={isPro}
              >
                <Crown className="mr-2 h-4 w-4" />
                {isPro ? 'Already Pro' : 'Get Pro - £15/year'}
              </Button>
              <Button
                onClick={() => handleUpgrade('monthly')}
                variant="outline"
                className="w-full rounded-none border-[rgb(126_200_192_/_0.35)] text-[#e8f4f1] hover:bg-[rgb(126_200_192_/_0.08)]"
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
        <h2 className="brand-display text-center text-2xl tracking-tight text-[#e8f4f1]">
          Feature Comparison
        </h2>

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
                  <Check className="mx-auto h-4 w-4 text-[#7ec8c0]" />
                </td>
                <td className="text-center p-4">
                  <Check className="mx-auto h-4 w-4 text-[#7ec8c0]" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Batch processing</td>
                <td className="text-center p-4 text-muted-foreground">
                  Trial only
                </td>
                <td className="text-center p-4">
                  <Check className="mx-auto h-4 w-4 text-[#7ec8c0]" />
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
                  <Check className="mx-auto h-4 w-4 text-[#7ec8c0]" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">ZIP download</td>
                <td className="text-center p-4 text-muted-foreground">No</td>
                <td className="text-center p-4">
                  <Check className="mx-auto h-4 w-4 text-[#7ec8c0]" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Metadata stripping</td>
                <td className="text-center p-4 text-muted-foreground">No</td>
                <td className="text-center p-4">
                  <Check className="mx-auto h-4 w-4 text-[#7ec8c0]" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="brand-display text-center text-2xl tracking-tight text-[#e8f4f1]">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is my data safe?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All image processing happens directly in your browser, so the
                files you convert, resize, or correct never leave your device.
                The dive Logbook is the one exception: anything you choose to
                save there, including photos you attach, is stored on your
                account so it syncs across devices. You can export or delete it
                whenever you like.
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
