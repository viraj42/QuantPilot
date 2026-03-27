import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import useAuth from "../utils/useAuth";
import { useTheme } from "../utils/ThemeContext";
import { getProfileOverview } from "../api/analytics";
import { User, LogOut } from "lucide-react"; // Added icons for elite feel

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [streak, setStrike] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Consistent Avatar Logic: Use user name or email as seed
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || user?.email || 'default'}`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const response = await getProfileOverview();
        setStrike(response.streak || 0);
      } catch (error) {
        console.error("Failed to load Streak:", error);
      }
    };
    if (isAuthenticated) fetchStreak();
  }, [isAuthenticated]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const drawer = (
    <AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 z-[500] lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/80"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.32 }}
            className="absolute top-0 left-0 h-full w-[82%] max-w-sm bg-background border-r border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-border">
              <span className="font-heading font-bold text-lg tracking-tight">Menu</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-border bg-surface hover:scale-110 transition"
                >
                  {theme === "dark" ? "☀️" : "🌙"}
                </button>
                <button onClick={() => setMobileOpen(false)} className="text-xl p-2">✕</button>
              </div>
            </div>
            <div className="flex flex-col gap-6 px-6 py-8 text-lg font-semibold">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link to="/practice" onClick={() => setMobileOpen(false)}>Practice</Link>
                  <Link to="/mock/home" onClick={() => setMobileOpen(false)}>Mock Tests</Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>My Profile</Link>
                  <Link to="/bookmarks" onClick={() => setMobileOpen(false)}>Bookmarks</Link>
                </>
              ) : (
                <>
                  <a href="#how" onClick={() => setMobileOpen(false)}>How it works</a>
                  <a href="#modules" onClick={() => setMobileOpen(false)}>Modules</a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2">
              <div className="w-6 h-0.5 bg-current mb-1.5 rounded-full" />
              <div className="w-4 h-0.5 bg-current mb-1.5 rounded-full" />
              <div className="w-6 h-0.5 bg-current rounded-full" />
            </button>
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
              <div className="bg-primary text-white px-2 py-1 rounded-lg font-bold">|||</div>
              <span className="text-xl font-heading font-bold tracking-tight">QuantPilot⚡</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/practice">Practice</Link>
                <Link to="/mock/home">Mock Tests</Link>
                <Link to="/bookmarks">Bookmarks</Link>
              </>
            ) : (
              <>
                <a href="#how">How it works</a>
                <a href="#modules">Modules</a>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={toggleTheme}
              className="hidden lg:block p-2 rounded-lg border border-border bg-surface hover:scale-110 transition"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 md:gap-5">
                <span className="hidden sm:block font-bold text-sm">🔥 {streak}</span>
                <div 
                  className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 relative shrink-0 cursor-pointer"
                  ref={dropdownRef}
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <img src={avatarUrl} alt="profile" className="rounded-full bg-surface" />
                  
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-3 w-48 bg-background border border-border rounded-2xl shadow-2xl p-2 z-[110] overflow-hidden"
                      >
                        {/* Profile Link Option */}
                        <button
                          onClick={() => { navigate("/profile"); setProfileOpen(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                        >
                          <User size={14} className="text-primary" /> Profile
                        </button>

                        <div className="h-px bg-border my-1 mx-2" />

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 hover:bg-rose-500/10 rounded-xl text-xs font-bold text-rose-500 flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={14} /> Log Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hidden sm:block text-sm font-bold opacity-60">Login</Link>
                <Link to="/signup" className="hidden sm:block">
                  <button className="btn-primary px-6 py-2.5 text-xs">Sign Up</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      {createPortal(drawer, document.body)}
    </>
  );
};

export default Navbar;