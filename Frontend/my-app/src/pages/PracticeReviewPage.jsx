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

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-0.5 bg-primary/20 rounded-full overflow-hidden">
          <Loader/>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      
      {/* Background Layer */}
      <Background3D />

      {/* Main Navbar */}
      <Navbar />

      <main className="relative z-10 pt-16 pb-20 px-6 transition-all duration-500">
        <div className="max-w-[850px] mx-auto">

          {/* Header */}
          <header className="mb-10">
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter text-foreground">
              Review <span className="text-primary italic">Section</span>
            </h2>
          </header>

          {/* Performance Strip */}
          <PerformanceStrip analytics={data.analytics} />

          {/* Filter Navigation */}
          <div className="sticky top-[90px] z-30 bg-background/80 backdrop-blur-xl border-y border-border/10 py-3 mb-8 flex items-center justify-between">

            <div className="flex gap-8">
              {["All", "Incorrect"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${
                    activeFilter === tab
                      ? "text-primary"
                      : "text-foreground/30 hover:text-foreground"
                  }`}
                >
                  {tab}{" "}
                  {tab === "Incorrect" &&
                    `(${data.review.filter((r) => !r.isCorrect).length})`}

                  {activeFilter === tab && (
                    <motion.div
                      layoutId="tabUnderline"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>

            <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">
              {filteredReview.length} items listed
            </span>

          </div>

          {/* Chart */}
          <AccuracyVsTimeChart data={data.analytics?.accuracyVsTime} />

          {/* Review List */}
          <div className="space-y-3">
            {filteredReview.map((item) => (
              <ReviewCard key={item.questionId} item={item} />
            ))}
          </div>

          {/* Footer */}
          <footer className="mt-16 flex flex-col items-center gap-4">
            <button
              onClick={() => navigate(`/practice`)}
              className="btn-primary !px-10 !py-3 shadow-xl shadow-primary/10"
            >
              Return to Dashboard
            </button>
          </footer>

        </div>
      </main>
    </div>
  );
}

export default PracticeReviewPage;