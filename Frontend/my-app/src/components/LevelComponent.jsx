import React from 'react';
import { motion } from 'framer-motion';

// --- TOPIC HEADER ---
export const TopicHeader = ({ name, progress }) => (
  <div className="flex justify-between items-center w-full mb-10 pb-5 border-b border-border/40">
    <h2 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-foreground">
      {name}
    </h2>
  </div>
);


// --- LEVEL NODE ---
export const LevelNode = ({ data, onStart }) => {

  const { level, difficulty, unlocked, completed, unlockRequirement, attempts } = data;

  const difficultyLabels = {
    easy: "Easy fundamentals",
    medium: "Medium challenge",
    hard: "Advanced practice"
  };

  const buttonLabel = attempts > 0 ? "Practice" : "Start";

  return (
    <div className={`relative flex flex-col items-center w-full max-w-lg mx-auto ${!unlocked && 'opacity-40'}`}>

      <div className="flex items-center gap-5 w-full">

        {/* Level Badge */}
        <div className={`w-14 h-14 rounded-md flex items-center justify-center shrink-0 border-2 transition-all duration-500 shadow-lg ${
          completed
            ? 'bg-secondary border-secondary text-white'
            : unlocked
            ? 'bg-background border-primary text-primary'
            : 'bg-background border-border text-foreground/20'
        }`}>
          <span className="font-heading font-bold text-lg">
            {completed ? '✓' : `L${level}`}
          </span>
        </div>


        {/* Level Card */}
        <div className="flex-1 glass-card p-4 flex items-center justify-between border-border/40">

          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              {difficultyLabels[difficulty] || "Practice level"}
            </h4>

            {!unlocked && unlockRequirement && (
              <p className="text-[11px] font-medium text-rose-500">
                Unlock: {unlockRequirement}
              </p>
            )}

            {completed && (
              <p className="text-[11px] font-medium text-secondary">
                Level completed
              </p>
            )}
          </div>


          <div className="shrink-0">

            {unlocked ? (

              <button
                onClick={() => onStart(level)}
                className="text-xs font-semibold py-2 px-5 rounded-md btn-primary shadow-none"
              >
                {buttonLabel}
              </button>

            ) : (

              <div className="p-2 opacity-20">
                🔒
              </div>

            )}

          </div>

        </div>

      </div>
    </div>
  );
};


// --- CONNECTOR ---
export const RoadmapConnector = ({ active }) => (
  <div className="w-0.5 h-11 my-2 bg-border relative overflow-hidden">
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: active ? '100%' : '0%' }}
      className="absolute top-0 left-0 w-full bg-primary transition-all duration-700"
    />
  </div>
);