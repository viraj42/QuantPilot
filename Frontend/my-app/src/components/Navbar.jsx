import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import useAuth from "../utils/useAuth";
import { useTheme } from "../utils/ThemeContext";
import { getProfileOverview } from "../api/analytics";
import { User, LogOut } from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [streak, setStrike] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Consistent Avatar Logic: Use user name or email as seed
  const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.name || user?.email || 'default'}`;

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

  const isActive = (path) => location.pathname === path;

  // ── Authenticated nav links ──
  const authLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/practice", label: "Practice" },
    { to: "/mock/home", label: "Mock Tests" },
  ];

  // ── Public nav links ──
  const publicLinks = [
    { href: "#how", label: "How it works" },
    { href: "#modules", label: "Modules" },
  ];

  // ── Mobile bottom-sheet drawer ──
  const drawer = (
    <AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 z-[500] lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/60 rounded-t-[2rem] shadow-2xl flex flex-col"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Brand header strip */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-base">⚡</span>
                </div>
                <span className="font-heading font-bold text-base tracking-tight">Aptify</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl border border-border bg-surface hover:bg-muted transition text-base"
                >
                  {theme === "dark" ? "☀️" : "🌙"}
                </button>
                {/* Close */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl border border-border bg-surface hover:bg-muted transition text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Nav links */}
            <div className="flex flex-col gap-1 px-4 py-4">
              {isAuthenticated ? (
                <>
                  {authLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-base transition-all
                        ${isActive(to)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/70 hover:bg-muted hover:text-foreground"
                        }`}
                    >
                      {isActive(to) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                      {label}
                    </Link>
                  ))}
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-base transition-all
                      ${isActive("/profile")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    My Profile
                  </Link>
                </>
              ) : (
                <>
                  {publicLinks.map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-base text-foreground/70 hover:bg-muted hover:text-foreground transition-all"
                    >
                      {label}
                    </a>
                  ))}
                </>
              )}
            </div>

            {/* Bottom actions */}
            {isAuthenticated ? (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-xl border border-accent/20">
                  <span className="text-sm">🔥</span>
                  <span className="font-black text-sm text-accent">{streak} Day Streak</span>
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 transition"
                >
                  <LogOut size={13} /> Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-6 py-4 border-t border-border/40 mb-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-3 rounded-2xl border border-border font-bold text-sm hover:bg-muted transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1"
                >
                  <button className="btn-primary w-full py-3 text-xs rounded-2xl">Sign Up</button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-border/30 bg-background/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── LEFT: hamburger + logo ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl border border-border/60 bg-surface/60 gap-1.5 hover:bg-muted transition"
              aria-label="Open menu"
            >
              <span className="w-4 h-[1.5px] bg-foreground rounded-full" />
              <span className="w-3 h-[1.5px] bg-foreground/60 rounded-full" />
              <span className="w-4 h-[1.5px] bg-foreground rounded-full" />
            </button>

            {/* Logo */}
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center gap-2 group"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                <span className="text-sm leading-none">⚡</span>
              </div>
              <span className="text-[15px] font-heading font-bold tracking-tight">
                Aptify
              </span>
            </Link>
          </div>

          {/* ── CENTER: desktop nav pills ── */}
          <div className="hidden lg:flex items-center bg-muted/50 border border-border/50 rounded-2xl px-2 py-1.5 gap-0.5">
            {isAuthenticated ? (
              authLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200
                    ${isActive(to)
                      ? "bg-background text-foreground shadow-sm border border-border/40"
                      : "text-foreground/50 hover:text-foreground hover:bg-background/60"
                    }`}
                >
                  {label}
                </Link>
              ))
            ) : (
              publicLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground hover:bg-background/60 transition-all duration-200"
                >
                  {label}
                </a>
              ))
            )}
          </div>

          {/* ── RIGHT: theme, streak, avatar / auth buttons ── */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Theme toggle — desktop */}
            <button
              onClick={toggleTheme}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl border border-border/60 bg-surface/60 hover:bg-muted text-sm transition"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Streak badge — always visible on mobile too */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-xl">
                  <span className="text-[13px] leading-none">🔥</span>
                  <span className="font-black text-[12px] text-accent">{streak}</span>
                </div>

                {/* Avatar + dropdown */}
                <div
                  className="relative flex-shrink-0 cursor-pointer"
                  ref={dropdownRef}
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className="w-8 h-8 rounded-xl border-2 border-primary/25 overflow-hidden bg-surface hover:border-primary/50 transition">
                    <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
                  </div>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-background border border-border/60 rounded-2xl shadow-2xl p-1.5 z-[110]"
                      >
                        {/* User name */}
                        <div className="px-3 py-2 mb-1">
                          <p className="text-[11px] font-black opacity-40 uppercase tracking-widest">Signed in as</p>
                          <p className="text-xs font-bold truncate mt-0.5">{user?.name || user?.email}</p>
                        </div>

                        <div className="h-px bg-border mx-1 mb-1" />

                        <button
                          onClick={() => { navigate("/profile"); setProfileOpen(false); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-primary/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                        >
                          <User size={13} className="text-primary" /> Profile
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2.5 hover:bg-rose-500/10 rounded-xl text-xs font-bold text-rose-500 flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={13} /> Log Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hidden sm:block text-[12px] font-bold opacity-60 hover:opacity-100 transition px-2">
                  Login
                </Link>
                <Link to="/signup">
                  <button className="btn-primary px-5 py-2 text-[11px] rounded-xl">Sign Up</button>
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