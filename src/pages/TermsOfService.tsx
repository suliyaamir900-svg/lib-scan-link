import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
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
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Terms of Service / सेवा की शर्तें</h1>
          <p className="text-muted-foreground text-sm">Last Updated: March 2026</p>
        </div>

        <div className="space-y-6">
          <Section title="1. Acceptance of Terms / शर्तों की स्वीकृति">
            <p>By accessing and using Smart Library Entry, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
          </Section>

          <Section title="2. Description of Service / सेवा का विवरण">
            <p>Smart Library Entry is a cloud-based library management platform that provides:</p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>QR code-based student entry and exit tracking</li>
              <li>Book management, issuing, and tracking</li>
              <li>Seat management and booking</li>
              <li>Student analytics and gamification</li>
              <li>Administrative tools for library management</li>
            </ul>
          </Section>

          <Section title="3. User Accounts / उपयोगकर्ता खाते">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>One account per library/institution is recommended</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use / स्वीकार्य उपयोग">
            <p>You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to access other users' data</li>
              <li>Upload malicious content or attempt to compromise the system</li>
              <li>Share your admin credentials with unauthorized persons</li>
              <li>Use automated scripts to scrape or overload the platform</li>
            </ul>
          </Section>

          <Section title="5. Data Ownership / डेटा स्वामित्व">
            <p>You retain ownership of all data you input into the platform. We do not claim ownership of your library data, student entries, or any content you create. You can export or delete your data at any time.</p>
          </Section>

          <Section title="6. Service Availability / सेवा उपलब्धता">
            <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be communicated in advance when possible. We are not liable for any data loss due to unforeseen circumstances.</p>
          </Section>

          <Section title="7. Intellectual Property / बौद्धिक संपदा">
            <p>The Smart Library Entry platform, including its design, code, and features, is the intellectual property of S_Amir786. You may not copy, modify, or distribute any part of the platform without written permission.</p>
          </Section>

          <Section title="8. Limitation of Liability / दायित्व की सीमा">
            <p>Smart Library Entry is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform.</p>
          </Section>

          <Section title="9. Termination / समाप्ति">
            <p>We reserve the right to terminate or suspend accounts that violate these terms. You may delete your account at any time, which will result in permanent deletion of all associated data.</p>
          </Section>

          <Section title="10. Contact / संपर्क">
            <p>For questions about these Terms of Service:</p>
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
