import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Background3D from '../components/Background3D';
import Navbar from '../components/Navbar';
import {
  Zap, Target, Clock, BarChart3, BookOpen, Trophy,
  ChevronRight, Star, ArrowRight, CheckCircle2, Brain,
  TrendingUp, Shield, Layers
} from 'lucide-react';

/* ─────────────────────────────────────────────
   SECTION: ANIMATED COUNTER
───────────────────────────────────────────── */
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const increment = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─────────────────────────────────────────────
   SECTION: GLOW BADGE
───────────────────────────────────────────── */
const GlowBadge = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
    bg-primary/10 border border-primary/25 text-primary text-[10px]
    font-black uppercase tracking-widest backdrop-blur-sm">
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   SECTION: FEATURE CARD
───────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, desc, color = 'primary', delay = 0 }) => {
  const colorMap = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="glass-card p-7 flex flex-col gap-5 group cursor-default
        hover:border-primary/30 hover:shadow-primary/5 hover:shadow-2xl"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color]} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="text-lg font-heading font-bold mb-2 tracking-tight">{title}</h3>
        <p className="text-foreground/50 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   SECTION: STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ value, suffix, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center justify-center gap-1 py-8 px-4"
  >
    <div className="text-4xl md:text-5xl font-heading font-black tracking-tighter text-foreground">
      <AnimatedCounter target={value} suffix={suffix} />
    </div>
    <p className="text-foreground/40 text-xs font-bold uppercase tracking-widest text-center">{label}</p>
  </motion.div>
);

/* ─────────────────────────────────────────────
   SECTION: STEP
───────────────────────────────────────────── */
const Step = ({ step, title, desc, icon: Icon, isLast, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.5, delay }}
    className="flex gap-6"
  >
    {/* Line connector */}
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-inner">
        <Icon size={20} className="text-primary" strokeWidth={1.75} />
      </div>
      {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-primary/30 to-transparent mt-3 min-h-[48px]" />}
    </div>

    <div className="pb-10">
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1 block">{step}</span>
      <h3 className="text-xl font-heading font-bold mb-2 tracking-tight">{title}</h3>
      <p className="text-foreground/50 text-sm leading-relaxed max-w-xs">{desc}</p>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────
   TESTIMONIAL CARD
───────────────────────────────────────────── */
const TestimonialCard = ({ name, role, text, avatar, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-7 flex flex-col gap-5 hover:border-primary/25 transition-all duration-300"
  >
    {/* Stars */}
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={13} className="text-accent fill-accent" />
      ))}
    </div>
    <p className="text-sm text-foreground/60 leading-relaxed italic">"{text}"</p>
    <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border/30">
      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
        {name[0]}
      </div>
      <div>
        <p className="text-sm font-bold">{name}</p>
        <p className="text-foreground/40 text-xs">{role}</p>
      </div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  const features = [
    { icon: Target, title: 'Smart Practice Engine', desc: 'Deterministic session generation ensures you always face unseen questions first, then reinforces weak areas.', color: 'primary' },
    { icon: Clock, title: 'Mock Exam Engine', desc: 'Backend-validated timer with frozen question sets. Real exam conditions, zero loopholes.', color: 'secondary' },
    { icon: BarChart3, title: 'Performance Analytics', desc: 'Real-time accuracy tracking, readiness indexing & topic-level heatmaps to identify gaps instantly.', color: 'accent' },
    { icon: BookOpen, title: 'Structured Curriculum', desc: 'Clean academic hierarchy — sections → topics → levels. Optimized to maximize your score progression.', color: 'violet' },
    { icon: Brain, title: 'Pilot Insight AI', desc: 'Personalized AI coaches guide your prep with intelligent study insights based on your performance data.', color: 'cyan' },
    { icon: Trophy, title: 'Global Ranking', desc: 'Compare your readiness against thousands of aspirants. Climb the leaderboard with every session.', color: 'rose' },
  ];

  const steps = [
    { step: 'Step 01', title: 'Choose your topic', desc: 'Browse our structured curriculum organized by section and topic. Each topic has three difficulty tiers.', icon: Layers },
    { step: 'Step 02', title: 'Practice & Unlock levels', desc: 'Our engine tracks accuracy in real-time. Score ≥70% to unlock the next difficulty tier automatically.', icon: Shield },
    { step: 'Step 03', title: 'Take Mock Tests', desc: 'Simulate full exam conditions with backend timer validation. Your questions are frozen — no refresh cheats.', icon: Clock },
    { step: 'Step 04', title: 'Measure your Readiness', desc: 'Check your Readiness Index, Global Rank, and Pilot Insight to know exactly where you stand.', icon: TrendingUp },
  ];

  const testimonials = [
    { name: 'Arjun Mehta', role: 'CAT 2024 — 98.6 percentile', text: 'Aptify\'s review mode completely changed how I study. Mistakes become assets — I\'ve never improved this fast.' },
    { name: 'Priya Sharma', role: 'GATE 2024 — AIR 42', text: 'The analytics dashboard is insane. I knew exactly which topics to fix two weeks before the exam. Absolute game changer.' },
    { name: 'Rahul Sinha', role: 'XAT 2024 — 97.2 percentile', text: 'Tried four platforms before this. Nothing comes close to the structure of Aptify. The mock engine is flawless.' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      {/* Fixed 3D background */}
      <Background3D />
      <Navbar />

      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[200] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <main className="relative z-10">

        {/* ══════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-24 pb-16 md:pb-24 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left copy */}
          <motion.div
            style={{ y: heroY }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex-1 w-full text-center lg:text-left space-y-6"
          >
            <GlowBadge>🏆 #1 Aptitude Prep Platform</GlowBadge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] font-heading font-black leading-[1.05] tracking-[-0.03em]">
              Turn practice into{' '}
              <br className="hidden md:block" />
              <span className="relative inline-block">
                <span className="text-primary italic">measurable</span>
                {/* underline accent */}
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                  className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary/40 rounded-full origin-left block"
                />
              </span>{' '}
              improvement.
            </h1>



            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary gap-2 text-sm px-8 py-3.5 shadow-lg shadow-primary/20"
                  id="cta-hero-signup"
                >
                  Start for Free <ArrowRight size={16} />
                </motion.button>
              </Link>
              <a href="#how-it-works">
                <button className="flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-foreground transition-colors px-2 py-3.5">
                  See how it works <ChevronRight size={15} />
                </button>
              </a>
            </div>

            {/* Social proof */}

          </motion.div>

          {/* Right — Dashboard Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="flex-1 w-full max-w-[500px] mx-auto lg:mx-0 lg:max-w-none"
          >
            {/* Floating glow ring */}
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 blur-[60px] rounded-[3rem]" />
              <div className="glass-card p-3 md:p-4 shadow-2xl relative overflow-hidden group">
                {/* Mock dashboard UI inside card */}
                <div className="rounded-[1.6rem] bg-background/60 dark:bg-background/80 backdrop-blur p-5 space-y-4">

                  {/* Top bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Aptify⚡</p>
                      <p className="text-lg font-heading font-bold tracking-tight mt-0.5">Welcome back, <span className="text-primary italic">Viraj</span></p>
                    </div>
                    <div className="glass-card px-3 py-1.5 text-xs font-bold text-accent flex items-center gap-1.5 rounded-full">
                      🔥 14 day streak
                    </div>
                  </div>

                  {/* Metric pills */}
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { l: '🎯 Accuracy', v: '89%' },
                      { l: '⚙️ Solved', v: '1,240' },
                      { l: '📈 Readiness', v: '91%' },
                      { l: '🏆 Rank', v: '#47' },
                    ].map((m, i) => (
                      <div key={i} className="bg-primary/5 border border-border/40 rounded-xl p-2.5 text-center">
                        <p className="text-base font-heading font-black text-foreground">{m.v}</p>
                        <p className="text-[9px] text-foreground/40 font-bold mt-0.5">{m.l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini bar chart */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/35">Practice Momentum — Last 7 Days</p>
                    <div className="flex items-end gap-1.5 h-14">
                      {[18, 32, 25, 40, 28, 47, 39].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.5, delay: i * 0.06 + 0.5 }}
                          style={{ height: `${(h / 47) * 100}%` }}
                          className={`flex-1 rounded-t-md origin-bottom ${i === 5 ? 'bg-primary' : 'bg-primary/25'}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[8px] text-foreground/25 font-bold">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
                    </div>
                  </div>

                  {/* Quick access */}
                  <div className="flex gap-2">
                    {['Practice', 'Mock Tests', 'My Profile'].map((label, i) => (
                      <div key={i} className={`flex-1 py-2 px-2.5 rounded-xl text-center text-[10px] font-bold cursor-pointer transition-all hover:scale-105 ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-primary/8 text-foreground/60 border border-border/40'}`}>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating mini badge — only on md+ to avoid overflow on small screens */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-3 glass-card px-3 py-1.5 text-xs font-black shadow-xl rounded-2xl hidden md:flex items-center gap-2"
              >
                <span className="text-green-400">●</span> Live Rank Update
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -left-3 glass-card px-3 py-1.5 text-xs font-black shadow-xl rounded-2xl hidden md:flex items-center gap-2"
              >
                🎯 New level unlocked!
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════
            FEATURES SECTION
        ══════════════════════════════════════ */}
        <section id="modules" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="text-center mb-10 md:mb-14 space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <GlowBadge>⚡ Platform Features</GlowBadge>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-3xl md:text-5xl font-heading font-black tracking-tight"
            >
              Everything you need to dominate
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-foreground/45 text-base md:text-lg max-w-xl mx-auto"
            >
              Six precision-engineered modules working in harmony, built for aspirants who refuse to leave marks on the table.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.08} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════ */}
        <section id="how-it-works" className="bg-surface/5 dark:bg-surface/[0.03] backdrop-blur-sm border-y border-border/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

              {/* Left: steps */}
              <div className="space-y-4">
                <GlowBadge>🗺️ Your Journey</GlowBadge>
                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="text-3xl md:text-5xl font-heading font-black tracking-tight mb-10"
                >
                  From practice to{' '}
                  <span className="text-primary italic">peak performance</span>
                </motion.h2>

                <div>
                  {steps.map((s, i) => (
                    <Step key={i} {...s} isLast={i === steps.length - 1} delay={i * 0.1} />
                  ))}
                </div>
              </div>

              {/* Right: visual panel */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="glass-card p-6 md:p-8 lg:sticky lg:top-24 space-y-5"
              >
                {/* Section progress card */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-4">Section Progress — Quant</p>
                  <div className="space-y-3.5">
                    {[
                      { name: 'Number System', pct: 92, color: 'bg-primary' },
                      { name: 'Algebra', pct: 78, color: 'bg-secondary' },
                      { name: 'Geometry', pct: 55, color: 'bg-accent' },
                      { name: 'Data Interpretation', pct: 40, color: 'bg-violet-500' },
                    ].map((t, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-foreground/70">{t.name}</span>
                          <span className="text-foreground/50">{t.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${t.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: i * 0.15 + 0.2, ease: 'easeOut' }}
                            className={`h-full rounded-full ${t.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border/30" />


                {/* Readiness Index */}
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-4">
                  <span className="text-3xl">🚀</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Pilot Insight</p>
                    <p className="text-sm font-bold mt-0.5 leading-relaxed">Focus on Geometry this week — your accuracy drops from 78% → 42% at Hard level.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            CTA SECTION
        ══════════════════════════════════════ */}
        <section className="px-4 sm:px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto glass-card p-12 md:p-16 text-center relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/15 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 space-y-7">
              <span className="text-6xl block">⚡</span>
              <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight">
                Ready to take off?
              </h2>
              {/* <p className="text-foreground/50 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                Join 2,400+ aspirants who are training smarter. Your rank is waiting — claim it.
              </p> */}

              {/* Checklist */}
              {/* <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-foreground/60 font-semibold">
                {['Free to start', 'No credit card needed', 'Instant access', 'All levels covered'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div> */}
              <br />
              <br />
              <br />

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary gap-2 text-sm px-10 py-4 shadow-xl shadow-primary/20"
                    id="cta-bottom-signup"
                  >
                    Get Started — It's Free <ArrowRight size={16} />
                  </motion.button>
                </Link>
                <Link to="/login">
                  <button className="px-8 py-4 rounded-xl font-bold text-sm border border-border/60 bg-surface/30 hover:bg-surface/60 transition-all text-foreground/70">
                    Already have an account →
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════
            FOOTER
        ══════════════════════════════════════ */}
        <footer className="border-t border-border/20 bg-surface/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">

              {/* Copyright */}
              <p className="text-xs text-foreground/30 font-medium">
                © 2026 Aptify. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default LandingPage;