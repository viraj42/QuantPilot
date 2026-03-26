import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- 2. BREADCRUMB ---
export const Breadcrumb = ({ sectionName }) => (
  <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-4">
    <Link to="/practice" className="hover:text-primary transition-colors">Practice</Link>
    <span>/</span>
    <span className="text-foreground/60">{sectionName}</span>
  </nav>
);

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

// --- 6. UNIVERSAL TOPIC CARD (Elite Variant) ---
export const TopicCard = ({ topic, sectionSlug }) => {
  const getStatus = () => {
    if (topic.attempts === 0) return { label: "Not Started", color: "bg-foreground/5 text-foreground/40" };
    if (topic.overall >= 80) return { label: "Mastered", color: "bg-secondary/10 text-secondary border-secondary/20" };
    return { label: "In Progress", color: "bg-primary/10 text-primary border-primary/20" };
  };

  const status = getStatus();

  return (
    <motion.div
      whileHover={{ 
        y: -8, 
        rotateX: 2, 
        rotateY: -2,
        transition: { duration: 0.2 } 
      }}
      style={{ perspective: 1000 }}
      className="glass-card p-6 flex flex-col justify-between min-h-[280px] group cursor-pointer border-border/40 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all"
    >
      <Link to={`/practice/${sectionSlug}/${topic.topicId}`} className="h-full flex flex-col">
        {/* 8. Card Header */}
        <div className="flex justify-between items-start mb-8">
          <h4 className="text-lg font-heading font-bold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors">
            {topic.topicName}
          </h4>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* 9. Difficulty Mastery Block */}
        <div className="space-y-4 flex-1">
          {[
            { label: "Easy", val: topic.easy },
            { label: "Med", val: topic.med },
            { label: "Hard", val: topic.hard }
          ].map((lvl) => (
            <div key={lvl.label} className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-foreground/30">
                <span>{lvl.label}</span>
                <span>{lvl.val}%</span>
              </div>
              <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${lvl.val}%` }}
                  className="h-full bg-primary/60"
                />
              </div>
            </div>
          ))}
        </div>

        {/* 10. Card Footer */}
        <div className="mt-8 pt-4 border-t border-border/40 flex justify-between items-center text-foreground/40 font-bold">
          <span className="text-[10px] uppercase tracking-widest">Attempts: {topic.attempts}</span>
          <span className="text-xs text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            {topic.attempts === 0 ? "Start" : topic.overall >= 80 ? "Review" : "Continue"} →
          </span>
        </div>
      </Link>
    </motion.div>
  );
};