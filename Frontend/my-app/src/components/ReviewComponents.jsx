import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

/* ── Shared math rendering (same pattern as PracticeComponent) ─── */
const formatMath = (expr = "") =>
  expr
    .replace(/\*/g, "\\cdot ")
    .replace(/\^(\w+)/g, "^{$1}")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2");

const injectMath = (text = "") =>
  text.replace(
    /(\d+\^?\w*(?:\s*[\+\-\=]\s*\d+\^?\w*)+)/g,
    (match) => `$${match}$`
  );

const renderText = (text = "") => {
  text = injectMath(text);
  const parts = text.split(/\$(.*?)\$/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="inline-block max-w-full align-middle">
        <InlineMath math={formatMath(part)} />
      </span>
    ) : (
      <span key={i} className="break-words whitespace-pre-wrap">{part}</span>
    )
  );
};


/* ─────────────────────────────────────────────────────
   PERFORMANCE STRIP
───────────────────────────────────────────────────── */
export const PerformanceStrip = ({ analytics }) => {
  if (!analytics) return null;
  const metrics = [
    { label: "Accuracy",  value: `${analytics.accuracy}%`,                         sub: "Precision",  color: "text-primary"      },
    { label: "Correct",   value: `${analytics.correct}/${analytics.totalQuestions}`, sub: "Solved",     color: "text-foreground"   },
    { label: "Avg Time",  value: `${analytics.averageTime}s`,                       sub: "Per Question", color: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
      {metrics.map((m, i) => (
        <div key={i} className="glass-card !rounded-2xl p-4 sm:p-5 border-border/20 text-center">
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-foreground/25 mb-1 block">
            {m.label}
          </span>
          <div className={`text-xl sm:text-2xl md:text-3xl font-heading font-bold tracking-tighter ${m.color}`}>
            {m.value}
          </div>
          <span className="text-[8px] font-bold text-foreground/35 uppercase tracking-widest">{m.sub}</span>
        </div>
      ))}
    </div>
  );
};


/* ─────────────────────────────────────────────────────
   QUESTION TIMELINE CHART  (replaces scatter plot)
   Shows each question as a horizontal bar — height = time taken,
   color = correct (green) / wrong (red).
   Instantly shows pacing + accuracy distribution together.
───────────────────────────────────────────────────── */
export const AccuracyVsTimeChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxTime = Math.max(...data.map((d) => d.time), 1);
  const correctCount = data.filter((d) => d.correct).length;
  const incorrectCount = data.length - correctCount;

  return (
    <div className="glass-card !rounded-2xl p-5 sm:p-6 mb-8 border-border/10">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/25 mb-1">
            Question Timeline
          </h4>
          <p className="text-[10px] text-foreground/35 font-medium">
            Time spent per question — taller = slower
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-secondary/70" />
            <span className="text-[9px] font-bold text-foreground/35 uppercase tracking-wide">{correctCount} correct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-500/70" />
            <span className="text-[9px] font-bold text-foreground/35 uppercase tracking-wide">{incorrectCount} wrong</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Bars + Q-number labels */}
        <div className="flex items-end gap-1 sm:gap-1.5 h-28 relative px-1">
          {/* Background grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0 border-t border-border/10"
              style={{ bottom: `${pct * 100}%` }}
            />
          ))}

          {data.map((point, i) => {
            const heightPct = Math.max((point.time / maxTime) * 100, 8);
            return (
              <motion.div
                key={i}
                title={`Q${i + 1} · ${point.time}s · ${point.correct ? "Correct" : "Wrong"}`}
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.025, ease: "easeOut" }}
                className={`flex-1 min-w-0 rounded-t-[3px] relative group cursor-default
                  ${point.correct
                    ? "bg-secondary/50 hover:bg-secondary/80"
                    : "bg-rose-500/50 hover:bg-rose-500/80"
                  } transition-colors duration-150`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-foreground text-background text-[8px] font-black rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Q{i + 1} · {point.time}s
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* X-axis labels — show every ~4 questions to avoid crowding */}
        <div className="flex gap-1 sm:gap-1.5 px-1 mt-1.5">
          {data.map((_, i) => (
            <div key={i} className="flex-1 text-center">
              {(i + 1) % Math.max(1, Math.ceil(data.length / 8)) === 0 || i === 0 || i === data.length - 1 ? (
                <span className="text-[8px] font-bold text-foreground/20">{i + 1}</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Y-axis label */}
        <div className="absolute -left-1 top-0 h-28 flex flex-col justify-between pointer-events-none">
          <span className="text-[7px] font-bold text-foreground/15">{maxTime}s</span>
          <span className="text-[7px] font-bold text-foreground/15">0s</span>
        </div>
      </div>
    </div>
  );
};


/* ─────────────────────────────────────────────────────
   REVIEW CARD  (expanded view now uses renderText for KaTeX)
───────────────────────────────────────────────────── */
export const ReviewCard = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const getOptionLabel = (index) => String.fromCharCode(65 + index);

  const isCorrect = item.isCorrect;

  return (
    <motion.div
      layout
      className={`glass-card !rounded-2xl overflow-hidden border-l-[4px] transition-colors duration-300
        ${isCorrect ? "border-l-secondary/50 border-border/15" : "border-l-rose-500/50 border-border/15"}`}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-foreground/[0.015] transition-colors"
      >
        {/* Result badge */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5
          ${isCorrect ? "bg-secondary/15 text-secondary" : "bg-rose-500/15 text-rose-500"}`}
        >
          {isCorrect ? "✓" : "✗"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
              ${isCorrect ? "bg-secondary/10 text-secondary" : "bg-rose-500/10 text-rose-500"}`}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </span>
            <span className="text-[9px] font-bold text-foreground/25 uppercase tracking-wide">
              {item.difficulty} · {item.timeTaken}s
            </span>
          </div>

          {/* Question preview — uses renderText for math */}
          <p className="text-sm font-heading font-semibold text-foreground/75 leading-snug line-clamp-2">
            {renderText(item.question)}
          </p>
        </div>

        {/* Chevron */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center mt-0.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
          <span className="text-[10px] text-foreground/30">↓</span>
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="border-t border-border/10 bg-foreground/[0.01]"
          >
            <div className="px-5 pt-5 pb-6 space-y-5">
              {/* Full question text with math rendering */}
              <p className="text-sm md:text-base text-foreground/85 font-medium leading-relaxed">
                {renderText(item.question)}
              </p>

              {/* Options grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.options.map((opt, idx) => {
                  const isUserPick    = item.userAnswer === idx;
                  const isRightAnswer = item.correctAnswer === idx;

                  let style = "border-border/10 bg-background/20 opacity-40";
                  if (isRightAnswer) style = "border-secondary/35 bg-secondary/[0.04] text-secondary opacity-100";
                  if (isUserPick && !isCorrect) style = "border-rose-500/35 bg-rose-500/[0.04] text-rose-500 opacity-100";

                  return (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${style}`}>
                      {/* Letter badge */}
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0
                        ${isRightAnswer ? "bg-secondary text-white"
                          : (isUserPick && !isCorrect) ? "bg-rose-500 text-white"
                          : "bg-foreground/8 text-foreground/30"}`}
                      >
                        {getOptionLabel(idx)}
                      </div>

                      {/* Option text with math rendering */}
                      <span className="text-xs font-medium leading-snug flex-1">
                        {renderText(opt.text || opt)}
                      </span>

                      {/* Tail indicator */}
                      {isRightAnswer && (
                        <span className="text-[9px] font-black text-secondary flex-shrink-0">✓</span>
                      )}
                      {isUserPick && !isCorrect && (
                        <span className="text-[9px] font-black text-rose-500 flex-shrink-0">✗</span>
                      )}
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