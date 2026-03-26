import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Elite 3D-style icons related to Aptitude/Quant
const FloatingObject = ({ children, delay = 0, xPos = "50%", yPos = "50%", duration = 20 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.2, 0.4, 0.2],
      y: [0, -40, 0],
      rotate: [0, 360],
      scale: 1 
    }}
    transition={{ 
      duration: duration, 
      repeat: Infinity, 
      delay: delay,
      ease: "linear" 
    }}
    style={{ left: xPos, top: yPos }}
    className="absolute pointer-events-none select-none text-primary/30 dark:text-primary/20 blur-[1px] md:blur-none"
  >
    {children}
  </motion.div>
);

export default function Background3D() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 25,
        y: (e.clientY / window.innerHeight - 0.5) * 25,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background transition-colors duration-500">
      
      {/* 1. Depth Grid Layer */}
      <motion.div 
        style={{ x: mousePos.x, y: mousePos.y }}
        className="absolute inset-[-10%] opacity-[0.1] dark:opacity-[0.15]"
      >
        <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]" />
      </motion.div>

      {/* 2. Project-Specific 3D Objects (Mathematical/Study Domain) */}
      <div className="absolute inset-0 overflow-hidden">
        
        {/* Floating Pencil (SVG 3D Style) */}
        <FloatingObject xPos="15%" yPos="20%" delay={0} duration={15}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="rotate-45">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </FloatingObject>

        {/* Floating Percentage (Quant Icon) */}
        <FloatingObject xPos="80%" yPos="15%" delay={2} duration={25}>
          <span className="text-6xl font-heading font-bold">%</span>
        </FloatingObject>

        {/* Floating Protractor / Geometry */}
        <FloatingObject xPos="75%" yPos="70%" delay={5} duration={18}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
            <path d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10H2z" />
            <path d="M12 12v10M12 12l4 4M12 12l-4 4" />
          </svg>
        </FloatingObject>

        {/* Square Root Symbol */}
        <FloatingObject xPos="10%" yPos="75%" delay={3} duration={22}>
           <span className="text-7xl font-light">√</span>
        </FloatingObject>

        {/* Pi Symbol */}
        <FloatingObject xPos="40%" yPos="85%" delay={7} duration={30}>
           <span className="text-5xl">π</span>
        </FloatingObject>

      </div>

      {/* 3. High-End Ambient Glows (Moving with Mouse Parallax) */}
      <motion.div 
        animate={{ x: mousePos.x * -1.5, y: mousePos.y * -1.5 }}
        className="absolute top-[20%] left-[20%] w-[35vw] h-[35vw] bg-primary/10 blur-[130px] rounded-full"
      />
      <motion.div 
        animate={{ x: mousePos.x * 2, y: mousePos.y * 2 }}
        className="absolute bottom-[20%] right-[15%] w-[30vw] h-[30vw] bg-secondary/10 blur-[110px] rounded-full"
      />
    </div>
  );
}