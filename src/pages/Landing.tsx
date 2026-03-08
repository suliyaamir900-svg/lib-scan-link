import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, LayoutDashboard, PenTool, FileSpreadsheet, Building2, Smartphone, ArrowRight, BookOpen } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">{t('auth.login')}</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground shadow-primary">
                {t('hero.cta.signup')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full gradient-primary blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full gradient-accent blur-3xl" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium gradient-primary text-primary-foreground mb-6">
              📚 {t('app.tagline')}
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 max-w-4xl mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-primary text-base px-8 gap-2">
                {t('hero.cta.signup')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                {t('auth.login')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('features.title')}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="shadow-card hover:shadow-lg transition-all duration-300 border-border/50 group h-full">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-xl ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} S_Amir786. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
