import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSectionTopics } from '../api/practice.api';
import { Breadcrumb, TopicBentoTile } from '../components/TopicPageComponent';
import { motion } from "framer-motion";
import Navbar from '../components/Navbar';
import Background3D from '../components/Background3D';
import Loader from './Loader';

const SectionTopicsPage = () => {
  const { sectionId } = useParams();
  const [data, setData] = useState({ topics: [], sectionName: "", progress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getSectionTopics(sectionId);
        const topics = response.topics || [];
        const sectionProgress = topics.length > 0 
          ? Math.round(topics.reduce((sum, t) => sum + (t.overall || 0), 0) / topics.length) 
          : 0;

        setData({
          topics,
          sectionName: response.sectionName || "Quantitative Aptitude",
          progress: sectionProgress
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [sectionId]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader /></div>;

  return (
    <div className="min-h-screen bg-background transition-colors duration-500 overflow-x-hidden">
      <Background3D />
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 pb-15">
        {/* --- REFINED ELITE HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="space-y-1">
            <Breadcrumb sectionName={data.sectionName} />
            {/* Heading size slightly reduced for cleaner aesthetics */}
            <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tighter text-foreground leading-tight">
              {data.sectionName}
            </h1>
          </div>
          
          {/* ── REFINED STAT STRIP ── */}
          <div className="flex items-center gap-0 glass-card !rounded-2xl border-border/20 overflow-hidden shadow-xl self-start md:self-center">

            {/* Overall progress stat */}
            <div className="flex items-center gap-3 px-5 py-4">
              {/* Mini animated arc */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" className="stroke-border/40" strokeWidth="3" />
                  <motion.circle
                    cx="18" cy="18" r="14" fill="none"
                    className="stroke-primary"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 87.96" }}
                    animate={{ strokeDasharray: `${(data.progress / 100) * 87.96} 87.96` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-black text-primary">{data.progress}%</span>
                </div>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/30 leading-none mb-0.5">Overall</p>
                <p className="text-lg font-heading font-black tracking-tight text-foreground leading-none">{data.progress}<span className="text-sm text-foreground/40">%</span></p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-border/40 flex-shrink-0" />

            {/* Module count stat */}
            <div className="px-5 py-4 text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/30 leading-none mb-0.5">Modules</p>
              <p className="text-lg font-heading font-black tracking-tight text-foreground leading-none">{data.topics.length}</p>
            </div>

          </div>
        </div>

        {/* --- STAGGERED BENTO GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {data.topics.map((topic, index) => {
            // Strategic Geometric Spanning Pattern
            let span = "md:col-span-4"; 
            if (index % 4 === 0) span = "md:col-span-8"; 
            if (index % 4 === 3) span = "md:col-span-6"; 
            if (index % 4 === 2) span = "md:col-span-6"; 

            return (
              <motion.div
                key={topic.topicId}
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
                className={span}
              >
                <TopicBentoTile 
                  topic={topic} 
                  sectionSlug={sectionId} 
                  index={index} 
                  spanClass="h-full"
                />
              </motion.div>
            );
          })}
        </div>

        {/* --- MINIMALIST FOOTER --- */}
    
      </main>
    </div>
  );
};

export default SectionTopicsPage;