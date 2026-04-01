import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { QrCode, LayoutDashboard, PenTool, FileSpreadsheet, Building2, Smartphone, ArrowRight, BookOpen, Shield, Zap, BarChart3, Users, Clock, CheckCircle } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }),
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
    { value: 5000, suffix: '+', label: 'Students Managed' },
    { value: 100, suffix: '+', label: 'Libraries Active' },
    { value: 99.9, suffix: '%', label: 'Uptime Guaranteed' },
    { value: 50000, suffix: '+', label: 'Entries Logged' },
  ];

  const benefits = [
    { icon: Zap, text: 'Lightning fast QR entry' },
    { icon: Shield, text: 'Secure & encrypted data' },
    { icon: BarChart3, text: 'Advanced analytics' },
    { icon: Clock, text: 'Real-time tracking' },
    { icon: Users, text: 'Multi-college support' },
    { icon: CheckCircle, text: 'Auto fine calculation' },
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
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-primary text-base px-8 gap-2 h-12 rounded-xl font-semibold">
                {t('hero.cta.signup')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base px-8 h-12 rounded-xl font-semibold">
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
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="text-center p-6 rounded-2xl bg-card shadow-card card-hover border border-border/50">
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

      {/* Benefits */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Why Choose Us?</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card border border-border/50 card-hover">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center p-10 md:p-14 rounded-3xl gradient-primary shadow-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_hsl(200_90%_55%_/_0.3),_transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">Ready to Transform Your Library?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">Start managing your library smarter with QR-based entry, real-time analytics, and automated fines.</p>
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8 h-12 rounded-xl shadow-elevated">
                  Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/signup" className="block hover:text-foreground transition-colors">Get Started</Link>
                <Link to="/login" className="block hover:text-foreground transition-colors">Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/about" className="block hover:text-foreground transition-colors">About Us</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/privacy" className="block hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block hover:text-foreground transition-colors">Terms of Service</Link>
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
