import React, { useState, useEffect } from "react";
import { Link, useLocation,useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import useAuth from "../utils/useAuth";
import { useTheme } from "../utils/ThemeContext";
import {getProfileOverview} from "../api/analytics"
const Navbar = () => {

  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak,setStrike]=useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(()=>{
      const fetchStreak=async()=>{
        try {
          const response=await getProfileOverview();
          console.log(response);
          setStrike(response.streak);
          
        } catch (error) {
          console.error("Failed to load Streak:", error);
        }
      };
      fetchStreak();
  })

  /* Prevent body scroll when drawer open */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileOpen]);

  /* ---------- MOBILE DRAWER (PORTAL) ---------- */
  const drawer = (
    <AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 z-[500] lg:hidden">

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/80"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.32 }}
            className="absolute top-0 left-0 h-full w-[82%] max-w-sm bg-background border-r border-border shadow-2xl flex flex-col"
          >

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-border">

              <span className="font-heading font-bold text-lg tracking-tight">
                Menu
              </span>

              <div className="flex items-center gap-3">

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-border bg-surface hover:scale-110 transition"
                >
                  {theme === "dark" ? "☀️" : "🌙"}
                </button>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-xl p-2"
                >
                  ✕
                </button>

              </div>

            </div>

            {/* Links */}
            <div className="flex flex-col gap-6 px-6 py-8 text-lg font-semibold">

              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link to="/practice" onClick={() => setMobileOpen(false)}>Practice</Link>
                  <Link to="/mocks" onClick={() => setMobileOpen(false)}>Mock Tests</Link>
                  <Link to="/bookmarks" onClick={() => setMobileOpen(false)}>Bookmarks</Link>
                </>
              ) : (
                <>
                  <a href="#how" onClick={() => setMobileOpen(false)}>How it works</a>
                  <a href="#modules" onClick={() => setMobileOpen(false)}>Modules</a>
                </>
              )}

            </div>

            {/* Footer */}
            <div className="mt-auto px-6 pb-8 pt-6 border-t border-border flex flex-col gap-4">

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="w-full py-3 border border-rose-500/30 rounded-xl font-bold text-rose-500"
                >
                  Log Out
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <button className="w-full py-3 border border-border rounded-xl font-bold">
                      Login
                    </button>
                  </Link>

                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    <button className="btn-primary w-full">
                      Sign Up
                    </button>
                  </Link>
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

          {/* Left: Logo + Burger */}
          <div className="flex items-center gap-4">

            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2"
            >
              <div className="w-6 h-0.5 bg-current mb-1.5 rounded-full" />
              <div className="w-4 h-0.5 bg-current mb-1.5 rounded-full" />
              <div className="w-6 h-0.5 bg-current rounded-full" />
            </button>

            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center gap-2"
            >
              <div className="bg-primary text-white px-2 py-1 rounded-lg font-bold">|||</div>
              <span className="text-xl font-heading font-bold tracking-tight">
                QuantPilot⚡
              </span>
            </Link>

          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">

            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/practice">Practice</Link>
                <Link to="/mocks">Mock Tests</Link>
                <Link to="/bookmarks">Bookmarks</Link>
              </>
            ) : (
              <>
                <a href="#how">How it works</a>
                <a href="#modules">Modules</a>
              </>
            )}

          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-surface hover:scale-110 transition"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-5">

                <span className="hidden md:block font-bold text-sm">
                  🔥 {streak}
                </span>

                <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 relative group">

                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt="profile"
                    className="rounded-full bg-surface"
                  />

                  <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity p-2 pointer-events-none group-hover:pointer-events-auto">

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-primary/10 rounded-lg text-xs font-bold text-rose-500"
                    >
                      Log Out
                    </button>

                  </div>

                </div>

              </div>
            ) : (
              <div className="flex items-center gap-4">

                <Link to="/login" className="hidden sm:block text-sm font-bold opacity-60">
                  Login
                </Link>

                <Link to="/signup" className="hidden sm:block">
                  <button className="btn-primary px-6 py-2.5 text-xs">
                    Sign Up
                  </button>
                </Link>

              </div>
            )}

          </div>

        </div>

      </nav>

      {/* Render drawer outside stacking contexts */}
      {createPortal(drawer, document.body)}
    </>
  );
};

export default Navbar;