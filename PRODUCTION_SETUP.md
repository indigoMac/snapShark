# 🚀 Production Setup Guide

## Current Status ✅

- ✅ Clerk authentication working with custom domain
- ✅ Stripe integration working with test keys
- ✅ Webhooks configured and tested
- ✅ All functionality verified

## Next Steps for Production

### 1. Switch to Stripe Production Keys 💳

**When to switch:** Now! Everything is tested and working.

**Required Stripe Environment Variables:**

```bash
# Replace test keys with production keys in Vercel
STRIPE_SECRET_KEY=sk_live_...                           # Live secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...          # Live publishable key
STRIPE_WEBHOOK_SECRET=whsec_...                         # Production webhook secret
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...              # Live monthly price ID
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...       # Live yearly price ID
```

**Steps:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to "Live mode" (top left)
3. Copy production API keys
4. Update Vercel environment variables
5. Create new webhook endpoint for production
6. Update price IDs for live products

### 2. Update Webhook Endpoint 🔗

**Current webhook URL:** `https://www.snap-shark.com/api/stripe/webhook`

In Stripe Dashboard:

1. Go to Developers → Webhooks
2. Create new endpoint for production
3. Add events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Create Production Stripe Products 📦

1. **Monthly Pro Plan:**
   - Price: £3/month
   - Billing: Recurring monthly
   - Copy price ID → `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

2. **Yearly Pro Plan:**
   - Price: £15/year
   - Billing: Recurring yearly
   - Copy price ID → `NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID`

### 4. Final Security Check 🔒

- [ ] All debug logs removed
- [ ] No test data in production
- [ ] Webhook signatures verified
- [ ] HTTPS only in production
- [ ] Environment variables secured

### 5. Monitoring & Alerts 📊

**Recommended monitoring:**

- Stripe webhook delivery status
- User subscription activations
- Payment failures
- Clerk authentication errors

## Production Readiness Checklist ✅

- [x] Authentication working
- [x] Payment flow tested
- [x] Webhooks working
- [x] Debug code cleaned up
- [ ] Stripe production keys configured
- [ ] Production webhooks set up
- [ ] Live products created
- [ ] Final testing complete

## Support Links 🔗

- [Stripe Live Mode Guide](https://stripe.com/docs/keys#test-live-modes)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Clerk Production Checklist](https://clerk.com/docs/production)

---

**Ready for production!** 🚀 The hardest part (Clerk metadata syncing) is solved.
