import React from 'react';
import { motion } from 'framer-motion';
import Background3D from '../components/Background3D';
import Navbar from '../components/Navbar';
import CoreModules from '../components/CoreModules';
import HowItWorks from '../components/HowItWorks';
import ExamCard from "../assets/ExamCard.png";

const LandingPage = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      {/* Fixed background visible through all layers */}
      <Background3D />
      <Navbar />

      <main className="relative z-10">
        {/* --- HERO SECTION --- */}
        <section className="max-w-7xl mx-auto px-6 pt-12 md:pt-24 pb-20 flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 text-center lg:text-left space-y-6 md:space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
              🏆 #1 Aptitude Prep Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight tracking-tight">
              Turn practice into <br />
              <span className="text-primary italic">measurable</span> improvement.
            </h1>
            
            <p className="text-base md:text-lg text-foreground/50 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium px-4 md:px-0">
              The most structured aptitude platform built for serious preparation. Track every second, master every topic.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4 px-4">
              <button className="btn-primary w-full sm:w-auto">
                Start Practicing →
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 relative w-full max-w-[500px] lg:max-w-none px-4"
          >
            <div className="glass-card p-2 md:p-3 shadow-2xl overflow-hidden group">
              <img src={ExamCard} alt="Preview" className="w-full h-auto rounded-[1.5rem] md:rounded-[2rem] transition-transform duration-700 group-hover:scale-[1.02]" />
            </div>
          </motion.div>
        </section>

        {/* --- CONTENT SECTIONS (Transparent/Glassy) --- */}
        <div id="how" className="backdrop-blur-sm border-y border-border/20 bg-surface/5 dark:bg-surface/5">
          <HowItWorks />
        </div>

        <div id="modules" className="bg-transparent">
          <CoreModules />
        </div>
      </main>

    </div>
  );
};

export default LandingPage;