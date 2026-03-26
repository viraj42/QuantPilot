import React from 'react';
import { motion } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { useNavigate } from "react-router-dom";

// --- 1. TOP MINIMAL BAR ---
export const TopMinimalBar = ({ topicName, level, current, total }) => (
  <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/10">
    <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 text-foreground/40 font-bold text-[10px] uppercase tracking-[0.2em]">
        <span className="text-foreground">{topicName}</span>
        <span className="opacity-30">/</span>
        <span>Level {level}</span>
      </div>
      <div className="text-xs font-black font-heading text-primary tracking-tighter">
        {current} <span className="text-foreground/20">/</span> {total}
      </div>
    </div>
  </div>
);

// --- MATH RENDER UTILITY ---
const renderText = (text = "") => {
  const regex = /\$(.*?)\$/g;
  const parts = text.split(regex);

  return parts.map((part, i) =>
    i % 2 === 1
      ? <InlineMath key={i} math={part} />
      : <span key={i}>{part}</span>
  );
};

// --- 2. QUESTION BLOCK ---
export const QuestionBlock = ({ text, index }) => (
  <motion.div 
    key={index}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="py-12 space-y-6"
  >
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
      Question {index}
    </span>

    <h2 className="text-xl md:text-2xl font-heading font-medium leading-relaxed text-foreground tracking-tight">
      {renderText(text)}
    </h2>

  </motion.div>
);

// --- 3. OPTIONS LIST ---
export const OptionList = ({ options, selectedId, onSelect }) => (
  <div className="space-y-3 w-full pb-28">
    {options.map((option, index) => {
      const optionId = option.id ?? index;
      const optionText = option.text ?? option;

      return (
        <motion.button
          key={optionId}
          whileTap={{ scale: 0.995 }}
          onClick={() => onSelect(optionId)}
          className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left group ${
            selectedId === optionId
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/40 bg-surface/40 hover:border-primary/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selectedId === optionId
                ? 'border-primary bg-primary'
                : 'border-border group-hover:border-primary/40'
            }`}
          >
            {selectedId === optionId && (
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>

          <span
            className={`text-sm md:text-base font-medium transition-colors ${
              selectedId === optionId
                ? 'text-foreground'
                : 'text-foreground/60'
            }`}
          >
            {renderText(optionText)}
          </span>
        </motion.button>
      );
    })}
  </div>
);

// --- 4. BOTTOM NAVIGATION ---
export const BottomNav = ({ isBookmarked, onBookmark, onNext, canNext, isLast }) => (
  <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 px-6">
    <div className="max-w-3xl mx-auto flex items-center justify-between">
      <button 
        onClick={onBookmark}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest ${
          isBookmarked ? 'text-primary' : 'text-foreground/30 hover:text-foreground'
        }`}
      >
        <span>{isBookmarked ? '★' : '☆'}</span>
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>

      <button 
        disabled={!canNext}
        onClick={onNext}
        className={`btn-primary px-10 py-4 shadow-2xl transition-all ${
          !canNext && 'opacity-20 grayscale pointer-events-none'
        }`}
      >
        {isLast ? 'Submit Practice' : 'Next Question →'}
      </button>
    </div>
  </div>
);

// --- 5. SESSION RESULT CARD ---
export const SessionResultCard = ({ result }) => {

  const navigate = useNavigate();

  const {
    sessionId,
    attempted,
    correct,
    accuracy,
    averageTime,
    confidenceSnapshot
  } = result;

  const handleReview = () => {
    navigate(`/practice/${sessionId}/review`);
  };

  return (

    <div className="min-h-screen bg-background flex items-center justify-center px-6">

      <div className="max-w-md w-full glass-card p-8 space-y-6 text-center">

        <h2 className="text-xl font-heading font-bold text-foreground">
          Practice Complete
        </h2>

        <div className="space-y-2">

          <p>Correct: {correct} / {attempted}</p>

          <p>Accuracy: {(accuracy * 100).toFixed(1)}%</p>

          <p>Average Time: {averageTime.toFixed(1)}s</p>

        </div>

        <div className="text-sm text-foreground/60">

          <p>Strong Answers: {confidenceSnapshot.strong}</p>

          <p>Guessed Answers: {confidenceSnapshot.guessed}</p>

        </div>

        <button
          onClick={handleReview}
          className="btn-primary w-full"
        >
          Review Set
        </button>

      </div>

    </div>

  );

};