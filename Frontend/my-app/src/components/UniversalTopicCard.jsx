import React from 'react';
import { motion } from 'framer-motion';

const UniversalTopicCard = ({ topic }) => {
  const statusConfig = {
    "Mastered": {
      className: "bg-secondary/10 text-secondary border-secondary/20",
      dot: "bg-secondary"
    },
    "In Progress": {
      className: "bg-primary/10 text-primary border-primary/20",
      dot: "bg-primary"
    },
    "Not Started": {
      className: "bg-foreground/5 text-foreground/40 border-border",
      dot: "bg-foreground/20"
    }
  };

  const safeTopic = topic || {};
  const status = safeTopic.status || "Not Started";
  const cfg = statusConfig[status] || statusConfig["Not Started"];

  const bars = [
    { label: "Easy", val: safeTopic.easy ?? 0, color: "bg-emerald-400" },
    { label: "Med",  val: safeTopic.med  ?? 0, color: "bg-primary" },
    { label: "Hard", val: safeTopic.hard ?? 0, color: "bg-rose-400" },
  ];

  const overall = safeTopic.overall ?? 0;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 16px 40px -12px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="glass-card flex flex-col border border-border/50 hover:border-primary/30 transition-colors duration-300 overflow-hidden rounded-2xl"
    >
      {/* Top accent bar tied to overall progress */}
      <div className="h-[3px] w-full bg-foreground/5">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${overall}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="h-full bg-primary"
        />
      </div>

      <div className="p-5 flex flex-col flex-1 gap-5">
        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <h4 className="font-heading font-bold text-foreground text-[15px] leading-snug tracking-tight flex-1 min-w-0 line-clamp-2">
            {safeTopic.title || "Topic"}
          </h4>
          <span className={`shrink-0 flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${cfg.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {status}
          </span>
        </div>

        {/* Difficulty bars */}
        <div className="space-y-3 flex-1">
          {bars.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">{item.label}</span>
                <span className="text-[10px] font-bold text-foreground/40 tabular-nums">{item.val}%</span>
              </div>
              <div className="h-[5px] bg-foreground/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.val}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                  className={`h-full rounded-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground/25">Attempts</span>
            <span className="text-sm font-bold text-foreground/60 tabular-nums">{safeTopic.attempts ?? 0}</span>
          </div>
          <button className="flex items-center gap-1.5 text-[11px] font-bold text-primary group">
            Continue
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </motion.span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default UniversalTopicCard;