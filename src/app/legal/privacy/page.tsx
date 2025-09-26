import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, Lock, Eye, Users, Database, FileText } from 'lucide-react';

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
            Your privacy matters to us. Here's how SnapShark protects your data
            and respects your privacy.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          {/* Privacy-First Approach */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" />
                Privacy-First Design
              </CardTitle>
              <CardDescription>
                SnapShark is built with privacy as the foundation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  🛡️ Zero-Knowledge Architecture
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your images never leave your device. All processing happens
                  locally in your browser using advanced web technologies. We
                  literally cannot see your photos.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">No Upload Required</h4>
                    <p className="text-sm text-muted-foreground">
                      Images are processed entirely in your browser
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lock className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Local Storage Only</h4>
                    <p className="text-sm text-muted-foreground">
                      Settings saved in your browser only
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                What Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">
                    Account Information (via Clerk)
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Email address (for account access)</li>
                    <li>• User ID (for subscription management)</li>
                    <li>• Authentication data (managed by Clerk)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Payment Information (via Stripe)
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Subscription status and billing details</li>
                    <li>
                      • Payment method information (stored by Stripe, not us)
                    </li>
                    <li>• Transaction history for billing purposes</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Usage Data (Minimal)</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Browser preferences and settings (stored locally)</li>
                    <li>• Error logs for debugging (no personal data)</li>
                    <li>• Anonymous usage analytics (if any)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Third-Party Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Clerk (Authentication)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Handles secure user authentication and account management.
                  </p>
                  <a
                    href="https://clerk.com/privacy"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Clerk Privacy Policy →
                  </a>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Stripe (Payments)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Processes payments securely. We don't store payment details.
                  </p>
                  <a
                    href="https://stripe.com/privacy"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Stripe Privacy Policy →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-600" />
                Your Rights & Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">GDPR Rights (EU Users)</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Right to access your data</li>
                    <li>• Right to rectification</li>
                    <li>• Right to erasure ("right to be forgotten")</li>
                    <li>• Right to data portability</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">How to Exercise Rights</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Account deletion: Delete via account settings</li>
                    <li>• Data export: Contact support</li>
                    <li>• Questions: snapshark2025@gmail.com</li>
                    <li>• Response time: 30 days maximum</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies & Local Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Cookies & Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Essential Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Required for authentication and core functionality. Cannot
                    be disabled.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Local Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Your settings and preferences are stored locally in your
                    browser. You can clear this data anytime through your
                    browser settings.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">No Tracking Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    We don't use tracking cookies or analytics that follow you
                    across websites.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Technical Safeguards</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• HTTPS encryption for all communications</li>
                    <li>• Industry-standard authentication (Clerk)</li>
                    <li>• Secure payment processing (Stripe)</li>
                    <li>• Regular security audits and updates</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Data Breach Protocol</h3>
                  <p className="text-sm text-muted-foreground">
                    In the unlikely event of a data breach, we will notify
                    affected users within 72 hours and take immediate action to
                    secure the system.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Policy Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Questions or Concerns?</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  If you have any questions about this privacy policy or your
                  data, please contact us:
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Email:</strong> snapshark2025@gmail.com
                    <br />
                    <strong>Response Time:</strong> Within 48 hours
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Policy Updates</h3>
                <p className="text-sm text-muted-foreground">
                  We may update this privacy policy from time to time. When we
                  do, we'll notify users via email and update the "Last updated"
                  date at the top of this page. Continued use of SnapShark after
                  updates constitutes acceptance of the new policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
