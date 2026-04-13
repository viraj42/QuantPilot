import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startMock, submitMock } from "../api/mock.api";
import { Clock, ChevronLeft, ChevronRight, Flag, Menu, X } from "lucide-react";
import Loader from "./Loader";

// ── KaTeX imports (run: npm install katex react-katex) ────────
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// ── ONLY NEW LOGIC: renders $...$ as inline math, rest as text ─
// Falls back to plain text when no $ present — zero overhead for
// normal aptitude questions that have no math notation.
const renderMath = (text) => {
  if (!text || !text.includes('$')) return text;

  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return (
        <InlineMath key={i} math={math} />
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const MockExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const initExam = async () => {
      try {
        const data = await startMock(id);
        setExamData(data);
        console.log(data);
        
        setTimeLeft(data.remainingSeconds);
        setLoading(false);
      } catch (err) {
        navigate("/mock/home");
      }
      finally {
        setLoading(false);
      }
    };
    initExam();
  }, [id, navigate]);

  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const currentSection = examData?.sections?.[currentSectionIdx];
  const currentQuestion = currentSection?.questions?.[currentQuestionIdx];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId, index) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: index }));
  };

  const toggleMark = (questionId) => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm("Submit exam?")) return;
    try {
      const formattedAnswers = Object.entries(userAnswers).map(([qId, ansIndex]) => ({
        questionId: qId,
        selectedAnswer: ansIndex,
      }));
      await submitMock(id, formattedAnswers);
      navigate(`/mock/${id}/result`);
    } catch (err) {
      alert("Submission failed.");
    }
    finally {
        setLoading(false);
    }
  };

  if (loading || !examData?.sections) {
    return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader />
    </div>
  );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden text-foreground">
      {/* --- TOP BAR --- */}
      <nav className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 hidden sm:block">Mock Session</span>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm transition-all ${
          timeLeft < 300 ? "bg-red-500/10 text-red-500 animate-pulse border border-red-500/20" : "bg-primary/5 text-primary border border-primary/10"
        }`}>
          <Clock size={16} />
          {formatTime(timeLeft)}
        </div>

        <button onClick={() => handleSubmit(false)} className="btn-primary !py-1.5 !px-4 !text-xs !rounded-lg">
          Submit
        </button>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 flex flex-col min-w-0 bg-background/50">
          
          {/* SECTION HEADER ROW (Combined Mobile Nav) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-surface/30">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {examData.sections.map((sec, idx) => (
                <button
                  key={sec._id}
                  onClick={() => { setCurrentSectionIdx(idx); setCurrentQuestionIdx(0); }}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                    currentSectionIdx === idx 
                      ? "bg-primary text-white border-primary shadow-sm" 
                      : "bg-surface border-border opacity-50 hover:opacity-100"
                  }`}
                >
                  {sec.name}
                </button>
              ))}
            </div>

            {/* Mobile Palette Trigger - Now in Header Row */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden ml-4 p-2 bg-primary/10 text-primary rounded-lg border border-primary/20 shrink-0"
            >
              <Menu size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="glass-card p-6 md:p-8 border-none shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">Question {currentQuestionIdx + 1}</span>
                  {markedForReview.has(currentQuestion._id) && (
                    <div className="flex items-center gap-1.5 text-accent font-bold text-[10px] bg-accent/10 px-2 py-1 rounded-md">
                      <Flag size={12} fill="currentColor" /> MARKED
                    </div>
                  )}
                </div>
                
                {/* ── CHANGE 1: question text now renders $...$ as KaTeX ── */}
                <p className="text-lg md:text-xl font-medium mb-8 leading-relaxed">
                  {renderMath(currentQuestion.text)}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(currentQuestion._id, i)}
                      className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 group ${
                        userAnswers[currentQuestion._id] === i
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/60 hover:border-primary/40 bg-surface/50"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                        userAnswers[currentQuestion._id] === i ? "bg-primary text-white" : "bg-muted text-foreground/40"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {/* ── CHANGE 2: option text now renders $...$ as KaTeX ── */}
                      <span className="font-medium text-sm md:text-base">{renderMath(opt)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <button 
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-40 hover:opacity-100 disabled:opacity-0 transition-all"
                >
                  <ChevronLeft size={18} /> Prev
                </button>

                <button 
                  onClick={() => toggleMark(currentQuestion._id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    markedForReview.has(currentQuestion._id) ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" : "bg-surface border-border opacity-60"
                  }`}
                >
                  <Flag size={14} /> {markedForReview.has(currentQuestion._id) ? "Unmark" : "Flag"}
                </button>

                {currentQuestionIdx < currentSection.questions.length - 1 ? (
                  <button onClick={() => setCurrentQuestionIdx(prev => prev + 1)} className="btn-primary !py-2.5 !px-6 !text-xs !rounded-xl">
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="w-20" />
                )}
              </div>
            </div>
          </div>
        </main>

        <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-surface border-l border-border transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
        }`}>
          <div className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Question Palette</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-muted rounded-md"><X size={18}/></button>
            </div>

            <div className="grid grid-cols-4 gap-2.5 overflow-y-auto pr-1 scrollbar-hide">
              {currentSection.questions.map((q, idx) => {
                const isAnswered = userAnswers[q._id] !== undefined;
                const isMarked = markedForReview.has(q._id);
                const isCurrent = currentQuestionIdx === idx;
                
                return (
                  <button
                    key={q._id}
                    onClick={() => { setCurrentQuestionIdx(idx); setIsSidebarOpen(false); }}
                    className={`h-11 rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2 ${
                      isMarked ? "bg-accent border-accent text-white" :
                      isAnswered ? "bg-green-500 border-green-500 text-white" :
                      isCurrent ? "border-primary text-primary bg-primary/5" : "bg-muted/30 border-transparent opacity-60"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-5 grid grid-cols-2 gap-y-3 border-t border-border/60">
               {[
                 { label: 'Answered', color: 'bg-green-500' },
                 { label: 'Marked', color: 'bg-accent' },
                 { label: 'Current', color: 'border-primary border-2' },
                 { label: 'Empty', color: 'bg-muted' }
               ].map(item => (
                 <div key={item.label} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter opacity-60">
                   <div className={`w-3 h-3 rounded-sm ${item.color}`} /> {item.label}
                 </div>
               ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MockExam;