/**
 * Single source of truth for the legal/policy details shown across the app.
 *
 * Update the values here (not the individual pages) when the operating entity,
 * contact details, or governing law change.
 */
export const LEGAL = {
  serviceName: 'SnapShark',
  siteUrl: 'https://www.snap-shark.com',
  /** Controller for UK GDPR purposes. Postal address is provided on request. */
  controller: 'SnapShark, a service operated by Mac Cox (sole trader, United Kingdom)',
  contactEmail: 'snapshark2025@gmail.com',
  responseTime: 'within 48 hours',
  /** Statutory deadline for responding to a data subject request. */
  rightsResponseWindow: '1 month',
  /** How long deleted content can persist in encrypted backups. */
  backupRetention: '30 days',
  governingLaw: 'England and Wales',
  supervisoryAuthority: {
    name: "Information Commissioner's Office (ICO)",
    url: 'https://ico.org.uk/make-a-complaint/',
  },
  minimumAge: 16,
  /** Bump when the policy text materially changes. */
  privacyLastUpdated: '1 September 2026',
  termsLastUpdated: '1 September 2026',
} as const;

/** Third parties that process data on our behalf, or that the browser contacts directly. */
export const SUB_PROCESSORS = [
  {
    name: 'Clerk',
    purpose: 'Account sign-in, session management, and account deletion',
    data: 'Email address, authentication identifiers',
    url: 'https://clerk.com/legal/privacy',
  },
  {
    name: 'Stripe',
    purpose: 'Subscription payments and billing',
    data: 'Billing details and payment method (held by Stripe, not by us)',
    url: 'https://stripe.com/privacy',
  },
  {
    name: 'Neon',
    purpose: 'Hosted PostgreSQL database for Logbook entries',
    data: 'Places, dives, notes, and optional dive details',
    url: 'https://neon.tech/privacy-policy',
  },
  {
    name: 'Vercel',
    purpose:
      'Website hosting, private Blob storage for Logbook photos, and cookieless analytics',
    data: 'Logbook photos, request logs, aggregate page analytics',
    url: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'OpenStreetMap',
    purpose: 'Map tiles and place-name search',
    data: 'Map tile requests from your browser; search terms proxied by our server',
    url: 'https://wiki.osmfoundation.org/wiki/Privacy_Policy',
  },
] as const;
