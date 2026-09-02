import type { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Shield,
  Lock,
  Eye,
  Users,
  Database,
  FileText,
  Globe,
  Clock,
} from 'lucide-react';
import { LEGAL, SUB_PROCESSORS } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy - SnapShark',
  description:
    'How SnapShark handles your data: on-device image tools, and what we store when you use the dive Logbook.',
  alternates: { canonical: `${LEGAL.siteUrl}/legal/privacy` },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            What we do and don&apos;t store, explained plainly.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            Last updated: {LEGAL.privacyLastUpdated}
          </p>
        </div>

        <div className="space-y-8">
          {/* Summary */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                The Short Version
              </CardTitle>
              <CardDescription>
                SnapShark has two parts, and they treat your data differently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    Image tools stay on your device
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Conversion, resizing, background removal, and underwater
                    correction all run inside your browser. Those images are
                    never uploaded to us and we cannot see them.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    The Logbook is stored on our servers
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    If you choose to save a dive, we store the place, date,
                    notes, any optional dive details, and any photos you attach,
                    so your logbook works across devices.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                You can export or permanently delete your Logbook at any time
                from your account page. Deleting your account deletes your
                Logbook with it.
              </p>
            </CardContent>
          </Card>

          {/* Controller */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                Who Is Responsible for Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {LEGAL.controller} is the data controller for the personal data
                described in this policy. We are based in the United Kingdom, so
                UK GDPR and the Data Protection Act 2018 apply to how we handle
                your data. Where you are in the EEA, we also aim to meet the
                equivalent standards of the EU GDPR.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Contact:</strong> {LEGAL.contactEmail}
                  <br />
                  <strong>Postal address:</strong> available on request by email
                  <br />
                  <strong>Response time:</strong> {LEGAL.responseTime}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What we collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                What We Collect and Why
              </CardTitle>
              <CardDescription>
                Each category below lists our lawful basis under UK GDPR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="font-semibold mb-2">
                  Logbook content (only if you use the Logbook)
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>
                    • Places you pin, including their names and map coordinates
                  </li>
                  <li>
                    • Dive entries: date and time, notes, and optional details
                    such as dive type, depth, bottom time, buddy name,
                    visibility, and water temperature
                  </li>
                  <li>• Trips you create and the places you assign to them</li>
                  <li>• Photos you attach to a dive, and their captions</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Why:</strong> to provide the Logbook feature you asked
                  for. <strong>Lawful basis:</strong> performance of our
                  contract with you (Article 6(1)(b)).
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Account information</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Email address and authentication data (held by Clerk)</li>
                  <li>• A user identifier that links your account to your Logbook</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Why:</strong> to create your account, sign you in, and
                  keep your data separate from other users.{' '}
                  <strong>Lawful basis:</strong> performance of our contract.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Billing information</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Subscription status and billing history (held by Stripe)</li>
                  <li>
                    • Payment card details are collected and stored by Stripe,
                    never by us
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Why:</strong> to take payment and manage
                  subscriptions. <strong>Lawful basis:</strong> performance of
                  our contract, and legal obligation for tax and accounting
                  records.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Technical and analytics data
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>
                    • Server and security logs, which include IP address and
                    browser type
                  </li>
                  <li>
                    • Cookieless, aggregated page analytics via Vercel Analytics
                    (no cross-site tracking, no advertising profiles)
                  </li>
                  <li>
                    • Your app settings and presets, which are kept in your
                    browser&apos;s local storage and not sent to us
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Why:</strong> to keep the service secure, diagnose
                  faults, and understand which features are used.{' '}
                  <strong>Lawful basis:</strong> our legitimate interests in
                  running a reliable, secure service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Photos and maps specifics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600" />
                Photos, Maps, and Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">How Logbook photos are stored</h3>
                <p className="text-sm text-muted-foreground">
                  Photos you attach to a dive are resized in your browser and
                  then uploaded to private storage (Vercel Blob). They have no
                  public web address: every request goes through our server,
                  which checks that you are signed in and that the photo belongs
                  to your account before sending it back. Deleting a photo, a
                  dive, or your Logbook removes the stored file as well as the
                  database record.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Map tiles and place search</h3>
                <p className="text-sm text-muted-foreground">
                  Map images come from OpenStreetMap, so your browser contacts
                  their servers directly and they will see your IP address and
                  the area of the map you are viewing. When you search for a
                  place name, the search text is sent through our server to
                  OpenStreetMap&apos;s search service, so your IP address is not
                  shared with them for searches.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Location data you enter</h3>
                <p className="text-sm text-muted-foreground">
                  We do not use your device&apos;s GPS. Dive locations are only
                  the coordinates of pins that you place on the map yourself.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sub-processors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Who We Share Data With
              </CardTitle>
              <CardDescription>
                We do not sell your data or share it for advertising
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {SUB_PROCESSORS.map((processor) => (
                  <div key={processor.name} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-1">{processor.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {processor.purpose}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Data:</strong> {processor.data}
                    </p>
                    <a
                      href={processor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      View their privacy policy →
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                We may also disclose data where we are legally required to, or
                to establish or defend legal claims.
              </p>
            </CardContent>
          </Card>

          {/* Transfers and retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                International Transfers &amp; Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Where your data is held</h3>
                <p className="text-sm text-muted-foreground">
                  Our database is hosted in the European Union. Some of our
                  providers are based in, or support their services from, the
                  United States. Where data is transferred outside the UK or
                  EEA, it is protected by UK approved safeguards such as the
                  International Data Transfer Addendum or Standard Contractual
                  Clauses, or by an adequacy decision.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">How long we keep things</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>
                    • Logbook content: until you delete it, or until you delete
                    your account
                  </li>
                  <li>
                    • Account data: for as long as your account is open
                  </li>
                  <li>
                    • Billing records: up to 7 years, to meet UK tax and
                    accounting rules
                  </li>
                  <li>
                    • Server logs: a short rolling period for security and
                    troubleshooting
                  </li>
                  <li>
                    • Encrypted backups may retain deleted content for up to{' '}
                    {LEGAL.backupRetention} before they expire
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Your rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-600" />
                Your Rights &amp; Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">
                    Your rights under UK and EU GDPR
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Access a copy of your data</li>
                    <li>• Correct data that is wrong or incomplete</li>
                    <li>• Erase your data (&quot;right to be forgotten&quot;)</li>
                    <li>• Receive your data in a portable format</li>
                    <li>• Restrict or object to certain processing</li>
                    <li>• Complain to a data protection regulator</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">How to use them</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • Export: download your full Logbook from your account
                      page
                    </li>
                    <li>
                      • Erase: delete individual entries, delete your whole
                      Logbook, or delete your account
                    </li>
                    <li>• Anything else: email {LEGAL.contactEmail}</li>
                    <li>
                      • We respond within {LEGAL.rightsResponseWindow}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  If you are unhappy with how we handle your data you can
                  complain to the {LEGAL.supervisoryAuthority.name} at{' '}
                  <a
                    href={LEGAL.supervisoryAuthority.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {LEGAL.supervisoryAuthority.url}
                  </a>
                  . If you are in the EEA, you may instead complain to your
                  local supervisory authority.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Cookies &amp; Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold">Essential cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Used to keep you signed in and to secure payments. These are
                  required for the service to work and cannot be turned off.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Local storage</h3>
                <p className="text-sm text-muted-foreground">
                  Your settings and presets are stored in your browser. You can
                  clear them at any time in your browser settings.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">No tracking or advertising cookies</h3>
                <p className="text-sm text-muted-foreground">
                  We do not use advertising cookies and do not track you across
                  other websites. Our analytics are cookieless and aggregated.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security & children */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Security &amp; Children
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold">How we protect your data</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• HTTPS encryption for all traffic</li>
                  <li>• Authentication handled by Clerk</li>
                  <li>
                    • Every Logbook request, including each photo, is checked
                    against the signed-in account, so users cannot read each
                    other&apos;s entries
                  </li>
                  <li>• Payments handled by Stripe; we never see card details</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">If something goes wrong</h3>
                <p className="text-sm text-muted-foreground">
                  No service can promise perfect security. If a breach affects
                  your rights we will notify the ICO within 72 hours where
                  required, and tell affected users without undue delay.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Children</h3>
                <p className="text-sm text-muted-foreground">
                  SnapShark is not intended for children under{' '}
                  {LEGAL.minimumAge}. If you believe a child has given us
                  personal data, email us and we will delete it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact & updates */}
          <Card>
            <CardHeader>
              <CardTitle>Contact &amp; Policy Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Questions or concerns?</h3>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Email:</strong> {LEGAL.contactEmail}
                    <br />
                    <strong>Response time:</strong> {LEGAL.responseTime}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Policy updates</h3>
                <p className="text-sm text-muted-foreground">
                  We may update this policy as the service changes. If a change
                  materially affects how we use your data, we will update the
                  date at the top of this page and, where appropriate, tell you
                  by email before it takes effect.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
