import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getProfileOverview } from "../api/analytics";
import { 
  Flame, Target, BarChart3, Zap, Calendar as CalendarIcon, 
} from "lucide-react";
import useAuth from "../utils/useAuth";
import Loader from "./Loader"
const ProfileDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Import useAuth at the top
  const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.name}`;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfileOverview();
        setData(res);
        console.log(res);
        
      } catch (err) {
        console.error("Profile load failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <Loader/>;

  const solvedEasy = data.solvedByDifficulty?.easy || 0;
  const solvedMed  = data.solvedByDifficulty?.medium || 0;
  const solvedHard = data.solvedByDifficulty?.hard || 0;
  const totalSolvedDiff = solvedEasy + solvedMed + solvedHard || 1; // avoid div/0

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  /**
   * Helper to find real backend data for a specific box
   * Maps current year (2026) and month/day to heatmap data
   */
  const getDayData = (monthIdx, dayIdx) => {
    if (!data.heatmap) return 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const actualMonth = ((monthIdx + 3) % 12) + 1;
    // If this month-number is greater than the current month, it belongs to the previous year
    const year = actualMonth > currentMonth ? currentYear - 1 : currentYear;
    const dateString = `${year}-${actualMonth.toString().padStart(2, '0')}-${(dayIdx + 1).toString().padStart(2, '0')}`;
    const dayRecord = data.heatmap.find(d => d.date === dateString);
    return dayRecord ? dayRecord.solved : 0;
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-500 pb-12">
      <Navbar />
      
      <main className="max-w-[1400px] mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 text-foreground">
        
        {/* --- LEFT SIDEBAR --- */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="glass-card p-8 text-center border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            <div className="w-24 h-24 rounded-3xl bg-muted mx-auto mb-4 overflow-hidden border-4 border-surface shadow-lg">
               <img src={avatarUrl} alt="avatar" />
            </div>
            <h2 className="text-xl font-heading font-black tracking-tight">{user?.name}</h2>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] mb-6">Elite Member</p>
            
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl border border-accent/20">
              <Flame size={18} fill="currentColor" />
              <span className="font-black text-lg">{data.streak} Day Streak</span>
            </div>
          </div>

          <div className="glass-card p-6 border-none shadow-xl">
             <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 px-1">Difficulty Mastery</h3>
             <div className="flex items-center justify-between gap-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted/30" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="oklch(0.7 0.2 160)" strokeWidth="2.5"
                      strokeDasharray={`${((solvedEasy / totalSolvedDiff) * 100).toFixed(1)} 100`}
                      strokeLinecap="round" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="oklch(0.8 0.15 80)" strokeWidth="2.5"
                      strokeDasharray={`${((solvedMed / totalSolvedDiff) * 100).toFixed(1)} 100`}
                      strokeDashoffset={`-${((solvedEasy / totalSolvedDiff) * 100).toFixed(1)}`}
                      strokeLinecap="round" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="oklch(0.6 0.2 25)" strokeWidth="2.5"
                      strokeDasharray={`${((solvedHard / totalSolvedDiff) * 100).toFixed(1)} 100`}
                      strokeDashoffset={`-${(((solvedEasy + solvedMed) / totalSolvedDiff) * 100).toFixed(1)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">{data.totalUniqueSolved}</span>
                    <span className="text-[9px] font-bold opacity-30 uppercase tracking-tighter mt-1">Solved</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                   {[
                     { label: 'Easy', solved: solvedEasy, col: 'text-teal-500' },
                     { label: 'Med.', solved: solvedMed,  col: 'text-yellow-500' },
                     { label: 'Hard', solved: solvedHard, col: 'text-rose-500' }
                   ].map(item => (
                     <div key={item.label} className="bg-muted/30 p-2 rounded-lg">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`text-[10px] font-black uppercase ${item.col}`}>{item.label}</span>
                          <span className="text-[11px] font-bold">{item.solved}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </aside>

        {/* --- CENTER: MAIN ANALYTICS --- */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-6 border-none bg-primary/5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Global Accuracy</p>
              <p className="text-3xl font-heading font-black text-primary">{data.globalAccuracy}%</p>
            </div>
            <div className="glass-card p-6 border-none bg-secondary/5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Total Solved</p>
              <p className="text-3xl font-heading font-black text-secondary">{data.totalUniqueSolved}</p>
            </div>
          </div>

          <div className="glass-card p-8 border-none shadow-xl">
            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">
              <BarChart3 size={14} /> Section Mastery
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.sectionOverview.map((s) => (
                <div key={s.section} className="p-5 bg-muted/20 border border-border/40 rounded-3xl flex items-center justify-between group transition-all hover:bg-muted/30 hover:border-primary/20">
                   <div>
                      <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">{s.section}</p>
                      <p className="text-2xl font-black text-primary transition-transform group-hover:scale-105 origin-left">{s.accuracy}%</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black">{s.totalSolved}</p>
                      <p className="text-[9px] font-bold opacity-30 uppercase">Solved</p>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITY HEATMAP (BACKEND SYNCED) */}
          <div className="glass-card p-8 border-none shadow-xl overflow-hidden">
            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 mb-8">
              <CalendarIcon size={14} /> Activity Insight
            </h3>
            
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 min-w-max pb-4 px-1">
                {months.map((month, mIdx) => (
                  <div key={month} className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter text-center">{month}</span>
                    <div className="grid grid-rows-6 grid-flow-col gap-1">
                      {Array.from({ length: 30 }).map((_, dIdx) => {
                        const count = getDayData(mIdx, dIdx);
                        const intensity = count >= 100 ? 3 : count >= 50 ? 2 : count > 0 ? 1 : 0;
                        const colors = ['bg-muted/40', 'bg-primary/50', 'bg-primary/80', 'bg-primary'];
                        
                        return (
                          <div key={dIdx} className="group relative">
                            <div className={`w-3.5 h-3.5 rounded-[2px] ${colors[intensity]} transition-all hover:scale-110 hover:ring-1 hover:ring-primary/40`} />
                            {count > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface border border-border rounded shadow-xl text-[8px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 z-50 pointer-events-none">
                                {count} Solved
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-[9px] font-bold opacity-30 uppercase tracking-widest justify-end">
              <span>Less</span>
              {[0, 1, 2, 3].map(i => <div key={i} className={`w-2.5 h-2.5 rounded-sm ${['bg-muted/40', 'bg-primary/20', 'bg-primary/50', 'bg-primary'][i]}`} />)}
              <span>More</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDEBAR --- */}
        <aside className="lg:col-span-3">
          <div className="glass-card p-6 border-none h-full max-h-[850px] flex flex-col shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 px-1">
              Topic Breakdown
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
               {data.topicProgress.filter(t => t.totalQuestions > 0).map((topic) => (
                 <div key={topic.topicName} className="group">
                    <div className="flex justify-between items-end mb-1.5 px-1">
                      <p className="text-[11px] font-bold text-foreground/70 truncate w-3/4 group-hover:text-primary transition-colors">{topic.topicName}</p>
                      <p className="text-[9px] font-black text-primary">{Math.round(topic.progressPercent)}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-primary/40 group-hover:bg-primary transition-all duration-500" style={{ width: `${topic.progressPercent}%` }} />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
};

export default ProfileDashboard;