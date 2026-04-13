import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCompanies, generateMock, getMockHistory } from "../api/mock.api";
import { Rocket, Clock, FileText, ChevronRight, RotateCcw, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "./Loader";

const MockHome = () => {
  const [companies, setCompanies] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);
  const [selected, setSelected] = useState(0); // index of featured company
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesData, historyData] = await Promise.all([
          getCompanies(),
          getMockHistory(),
        ]);
        setCompanies(companiesData.companies || []);
        setHistory(historyData || []);
      } catch (error) {
        console.error("Failed to load mock data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartMock = async (companyId) => {
    if (generatingId !== null) return; // prevent double-click
    setGeneratingId(companyId);
    try {
      const response = await generateMock(companyId);
      navigate(`/mock/${response.mockAttemptId}`);
    } catch (error) {
      setGeneratingId(null);
      alert("Error generating simulation.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );

  const featured = companies[selected] ?? null;
  const isGeneratingFeatured = featured && generatingId === featured.companyId;

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">

        {/* ── PAGE LABEL ── */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/30">Mock Tests</span>
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20">{companies.length} simulations</span>
        </div>

        {/* ── MAIN SPLIT PANEL ── */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-stretch">

          {/* ────── LEFT: FEATURED LAUNCH PANEL ────── */}
          <AnimatePresence mode="wait">
            {featured && (
              <motion.div
                key={featured._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="lg:w-[420px] xl:w-[460px] flex-shrink-0 glass-card border-border/30 flex flex-col overflow-hidden relative"
              >
                {/* Subtle background glyph */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

                <div className="flex-1 p-8 md:p-10 flex flex-col gap-6 relative z-10">

                  {/* Logo + year row */}
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-border/50 flex items-center justify-center shadow-sm overflow-hidden p-2">
                      {featured.logoUrl ? (
                        <img src={featured.logoUrl} alt={featured.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-2xl font-black text-primary">{featured.name[0]}</span>
                      )}
                    </div>
                    <span className="text-[9px] font-black tracking-[0.3em] uppercase text-primary/40 border border-primary/10 px-2 py-1 rounded-lg bg-primary/5">
                      2026
                    </span>
                  </div>

                  {/* Company name + description */}
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight">
                      {featured.name}
                    </h1>
                    <p className="text-sm text-foreground/45 leading-relaxed max-w-sm">
                      {featured.description}
                    </p>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-6 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-foreground/40" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest leading-none">Duration</p>
                        <p className="text-sm font-black mt-0.5">{featured.duration || "60m"}</p>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-border/50" />
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-foreground/40" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest leading-none">Questions</p>
                        <p className="text-sm font-black mt-0.5">{featured.totalQuestions || "40"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Launch button — pinned to bottom */}
                <button
                  onClick={() => handleStartMock(featured.companyId)}
                  disabled={generatingId !== null}
                  className={`w-full py-5 flex items-center justify-center gap-3 font-bold text-sm tracking-wide transition-all duration-300 border-t border-border/20
                    ${isGeneratingFeatured
                      ? "bg-primary text-white cursor-wait"
                      : generatingId !== null
                      ? "bg-muted/50 text-foreground/20 cursor-not-allowed"
                      : "bg-primary/5 hover:bg-primary text-primary hover:text-white group"
                    }`}
                >
                  {isGeneratingFeatured ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Preparing Test...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Launch Simulation
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ────── RIGHT: COMPANY SELECTOR LIST ────── */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/25 px-1 mb-1">
              Select Company
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 lg:max-h-[500px] lg:overflow-y-auto pr-1 scrollbar-hide">
              {companies.map((company, index) => {
                const isActive = selected === index;
                const isGeneratingThis = generatingId === company.companyId;
                return (
                  <motion.button
                    key={company._id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => { if (!generatingId) setSelected(index); }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all duration-200 group
                      ${isActive
                        ? "bg-surface border-primary/30 shadow-md"
                        : "bg-transparent border-border/30 hover:border-border/60 hover:bg-surface/50"
                      }`}
                  >
                    {/* Mini logo */}
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border overflow-hidden p-1.5 transition-colors
                      ${isActive ? "bg-white dark:bg-white/10 border-border/50" : "bg-muted/40 border-transparent"}
                    `}>
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-sm font-black text-primary">{company.name[0]}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate transition-colors ${isActive ? "text-foreground" : "text-foreground/60 group-hover:text-foreground"}`}>
                        {company.name}
                      </p>
                      <p className="text-[10px] text-foreground/30 mt-0.5 font-medium">
                        {company.totalQuestions || "40"} Qs · {company.duration || "60m"}
                      </p>
                    </div>

                    {/* State indicator */}
                    <div className="flex-shrink-0">
                      {isGeneratingThis ? (
                        <svg className="w-4 h-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <ChevronRight className={`w-4 h-4 transition-all ${isActive ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-30"}`} />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── HISTORY SECTION ── */}
        {history.length > 0 && (
          <section className="space-y-3">
            {/* Section label */}
            <div className="flex items-center gap-3">
              <RotateCcw className="w-3 h-3 text-foreground/25" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/25">Past Attempts</span>
              <div className="h-px flex-1 bg-border/30" />
            </div>

            {/* Timeline-style history rows */}
            <div className="glass-card border-border/20 overflow-hidden divide-y divide-border/10">
              {history.map((attempt, index) => (
                <motion.div
                  key={attempt._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-primary/[0.025] transition-colors group"
                >
                  {/* Score badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-muted/50 flex flex-col items-center justify-center border border-border/30">
                    <span className="text-[13px] font-black text-primary leading-none">{attempt.score}</span>
                    <span className="text-[8px] font-bold opacity-30 uppercase mt-0.5">Score</span>
                  </div>

                  {/* Company + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground/80 truncate">{attempt.companyName}</p>
                    <p className="text-[10px] text-foreground/30 mt-0.5">
                      {new Date(attempt.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                  </div>

                  {/* View button */}
                  <button
                    onClick={() => navigate(`/mock/${attempt._id}/result`)}
                    className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Review <ArrowUpRight className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default MockHome;