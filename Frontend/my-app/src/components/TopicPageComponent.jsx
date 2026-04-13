import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, CheckCircle2, PlayCircle, Star } from 'lucide-react';

export const Breadcrumb = ({ sectionName }) => (
  <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20">
    <Link to="/practice" className="hover:text-primary transition-colors">Practice</Link>
    <span className="scale-75">/</span>
    <span className="text-foreground/40">{sectionName}</span>
  </nav>
);

export const TopicBentoTile = ({ topic, sectionSlug, index, spanClass }) => {
  const isMastered = topic.overall >= 80;
  const isStarted = topic.attempts > 0;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`glass-card p-7 flex flex-col justify-between transition-all duration-500 border-none shadow-xl relative overflow-hidden group h-full ${spanClass}`}
    >
      {/* Signature Background Pattern from your Old Version */}
      {/* <div className="absolute -right-2 -bottom-2 opacity-[0.05] text-foreground transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
        <LayoutGrid size={140} strokeWidth={1} />
      </div> */}

      <Link to={`/practice/${sectionSlug}/${topic.topicId}`} className="relative z-10 h-full flex flex-col">
        {/* Top Row: Play Icon and Attempts */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <PlayCircle size={22} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">
            {topic.attempts} Attempts
          </span>
        </div>

        {/* Middle: Heading and Module Label */}
        <div className="flex-1">
          <h4 className="text-2xl font-heading font-black tracking-tight text-primary leading-tight mb-1">
            {topic.topicName}
          </h4>
          <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.1em] mb-8">
            Module {index + 1}
          </p>

          {/* Signature Triple Mastery Bars from your Old Version */}
          <div className="flex gap-1.5 mb-8">
            {[
              { val: topic.easy, col: "bg-emerald-400" },
              { val: topic.med, col: "bg-amber-400" },
              { val: topic.hard, col: "bg-rose-400" }
            ].map((lvl, i) => (
              <div key={i} className="flex-1 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${lvl.val}%` }}
                  className={`h-full ${lvl.col}`} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row: Mastery % and Floating Button */}
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-black opacity-30 uppercase tracking-tighter">Current Mastery</p>
            <p className="text-3xl font-heading font-black text-primary leading-none">{topic.overall}%</p>
          </div>
          
          <button className="btn-primary !px-6 !py-3 !rounded-2xl !text-sm font-bold shadow-lg shadow-blue-500/30 transform transition-transform group-hover:scale-105 active:scale-95">
             {isMastered ? 'Review' : 'Resume'}
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

// --- 4. SECTION PROGRESS STRIP ---
// --- 4. SECTION PROGRESS STRIP ---
export const SectionProgressStrip = ({ progressPercent }) => (
  <div className="w-full py-8 border-y border-border/40 my-8 space-y-4">

    <div className="flex justify-between items-end">
      <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">
        Progress :
      </span>
    </div>
    <br />
    <div className="relative h-2 w-full bg-foreground/5 rounded-full overflow-visible">

      {/* Filled Bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ duration: 1.2, ease: "circOut" }}
        className="relative h-full bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]"
      >

        {/* Percentage at end of filled bar */}
        <span className="absolute -top-6 right-0 text-sm font-heading font-bold text-primary whitespace-nowrap">
          {progressPercent}%
        </span>

      </motion.div>

      {/* Flag at end of full bar */}
      <span className="absolute -top-6 right-0 text-xl">
        🚩
      </span>

    </div>

  </div>
);
