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
import { Check, Crown, Shield, Sparkles } from 'lucide-react';
import { usePaywall } from '@/hooks/usePaywall';
import { STRIPE_CONFIG } from '@/lib/stripe';
import { FREE_COLOUR_BATCH_LIMIT, FREE_PHOTO_LIMIT } from '@/lib/plan';

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
          Free for the first trip. Pro when the card is full.
        </h1>
        <p className="brand-lede mt-4">
          Log dives, fix a few photos, and send the trip for free. Upgrade when
          you come back with a whole weekend of shots.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <Card className="brand-panel relative border-[rgb(126_200_192_/_0.18)] bg-[rgb(6_38_47_/_0.55)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#7ec8c0]" />
              <CardTitle className="text-[#e8f4f1]">Free</CardTitle>
            </div>
            <CardDescription className="text-[#9bb8b3]">
              The loop that makes the logbook worth opening
            </CardDescription>
            <div className="pt-4">
              <span className="brand-display text-3xl text-[#e8f4f1]">£0</span>
              <span className="text-[#7a9a95]">/forever</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {[
                'Dive logbook, map pins, and trips',
                `Colour-fix ${FREE_COLOUR_BATCH_LIMIT} photos at a time`,
                `Keep ${FREE_PHOTO_LIMIT} photos in your logbook`,
                'Share a trip or place as a link',
                'Image card for WhatsApp, Messages, Instagram',
                'iPhone photos (HEIC) in Safari',
                'Single-image converter tools',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#7ec8c0]" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        <Card className="relative border-[rgb(126_200_192_/_0.35)] bg-[rgb(6_38_47_/_0.75)] shadow-none">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="rounded-none bg-[#7ec8c0] text-[#06262f] hover:bg-[#7ec8c0]">
              <Crown className="mr-1 h-3 w-3" />
              For the trip
            </Badge>
          </div>

          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#7ec8c0]" />
              <CardTitle className="text-[#e8f4f1]">Pro</CardTitle>
            </div>
            <CardDescription className="text-[#9bb8b3]">
              Batch colour-fix and room for a full card of photos
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
                <Badge variant="secondary" className="rounded-none text-xs">
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
              {[
                'Colour-fix up to 50 photos in one go',
                'More logbook photo storage',
                'ZIP download of a corrected batch',
                'Converter extras: AVIF, print packages, presets',
                'Background removal',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#7ec8c0]" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
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

      <div className="space-y-6">
        <h2 className="brand-display text-center text-2xl tracking-tight text-[#e8f4f1]">
          What you actually pay for
        </h2>

        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[32rem] border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">Feature</th>
                <th className="p-4 text-center">Free</th>
                <th className="p-4 text-center">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Logbook, map, trips', true, true],
                ['Share a trip or place', true, true],
                [
                  'Colour-fix at once',
                  `${FREE_COLOUR_BATCH_LIMIT} photos`,
                  '50 photos',
                ],
                ['Logbook photos', `${FREE_PHOTO_LIMIT}`, 'A full trip’s worth'],
                ['iPhone HEIC (Safari)', true, true],
                ['Batch converter / ZIP', 'Trial', true],
                ['AVIF output', false, true],
                ['Print packages', false, true],
              ].map(([feature, free, pro]) => (
                <tr key={String(feature)} className="border-b">
                  <td className="p-4">{feature}</td>
                  <td className="p-4 text-center">
                    {free === true ? (
                      <Check className="mx-auto h-4 w-4 text-[#7ec8c0]" />
                    ) : free === false ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="text-muted-foreground">{free}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {pro === true ? (
                      <Check className="mx-auto h-4 w-4 text-[#7ec8c0]" />
                    ) : (
                      <span>{pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="brand-display text-center text-2xl tracking-tight text-[#e8f4f1]">
          Frequently Asked Questions
        </h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Do I need Pro to share?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No. A share link is free. That is how you send a trip to WhatsApp
              or Messages. Pro is for colour-fixing a whole card and keeping
              more photos.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Is my data safe?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Colour-fix and the other photo tools run in your browser, so those
              files never leave your device. The logbook is stored on your
              account so it syncs. A share link only shows what you choose to
              publish; turn it off and the old URL stops working. You can export
              or delete everything from your account.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Yes. You keep Pro until the end of the billing period. Your
              logbook stays; you just go back to the free photo limits.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We offer a 30-day money-back guarantee. If Pro is not right,
              email us within 30 days for a full refund.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
