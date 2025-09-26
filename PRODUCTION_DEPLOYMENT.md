# 🚀 SnapShark Production Deployment Guide

## 🔒 **CRITICAL SECURITY FIXES COMPLETED**

✅ **Debug endpoints removed** - All `/api/debug/` routes deleted  
✅ **Security headers added** - Protection against XSS, clickjacking, etc.  
✅ **Legal documents created** - Privacy Policy & Terms of Service  
✅ **Rate limiting implemented** - Protection against API abuse  
✅ **Footer legal links added** - Compliant with legal requirements

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **1. Environment Variables**

Copy from `env.example` and set in Vercel dashboard:

#### **🔐 Authentication (Clerk)**

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... # ⚠️ MUST be pk_live_ for production!
CLERK_SECRET_KEY=sk_live_...                  # ⚠️ MUST be sk_live_ for production!
```

#### **💳 Payments (Stripe)**

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # ⚠️ MUST be pk_live_ for production!
STRIPE_SECRET_KEY=sk_live_...                  # ⚠️ MUST be sk_live_ for production!
STRIPE_WEBHOOK_SECRET=whsec_...                # From Stripe webhook configuration
STRIPE_PRO_PRICE_ID=price_...                 # Monthly subscription price ID
STRIPE_PRO_YEARLY_PRICE_ID=price_...           # Yearly subscription price ID
```

#### **🌐 App Configuration**

```bash
NEXT_PUBLIC_APP_URL=https://snap-shark.com    # Your production domain
```

---

## 🛠️ **DEPLOYMENT STEPS**

### **Step 1: Vercel Setup**

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure custom domain if needed
4. Enable automatic deployments from `main` branch

### **Step 2: Stripe Configuration**

1. Switch to **Live Mode** in Stripe dashboard
2. Create production webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
3. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`
4. Test webhook delivery

### **Step 3: Clerk Configuration**

1. Create production application in Clerk
2. Configure allowed origins: `https://yourdomain.com`
3. Set up social providers if needed
4. Copy production keys to environment variables

### **Step 4: Domain & SSL**

1. Configure domain in Vercel
2. Set up SSL certificate (automatic with Vercel)
3. Test domain redirects (non-www to www or vice versa)
4. Update `vercel.json` redirects if needed

---

## 🧪 **POST-DEPLOYMENT TESTING**

### **Critical Path Testing**

- [ ] Homepage loads correctly
- [ ] Image processing works (all formats)
- [ ] Background removal functions
- [ ] Underwater color correction works
- [ ] User registration/login
- [ ] Pro subscription signup flow
- [ ] Payment processing (test with Stripe test cards)
- [ ] Subscription management
- [ ] Legal pages accessible

### **Security Testing**

- [ ] Debug endpoints return 404: `/api/debug/update-pro-status`
- [ ] Security headers present: Check at [securityheaders.com](https://securityheaders.com)
- [ ] Rate limiting active: Test rapid API calls
- [ ] HTTPS enforced
- [ ] No console errors or warnings

### **Performance Testing**

- [ ] Core Web Vitals acceptable
- [ ] Mobile experience smooth
- [ ] Image processing fast on various devices
- [ ] Example images load quickly

---

## 📊 **MONITORING & MAINTENANCE**

### **Immediate Monitoring**

1. Set up Stripe webhook monitoring
2. Monitor Vercel function logs
3. Track error rates in first 24 hours
4. Monitor payment success rates

### **Recommended Additions**

```bash
# Add to environment variables for better monitoring
SENTRY_DSN=your_sentry_dsn          # Error tracking
VERCEL_ANALYTICS_ID=your_id         # Performance monitoring
```

### **Weekly Checks**

- [ ] Payment webhook delivery status
- [ ] User registration rates
- [ ] Performance metrics
- [ ] Security scan results
- [ ] Legal compliance updates

---

## 🚨 **EMERGENCY PROCEDURES**

### **If Something Goes Wrong**

1. **Payments failing**: Check Stripe webhook logs and environment variables
2. **Authentication broken**: Verify Clerk configuration and allowed origins
3. **Images not processing**: Check browser console for errors, test different formats
4. **High error rates**: Check Vercel function logs, may need to rollback

### **Rollback Plan**

1. Revert to previous Vercel deployment
2. Check if environment variables changed
3. Verify third-party service status (Stripe, Clerk)

---

## 🎯 **SUCCESS METRICS**

Track these KPIs after launch:

- **User Registration Rate**: Target >20% of visitors
- **Payment Conversion**: Target >5% of registrations to Pro
- **Error Rate**: Keep <1% of requests
- **Page Load Speed**: <3 seconds on mobile
- **User Retention**: Target >30% return within 7 days

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues & Solutions**

**Issue**: Stripe webhook not receiving events  
**Solution**: Check webhook URL, verify HTTPS, check Stripe logs

**Issue**: Clerk authentication failing  
**Solution**: Verify production keys, check allowed origins

**Issue**: Images not processing on mobile  
**Solution**: Test in different browsers, check for iOS Safari issues

**Issue**: High memory usage in Vercel functions  
**Solution**: Monitor function duration, may need to optimize image processing

---

## 📞 **SUPPORT CONTACTS**

- **Stripe Support**: https://support.stripe.com
- **Clerk Support**: https://clerk.com/support
- **Vercel Support**: https://vercel.com/support
- **Next.js Issues**: https://github.com/vercel/next.js/issues

---

## ✅ **FINAL PRODUCTION CHECKLIST**

Before announcing launch:

- [ ] All critical paths tested
- [ ] Legal pages reviewed by legal counsel (recommended)
- [ ] Privacy policy reflects actual data practices
- [ ] Terms of service cover your use cases
- [ ] Rate limiting tested and working
- [ ] Security headers verified
- [ ] Payment flow tested end-to-end
- [ ] Mobile experience optimized
- [ ] Error monitoring in place
- [ ] Backup plan documented

**🎉 You're ready to launch SnapShark!**
