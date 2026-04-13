import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Bookmark, CheckCircle, ArrowLeft } from 'lucide-react';
import { getPracticeReview } from "../api/practice.api";

// --- 1. TOP MINIMAL BAR ---
export const TopMinimalBar = ({ topicName, level, current, total, isBookmarked, onBookmark }) => {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-xl border-b border-border/20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Left: back + identity */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border border-border/40 bg-surface/60 hover:bg-muted transition-all"
          >
            <ArrowLeft size={15} className="opacity-60" />
          </button>
          <div className="flex flex-col -space-y-0.5 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/35 leading-none">Practice · Level {level}</span>
            <span className="text-sm font-heading font-bold text-foreground truncate max-w-[140px] md:max-w-xs leading-tight mt-0.5">
              {topicName}
            </span>
          </div>
        </div>

        {/* Right: counter + bookmark */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Question counter — pill style */}
          <div className="flex items-center gap-1 bg-primary/8 border border-primary/15 rounded-xl px-3 py-1">
            <span className="text-sm font-black text-primary tabular-nums">{current}</span>
            <span className="text-foreground/20 text-xs font-bold">/</span>
            <span className="text-xs font-bold text-foreground/40 tabular-nums">{total}</span>
          </div>
          <button
            onClick={onBookmark}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200
              ${isBookmarked
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-surface/60 border-border/40 text-foreground/25 hover:text-foreground/50'
              }`}
          >
            <Bookmark size={15} fill={isBookmarked ? "currentColor" : "none"} strokeWidth={2} />
          </button>
        </div>

      </div>

      {/* Progress track — thin line below bar */}
      <div className="w-full h-[2px] bg-border/20">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};


// ── Math rendering (unchanged logic) ──────────────────────────
const formatMath = (expr = "") => {
  return expr
    .replace(/\*/g, '\\cdot ')
    .replace(/\^(\w+)/g, '^{$1}')   // 2^x → 2^{x}
    .replace(/(\d)([a-zA-Z])/g, '$1 $2'); // 2x → 2 x
};

const injectMath = (text) => {
  // Detect equation-like patterns and wrap ONLY that part
  return text.replace(
    /(\d+\^?\w*(?:\s*[\+\-\=]\s*\d+\^?\w*)+)/g,
    (match) => `$${match}$`
  );
};

const renderText = (text = "") => {
  text = injectMath(text); // 👈 KEY FIX

  const regex = /\$(.*?)\$/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} className="inline-block max-w-full align-middle">
          <InlineMath math={formatMath(part)} />
        </span>
      );
    }

    return (
      <span key={i} className="break-words whitespace-pre-wrap">
        {part}
      </span>
    );
  });
};
// ─────────────────────────────────────────────────────────────


// --- 2. QUESTION BLOCK ---
export const QuestionBlock = ({ text, index }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="pt-8 pb-6 space-y-5"
    >
      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-[9px] font-black text-primary">{index}</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">
          Question
        </span>
      </div>

      {/* Question text */}
      <h2 className="text-xl md:text-2xl font-heading font-semibold leading-[1.65] text-foreground tracking-tight break-words">
        {renderText(text)}
      </h2>
    </motion.div>
  </AnimatePresence>
);


// --- 3. OPTIONS LIST ---
export const OptionList = ({ options, selectedId, onSelect }) => {
  const labels = ['A', 'B', 'C', 'D', 'E'];
  return (
    <div className="grid grid-cols-1 gap-2.5 w-full pb-36">
      {options.map((option, index) => {
        const optionId = option.id ?? index;
        const optionText = option.text ?? option;
        const isSelected = selectedId === optionId;
        return (
          <motion.button
            key={optionId}
            whileTap={{ scale: 0.985 }}
            onClick={() => onSelect(optionId)}
            className={`w-full min-h-[58px] flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-left group
              ${isSelected
                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                : 'border-border/35 bg-surface/30 hover:border-primary/30 hover:bg-surface/60'
              }`}
          >
            {/* Letter badge */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-[11px] transition-all duration-200
              ${isSelected ? 'bg-primary text-white shadow-sm' : 'bg-muted/60 text-foreground/35 group-hover:bg-muted'}`}
            >
              {labels[index] || index + 1}
            </div>

            <span className={`text-base font-medium leading-relaxed break-words [&_.katex]:text-[1.05em] flex-1 transition-colors duration-200
              ${isSelected ? 'text-foreground' : 'text-foreground/65 group-hover:text-foreground/85'}`}
            >
              {renderText(optionText)}
            </span>

            {/* Selected indicator dot */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};


// --- 4. BOTTOM NAVIGATION ---
export const BottomNav = ({ onPrev, onNext, canNext, isLast, canPrev }) => (
  <div className="fixed bottom-0 left-0 w-full z-40 pointer-events-none">
    {/* Gradient fade */}
    <div className="h-16 bg-gradient-to-t from-background to-transparent" />
    {/* Button row */}
    <div className="bg-background border-t border-border/20 px-4 sm:px-6 py-3 pointer-events-auto">
      <div className="max-w-3xl mx-auto flex items-center gap-3">

        {canPrev && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onPrev}
            className="h-12 flex-1 flex items-center justify-center gap-2 rounded-2xl bg-surface border-2 border-border/40 font-bold text-[10px] uppercase tracking-widest hover:bg-muted hover:border-border/60 transition-all"
          >
            <ChevronLeft size={16} className="opacity-60" />
            <span className="opacity-60">Prev</span>
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canNext}
          onClick={onNext}
          className={`h-12 ${canPrev ? 'flex-[2]' : 'w-full'} btn-primary !rounded-2xl transition-all flex items-center justify-center gap-2
            ${!canNext ? 'opacity-20 grayscale pointer-events-none' : 'shadow-lg shadow-primary/20'}`}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-black">
            {isLast ? 'Finish' : 'Next'}
          </span>
          {!isLast && <ChevronRight size={16} />}
        </motion.button>

      </div>
    </div>
  </div>
);


// --- 5. SESSION RESULT CARD ---
export const SessionResultCard = ({ result, sessionId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const accuracy = (result.accuracy * 100).toFixed(0);

  const handleReview = async () => {
    try {
      setLoading(true);
      const reviewData = await getPracticeReview(sessionId);
      navigate(`/practice/${sessionId}/review`, {
        state: { review: reviewData }
      });
    } catch (err) {
      console.error("Review fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-sm w-full space-y-8"
      >
        {/* Check icon */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-5"
          >
            <CheckCircle size={36} className="text-secondary" />
          </motion.div>
          <h2 className="text-3xl font-heading font-black tracking-tight">Session Complete</h2>
          <p className="text-sm text-foreground/40 mt-1">Here's how you did</p>
        </div>

        {/* Score panel */}
        <div className="glass-card border-border/25 overflow-hidden">

          {/* Accuracy — large feature */}
          <div className="px-8 py-7 text-center border-b border-border/10 bg-primary/[0.03]">
            <p className="text-6xl font-heading font-black text-primary tracking-tighter">{accuracy}%</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mt-2">Accuracy</p>
          </div>

          {/* Correct / Attempted */}
          <div className="flex divide-x divide-border/10">
            <div className="flex-1 px-6 py-5 text-center">
              <p className="text-2xl font-black text-foreground/80">{result.correct}</p>
              <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-0.5">Correct</p>
            </div>
            <div className="flex-1 px-6 py-5 text-center">
              <p className="text-2xl font-black text-foreground/40">{result.attempted}</p>
              <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-0.5">Attempted</p>
            </div>
          </div>
        </div>

        {/* Review button */}
        <button
          onClick={handleReview}
          disabled={loading}
          className="btn-primary w-full py-4 rounded-2xl shadow-xl shadow-primary/15 text-sm font-black tracking-wide"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Loading Review...
            </span>
          ) : (
            "Review Session"
          )}
        </button>

      </motion.div>
    </div>
  );
};