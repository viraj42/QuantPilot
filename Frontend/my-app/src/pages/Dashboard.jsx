import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../utils/useAuth';
import { getDashboardOverview, getRecentTopics, getWeakTopics } from '../api/analytics';
import { mapDashboardData } from '../utils/dashboardMapper';
import UniversalTopicCard from '../components/UniversalTopicCard';
import { MetricCard, ConsistencyMiniChart } from '../components/DashboardComponents';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [state, setState] = useState({
    overview: null,
    recent: [],
    weak: [],
    loading: true
  });
  const navigate=useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [overviewRaw, recentRaw, weakRaw] = await Promise.all([
          getDashboardOverview(),
          getRecentTopics(),
          getWeakTopics()
        ]);

        const normalizeTopic = (t) => ({
          id: t.topicId,
          title: t.topicName,
          status: t.overall >= 80 ? "Mastered" : t.overall > 0 ? "In Progress" : "Not Started",
          easy: t.easy ?? 0, med: t.med ?? 0, hard: t.hard ?? 0,
          overall: t.overall ?? 0, attempts: t.attempts ?? 0
        });

        console.log(recentRaw);
        

        setState({
          overview: mapDashboardData(overviewRaw),
          recent: Array.isArray(recentRaw) ? recentRaw.map(normalizeTopic) : [],
          weak: Array.isArray(weakRaw) ? weakRaw.map(normalizeTopic) : [],
          loading: false
        });
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    fetchAllData();
  }, []);

  if (state.loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-12 h-1 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--color-primary),0.3)]" 
      />
    </div>
  );

  const { metrics, weeklyAttempts } = state.overview;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden">
      <Navbar onOpenMenu={() => setMobileOpen(true)} />

      <main className="relative z-10 pt-16 pb-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">

          <header className="space-y-1">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-5xl font-heading font-bold tracking-tighter"
            >
              Welcome back <span className="text-primary italic">{user?.name}</span>
            </motion.h2>
            <p className="text-foreground/40 text-sm font-medium tracking-wide">
              {metrics.readiness > 70 ? "You're in the elite zone. Keep the momentum for the next mock." : "Focus on your weak areas today to boost your readiness index."}
            </p>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="🎯 Accuracy" value={`${metrics.accuracy}%`} meta="Accuracy Rate" />
            <MetricCard label="⚙️ Solved" value={metrics.solved} meta="Total Covered" />
            <MetricCard label="📈 Readiness" value={`${metrics.readiness}%`} />
            <MetricCard label="🏆 Rank" value={metrics.rank || "Top 5%"} meta="Global Rank" colorClass="text-accent" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-foreground/70 ml-1">Practice Momentum</h3>
              <ConsistencyMiniChart dailyCounts={weeklyAttempts} />
            </div>
          
            <div className="glass-card p-8 bg-primary/5 dark:bg-primary/[0.03] border-primary/20 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />
              <span className="text-4xl mb-6 transform group-hover:rotate-12 transition-transform inline-block">🚀</span>
              <h4 className="text-2xl font-heading font-bold mb-3 tracking-tighter">Pilot Insight</h4>
              <p className="text-sm text-foreground/50 leading-relaxed font-medium">
                Your velocity is peaked. Practicing <span className="text-primary font-bold">Medium Topics</span> on weekends will increase your mock readiness by <span className="text-primary font-bold">14%</span>.
              </p>
            </div>
          </section>

          <div className="space-y-16">
             <section className="space-y-6">
               <div className="flex justify-between items-center px-1">
                 <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-foreground/70">Recently Practiced</h3>
                 <Link to="/practice" className="text-[10px] font-bold text-primary hover:underline">Full History →</Link>
               </div>
               <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x px-1">
                 {state.recent.length > 0 ? state.recent.map(topic => (
                   <div
                      key={topic.id}
                      className="snap-start min-w-[300px] cursor-pointer"
                      onClick={() => navigate(`/practice/${topic.sectionId}/${topic.id}`)}
                    >
                      <UniversalTopicCard topic={topic} />
                    </div>
                 )) : <div className="p-10 text-center w-full text-foreground/30 italic text-xs">No recent activity!!.</div>}
               </div>
             </section>

             <section className="space-y-6">
               <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-foreground/70 px-1">Weak Topics</h3>
               <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x px-1">
                 {state.weak.length > 0 ? state.weak.map(topic => (
                   <div key={topic.id} className="snap-start min-w-[300px]" 
                    onClick={() => navigate(`/practice/${topic.sectionId}/${topic.id}`)}
                    >
                     <UniversalTopicCard topic={topic} />
                   </div>
                 )) : <div className="p-10 text-center w-full text-foreground/30 italic text-xs">NO TOPICS!!..</div>}
               </div>
             </section>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[200] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute top-0 left-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-950 shadow-2xl p-8 flex flex-col border-r border-border"
            >
              <div className="flex justify-between items-center mb-12 border-b border-border pb-6">
                <span className="font-heading font-bold text-xl tracking-tighter uppercase">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="text-2xl p-2 hover:bg-primary/5 rounded-full">✕</button>
              </div>
              <nav className="flex flex-col gap-6 text-xl font-bold mb-auto">
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link to="/practice" onClick={() => setMobileOpen(false)}>Practice</Link>
                <Link to="/mocks" onClick={() => setMobileOpen(false)}>Mock Tests</Link>
                <Link to="/bookmarks" onClick={() => setMobileOpen(false)}>Bookmarks</Link>
              </nav>
              <div className="pt-8 border-t border-border space-y-4">
                 <button onClick={() => {document.documentElement.classList.toggle('dark'); setMobileOpen(false)}} className="w-full py-4 border rounded-xl font-bold flex items-center justify-center gap-2">🌓 Switch Theme</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;