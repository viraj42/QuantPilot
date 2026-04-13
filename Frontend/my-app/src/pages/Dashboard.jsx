import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../utils/useAuth';
import { getDashboardOverview, getRecentTopics, getWeakTopics, getInsight, getUserRank } from '../api/analytics';
import { mapDashboardData } from '../utils/dashboardMapper';
import UniversalTopicCard from '../components/UniversalTopicCard';
import { MetricCard, ConsistencyMiniChart } from '../components/DashboardComponents';
import Navbar from '../components/Navbar';
import Loader from './Loader';

/* ── Reusable section label ── */
const SectionLabel = ({ children, action }) => (
  <div className="flex items-center justify-between px-0.5 mb-4">
    <div className="flex items-center gap-3">
      <div className="w-1 h-4 bg-primary rounded-full" />
      <h3 className="text-[11px] font-black uppercase tracking-[0.45em] text-foreground/50">
        {children}
      </h3>
    </div>
    {action}
  </div>
);

/* ── Quick action chip ── */
const QuickChip = ({ to, emoji, label }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/60 dark:bg-surface/30
        border border-border/50 hover:border-primary/30 text-[11px] font-bold
        text-foreground/60 hover:text-foreground transition-all cursor-pointer backdrop-blur-sm"
    >
      <span>{emoji}</span>
      <span className="hidden sm:inline">{label}</span>
    </motion.div>
  </Link>
);

/* ── Empty state ── */
const EmptyState = ({ message }) => (
  <div className="py-10 text-center text-foreground/25 italic text-xs tracking-wide
    border border-dashed border-border/30 rounded-2xl">
    {message}
  </div>
);

const Dashboard = () => {
  const [Userrank, setRank] = useState(0);
  const [insights, setInsights] = useState('');
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [state, setState] = useState({
    overview: null,
    recent: [],
    weak: [],
    loading: true,
  });
  const navigate = useNavigate();

  /* ── Data fetching — unchanged ── */
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [overviewRaw, recentRaw, weakRaw] = await Promise.all([
          getDashboardOverview(),
          getRecentTopics(),
          getWeakTopics(),
        ]);

        const normalizeTopic = (t) => ({
          id: t.topicId,
          sectionId: t.sectionId,
          title: t.topicName,
          status: t.overall >= 80 ? 'Mastered' : t.overall > 0 ? 'In Progress' : 'Not Started',
          easy: t.easy ?? 0, med: t.med ?? 0, hard: t.hard ?? 0,
          overall: t.overall ?? 0, attempts: t.attempts ?? 0,
        });

        setState({
          overview: mapDashboardData(overviewRaw),
          recent: Array.isArray(recentRaw) ? recentRaw.map(normalizeTopic) : [],
          weak: Array.isArray(weakRaw) ? weakRaw.map(normalizeTopic) : [],
          loading: false,
        });
      } catch (err) {
        console.error('Dashboard Sync Error:', err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const insight_data = await getInsight();
        if (!insight_data) return;
        setInsights(insight_data.insight);

        const rank_data = await getUserRank();
        if (!rank_data) return;
        setRank(rank_data.rank);
      } catch (error) {
        console.error('Dashboard Sync Error:', error);
      }
    };
    fetchInfo();
  }, []);

  /* ── Loading state ── */
  if (state.loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader />
    </div>
  );

  const { metrics, weeklyAttempts } = state.overview;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden">
      <Navbar onOpenMenu={() => setMobileOpen(true)} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pt-8 pb-20 px-4 sm:px-6 lg:px-10"
      >
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">

          {/* ── Header ── */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <motion.h1
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-black tracking-tighter leading-tight"
              >
                Welcome back,{' '}
                <span className="text-primary italic">{user?.name}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-foreground/40 text-sm font-medium"
              >
                {metrics.readiness > 70
                  ? "You're in the elite zone. Keep the momentum for the next mock."
                  : 'Focus on your weak areas today to boost your readiness index.'}
              </motion.p>
            </div>

            {/* Quick action chips */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex items-center gap-2 shrink-0"
            >

            </motion.div>
          </header>

          {/* ── Metric Cards ── */}
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
              <MetricCard label="🎯 Accuracy" value={`${metrics.accuracy}%`} meta="Accuracy Rate" />
              <MetricCard label="⚙️ Solved" value={metrics.solved} meta="Total Covered" />
              <MetricCard label="📈 Readiness" value={`${metrics.readiness}%`} />
              <MetricCard label="🏆 Rank" value={Userrank || 'Top 5%'} meta="Global Rank" colorClass="text-accent" />
            </div>
          </section>

          {/* ── Practice Momentum + Pilot Insight ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 items-stretch">

            {/* Chart — 2/3 on desktop */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <SectionLabel>Practice Momentum</SectionLabel>
              <div className="flex-1">
                <ConsistencyMiniChart dailyCounts={weeklyAttempts} />
              </div>
            </div>

            {/* Insight card — 1/3 on desktop */}
            <div className="glass-card p-6 md:p-7 bg-primary/5 dark:bg-primary/[0.03]
              border-primary/20 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full
                blur-3xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <span className="text-3xl mb-4 transform group-hover:rotate-12 transition-transform
                inline-block select-none">
                🚀
              </span>
              <h4 className="text-base font-heading font-black mb-2 tracking-tight text-foreground/80
                uppercase tracking-[0.1em] text-[11px]">
                Pilot Insight
              </h4>
              <p className="text-sm text-foreground/55 leading-relaxed font-medium">
                {insights || 'Complete more practice sessions to unlock personalized insights.'}
              </p>
            </div>
          </section>

          {/* ── Topic Sections ── */}
          <div className="space-y-8 md:space-y-10">

            {/* Recently Practiced */}
            <section>
              <SectionLabel
                action={
                  <Link
                    to="/practice"
                    className="text-[10px] font-black text-primary hover:underline
                      underline-offset-4 uppercase tracking-widest"
                  >
                    Full History →
                  </Link>
                }
              >
                Recently Practiced
              </SectionLabel>

              {state.recent.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x
                  md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-x-visible md:pb-0">
                  {state.recent.map((topic) => (
                    <div
                      key={topic.id}
                      className="snap-start shrink-0 w-[270px] sm:w-[290px] md:w-auto cursor-pointer"
                      onClick={() => navigate(`/practice/${topic.sectionId}/${topic.id}`)}
                    >
                      <UniversalTopicCard topic={topic} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No recent activity yet — start practicing!" />
              )}
            </section>

            {/* Weak Topics */}
            <section>
              <SectionLabel>Weak Topics</SectionLabel>

              {state.weak.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x
                  md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-x-visible md:pb-0">
                  {state.weak.map((topic) => (
                    <div
                      key={topic.id}
                      className="snap-start shrink-0 w-[270px] sm:w-[290px] md:w-auto cursor-pointer"
                      onClick={() => navigate(`/practice/${topic.sectionId}/${topic.id}`)}
                    >
                      <UniversalTopicCard topic={topic} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No weak topics detected — great work! 🎉" />
              )}
            </section>

          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default Dashboard;