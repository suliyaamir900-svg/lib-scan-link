import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  QrCode, LayoutDashboard, PenTool, FileSpreadsheet, Building2, Smartphone,
  ArrowRight, BookOpen, Shield, Zap, BarChart3, Users, Clock, CheckCircle,
  Star, Bell, Globe, Lock, Sparkles, ChevronRight
} from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function AnimatedCounter({ end, suffix = '', duration = 1800 }: { end: number; suffix?: string; duration?: number }) {
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: QrCode, title: 'QR Entry / QR एंट्री', desc: 'Scan & enter in under 3 seconds. No queues, no paperwork.' },
    { icon: LayoutDashboard, title: 'Live Dashboard / लाइव डैशबोर्ड', desc: 'Real-time occupancy, peak hours and visitor trends.' },
    { icon: PenTool, title: 'Digital Signature / डिजिटल हस्ताक्षर', desc: 'Capture e-signatures on entry — fully paperless.' },
    { icon: FileSpreadsheet, title: 'Smart Reports / स्मार्ट रिपोर्ट', desc: 'Excel + PDF exports with department-wise filters.' },
    { icon: Building2, title: 'Multi-Library / मल्टी-लाइब्रेरी', desc: 'Run multiple libraries under a single account.' },
    { icon: Smartphone, title: 'Mobile-Ready / मोबाइल फ्रेंडली', desc: 'Works on any phone, tablet or desktop browser.' },
  ];

  const stats = [
    { value: 5000, suffix: '+', label: 'Students managed' },
    { value: 100, suffix: '+', label: 'Libraries active' },
    { value: 99.9, suffix: '%', label: 'Uptime' },
    { value: 50000, suffix: '+', label: 'Entries logged' },
  ];

  const benefits = [
    { icon: Zap, text: 'Lightning fast', desc: 'QR entry under 3 seconds' },
    { icon: Shield, text: 'Secure data', desc: 'Encrypted & RLS-protected' },
    { icon: BarChart3, text: 'Smart analytics', desc: 'Department & time-based' },
    { icon: Clock, text: 'Real-time tracking', desc: 'Live occupancy & study time' },
    { icon: Users, text: 'Multi-college', desc: 'One system, many institutions' },
    { icon: CheckCircle, text: 'Auto fines', desc: 'Smart calculation with limits' },
  ];

  const howItWorks = [
    { step: '01', title: 'Sign up & setup', desc: 'Create your library, add departments and rules in minutes.' },
    { step: '02', title: 'Add students & books', desc: 'Import via Excel or add manually with full profiles.' },
    { step: '03', title: 'Generate your QR', desc: 'Print one QR for the entrance — that\'s it.' },
    { step: '04', title: 'Track & analyze', desc: 'Watch live data flow into your dashboard instantly.' },
  ];

  const testimonials = [
    { name: 'Dr. Priya Sharma', role: 'Head Librarian, Delhi University', text: 'Transformed our library overnight — from registers to real-time tracking.', rating: 5 },
    { name: 'Rajesh Kumar', role: 'Admin, IIT Kanpur', text: 'QR entry saves hours every day. Students love how fast it is.', rating: 5 },
    { name: 'Anita Verma', role: 'Librarian, Govt. College', text: 'Hindi support makes it accessible for everyone on staff.', rating: 5 },
  ];

  const advancedFeatures = [
    { icon: Sparkles, title: 'Smart search', desc: 'Find by name, enrollment, phone or roll number' },
    { icon: Bell, title: 'Live alerts', desc: 'Notifications for overdue books and pending fines' },
    { icon: Globe, title: 'Bilingual', desc: 'Full Hindi + English everywhere' },
    { icon: Lock, title: 'Entry password', desc: 'Secure librarian-controlled access' },
    { icon: Star, title: 'Student portal', desc: 'Public history, fines & feedback' },
    { icon: BarChart3, title: 'AI insights', desc: 'Daily summary & smart suggestions' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Subtle ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-accent/[0.05] blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'glass-heavy border-b border-border/40 shadow-card' : 'bg-transparent'
      }`}>
        <div className="container mx-auto flex items-center justify-between h-16 px-5 max-w-6xl">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-primary group-hover:scale-105 transition-transform">
              <BookOpen className="h-[18px] w-[18px] text-primary-foreground" />
            </div>
            <span className="font-bold text-[17px] tracking-tight">{t('app.name')}</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium hidden sm:inline-flex">{t('auth.login')}</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground shadow-primary font-medium rounded-lg">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-5 relative">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/15 mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Trusted by 100+ college libraries across India
            </span>
          </motion.div>
          <motion.h1
            className="text-[44px] sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            The smart way to
            <br />
            <span className="gradient-text">run your library.</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            QR-based entry, real-time analytics, automated fines and complete book tracking — built specifically for Indian colleges.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-3 justify-center mb-14" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-primary text-[15px] px-7 gap-2 h-12 rounded-xl font-semibold btn-float w-full sm:w-auto">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-[15px] px-7 h-12 rounded-xl font-semibold w-full sm:w-auto border-border/60 hover:bg-muted/60">
                See features
              </Button>
            </a>
          </motion.div>

          {/* Hero stats strip */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/50 rounded-2xl overflow-hidden border border-border/50 max-w-3xl mx-auto"
          >
            {stats.map((s, i) => (
              <div key={i} className="bg-card px-4 py-5">
                <p className="text-2xl md:text-3xl font-bold tracking-tight">
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <motion.span initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              Features
            </motion.span>
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Everything you need.
              <br />
              <span className="text-muted-foreground">Nothing you don't.</span>
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="group h-full p-7 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-105 transition-all duration-300">
                    <f.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 px-5 bg-muted/20 border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">How it works</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              From signup to live tracking
              <br />
              <span className="text-muted-foreground">in under 10 minutes.</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {howItWorks.map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="relative h-full p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                  <div className="text-5xl font-bold text-muted-foreground/15 mb-3 group-hover:text-primary/30 transition-colors">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-base mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-24 px-5">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">Smart by default</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Powerful tools, <span className="text-muted-foreground">quietly working.</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {advancedFeatures.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:scale-105 transition-all">
                    <f.icon className="h-[18px] w-[18px] text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px] mb-1 tracking-tight">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-5 bg-muted/20 border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">Why us</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Built for librarians, <span className="text-muted-foreground">not engineers.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {benefits.map((b, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="flex items-start gap-3 p-5 rounded-xl bg-card border border-border/50 hover:shadow-card-hover transition-all duration-300 h-full">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center shrink-0">
                    <b.icon className="h-[17px] w-[17px] text-primary" />
                  </div>
                  <div>
                    <span className="text-[14px] font-semibold block mb-0.5 tracking-tight">{b.text}</span>
                    <span className="text-xs text-muted-foreground">{b.desc}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-5">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">Reviews</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Loved by librarians
              <br />
              <span className="text-muted-foreground">across India.</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((tm, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="h-full p-7 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-card-hover transition-all duration-300">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: tm.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-[15px] leading-relaxed mb-6 font-medium">"{tm.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                      {tm.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight truncate">{tm.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{tm.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="relative overflow-hidden rounded-3xl gradient-primary p-10 md:p-16 text-center shadow-elevated">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_hsl(200_90%_55%_/_0.4),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,_hsl(320_75%_55%_/_0.3),_transparent_60%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-5 tracking-tight">
                Ready when you are.
              </h2>
              <p className="text-primary-foreground/85 mb-9 max-w-lg mx-auto text-base md:text-lg font-light">
                Set up your library in minutes. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/95 font-semibold px-8 h-12 rounded-xl shadow-elevated w-full sm:w-auto">
                    Start free <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/15 font-semibold px-8 h-12 rounded-xl w-full sm:w-auto">
                    Learn more <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-5 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-sm tracking-tight">{t('app.name')}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                Smart library management built for Indian colleges and institutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Product</h4>
              <div className="space-y-2.5 text-sm">
                <Link to="/signup" className="block hover:text-primary transition-colors">Get started</Link>
                <Link to="/login" className="block hover:text-primary transition-colors">Sign in</Link>
                <a href="#features" className="block hover:text-primary transition-colors">Features</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Legal</h4>
              <div className="space-y-2.5 text-sm">
                <Link to="/privacy" className="block hover:text-primary transition-colors">Privacy</Link>
                <Link to="/terms" className="block hover:text-primary transition-colors">Terms</Link>
                <Link to="/about" className="block hover:text-primary transition-colors">About</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Support</h4>
              <div className="space-y-2.5 text-sm">
                <a href="mailto:support@smartlibraryentry.com" className="block hover:text-primary transition-colors">Contact</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} S_Amir786 — LibScan. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
