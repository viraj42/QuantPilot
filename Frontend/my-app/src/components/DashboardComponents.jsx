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
export const ConsistencyMiniChart = ({ dailyCounts }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = Array.isArray(dailyCounts) ? dailyCounts : [0, 0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...counts, 5);

  // State to track mobile clicks
  const [activeBar, setActiveBar] = React.useState(null);

  return (
    <div 
      className="glass-card p-5 md:p-8 pt-14 md:pt-16 w-full relative" 
      onClick={() => setActiveBar(null)} // Reset when clicking card background
    >
      <div className="flex items-end justify-between h-40 md:h-44 gap-1.5 md:gap-4 mb-6 md:mb-8">
        {counts.map((count, i) => {
          const ratio = count / maxVal;
          const barHeight = count === 0 ? "6px" : `${ratio * 100}%`;
          const isActive = activeBar === i;

          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col items-center group h-full justify-end cursor-pointer"
              onClick={(e) => {
                e.stopPropagation(); // Prevents background click from firing
                // Toggle logic: if already active, close it; otherwise, open this one
                setActiveBar(isActive ? null : i);
              }}
            >
              <div className="relative w-full flex flex-col items-center justify-end h-full">
                
                {/* LABEL LOGIC:
                  1. isActive ? "opacity-100" -> Handles Mobile Click
                  2. group-hover:opacity-100 -> Handles Laptop Hover
                */}
                <div className={`absolute -top-12 transition-all duration-300 bg-foreground text-background text-[9px] md:text-[10px] py-1.5 px-2 md:px-3 rounded-lg font-bold z-30 pointer-events-none shadow-2xl whitespace-nowrap ${
                  isActive 
                    ? "opacity-100 -translate-y-1" 
                    : "opacity-0 md:group-hover:opacity-100 md:group-hover:-translate-y-1"
                }`}>
                  {count} Solved
                  {/* Tooltip Arrow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
                </div>
                
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                  className={`w-full max-w-[24px] md:max-w-[40px] rounded-t-lg md:rounded-t-xl transition-all duration-500 relative ${
                    isActive 
                      ? "bg-primary" 
                      : count === 0 
                        ? "bg-foreground/5" 
                        : "bg-primary/20 dark:bg-primary/10 md:group-hover:bg-primary"
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent transition-opacity rounded-t-lg md:rounded-t-xl ${
                    isActive ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                  }`} />
                </motion.div>
              </div>
              
              <span className={`mt-4 text-[8px] md:text-[10px] font-black uppercase tracking-tighter md:tracking-[0.2em] transition-colors ${
                isActive ? "text-primary" : "text-foreground/20 md:group-hover:text-primary"
              }`}>
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer info stays synced with active state */}
      <div className="pt-6 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-foreground/40">
            {activeBar !== null ? "Daily Stats" : "Activity"}
          </span>
        </div>
        <div className="text-[10px] md:text-[11px] font-bold text-primary tracking-tighter">
          {activeBar !== null 
            ? `${counts[activeBar]} Problems on ${days[activeBar]}`
            : `Weekly AVG : ${(counts.reduce((a, b) => a + b, 0) / 7).toFixed(1)}`
          }
        </div>
      </div>
    </div>
  );
};