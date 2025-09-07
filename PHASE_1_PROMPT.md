# 🔧 Phase 1: Subscription Management Enhancement

## Project Context

You're working on **SnapShark**, a privacy-first, client-side image converter built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui. The app is **production-ready** with:

- ✅ **Working Clerk authentication** (custom domain: snap-shark.com)
- ✅ **Stripe payments integration** (webhooks, dual metadata sync)
- ✅ **Freemium model** (Free tier + Pro £3/month or £15/year)
- ✅ **Client-side image processing** (Canvas + Web Workers)
- ✅ **PWA capabilities** with service workers

## Current State

The app has **basic subscription management** working:

- Users can upgrade to Pro via Stripe Checkout
- Pro status syncs immediately (publicMetadata + privateMetadata)
- Basic "Manage Subscription" button (opens Stripe Customer Portal)
- Account page shows subscription status and Pro features

## Phase 1 Goals

**Enhance subscription management with:**

1. **Cancel Subscription Functionality**
   - Add cancel button on account page
   - Graceful handling (immediate access loss vs end of billing period)
   - Clear messaging about when access ends
   - Offer retention (discount/pause options)

2. **Enhanced Billing Management**
   - View past invoices and payment history
   - Update payment method inline (not just portal)
   - Handle failed payments gracefully
   - Show next billing date and amount

3. **Comprehensive Subscription Status Handling**
   - Handle all Stripe subscription states: active, past_due, canceled, unpaid, trialing
   - Show appropriate UI for each state
   - Grace periods for failed payments
   - Reactivation flow for canceled subscriptions

## Technical Requirements

- **Preserve existing functionality** - don't break what works
- **Use existing tech stack** - Next.js App Router, Clerk, Stripe, shadcn/ui
- **Follow current patterns** - especially the dual metadata approach for Clerk sync
- **Maintain client-side privacy** - no user data leaves their browser
- **Production-ready code** - proper error handling, loading states, accessibility

## Key Files to Work With

- `src/app/account/page.tsx` - Main subscription management UI
- `src/hooks/usePaywall.ts` - Subscription state management
- `src/app/api/stripe/webhook/route.ts` - Handles Stripe events
- `src/lib/stripe.ts` - Stripe configuration and utilities

## Current Webhook Events Handled

- `checkout.session.completed` - Sets user to Pro
- Need to add: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

## Important Constraints

1. **Don't break the working Pro upgrade flow**
2. **Maintain the dual metadata sync** (publicMetadata + privateMetadata)
3. **Keep the privacy-first approach**
4. **Use existing UI patterns and components**
5. **Handle all edge cases gracefully**

## Success Criteria

- [ ] Users can cancel subscriptions with clear messaging
- [ ] All subscription states are handled with appropriate UI
- [ ] Payment failures are handled gracefully with retry options
- [ ] Billing history and invoices are accessible
- [ ] Code is production-ready with proper error handling
- [ ] Existing functionality remains intact

## Starting Point

Begin with **one specific feature** - the cancel subscription functionality. Add a cancel button to the account page, implement the backend API route, handle the webhook, and update the UI states accordingly.

Focus on **incremental changes** that don't disrupt the working system.
