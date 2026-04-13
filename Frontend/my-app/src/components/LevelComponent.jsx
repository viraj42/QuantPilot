import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, Zap, Star } from 'lucide-react';

export const LevelNode = ({ data, onStart, index, isGenerating = false, anyGenerating = false }) => {
  const { level, difficulty, unlocked, completed, unlockRequirement, attempts } = data;

  const difficultyLabels = {
    easy: "Fundamentals",
    medium: "Core Challenge",
    hard: "Elite Mastery"
  };

  // Logic: Alternate alignment to create the "Roadmap" path
  const isRightAligned = index % 2 !== 0;

  return (
    <div className={`relative w-full flex flex-col items-center mb-16 px-4 ${!unlocked ? 'opacity-40' : 'opacity-100'}`}>
      
      {/* The Central Connector Line (Behind everything) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-full w-0.5 bg-border/40 -z-10 hidden md:block" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`flex flex-col md:flex-row items-center gap-6 w-full max-w-2xl ${isRightAligned ? 'md:flex-row-reverse' : ''}`}
      >
        
        {/* 1. The Visual Anchor (Level Circle) */}
        <div className="relative shrink-0">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 border-2 z-10 bg-surface ${
            completed ? 'border-secondary text-secondary' : unlocked ? 'border-primary text-primary' : 'border-border text-foreground/10'
          }`}>
            {completed ? <CheckCircle2 size={24} /> : <span className="font-heading font-black text-xl">{level}</span>}
          </div>
          
          {/* Subtle Outer Ring for Unlocked Levels */}
          {unlocked && !completed && (
             <div className="absolute inset-[-4px] rounded-[1.4rem] border border-primary/20 animate-pulse" />
          )}
        </div>

        {/* 2. The Content Card */}
        <div 
          onClick={() => unlocked && !anyGenerating && onStart(level)}
          className={`flex-1 glass-card p-6 md:p-8 border-none shadow-xl transition-all group w-full text-center md:text-left
            ${
              isGenerating
                ? 'cursor-wait ring-2 ring-primary/40 scale-[1.02]'
                : !unlocked || anyGenerating
                ? 'cursor-not-allowed grayscale opacity-50'
                : 'cursor-pointer hover:scale-[1.02] active:scale-95'
            }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Lvl {level}</span>
                <div className={`w-1 h-1 rounded-full ${completed ? 'bg-secondary' : 'bg-primary'}`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${difficulty === 'hard' ? 'text-rose-500' : 'text-foreground/40'}`}>
                  {difficulty}
                </span>
              </div>
              <h4 className="text-xl font-heading font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                {isGenerating ? 'Preparing Test...' : difficultyLabels[difficulty]}
              </h4>
              
              {!unlocked && unlockRequirement && (
                <p className="text-[11px] font-bold text-rose-500 mt-2 flex items-center justify-center md:justify-start gap-1">
                  <Lock size={12} /> {unlockRequirement} Accuracy Needed
                </p>
              )}
            </div>

            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isGenerating
                ? 'bg-primary text-white shadow-lg shadow-primary/30 animate-pulse'
                : completed
                ? 'bg-secondary text-white'
                : unlocked
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-muted text-foreground/10'
            }`}>
              {isGenerating ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : attempts > 0 ? (
                <Zap size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-1" />
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export const RoadmapConnector = ({ active }) => (
  <div className="w-1 h-16 bg-muted relative overflow-hidden rounded-full mb-16">
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: active ? '100%' : '0%' }}
      transition={{ duration: 1 }}
      className="absolute top-0 left-0 w-full bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.5)]"
    />
  </div>
);