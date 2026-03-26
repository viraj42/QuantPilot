import React from 'react';
import { motion } from 'framer-motion';

// --- WELCOME STRIP ---
// Cleaned up: Removed redundant background-colors; used typography for depth.
export const WelcomeStrip = ({ userName, lastActivity }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 px-1">
    <div className="space-y-1">
      <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground tracking-tighter leading-none">
        Welcome back, <span className="text-primary italic font-medium">{userName}</span>
      </h1>
      <p className="text-sm text-foreground/40 font-medium tracking-wide">
        System synchronized. Last activity: {lastActivity}
      </p>
    </div>
    <button className="btn-primary px-8 py-3.5 text-sm shadow-2xl">
      Continue Practice →
    </button>
  </div>
);

// --- METRIC CARD ---
// Human Touch: Subtle border-glow on hover; meta-text uses uppercase tracking for a 'pro-tool' feel.
export const MetricCard = ({ label, value, meta, colorClass = "text-foreground" }) => {
  const getReadinessText = (val) => {
    const v = parseInt(val);
    if (v < 40) return "Foundation Phase";
    if (v < 70) return "Steady Progress";
    if (v < 85) return "Near Readiness";
    return "Placement Ready";
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between min-h-[160px] hover:border-primary/20 transition-all duration-500">
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/20">
          {label}
        </span>
        <div className={`text-4xl font-heading font-bold tracking-tighter ${colorClass}`}>
          {value}
        </div>
      </div>
      <div className="text-[11px] font-bold text-foreground/40 uppercase tracking-tight">
        {label.includes("Readiness") ? getReadinessText(value) : meta}
      </div>
    </div>
  );
};

// --- REALISTIC CONSISTENCY CHART ---
// Cleaned up: Simplified internal wrappers; used standard global card radius.
export const ConsistencyMiniChart = ({ dailyCounts }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = Array.isArray(dailyCounts) && dailyCounts.length === 7 ? dailyCounts : [0, 0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...counts, 5);

  return (
    <div className="glass-card p-8">
      <div className="flex items-end justify-between h-44 gap-3 md:gap-6 mb-8">
        {counts.map((count, i) => {
          const ratio = count / maxVal;
          const barHeight = count === 0 ? "6px" : `${ratio * 100}%`;

          return (
            <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
              <div className="relative w-full flex flex-col items-center justify-end h-full">
                {/* Tooltip - Human Touch: Refined shadow and transition */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300 bg-foreground text-background text-[10px] py-1.5 px-3 rounded-lg font-bold z-10 pointer-events-none shadow-xl">
                  {count} Solved
                </div>
                
                {/* Bar - Cleaned: Uses global primary opacity */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                  className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 relative group-hover:bg-primary ${
                    count === 0 ? "bg-foreground/5" : "bg-primary/20 dark:bg-primary/10"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity rounded-t-xl" />
                </motion.div>
              </div>
              
              <span className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 group-hover:text-primary transition-colors">
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Analytics Footer - Cleaned: Removed excess background colors */}
      <div className="pt-6 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map(dot => (
              <div key={dot} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${dot * 0.15}s` }} />
            ))}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/40">
            Activity 
          </span>
        </div>
        <div className="text-[11px] font-bold text-primary tracking-tighter">
          Weekly AVG : {(counts.reduce((a, b) => a + b, 0) / 7).toFixed(1)}
        </div>
      </div>
    </div>
  );
};