import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Alert = ({ msg, shut }) => {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="fixed top-6 left-1/2 z-[200] w-[90%] max-w-md"
        >
          <div className="glass-card !rounded-2xl border-l-4 border-l-rose-500 bg-surface/90 dark:bg-surface/80 shadow-2xl backdrop-blur-2xl p-4 flex items-center gap-4">
            {/* Animated Warning Icon */}
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
              <span className="text-rose-500 text-xl">⚠️</span>
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-0.5">
                Attention Required
              </h4>
              <p className="text-sm text-foreground/70 font-medium leading-tight truncate">
                {msg}
              </p>
            </div>

            {/* Close Button */}
            <button 
              onClick={shut}
              className="w-8 h-8 rounded-lg hover:bg-foreground/5 flex items-center justify-center transition-colors text-foreground/40 hover:text-foreground"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;