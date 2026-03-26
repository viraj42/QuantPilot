import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SectionCard from '../components/sectionCard';
import UniversalTopicCard from '../components/UniversalTopicCard';
import { getSession, getRecentTopics } from '../api/practice.api';
import Navbar from '../components/Navbar';

const PracticeHome = () => {

  const [state, setState] = useState({
    sections: [],
    recent: [],
    loading: true
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {

    const fetchPracticeData = async () => {
      try {

        const [sessionData, recentData] = await Promise.all([
          getSession(),
          getRecentTopics()
        ]);

        console.log(sessionData);

        const normalizedSections = Array.isArray(sessionData?.sections)
          ? sessionData.sections.map(sec => ({
              id: sec.sectionId,
              name: sec.sectionName,
              topicCount: sec.topicCount ?? 0,
              easy: sec.easy ?? 0,
              medium: sec.medium ?? 0,
              hard: sec.hard ?? 0,
              progress: sec.overall ?? 0,
              slug: sec.sectionId
            }))
          : [];

        console.log(normalizedSections);

        const normalizedRecent = Array.isArray(recentData)
          ? recentData.map(t => ({
              id: t.topicId,
              title: t.topicName,
              status: t.overall >= 80 ? "Mastered" : "In Progress",
              easy: t.easy ?? 0,
              med: t.med ?? 0,
              hard: t.hard ?? 0,
              overall: t.overall ?? 0,
              attempts: t.attempts ?? 0
            }))
          : [];

        setState({
          sections: normalizedSections,
          recent: normalizedRecent.slice(0, 3),
          loading: false
        });

      } catch (err) {

        console.error("Practice Home Load Error:", err);

        setState(prev => ({
          ...prev,
          loading: false
        }));

      }
    };

    fetchPracticeData();

  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-10 h-1 bg-primary animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">

      <Navbar onOpenMenu={() => setMobileOpen(true)} />

      <main className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">

        <div className="max-w-7xl mx-auto space-y-12">

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-border/20 pb-4">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tighter">
                Practice Home
              </h1>
              <p className="text-foreground/40 font-medium text-sm">
                Sharpen your aptitude skills through structured domains.
              </p>
            </div>
          </header>

          <section className="space-y-8">

            <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-foreground/70 ml-1">
              Learning Domains
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {state.sections.map(section => (

                <SectionCard
                  key={section.id}
                  sectionName={section.name}
                  topicCount={section.topicCount}
                  easy={section.easy}
                  medium={section.medium}
                  hard={section.hard}
                  progress={section.progress}
                  link={`/practice/${section.slug}`}
                />

              ))}

            </div>

          </section>

          {state.recent.length > 0 && (

            <section className="space-y-8">

              <div className="flex justify-between items-end">

                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-foreground/70 ml-1">
                  Continue Where You Left Off
                </h3>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {state.recent.map(topic => (

                  <div key={topic.id} className="opacity-90 hover:opacity-100 transition-opacity">

                    <UniversalTopicCard topic={topic} />

                  </div>

                ))}

              </div>

            </section>

          )}

        </div>

      </main>

    </div>
  );
};

export default PracticeHome;