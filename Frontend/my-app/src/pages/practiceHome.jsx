import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SectionCard from '../components/sectionCard';
import UniversalTopicCard from '../components/UniversalTopicCard';
import { getSession, getRecentTopics } from '../api/practice.api';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

/* ── Reusable section label — same pattern as Dashboard ── */
const SectionLabel = ({ children, badge }) => (
  <div className="flex items-center gap-3 px-0.5 mb-4">
    <div className="w-1 h-4 bg-primary rounded-full" />
    <h3 className="text-[11px] font-black uppercase tracking-[0.45em] text-foreground/50">
      {children}
    </h3>
    {badge && (
      <span className="ml-auto text-[9px] font-black uppercase tracking-widest
        px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
        {badge}
      </span>
    )}
  </div>
);

/* ── Horizontal scroll hint — visible on mobile only ── */
const ScrollHint = () => (
  <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/25
    text-right pr-1 mt-1 md:hidden">
    ← swipe to see more →
  </p>
);

const PracticeHome = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    sections: [],
    recent: [],
    loading: true,
  });

  /* ── Data fetching — 100% unchanged ── */
  useEffect(() => {
    const fetchPracticeData = async () => {
      try {
        const [sessionData, recentData] = await Promise.all([
          getSession(),
          getRecentTopics(),
        ]);

        const normalizedSections = Array.isArray(sessionData?.sections)
          ? sessionData.sections.map((sec) => ({
            id: sec.sectionId,
            name: sec.sectionName,
            topicCount: sec.topicCount ?? 0,
            easy: sec.easy ?? 0,
            medium: sec.medium ?? 0,
            hard: sec.hard ?? 0,
            progress: sec.overall ?? 0,
            slug: sec.sectionId,
          }))
          : [];

        const normalizedRecent = Array.isArray(recentData)
          ? recentData.map((t) => ({
            id: t.topicId,
            title: t.topicName,
            sectionId: t.sectionId,
            status: t.overall >= 80 ? 'Mastered' : 'In Progress',
            easy: t.easy ?? 0,
            med: t.med ?? 0,
            hard: t.hard ?? 0,
            overall: t.overall ?? 0,
            attempts: t.attempts ?? 0,
          }))
          : [];

        setState({
          sections: normalizedSections,
          recent: normalizedRecent.slice(0, 3),
          loading: false,
        });
      } catch (err) {
        console.error('Practice Home Load Error:', err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchPracticeData();
  }, []);

  /* ── Loading state ── */
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader />
      </div>
    );
  }

  const totalDomains = state.sections.length;
  const masteredCount = state.sections.filter((s) => s.progress >= 80).length;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pt-8 pb-20 px-4 sm:px-6 lg:px-10"
      >
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">

          {/* ── Page Header ── */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4
            border-b border-border/20 pb-6">
            <div className="space-y-1.5">
              <motion.h1
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-black tracking-tighter"
              >
                Practice Home
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-foreground/40 font-medium text-sm"
              >
                Sharpen your aptitude skills through structured domains.
              </motion.p>
            </div>

            {/* Domain summary pills */}
            {totalDomains > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex items-center gap-2 shrink-0"
              >
                {masteredCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                    bg-secondary/8 border border-secondary/20 text-[11px] font-black text-secondary">
                    ✅ {masteredCount} Mastered
                  </div>
                )}
              </motion.div>
            )}
          </header>

          {/* ── Learning Domains ── */}
          <section>
            <SectionLabel badge={totalDomains > 0 ? `${totalDomains} total` : null}>
              Learning Domains
            </SectionLabel>

            {state.sections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {state.sections.map((section, i) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.07,
                      duration: 0.45,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                  >
                    <SectionCard
                      sectionName={section.name}
                      topicCount={section.topicCount}
                      easy={section.easy}
                      medium={section.medium}
                      hard={section.hard}
                      progress={section.progress}
                      link={`/practice/${section.slug}`}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-foreground/25 italic text-xs tracking-wide
                border border-dashed border-border/30 rounded-2xl">
                No domains available yet.
              </div>
            )}
          </section>

          {/* ── Continue Where You Left Off ── */}
          {state.recent.length > 0 && (
            <section>
              <SectionLabel badge={`${state.recent.length} recent`}>
                Continue Where You Left Off
              </SectionLabel>

              {/* Mobile: horizontal scroll; md+: grid */}
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x
                md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-x-visible md:pb-0">
                {state.recent.map((topic, i) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="snap-start shrink-0 w-[270px] sm:w-[290px] md:w-auto cursor-pointer"
                    onClick={() => navigate(`/practice/${topic.sectionId}/${topic.id}`)}
                  >
                    <UniversalTopicCard topic={topic} />
                  </motion.div>
                ))}
              </div>
              <ScrollHint />
            </section>
          )}

        </div>
      </motion.main>
    </div>
  );
};

export default PracticeHome;