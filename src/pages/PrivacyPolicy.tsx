import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Smart Library Entry</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Privacy Policy / गोपनीयता नीति</h1>
          <p className="text-muted-foreground text-sm">Last Updated: March 2026 / अंतिम अपडेट: मार्च 2026</p>
        </div>

        <div className="space-y-6">
          <Section title="1. Introduction / परिचय">
            <p>Welcome to Smart Library Entry ("we", "our", "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
            <p>स्मार्ट लाइब्रेरी एंट्री में आपका स्वागत है। हम आपकी व्यक्तिगत जानकारी और आपकी गोपनीयता की रक्षा के लिए प्रतिबद्ध हैं।</p>
          </Section>

          <Section title="2. Information We Collect / हम कौन सी जानकारी एकत्र करते हैं">
            <h4 className="font-semibold text-sm mb-2">For Library Administrators:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Name, email address, phone number</li>
              <li>Library name and college/institution name</li>
              <li>Account credentials (password is encrypted)</li>
            </ul>
            <h4 className="font-semibold text-sm mb-2 mt-3">For Students & Teachers (via QR Entry):</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Full name, roll number / employee ID</li>
              <li>Department, year, phone number, email (optional)</li>
              <li>Entry and exit timestamps</li>
              <li>Digital signature (stored as image data)</li>
              <li>Seat and locker selection (if applicable)</li>
              <li>Device information (browser user agent)</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information / हम आपकी जानकारी का उपयोग कैसे करते हैं">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>To manage and track library entries and exits</li>
              <li>To provide library analytics and reports to administrators</li>
              <li>To enable seat booking, queue management, and locker assignment</li>
              <li>To generate study time statistics and gamification points</li>
              <li>To send notifications and announcements</li>
              <li>To improve our platform and user experience</li>
              <li>To provide AI-based book recommendations</li>
            </ul>
          </Section>

          <Section title="4. Data Storage & Security / डेटा भंडारण और सुरक्षा">
            <p>Your data is stored securely using industry-standard encryption. We use:</p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li><strong>Encrypted database</strong> — All data at rest is encrypted</li>
              <li><strong>HTTPS</strong> — All data in transit is encrypted via TLS/SSL</li>
              <li><strong>Row-Level Security (RLS)</strong> — Each library's data is isolated and only accessible by its admin</li>
              <li><strong>Secure authentication</strong> — Passwords are hashed and never stored in plain text</li>
              <li><strong>No third-party data sharing</strong> — We do not sell or share your data with third parties</li>
            </ul>
          </Section>

          <Section title="5. Data Isolation / डेटा अलगाव">
            <p>Each library operates in its own isolated environment. Library A's admin cannot see Library B's data. Student entries are linked only to the library whose QR code was scanned. This ensures complete privacy between institutions.</p>
          </Section>

          <Section title="6. Student Data / छात्र डेटा">
            <p>Student data collected through QR entry forms is:</p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>Only visible to the respective library administrator</li>
              <li>Used solely for library management purposes</li>
              <li>Never shared with other students, libraries, or external parties</li>
              <li>Deletable by the library administrator at any time</li>
            </ul>
            <p className="mt-2">Students do not need to create an account. No passwords or login credentials are collected from students.</p>
          </Section>

          <Section title="7. Cookies & Tracking / कुकीज़ और ट्रैकिंग">
            <p>We use minimal cookies required for authentication and session management. We do not use:</p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>Third-party tracking cookies</li>
              <li>Advertising trackers</li>
              <li>Social media tracking pixels</li>
            </ul>
          </Section>

          <Section title="8. Data Retention / डेटा प्रतिधारण">
            <p>Library administrators can delete student entries and data at any time. Account data is retained as long as the account is active. Upon account deletion, all associated data is permanently removed.</p>
          </Section>

          <Section title="9. Your Rights / आपके अधिकार">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Right to Access</strong> — You can request a copy of your data</li>
              <li><strong>Right to Deletion</strong> — You can request deletion of your account and data</li>
              <li><strong>Right to Correction</strong> — You can update your information in settings</li>
              <li><strong>Right to Withdraw</strong> — Library admins can delete their account at any time</li>
            </ul>
          </Section>

          <Section title="10. Children's Privacy / बच्चों की गोपनीयता">
            <p>Our service is designed for educational institutions. We do not knowingly collect personal information from children under 13 without proper institutional oversight.</p>
          </Section>

          <Section title="11. Changes to This Policy / इस नीति में परिवर्तन">
            <p>We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.</p>
          </Section>

          <Section title="12. Contact Us / हमसे संपर्क करें">
            <p>If you have questions about this Privacy Policy, please contact us:</p>
            <p className="mt-2"><strong>Email:</strong> support@smartlibraryentry.com</p>
            <p><strong>Developer:</strong> S_Amir786</p>
          </Section>
        </div>

        <div className="text-center text-[10px] text-muted-foreground mt-10 pb-4">
          © {new Date().getFullYear()} S_Amir786. All rights reserved.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-muted-foreground text-sm leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}
