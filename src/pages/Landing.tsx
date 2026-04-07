import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { QrCode, LayoutDashboard, PenTool, FileSpreadsheet, Building2, Smartphone, ArrowRight, BookOpen, Shield, Zap, BarChart3, Users, Clock, CheckCircle, Star, Fingerprint, Bell, Globe, Award, TrendingUp, Lock, Sparkles } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as any, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Landing() {
  const { t } = useLanguage();

  const features = [
    { icon: QrCode, title: t('features.qr.title'), desc: t('features.qr.desc'), gradient: 'gradient-primary' },
    { icon: LayoutDashboard, title: t('features.dashboard.title'), desc: t('features.dashboard.desc'), gradient: 'gradient-accent' },
    { icon: PenTool, title: t('features.signature.title'), desc: t('features.signature.desc'), gradient: 'gradient-warm' },
    { icon: FileSpreadsheet, title: t('features.reports.title'), desc: t('features.reports.desc'), gradient: 'gradient-success' },
    { icon: Building2, title: t('features.multi.title'), desc: t('features.multi.desc'), gradient: 'gradient-primary' },
    { icon: Smartphone, title: t('features.mobile.title'), desc: t('features.mobile.desc'), gradient: 'gradient-accent' },
  ];

  const stats = [
    { value: 5000, suffix: '+', label: 'Students Managed', icon: Users },
    { value: 100, suffix: '+', label: 'Libraries Active', icon: Building2 },
    { value: 99.9, suffix: '%', label: 'Uptime Guaranteed', icon: Zap },
    { value: 50000, suffix: '+', label: 'Entries Logged', icon: TrendingUp },
  ];

  const benefits = [
    { icon: Zap, text: 'Lightning fast QR entry', desc: 'Scan & enter in under 3 seconds' },
    { icon: Shield, text: 'Secure & encrypted data', desc: 'Bank-level encryption for all records' },
    { icon: BarChart3, text: 'Advanced analytics', desc: 'Department-wise & time-based reports' },
    { icon: Clock, text: 'Real-time tracking', desc: 'Live occupancy & study time monitoring' },
    { icon: Users, text: 'Multi-college support', desc: 'One system for multiple institutions' },
    { icon: CheckCircle, text: 'Auto fine calculation', desc: 'Smart fine tracking with limits' },
  ];

  const howItWorks = [
    { step: '01', title: 'Sign Up & Setup', desc: 'Create your library account and configure departments, years, and settings in minutes.', icon: Sparkles, gradient: 'gradient-primary' },
    { step: '02', title: 'Add Students & Books', desc: 'Import student profiles via Excel or add manually. Catalog your entire book collection.', icon: Users, gradient: 'gradient-accent' },
    { step: '03', title: 'Generate QR Code', desc: 'Get a unique QR code for your library. Print it and place at the entrance.', icon: QrCode, gradient: 'gradient-warm' },
    { step: '04', title: 'Track & Analyze', desc: 'Students scan QR to enter. You get real-time dashboard with analytics and reports.', icon: TrendingUp, gradient: 'gradient-success' },
  ];

  const testimonials = [
    { name: 'Dr. Priya Sharma', role: 'Head Librarian, Delhi University', text: 'This system transformed our library management. From manual registers to digital tracking in just one day!', rating: 5 },
    { name: 'Rajesh Kumar', role: 'College Admin, IIT Kanpur', text: 'The QR-based entry system saved us hours of manual work. Students love the quick scan feature.', rating: 5 },
    { name: 'Anita Verma', role: 'Librarian, Government College', text: 'Best library management tool for Indian colleges. Hindi support makes it accessible for everyone.', rating: 5 },
  ];

  const advancedFeatures = [
    { icon: Fingerprint, title: 'Smart Student Search', desc: 'Search by name, enrollment, phone or roll number instantly' },
    { icon: Bell, title: 'Overdue Alerts', desc: 'Automatic notifications for overdue books and fines' },
    { icon: Globe, title: 'Bilingual Support', desc: 'Full Hindi + English interface for all users' },
    { icon: Award, title: 'Gamification & Points', desc: 'Reward students with points and badges for library visits' },
    { icon: Lock, title: 'Entry Password', desc: 'Secure library entry with librarian-set passwords' },
    { icon: Star, title: 'Student Portal', desc: 'Students can view their stats, borrow history & give feedback' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-heavy border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium">{t('auth.login')}</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground shadow-primary font-medium">
                {t('hero.cta.signup')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-[10%] w-80 h-80 rounded-full bg-primary/8 blur-3xl animate-float" />
          <div className="absolute bottom-10 right-[10%] w-96 h-96 rounded-full bg-accent/8 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl" />
        </div>
        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
              <Zap className="h-3.5 w-3.5" /> {t('app.tagline')}
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            <span className="gradient-text">Smart Library</span>
            <br />
            <span className="text-foreground">Management System</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-primary text-base px-8 gap-2 h-12 rounded-xl font-semibold btn-float">
                {t('hero.cta.signup')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base px-8 h-12 rounded-xl font-semibold btn-float">
                {t('auth.login')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={i}>
                <div className="text-center p-6 rounded-2xl bg-card shadow-card card-hover border border-border/50 group">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl md:text-4xl font-extrabold gradient-text">
                    <AnimatedCounter end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-3xl md:text-4xl font-bold mb-3">{t('features.title')}</motion.h2>
            <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="text-muted-foreground max-w-lg mx-auto">Everything you need to manage your library efficiently</motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="shadow-card card-hover border-border/50 group h-full overflow-hidden relative">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03]" />
                  <CardContent className="p-6 relative">
                    <div className={`h-12 w-12 rounded-xl ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works / कैसे काम करता है</h2>
            <p className="text-muted-foreground">Get started in 4 simple steps</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="relative text-center group">
                  <div className={`h-16 w-16 rounded-2xl ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <item.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 md:right-auto md:-left-2 h-7 w-7 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-8 -right-8 text-muted-foreground/30">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20 mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Advanced Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Powerful & Smart / शक्तिशाली और स्मार्ट</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Built specifically for Indian college libraries</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {advancedFeatures.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={i}>
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-card shadow-card border border-border/50 card-hover group">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Why Choose Us? / हमें क्यों चुनें?</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="flex items-start gap-3 p-5 rounded-xl bg-card shadow-card border border-border/50 card-hover group h-full">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block mb-0.5">{b.text}</span>
                    <span className="text-xs text-muted-foreground">{b.desc}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">What Librarians Say / लाइब्रेरियन क्या कहते हैं</h2>
            <p className="text-muted-foreground">Trusted by libraries across India</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="shadow-card card-hover border-border/50 h-full overflow-hidden">
                  <div className="h-1 gradient-primary" />
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={0}
            className="text-center p-10 md:p-14 rounded-3xl gradient-primary shadow-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_hsl(200_90%_55%_/_0.3),_transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_hsl(320_75%_55%_/_0.2),_transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">Ready to Transform Your Library?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">Start managing your library smarter with QR-based entry, real-time analytics, and automated fines.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8 h-12 rounded-xl shadow-elevated btn-float">
                    Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="border-white/30 text-primary-foreground hover:bg-white/10 font-semibold px-8 h-12 rounded-xl btn-float">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-sm">{t('app.name')}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Smart Library Management for Indian colleges & institutions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/signup" className="block hover:text-foreground transition-colors">Get Started</Link>
                <Link to="/login" className="block hover:text-foreground transition-colors">Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/privacy" className="block hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block hover:text-foreground transition-colors">Terms of Service</Link>
                <Link to="/about" className="block hover:text-foreground transition-colors">About Us</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="mailto:support@smartlibraryentry.com" className="block hover:text-foreground transition-colors">Contact Us</a>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} S_Amir786. All rights reserved. | Smart Library Entry v2.0
          </div>
        </div>
      </footer>
    </div>
  );
}
