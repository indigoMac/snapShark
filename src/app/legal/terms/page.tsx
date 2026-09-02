import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Shield,
  CreditCard,
  AlertTriangle,
  Users,
  Gavel,
} from 'lucide-react';
import { LEGAL } from '@/lib/legal';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Clear, fair terms for using SnapShark. We believe in transparency
            and mutual respect.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            Last updated: {LEGAL.termsLastUpdated}
          </p>
        </div>

        <div className="space-y-8">
          {/* Agreement to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-blue-600" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                By accessing and using SnapShark ("the Service"), you accept and
                agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use
                this service.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Key Point:</strong> These terms apply to all users,
                  whether using free or paid features. You must be at least{' '}
                  {LEGAL.minimumAge} years old to create an account.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">What SnapShark Provides</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Client-side image processing and optimization</li>
                    <li>
                      • Format conversion, resizing, and compression tools
                    </li>
                    <li>• AI-powered background removal</li>
                    <li>• Underwater photo color correction</li>
                    <li>• Print package generation with multiple sizes</li>
                    <li>
                      • A personal dive Logbook that saves places, dives, notes,
                      and photos to your account
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">
                    Image Tools vs. the Logbook
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Image processing happens locally in your browser, and those
                    images are never uploaded to us. The Logbook works
                    differently: anything you choose to save there, including
                    photos you attach, is stored on our servers so it is
                    available across your devices. Our{' '}
                    <a
                      href="/legal/privacy"
                      className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </a>{' '}
                    explains exactly what is stored and for how long.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Acceptable Use</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    You agree to use SnapShark only for lawful purposes and in
                    accordance with these terms.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>
                      • Process only images you own or have permission to use
                    </li>
                    <li>• Respect intellectual property rights</li>
                    <li>
                      • Do not attempt to reverse engineer or exploit the
                      service
                    </li>
                    <li>• Do not use the service to process illegal content</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Account Security</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Keep your account credentials secure</li>
                    <li>• Notify us immediately of any unauthorized access</li>
                    <li>
                      • You are responsible for all activity under your account
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Uses */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Prohibited Uses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                You may not use SnapShark for any of the following purposes:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                    Content Restrictions
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Illegal, harmful, or offensive content</li>
                    <li>• Copyrighted material without permission</li>
                    <li>• Content that violates others' privacy</li>
                    <li>• Malicious or harmful files</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                    Technical Abuse
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automated or excessive usage</li>
                    <li>• Attempts to bypass limitations</li>
                    <li>• Interfering with service operation</li>
                    <li>• Attempting to access restricted areas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription & Billing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Subscription & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Free vs Pro Features</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    All core features are available for free. Pro subscriptions
                    add convenience and efficiency:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Free: Process images one at a time using presets</li>
                    <li>
                      • Pro: Batch processing and instant package generation
                    </li>
                    <li>• Pro: Priority customer support</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Billing Terms</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Monthly or yearly billing cycles</li>
                    <li>• Automatic renewal unless cancelled</li>
                    <li>
                      • Pro-rated refunds for annual plans (first 30 days)
                    </li>
                    <li>• Cancel anytime through account settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Payment Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    All payments are processed securely by Stripe. We do not
                    store your payment information.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">
                    Consumer Cancellation Rights (UK &amp; EU)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    If you are a consumer in the UK or EEA you normally have 14
                    days to cancel a new subscription and receive a refund. By
                    starting to use Pro features straight away you ask us to
                    begin the service immediately, and you may be charged for
                    what you have used up to the point you cancel. To cancel
                    within this period, email {LEGAL.contactEmail}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Your Content</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    You keep all rights to your images and to everything you
                    save in your Logbook. Images you run through the processing
                    tools stay on your device and are never sent to us.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    For Logbook content only, you give us a limited licence to
                    store, copy, and display that content back to you so we can
                    operate the feature. That licence exists purely to run the
                    service: we do not publish your entries, sell them, or use
                    them to train models. It ends when you delete the content or
                    your account.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You are responsible for what you upload. Only add photos you
                    have the right to use, and be careful about uploading images
                    or details that identify other people without their
                    agreement.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Our Service</h3>
                  <p className="text-sm text-muted-foreground">
                    SnapShark, including its code, design, and algorithms, is
                    protected by intellectual property laws. You may not copy,
                    modify, or distribute our service without permission.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Open Source Components</h3>
                  <p className="text-sm text-muted-foreground">
                    We use various open-source libraries and tools. Their
                    respective licenses apply to those components.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimers & Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Disclaimers & Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Service Availability</h3>
                  <p className="text-sm text-muted-foreground">
                    We strive for high availability but cannot guarantee 100%
                    uptime. The service is provided "as is" without warranties.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Processing Results</h3>
                  <p className="text-sm text-muted-foreground">
                    While we work to provide high-quality results, image
                    processing quality may vary. Results depend on input quality
                    and browser capabilities.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Keep Your Own Copies</h3>
                  <p className="text-sm text-muted-foreground">
                    The Logbook is a convenience, not a backup service or an
                    official dive record. Please keep your own copies of photos
                    and any dive information that matters to you, and do not
                    rely on it for dive planning or safety decisions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Limitation of Liability</h3>
                  <p className="text-sm text-muted-foreground">
                    Except as set out below, our liability is limited to the
                    amount you paid for the service in the past 12 months, and
                    we are not liable for indirect, incidental, or consequential
                    damages.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Nothing in these terms limits liability for death or
                    personal injury caused by negligence, for fraud, or for
                    anything else that cannot be limited by law. If you are a
                    consumer, you keep all rights given to you by the consumer
                    law of your home country, and nothing here overrides them.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Account Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Your Right to Terminate</h3>
                  <p className="text-sm text-muted-foreground">
                    You may cancel your account at any time through account
                    settings. Subscription cancellations take effect at the end
                    of the current billing period.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Our Right to Terminate</h3>
                  <p className="text-sm text-muted-foreground">
                    We may suspend or terminate accounts that violate these
                    terms, engage in abuse, or for technical/security reasons.
                    We'll provide notice when possible.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Effect of Termination</h3>
                  <p className="text-sm text-muted-foreground">
                    When you close your account, your access to Pro features
                    ends and your Logbook content is deleted, including photos
                    held in our storage. You can also export or delete your
                    Logbook at any time from your account page without closing
                    your account. We keep billing records where the law requires
                    it. Export anything you want to keep before you delete it,
                    because deletion cannot be undone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">How We Update Terms</h3>
                  <p className="text-sm text-muted-foreground">
                    We may update these terms from time to time. When we do,
                    we'll notify users via email and update the "Last updated"
                    date.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Your Agreement to Changes</h3>
                  <p className="text-sm text-muted-foreground">
                    Continued use of SnapShark after term updates constitutes
                    acceptance of the new terms. If you don't agree with
                    changes, please discontinue use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Questions About Terms?</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-sm">
                      <strong>Operated by:</strong> {LEGAL.controller}
                      <br />
                      <strong>Email:</strong> {LEGAL.contactEmail}
                      <br />
                      <strong>Response Time:</strong> {LEGAL.responseTime}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Governing Law</h3>
                  <p className="text-sm text-muted-foreground">
                    These terms are governed by the law of{' '}
                    {LEGAL.governingLaw}, and the courts of{' '}
                    {LEGAL.governingLaw} have jurisdiction. If you are a
                    consumer living elsewhere, you keep the protection of the
                    mandatory consumer laws of your country of residence and may
                    bring a claim in your local courts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
