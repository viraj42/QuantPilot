import React from 'react';
import { motion } from 'framer-motion';

const CoreModules = () => {
  const modules = [
    { title: "Academic Structure", icon: "📚", desc: "Clean hierarchy. Optimized progress calculation." },
    { title: "Practice Engine", icon: "⚙️", desc: "Deterministic session generation (unseen → incorrect)." },
    { title: "Mock Engine", icon: "⏱️", desc: "Backend timer validation & frozen question sets." },
    { title: "Review Mode", icon: "🔍", desc: "Mistakes become assets. High ROI study sessions." },
    { title: "Bookmark", icon: "🔖", desc: "Mark important questions with clean architecture." },
    { title: "Performance", icon: "📊", desc: "Real-time accuracy and readiness indexing." }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <div className="text-center mb-20 space-y-4">
        <h2 className="text-4xl font-heading font-bold tracking-tight">Core Modules Overview</h2>
        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((mod, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -10 }}
            className="glass-card p-10 flex flex-col items-center text-center space-y-6 hover:border-primary/40"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              {mod.icon}
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold mb-3">{mod.title}</h3>
              <p className="text-foreground/50 text-sm leading-relaxed">{mod.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CoreModules;