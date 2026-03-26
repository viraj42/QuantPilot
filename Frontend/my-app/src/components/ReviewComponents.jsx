import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- COMPACT PERFORMANCE STRIP ---------- */
export const PerformanceStrip = ({ analytics }) => {
  if (!analytics) return null;
  const metrics = [
    { label: "Accuracy", value: `${analytics.accuracy}%`, sub: "Precision", color: "text-primary" },
    { label: "Correct", value: `${analytics.correct}/${analytics.totalQuestions}`, sub: "Solved", color: "text-foreground" },
    { label: "Velocity", value: `${analytics.averageTime}s`, sub: "Avg Time", color: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-10">
      {metrics.map((m, i) => (
        <div key={i} className="glass-card p-5 border-border/20 !rounded-[1rem] text-center">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-1 block">{m.label}</span>
          <div className={`text-2xl md:text-3xl font-heading font-bold tracking-tighter ${m.color}`}>{m.value}</div>
          <span className="text-[8px] font-bold text-foreground/40 uppercase tracking-widest">{m.sub}</span>
        </div>
      ))}
    </div>
  );
};

/* ---------- ELITE COMPACT REVIEW CARD ---------- */
export const ReviewCard = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const getOptionLabel = (index) => String.fromCharCode(65 + index);

  return (
    <motion.div 
      layout
      className={`glass-card !rounded-[1rem] overflow-hidden mb-4 border-l-[6px] transition-all duration-300 ${
        item.isCorrect ? "border-l-secondary/60 border-border/10" : "border-l-rose-500/60 border-border/10"
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center gap-5 text-left hover:bg-foreground/[0.01]"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
               item.isCorrect ? "bg-secondary/10 text-secondary" : "bg-rose-500/10 text-rose-500"
             }`}>
               {item.isCorrect ? "Correct" : "Incorrect"}
             </span>
             <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">{item.difficulty} • {item.timeTaken}s</span>
          </div>
          <p className="text-sm md:text-base font-heading font-semibold text-foreground/80 leading-snug truncate">
            {item.question}
          </p>
        </div>
        <div className={`shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
           <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-xs opacity-40">↓</div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 border-t border-border/5 bg-foreground/[0.01]"
          >
            <div className="pt-6">
              <p className="text-sm md:text-base text-foreground/90 font-medium leading-relaxed mb-6">
                {item.question}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.options.map((opt, idx) => {
                  const isUserSelection = item.userAnswer === idx;
                  const isCorrectAnswer = item.correctAnswer === idx;
                  
                  let stateStyle = "border-border/10 bg-background/20 opacity-50";
                  if (isCorrectAnswer) stateStyle = "border-secondary/30 bg-secondary/[0.03] text-secondary opacity-100";
                  if (isUserSelection && !item.isCorrect) stateStyle = "border-rose-500/30 bg-rose-500/[0.03] text-rose-500 opacity-100";

                  return (
                    <div key={idx} className={`p-3.5 rounded-md border-2 flex items-center justify-between transition-all ${stateStyle}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border ${
                          isCorrectAnswer ? 'bg-secondary text-white' : 
                          (isUserSelection && !item.isCorrect) ? 'bg-rose-500 text-white' : 'bg-foreground/5 border-border'
                        }`}>
                          {getOptionLabel(idx)}
                        </div>
                        <span className="text-xs font-medium">{opt.text || opt}</span>
                      </div>
                      {isCorrectAnswer && <span className="text-[8px] font-black uppercase text-secondary">✓</span>}
                      {isUserSelection && !item.isCorrect && <span className="text-[8px] font-black uppercase text-rose-500">✗</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ---------- DENSE SCATTER PLOT ---------- */
export const AccuracyVsTimeChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const maxTime = Math.max(...data.map((d) => d.time), 30);

  return (
    <div className="glass-card !rounded-[1rem] p-6 mb-8 border-border/10">
       <div className="flex justify-between items-center mb-6">
          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/20">Velocity Matrix</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-foreground/30 uppercase"><div className="w-2 h-2 rounded-full bg-secondary" /> Win</div>
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-foreground/30 uppercase"><div className="w-2 h-2 rounded-full bg-rose-500" /> Fail</div>
          </div>
       </div>
       <div className="relative h-40 w-full px-2 border-l border-b border-border/20">
        {data.map((point, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={`absolute w-2.5 h-2.5 rounded-md border-2 border-background shadow-md ${point.correct ? "bg-secondary" : "bg-rose-500"}`}
            style={{ left: `${(point.time / maxTime) * 95}%`, bottom: point.correct ? "80%" : "15%" }}
          />
        ))}
      </div>
    </div>
  );
};