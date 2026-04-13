import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPracticeReview } from "../api/practice.api";
import { PerformanceStrip, AccuracyVsTimeChart, ReviewCard } from "../components/ReviewComponents";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Background3D from "../components/Background3D";
import Loader from "./Loader";

function PracticeReviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({ review: [], analytics: null });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await getPracticeReview(sessionId);
        setData({
          review: response.review,
          analytics: response.analytics,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) fetchReview();
  }, [sessionId]);

  const filteredReview =
    activeFilter === "Incorrect"
      ? data.review.filter((r) => !r.isCorrect)
      : data.review;

  const incorrectCount = data.review.filter((r) => !r.isCorrect).length;

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">

      <Background3D />
      <Navbar />

      <main className="relative z-10 pt-8 pb-20 px-4 sm:px-6 transition-all duration-500">
        <div className="max-w-[850px] mx-auto">

          {/* ── Header ── */}
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border-b border-border/15 pb-6"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-2">
              Session Review
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tighter text-foreground">
              How Did You <span className="text-primary italic">Perform?</span>
            </h1>
          </motion.header>

          {/* ── Performance Strip ── */}
          <PerformanceStrip analytics={data.analytics} />

          {/* ── Chart ── */}
          <AccuracyVsTimeChart data={data.analytics?.accuracyVsTime} />

          {/* ── Filter Bar ── */}
          <div className="sticky top-[64px] z-30 bg-background/85 backdrop-blur-xl border-y border-border/10 py-3 mb-6 flex items-center justify-between">
            <div className="flex gap-6">
              {["All", "Incorrect"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-1.5
                    ${activeFilter === tab ? "text-primary" : "text-foreground/30 hover:text-foreground"}`}
                >
                  {tab}{tab === "Incorrect" && ` (${incorrectCount})`}
                  {activeFilter === tab && (
                    <motion.div
                      layoutId="tabUnderline"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">
              {filteredReview.length} questions
            </span>
          </div>

          {/* ── Review Cards ── */}
          <div className="space-y-2.5">
            {filteredReview.length > 0 ? (
              filteredReview.map((item, i) => (
                <motion.div
                  key={item.questionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <ReviewCard item={item} />
                </motion.div>
              ))
            ) : (
              <div className="py-16 text-center text-foreground/25 text-xs italic border border-dashed border-border/30 rounded-2xl">
                No {activeFilter.toLowerCase()} questions to show.
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <footer className="mt-14 flex flex-col items-center gap-4">
            <button
              onClick={() => navigate(`/practice`)}
              className="btn-primary px-10 py-3 shadow-xl shadow-primary/10 !rounded-2xl"
            >
              Return to Practice
            </button>
          </footer>

        </div>
      </main>
    </div>
  );
}

export default PracticeReviewPage;