import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCompanies, generateMock, getMockHistory } from "../api/mock.api";
import { Rocket, Clock, FileText, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Loader from "./Loader";

const MockHome = () => {
  const [companies, setCompanies] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const response = await generateMock(companyId);
      navigate(`/mock/${response.mockAttemptId}`);
    } catch (error) {
      alert("Error generating simulation.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <div className="min-h-screen bg-background transition-colors duration-500 pb-16">
      <Navbar />

      {/* ✅ ULTRA-TIGHT START */}
      <main className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 space-y-10">

        {/* ✅ MINIMAL HEADER */}
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight">
            Company <span className="text-primary italic">Simulations</span>
          </h1>
        </div>

        {/* ✅ DIRECT CONTENT (NO SECTION HEADER WASTE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company, index) => (
            <motion.div
              key={company._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -6 }}
              className="glass-card group flex flex-col overflow-hidden border-border/30 hover:border-primary/40 transition-all duration-300"
            >
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-white/5 p-2 border border-border/50 flex items-center justify-center">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xl font-black text-primary">
                        {company.name[0]}
                      </span>
                    )}
                  </div>

                  <div className="text-[9px] font-black uppercase text-primary/60">
                    2026
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-xs text-foreground/40 mt-1 line-clamp-2">
                    {company.description}
                  </p>
                </div>

                <div className="flex items-center gap-5 text-foreground/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 opacity-40" />
                    <span className="text-[10px] font-bold">
                      {company.duration || "60m"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 opacity-40" />
                    <span className="text-[10px] font-bold">
                      {company.totalQuestions || "40"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartMock(company.companyId)}
                className="w-full bg-foreground/[0.03] group-hover:bg-primary border-t border-border/20 py-4 flex items-center justify-center gap-2 transition-all duration-300"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 group-hover:text-white">
                  Start
                </span>
                <Rocket className="w-4 h-4 text-foreground/30 group-hover:text-white" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* ✅ HISTORY (kept, but tightened) */}
        {history.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/30">
              History
            </h3>

            <div className="glass-card overflow-hidden border-border/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/10">
                      <th className="px-6 py-4 text-[10px] text-foreground/30">
                        Company
                      </th>
                      <th className="px-6 py-4 text-[10px] text-foreground/30">
                        Score
                      </th>
                      <th className="px-6 py-4 text-[10px] text-foreground/30">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] text-foreground/30">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/10">
                    {history.map((attempt) => (
                      <tr key={attempt._id} className="hover:bg-primary/[0.02]">
                        <td className="px-6 py-4 text-sm font-semibold">
                          {attempt.companyName}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">
                          {attempt.score}
                        </td>
                        <td className="px-6 py-4 text-xs text-foreground/40">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              navigate(`/mock/${attempt._id}/result`)
                            }
                            className="text-primary text-xs font-bold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MockHome;