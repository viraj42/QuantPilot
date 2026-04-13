import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLevelRoadmap, startPracticeSession } from '../api/practice.api';
import { LevelNode } from '../components/LevelComponent';
import { Breadcrumb } from '../components/TopicPageComponent';
import Navbar from '../components/Navbar';
import Background3D from '../components/Background3D';
import Loader from './Loader';
import { Star } from 'lucide-react';
import { motion } from "framer-motion";

const LevelRoadmapPage = () => {
  const { sectionId, topicId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingLevel, setGeneratingLevel] = useState(null);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const response = await getLevelRoadmap(topicId);
        setData(response);
      } catch (err) {
        console.error("Roadmap Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [topicId]);

  const handleStartSession = async (level) => {
    if (generatingLevel !== null) return; // prevent double-click
    setGeneratingLevel(level);
    try {
      await startPracticeSession(topicId, level);
      navigate(`/practice/${sectionId}/${topicId}/level/${level}`);
    } catch (err) {
      console.error(err);
      setGeneratingLevel(null);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader /></div>;

  return (
    <div className="min-h-screen bg-background transition-colors duration-500 overflow-x-hidden">
      <Background3D />
      <Navbar />

      <main className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 pt-4 pb-20">
        
        {/* --- TIGHTENED ELITE HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border/10 pb-6">
          <div className="space-y-0.5">
            <Breadcrumb sectionName={data.topic.name} />
          </div>

          {/* ── REFINED STAT STRIP ── */}
          <div className="flex items-center gap-0 glass-card !rounded-2xl border-border/20 overflow-hidden shadow-xl self-start md:self-center">

            {/* Progress stat */}
            <div className="flex items-center gap-3 px-5 py-4">
              {/* Mini arc indicator */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" className="stroke-border/40" strokeWidth="3" />
                  <motion.circle
                    cx="18" cy="18" r="14" fill="none"
                    className="stroke-primary"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.topic.overallProgress / 100) * 87.96} 87.96`}
                    initial={{ strokeDasharray: "0 87.96" }}
                    animate={{ strokeDasharray: `${(data.topic.overallProgress / 100) * 87.96} 87.96` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-black text-primary">{data.topic.overallProgress}%</span>
                </div>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/30 leading-none mb-0.5">Progress</p>
                <p className="text-lg font-heading font-black tracking-tight text-foreground leading-none">{data.topic.overallProgress}<span className="text-sm text-foreground/40">%</span></p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-border/40 flex-shrink-0" />

            {/* Levels stat */}
            <div className="px-5 py-4 text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/30 leading-none mb-0.5">Levels</p>
              <p className="text-lg font-heading font-black tracking-tight text-foreground leading-none">{data.levels.length}</p>
            </div>

          </div>
        </div>

        {/* --- SINUOUS ROADMAP --- */}
        <div className="flex flex-col items-center">
          {data.levels.map((levelData, index) => (
            <LevelNode
              key={levelData.level}
              data={levelData}
              onStart={handleStartSession}
              index={index}
              isGenerating={generatingLevel === levelData.level}
              anyGenerating={generatingLevel !== null}
            />
          ))}
          
          {/* Final Milestone Indicator */}
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="w-16 h-16 rounded-full border-4 border-dashed border-border/40 flex items-center justify-center mt-6"
          >
             <Star className="text-foreground/10" size={24} />
          </motion.div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-foreground/20 mt-3">Module Finalized</p>
        </div>

      </main>
    </div>
  );
};

export default LevelRoadmapPage;