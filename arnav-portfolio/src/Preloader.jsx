import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import './Preloader.css';

const LOAD_DURATION = 7500;
const COMPLETION_HOLD = 400;

// --- MULTILINGUAL GREETING CYCLE (Windows OOBE style) ---
const greetings = ['Hi', 'Hello', 'Hola', 'Bonjour', 'नमस्ते', 'Ciao', 'こんにちは', 'مرحبا'];
const welcomeMessages = ['आपका स्वागत है', 'Welcome'];

const GreetingCycle = ({ isWelcome }) => {
  const [index, setIndex] = useState(0);
  const [welcomeIndex, setWelcomeIndex] = useState(0);

  useEffect(() => {
    if (isWelcome) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % greetings.length);
    }, 600);
    return () => clearInterval(interval);
  }, [isWelcome]);

  useEffect(() => {
    if (!isWelcome) return;
    const timeout = setTimeout(() => setWelcomeIndex(1), 1000);
    return () => clearTimeout(timeout);
  }, [isWelcome]);

  const currentText = isWelcome ? welcomeMessages[welcomeIndex] : greetings[index];

  return (
    <div className="flex flex-col items-center justify-center h-[120px] overflow-hidden px-4">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentText}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', exit: { duration: 0.1 } }}
          className="font-clash font-light text-[clamp(40px,8vw,80px)] text-[var(--black)] leading-none"
        >
          {currentText}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

// Keep the animation clock out of App: ticking progress must not rerender the portfolio.
export default function Preloader({ onComplete }) {
  const percentageRef = useRef(null);
  const progress = useMotionValue(0);
  const progressX = useTransform(progress, value => `${value}%`);
  const [isWelcome, setIsWelcome] = useState(false);

  useEffect(() => {
    document.body.classList.add('loading');
    const start = performance.now();
    let frame;
    let lastPercentage = -1;
    let welcomeShown = false;

    const tick = now => {
      const value = Math.min(((now - start) / LOAD_DURATION) * 100, 100);
      progress.set(value);
      const percentage = Math.floor(value);
      if (percentage !== lastPercentage && percentageRef.current) {
        percentageRef.current.textContent = String(percentage);
        lastPercentage = percentage;
      }
      if (value >= 75 && !welcomeShown) {
        welcomeShown = true;
        setIsWelcome(true);
      }
      if (value < 100) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    const finishTimer = setTimeout(() => {
      progress.set(100);
      if (percentageRef.current) percentageRef.current.textContent = '100';
      document.body.classList.remove('loading');
      onComplete(true);
    }, LOAD_DURATION + COMPLETION_HOLD);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(finishTimer);
      document.body.classList.remove('loading');
    };
  }, [onComplete, progress]);

  return (
    <motion.div
      data-preloader=""
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050505]"
      style={{ willChange: 'transform' }}
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{
        duration: 1.1,
        ease: [0.76, 0, 0.24, 1],
        delay: 0.15,
      }}
    >
      {/* Liquid curtain — manndamani-exact: wavy bottom edge dips ~150px below the
          viewport (control at +300px-equivalent) and flattens (1.7s, delay .3) while
          the whole overlay slides up (1.1s, delay .15). The overlay keeps its bg;
          the SVG's wave extends past the container box (overflow visible) so the page
          shows through the wave valleys. */}
      <motion.svg
        className="absolute left-0 top-0 w-full h-[118%] pointer-events-none"
        viewBox="0 0 100 118"
        preserveAspectRatio="none"
        style={{ zIndex: 5 }}
      >
        <motion.path
          fill="#050505"
          initial={{ d: "M0 0 H100 V100 Q50 133 0 100 Z" }}
          animate={{ d: "M0 0 H100 V100 Q50 133 0 100 Z" }}
          exit={{ d: "M0 0 H100 V100 Q50 100 0 100 Z" }}
          transition={{ duration: 1.7, ease: [0.76, 0, 0.24, 1], delay: 0.3 }}
        />
      </motion.svg>

      {/* Above the opaque curtain, below the greeting; no per-frame JS work. */}
      <motion.div className="preloader-atmosphere" aria-hidden="true"
        exit={{ opacity: 0 }} transition={{ duration: 0.35 }} />

      {/* Glow rises with the curtain, then fades as its edge reaches the top. */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px z-30 pointer-events-none"
        initial={{ opacity: 0 }}
        exit={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.1, delay: 0.15, times: [0, 0.45, 0.72, 1], ease: 'easeInOut' }}
        style={{ background: 'var(--red)', boxShadow: '0 0 15px 4px rgba(255,0,0,0.5), 0 0 30px 8px rgba(255,0,0,0.2)' }}
      />

      {/* PRELOADER CONTENT */}
      <motion.div
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center"
      >
        {/* Multilingual greeting — Windows OOBE style */}
        <GreetingCycle isWelcome={isWelcome} />
        <div aria-hidden="true" className="mt-3 h-px w-24 md:w-32 bg-white/25" />

        {/* Bottom: percentage + progress bar */}
        <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-16 md:right-16 flex flex-col items-end gap-4">
          <div className="font-clash font-light text-[clamp(60px,10vw,140px)] leading-none tabular-nums text-[var(--black)]">
            <span ref={percentageRef}>0</span><span className="text-[var(--red)] text-[0.4em]">%</span>
          </div>
          <div className="w-full h-[1px] bg-[var(--border)] relative">
            <motion.div
              className="absolute inset-0"
              style={{ x: progressX, willChange: 'transform' }}
            >
              <div className="absolute right-full top-1/2 -translate-y-1/2 h-[2px] w-[100px]" style={{ background: "linear-gradient(to right, transparent, var(--red))", boxShadow: '0 0 10px rgba(255,0,0,0.8)' }} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
