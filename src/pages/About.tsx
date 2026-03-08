import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Globe, Shield, Zap, Heart, ArrowLeft, Mail, Github } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-primary">
            <BookOpen className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">About Smart Library Entry</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete cloud-based digital library management system designed for colleges, universities, and institutions across India.
          </p>
        </div>

        {/* Mission */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" /> Our Mission / हमारा मिशन
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Smart Library Entry was created to solve the challenges faced by libraries in managing student entries, book tracking, and resource management. Our goal is to make library management <strong className="text-foreground">effortless, paperless, and intelligent</strong>.
            </p>
            <p>
              हमारा लक्ष्य भारत के हर कॉलेज और लाइब्रेरी को डिजिटल बनाना है — QR कोड से एंट्री, AI से किताबों की सिफारिश, और रियल-टाइम एनालिटिक्स के साथ।
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Zap, title: 'QR Code Entry', desc: 'Instant entry via QR scan — no app download needed. Works in any browser.' },
            { icon: Users, title: 'Multi-College', desc: 'Each college gets its own isolated space with unique QR codes and settings.' },
            { icon: Shield, title: 'Secure & Private', desc: 'All data is encrypted and stored securely. Each library admin controls their own data.' },
            { icon: Globe, title: 'Bilingual', desc: 'Full Hindi & English support throughout the system.' },
            { icon: BookOpen, title: 'Complete Management', desc: 'Books, seats, lockers, events, gamification — all in one platform.' },
            { icon: Heart, title: 'Student Friendly', desc: 'No login needed for students. Portal shows study hours, books, and achievements.' },
          ].map((f, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tech Stack */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Technology / तकनीक</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Edge Functions', 'AI/ML', 'QR Code', 'Real-time'].map(t => (
                <span key={t} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{t}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Developer */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              👨‍💻 Developer / डेवलपर
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Built with ❤️ by <strong className="text-foreground">S_Amir786</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Full-stack developer passionate about building tools that make education better. This project aims to digitize library management across Indian colleges and institutions.
            </p>
            <div className="flex gap-3">
              <Link to="/">
                <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
                  <BookOpen className="h-4 w-4" /> Visit App
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">Contact / संपर्क</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>For any queries, feature requests, or collaborations:</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@smartlibraryentry.com</p>
            <p className="text-xs mt-4">Version 2.0 • Last Updated: March 2026</p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground mt-8 pb-4">
          © {new Date().getFullYear()} S_Amir786. All rights reserved.
        </div>
      </div>
    </div>
  );
}
