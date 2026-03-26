import React from 'react';
import { motion } from 'framer-motion';

const UniversalTopicCard = ({ topic }) => {
  const statusColors = {
    "Mastered": "bg-secondary/10 text-secondary border-secondary/20",
    "In Progress": "bg-primary/10 text-primary border-primary/20",
    "Not Started": "bg-foreground/5 text-foreground/40 border-border"
  };

  const safeTopic = topic || {};

  const status = safeTopic.status || "Not Started";

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-5 min-w-[300px] flex flex-col border border-border/50 hover:border-primary/30 transition-all"
    >
      {/* 7.1 TopicCardHeader */}
      <div className="flex justify-between items-start mb-6">
        <h4 className="font-heading font-bold text-foreground text-sm tracking-tight truncate w-2/3">
          {safeTopic.title || "Topic"}
        </h4>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${statusColors[status]}`}>
          {status}
        </span>
      </div>

      {/* 7.2 MasteryStack */}
      <div className="space-y-3.5 mb-6 flex-1">
        {[
          { label: "Easy", val: safeTopic.easy ?? 0 },
          { label: "Medium", val: safeTopic.med ?? 0 },
          { label: "Hard", val: safeTopic.hard ?? 0 }
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-foreground/30">
              <span>{item.label}</span>
              <span>{item.val}%</span>
            </div>
            <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${item.val}%` }}
                viewport={{ once: true }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 7.3 SectionCardFooter */}
      <div className="pt-4 border-t border-border/40">
        <button className="text-xs font-bold text-primary flex items-center gap-1 group">
          Continue Practice <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </motion.div>
  );
};

export default UniversalTopicCard;