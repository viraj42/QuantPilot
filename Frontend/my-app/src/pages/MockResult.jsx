import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getMockResult } from "../api/mock.api";
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  BarChart3
} from "lucide-react";

const MockResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await getMockResult(id);
        setResult(data);
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center text-primary animate-pulse font-bold">Generating Analysis...</div>;
  if (!result) return <div className="p-10 text-center">Result not found.</div>;

  const avgTime = (result.durationTaken / result.overall.totalQuestions).toFixed(1);
  const isTimeEfficient = avgTime <= 90;

  return (
    <div className="min-h-screen bg-background pb-20 transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 pt-10 space-y-8">
        {/* --- SCORECARD HEADER --- */}
        <section className="glass-card p-8 md:p-12 text-center relative overflow-hidden border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
          <Trophy className="mx-auto text-accent w-16 h-16 mb-4 drop-shadow-lg" />
          <h1 className="text-3xl md:text-4xl font-heading font-black mb-2 tracking-tight">TEST Complete</h1>
          <p className="text-foreground/50 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">
            {result.company?.name} • {new Date(result.submittedAt).toLocaleDateString()}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { label: 'Total Score', val: result.overall.score, col: 'text-primary' },
              { label: 'Accuracy', val: `${result.overall.accuracy}%`, col: 'text-secondary' },
              { label: 'Time Taken', val: `${Math.floor(result.durationTaken / 60)}m`, col: 'text-foreground/80' },
              { label: 'Attempted', val: result.overall.attempted, col: 'text-accent' }
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <p className={`text-2xl md:text-3xl font-black ${stat.col}`}>{stat.val}</p>
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- INSIGHTS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card p-8 space-y-6 border-none">
            <h3 className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest opacity-40">
              <BarChart3 size={14} /> Sectional Breakdown
            </h3>
            <div className="space-y-6">
              {result.sectionStats.map((section) => (
                <div key={section.sectionId} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                    <span>{section.sectionName}</span>
                    <span className="text-primary">{section.accuracy}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out" 
                      style={{ width: `${section.accuracy}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 flex flex-col justify-center border-none bg-accent/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent/40" />
            <Clock className="text-accent mb-4" size={28} />
            <h4 className="font-heading font-bold text-lg mb-2">Pace Analysis</h4>
            <p className="text-xs text-foreground/60 leading-relaxed font-medium">
              Averaged <span className="text-foreground font-bold">{avgTime}s</span> per question. 
              {isTimeEfficient 
                ? " Speed is optimal for this pattern." 
                : " Aim for under 90s to improve completion rates."}
            </p>
          </div>
        </div>

        {/* --- QUESTION REVIEW SECTION (BUG FIX APPLIED HERE) --- */}
        <section className="space-y-6 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 ml-1">Detailed Review</h3>
          <div className="space-y-4">
            {result.review.map((item, idx) => (
              <div key={item.questionId} className="bg-surface dark:bg-surface border border-border/40 rounded-[1.5rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 transition-all hover:border-primary/20">
                <div className="shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    item.selectedAnswer === null ? "bg-muted text-foreground/30" :
                    item.isCorrect ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {idx + 1}
                  </div>
                </div>

                <div className="flex-1 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-muted/50 text-foreground/50 rounded-md text-[9px] font-black uppercase tracking-widest">
                        {item.sectionName}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        item.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {item.difficulty}
                      </span>
                    </div>
                  </div>

                  <p className="font-semibold text-foreground/90 leading-relaxed text-base">{item.question}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === item.correctAnswer;
                      const isSelected = optIdx === item.selectedAnswer;
                      
                      let borderStyle = "border-border/60 bg-background/30 text-foreground/60";
                      if (isCorrect) borderStyle = "border-green-500/50 bg-green-500/5 text-green-500 font-bold opacity-100 shadow-sm shadow-green-500/5";
                      if (isSelected && !isCorrect) borderStyle = "border-red-500/50 bg-red-500/5 text-red-500 font-bold opacity-100 shadow-sm shadow-red-500/5";

                      return (
                        <div key={optIdx} className={`p-4 rounded-xl border text-sm transition-all flex items-center gap-3 ${borderStyle}`}>
                          <span className="opacity-30 text-[10px] font-black">{String.fromCharCode(65 + optIdx)}</span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                          {isSelected && !isCorrect && <XCircle size={16} className="text-red-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {item.selectedAnswer === null && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-accent/5 rounded-lg w-fit">
                       <AlertCircle size={14} className="text-accent" />
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest">Question Unattempted</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-center pt-12">
          <button 
            onClick={() => navigate("/mock/home")}
            className="btn-primary px-12 py-4 gap-3 rounded-2xl shadow-xl"
          >
            Finish & Return <ChevronRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default MockResult;