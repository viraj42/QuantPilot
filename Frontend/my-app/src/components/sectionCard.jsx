import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const SectionCard = ({ sectionName, topicCount, easy, medium, hard, progress, link }) => {

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progress / 100) * circumference;

  const maxVal = Math.max(easy, medium, hard, 1);

  const difficultyStats = [
    { val: easy, gradient: "from-green-400/80 to-green-500/60" },
    { val: medium, gradient: "from-orange-400/80 to-orange-500/60" },
    { val: hard, gradient: "from-red-400/80 to-red-500/60" },
  ];

  return (
    <Link to={link} className="block group">
      <motion.div
        whileHover={{ y: -6 }}
        className="glass-card overflow-hidden flex flex-col transition-all border-border/40 hover:border-primary/40 shadow-xl shadow-black/5"
      >

        {/* Header */}
        <div className="px-6 py-5 border-b border-border/10 flex justify-between items-center bg-foreground/[0.02]">
          <h3 className="text-xl font-heading font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
            {sectionName}
          </h3>

          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">
            {topicCount} Topics
          </span>
        </div>

        {/* Content */}
        <div className="p-6 flex items-center justify-between">

          {/* Difficulty Bars */}
          <div className="flex-1 flex items-end justify-start gap-6 sm:gap-10 h-28 relative">

            {/* X Axis */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border/50 rounded-full" />

            {difficultyStats.map((d, i) => {

              const heightPercent = (d.val / maxVal) * 100;

              return (
                <div key={i} className="flex flex-col items-center justify-end h-full">

                  {/* Value */}
                  <span className="text-xs font-semibold text-foreground/70 mb-1">
                    {d.val}
                  </span>

                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className={`w-10 sm:w-14 rounded-t-xl bg-gradient-to-t ${d.gradient} shadow-sm`}
                  />

                </div>
              );
            })}

          </div>

          {/* Mastery Circle — hidden on mobile, shown sm+ */}
          <div className="relative items-center justify-center shrink-0 ml-6 hidden sm:flex">

            <svg width="100" height="100" className="transform -rotate-90">

              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-foreground/5 fill-none"
                strokeWidth="8"
              />

              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-primary fill-none"
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 1.5, delay: 0.2, ease: "circOut" }}
                strokeLinecap="round"
              />

            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-heading font-black tracking-tighter text-foreground">
                {progress}%
              </span>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-foreground/30">
                Mastery
              </span>
            </div>

          </div>

          {/* Mastery Pill — mobile only (replaces donut) */}
          <div className="sm:hidden flex-shrink-0 ml-3 flex flex-col items-center gap-1">
            <span className="text-xl font-heading font-black tracking-tighter text-primary">{progress}%</span>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-foreground/30">Mastery</span>
            <div className="w-10 h-1 rounded-full bg-border/40 overflow-hidden mt-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

        </div>

      </motion.div>
    </Link>
  );
};

export default SectionCard;