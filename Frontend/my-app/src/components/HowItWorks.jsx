import React from 'react';
import { motion } from 'framer-motion';

const HowItWorks = () => {
const steps = [
{ tag: "STEP 01", title: "Structured Practice", desc: "Our engine validates your level based on real accuracy.", icon: "🎯" },
{ tag: "STEP 02", title: "Earn Unlocks", desc: "Progress is computed dynamically: Easy → Medium → Hard.", icon: "🔓" },
{ tag: "STEP 03", title: "Measure Readiness", desc: "Track time per difficulty and compute your Readiness Index.", icon: "🏁" }
];

return ( <section className="max-w-7xl mx-auto px-6 py-20 md:py-30 space-y-18 md:space-y-28"> <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-11 tracking-tight">How does it work?</h2>

```
  {steps.map((step, i) => (
    <motion.div 
      key={i}
      initial={{ opacity: 0, y: 46 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.55 }}
      className={`flex flex-col ${i % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-9 md:gap-15`}
    >
      <div className="flex-1 w-full aspect-video bg-background/50 rounded-[1.9rem] md:rounded-[2.3rem] border border-border/40 flex items-center justify-center shadow-inner relative group overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300 animate-pulse" />
        <span className="text-5xl md:text-6xl group-hover:scale-[1.22] transition-transform duration-450">{step.icon}</span>
      </div>
      
      <div className="flex-1 space-y-4 md:space-y-5 text-center lg:text-left">
        <span className="text-primary font-black tracking-[0.28em] text-[10px] md:text-xs">{step.tag}</span>
        <h3 className="text-2xl md:text-4xl font-heading font-bold tracking-tight">{step.title}</h3>
        <p className="text-foreground/60 text-base md:text-lg leading-relaxed font-medium tracking-[0.01em]">{step.desc}</p>
      </div>
    </motion.div>
  ))}
</section>

);
};

export default HowItWorks;
