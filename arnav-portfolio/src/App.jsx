import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import DinoGame from './DinoGame';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useVelocity, useScroll, useMotionValueEvent } from 'framer-motion';

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Poppins:wght@600&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,300,400,500,600,700&display=swap');

  /* Supertalls font is defined in index.html to avoid re-parse on re-renders */

  :root {
    --bg: #0A0A0A;          
    --black: #F5F0E8;       
    --red: #FF0000;         
    --red-soft: rgba(255,0,0,0.08);
    --muted: #888888;       
    --border: rgba(255,255,255,0.12); 
    --white: #1A1A1A;       
  }

  /* Aggressively hide all scrollbars globally */
  ::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  
  * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  body {
    background-color: var(--bg);
    color: var(--black);
    font-family: 'Clash Grotesk', sans-serif;
    overflow-x: hidden;
    overflow-y: auto;
    margin: 0;
    padding: 0;
  }

  body.loading {
    overflow: hidden;
  }

  * { cursor: none !important; }

  /* Target and completely hide the Unicorn Studio watermark/badge */
  a[href*="unicorn.studio"], 
  div:has(> a[href*="unicorn.studio"]),
  div[style*="z-index: 2147483647"],
  div[class*="unicorn"],
  .unicorn-badge,
  #__us_badge {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
  }

  .font-bebas { font-family: 'Bebas Neue', sans-serif; }
  .font-caveat { font-family: 'Caveat', cursive; }
  .font-dancing { font-family: 'Dancing Script', cursive; }
  .font-clash { font-family: 'Clash Grotesk', sans-serif; }
  
  /* New Supertalls Utility Class */
  .font-supertalls { font-family: 'Supertalls'; }

  /* Pure White Text */
  .cinematic-text {
    font-family: 'Supertalls';
    color: #FFFFFF;
    letter-spacing: 0.02em;
  }
  
  /* Unlit Dark Base Text */
  .base-cinematic-text {
    font-family: 'Supertalls';
    color: rgba(255, 255, 255, 0.15); 
    letter-spacing: 0.02em;
  }

  @keyframes scan {
    0% { top: 0%; opacity: 0; }
    10% { opacity: 0.5; }
    90% { opacity: 0.5; }
    100% { top: 100%; opacity: 0; }
  }

  @keyframes grain {
    0%, 100% { transform: translate(0, 0); }
    10% { transform: translate(-5%, -10%); }
    30% { transform: translate(3%, -15%); }
    50% { transform: translate(12%, 9%); }
    70% { transform: translate(9%, 4%); }
    90% { transform: translate(-1%, 7%); }
  }

  .noise-overlay::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    background-repeat: repeat;
    pointer-events: none;
    z-index: 9000;
    opacity: 0.3;
    will-change: auto;
  }

  /* Perf: skip rendering sections that are off-screen (page is ~15k px tall).
     IntersectionObserver + whileInView still fire, so scroll animations are unaffected. */
  section {
    content-visibility: auto;
    contain-intrinsic-size: auto 900px;
  }

  @keyframes spin-forward { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes spin-backward { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
`;

// Global contexts
const CursorContext = React.createContext({ cursorX: null, cursorY: null });

// --- SOUND ENGINE (File-based) ---
const SFX = (() => {
  const cache = {};
  const play = (src, volume = 0.3) => {
    try {
      if (!cache[src]) cache[src] = new Audio(src);
      const audio = cache[src].cloneNode();
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch {}
  };
  return {
    hover: () => play('/assets/sounds/hover.mp3', 0.15),
    click: () => play('/assets/sounds/click.mp3', 0.2),
    scroll: () => play('/assets/sounds/scroll.mp3', 0.08),
    spaceEnter: () => play('/assets/sounds/boot.mp3', 0.3),
  };
})();

// --- PHYSICS ENGINES ---
const MagneticRepulsion = ({ children, repulsionForce = 40, radius = 200, className = "" }) => {
  const { cursorX, cursorY } = useContext(CursorContext);
  const triggerRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const visibleRef = useRef(false);

  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.2 });

  useEffect(() => {
    let animationFrameId;
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) animationFrameId = requestAnimationFrame(checkDistance);
    }, { rootMargin: '100px' });
    observer.observe(el);

    const checkDistance = () => {
      if (!visibleRef.current || !cursorX || !cursorY) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = cursorX.get() - centerX;
      const distanceY = cursorY.get() - centerY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      if (distance < radius) {
        const force = (radius - distance) / radius;
        x.set(-(distanceX / distance) * force * repulsionForce);
        y.set(-(distanceY / distance) * force * repulsionForce);
      } else {
        x.set(0); y.set(0);
      }
      animationFrameId = requestAnimationFrame(checkDistance);
    };
    return () => { cancelAnimationFrame(animationFrameId); observer.disconnect(); };
  }, [cursorX, cursorY, radius, repulsionForce, x, y]);

  return (
    <div ref={triggerRef} className={`inline-block relative ${className}`}>
      <motion.div style={{ x: springX, y: springY }} className="inline-block w-full h-full pointer-events-auto origin-center">
        {children}
      </motion.div>
    </div>
  );
};

const MagneticAttraction = ({ children, force = 0.2, radius = 300, className = "" }) => {
  const { cursorX, cursorY } = useContext(CursorContext);
  const triggerRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const visibleRef = useRef(false);

  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.2 });

  useEffect(() => {
    let animationFrameId;
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) animationFrameId = requestAnimationFrame(checkDistance);
    }, { rootMargin: '100px' });
    observer.observe(el);

    const checkDistance = () => {
      if (!visibleRef.current || !cursorX || !cursorY) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = cursorX.get() - centerX;
      const distanceY = cursorY.get() - centerY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      if (distance < radius) {
        const pull = (radius - distance) / radius;
        x.set(distanceX * pull * force);
        y.set(distanceY * pull * force);
      } else {
        x.set(0); y.set(0);
      }
      animationFrameId = requestAnimationFrame(checkDistance);
    };
    return () => { cancelAnimationFrame(animationFrameId); observer.disconnect(); };
  }, [cursorX, cursorY, radius, force, x, y]);

  return (
    <div ref={triggerRef} className={`inline-block relative ${className}`}>
      <motion.div style={{ x: springX, y: springY }} className="inline-block w-full h-full origin-center">
        {children}
      </motion.div>
    </div>
  );
};

const ParticleFlyer = ({ children, className, style, delay = 0 }) => (
  <motion.div
    className={className} style={{ ...style, willChange: 'transform, opacity' }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {children}
  </motion.div>
);

const ParticleTextSwap = ({ text }) => (
  <span className="relative inline-flex items-center justify-center whitespace-nowrap">
    <AnimatePresence mode="wait">
      <motion.span
        key={text}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="inline-block relative z-20"
      >
        {text}
      </motion.span>
    </AnimatePresence>
  </span>
);

const ScrambleText = ({ children, delay = 0 }) => {
  const [text, setText] = useState(children.replace(/./g, '_'));
  useEffect(() => {
    let iterations = 0;
    let interval;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+";
    const startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        setText(children.split("").map((letter, index) => {
          if (index < iterations) return children[index];
          return letters[Math.floor(Math.random() * letters.length)];
        }).join(""));
        if (iterations >= children.length) clearInterval(interval);
        iterations += 1;
      }, 25);
    }, delay * 1000);
    return () => { clearTimeout(startTimeout); clearInterval(interval); };
  }, [children, delay]);
  return <span className="text-[var(--black)] font-bold">{text}</span>;
};

// --- MULTILINGUAL GREETING CYCLE (Windows OOBE style) ---
const greetings = ['Hi', 'Hello', 'Hola', 'Bonjour', 'नमस्ते', 'Ciao', 'こんにちは', 'مرحبا'];
const welcomeMessages = ['आपका स्वागत है', 'Welcome'];

const GreetingCycle = ({ progress }) => {
  const [index, setIndex] = useState(0);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const isWelcome = progress >= 95;

  useEffect(() => {
    if (isWelcome) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % greetings.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isWelcome]);

  useEffect(() => {
    if (!isWelcome) return;
    setWelcomeIndex(0);
    const timeout = setTimeout(() => setWelcomeIndex(1), 1500);
    return () => clearTimeout(timeout);
  }, [isWelcome]);

  const currentText = isWelcome ? welcomeMessages[welcomeIndex] : greetings[index];

  return (
    <div className="flex flex-col items-center justify-center h-[100px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentText}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -8 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="font-clash font-bold text-[clamp(40px,8vw,80px)] text-[var(--black)] leading-none"
        >
          {currentText}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

// --- RUNNING TIMECODE ---
const Timecode = () => {
  const spanRef = useRef(null);
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame = (frame + 1) % 30;
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      const ff = String(frame).padStart(2, '0');
      if (spanRef.current) spanRef.current.textContent = `${hh}:${mm}:${ss}:${ff}`;
    }, 1000 / 10);
    return () => clearInterval(interval);
  }, []);
  return <span ref={spanRef} className="text-[var(--red)]" />;
};

// --- EDITING UI ELEMENTS ---
const CutMarker = ({ label = "CUT" }) => (
  <div className="w-full flex items-center gap-3 py-6 px-4 md:px-8 select-none">
    <div className="flex items-center gap-2">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
      <span className="font-clash text-[8px] tracking-[0.3em] text-[var(--red)] uppercase">{label}</span>
    </div>
    <div className="flex-1 h-px bg-[var(--border)] relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-[var(--red)]" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-[var(--red)]" />
    </div>
    <span className="font-clash text-[8px] tracking-widest text-[var(--muted)]"><Timecode /></span>
  </div>
);

const WaveformDivider = () => {
  const bars = 60;
  return (
    <div className="w-full flex items-center justify-center gap-[2px] py-4 px-4 opacity-30">
      {Array.from({ length: bars }).map((_, i) => {
        const h = Math.abs(Math.sin((i / bars) * Math.PI * 3)) * 16 + 2;
        return <div key={i} className="w-[2px] bg-[var(--red)]" style={{ height: `${h}px` }} />;
      })}
    </div>
  );
};

const RenderBar = ({ label = "RENDERING SEQUENCE" }) => (
  <div className="w-full px-4 md:px-8 py-4 flex items-center gap-4 select-none">
    <span className="font-clash text-[8px] tracking-widest text-[var(--muted)] uppercase whitespace-nowrap">{label}</span>
    <div className="flex-1 h-1 bg-[var(--border)] relative overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 bg-[var(--red)]"
        initial={{ width: '0%' }}
        whileInView={{ width: '100%' }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: 'linear' }}
      />
    </div>
    <span className="font-clash text-[8px] tracking-widest text-[var(--muted)]">100%</span>
  </div>
);

// --- DYNAMIC HUD COORDINATES ---
const TrackedCoordinates = () => {
  const { cursorX, cursorY } = useContext(CursorContext);
  const spanRef = useRef(null);

  // Update on mousemove only (rAF-throttled, direct DOM write — no React re-renders, no rAF poll)
  useEffect(() => {
    let raf = 0;
    const onMove = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (spanRef.current && cursorX && cursorY) {
          spanRef.current.textContent = `X ${Math.floor(cursorX.get())} Y ${Math.floor(cursorY.get())}`;
        }
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => { window.removeEventListener('mousemove', onMove); if (raf) cancelAnimationFrame(raf); };
  }, [cursorX, cursorY]);

  const springX = useSpring(cursorX, { damping: 40, stiffness: 300, mass: 0.5 });
  const springY = useSpring(cursorY, { damping: 40, stiffness: 300, mass: 0.5 });

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[99999] flex items-center gap-1.5 font-clash text-[8px] md:text-[9px] text-[var(--red)] tracking-widest mix-blend-difference"
      style={{ x: springX, y: springY, translateX: '24px', translateY: '24px' }}
    >
      <div className="w-1.5 h-1.5 bg-[var(--red)]" />
      <span ref={spanRef}>X 0 Y 0</span>
    </motion.div>
  );
};


const WorksBackground = ({ active }) => {
  return (
    <motion.div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-[#030303]" />
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
    </motion.div>
  );
};

const GalaxyIcon = ({ label, children }) => {
  return (
    <div className="relative group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-none bg-[#1A1A1A] border-2 border-[var(--border)] text-[var(--red)] transition-all duration-300 cursor-none hover:border-[var(--red)]/50 hover:scale-110">
      {children}
      {/* Sleek Tooltip that slides up on hover */}
      <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 font-clash text-[10px] md:text-[11px] font-bold tracking-widest text-[var(--black)] bg-[#111] border border-[var(--border)] px-4 py-2 rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-2xl translate-y-2 group-hover:translate-y-0">
        {label}
      </div>
    </div>
  );
};

const OrbitalRing = ({ radius, duration, reverse, items }) => {
  // Pure-CSS orbit: each item rides a rotating wrapper (compositor-driven,
  // zero main-thread cost) and counter-rotates on itself to stay upright.
  const spin = reverse ? 'spin-backward' : 'spin-forward';
  const counterSpin = reverse ? 'spin-forward' : 'spin-backward';

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: radius * 2, height: radius * 2 }}>
      <div className="absolute inset-0 rounded-full border border-dashed border-[var(--border)] opacity-70 pointer-events-none" />
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{ width: 0, height: 0, animation: `${spin} ${duration}s linear infinite`, animationDelay: `${-((i / items.length) * duration)}s` }}
        >
          {/* spacer: carries the translate to the ring point (no animation, so its transform survives) */}
          <div
            className="absolute pointer-events-auto"
            style={{ transform: `translateX(${radius}px) translate(-50%, -50%)` }}
          >
            {/* counter-rotator: keeps the icon upright (its own animation only affects itself) */}
            <div
              className="flex justify-center items-center"
              style={{ animation: `${counterSpin} ${duration}s linear infinite`, animationDelay: `${-((i / items.length) * duration)}s` }}
            >
              <GalaxyIcon label={item.label}>
                {item.icon}
              </GalaxyIcon>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const KeyframeTransition = () => {
  const [litIndex, setLitIndex] = useState(-1);
  const containerRef = useRef(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          let i = 0;
          const interval = setInterval(() => {
            setLitIndex(i);
            i++;
            if (i >= 5) {
              clearInterval(interval);
              setTimeout(() => {
                setLitIndex(-1);
                hasPlayed.current = false;
              }, 600);
            }
          }, 200);
        }
      },
      { threshold: 0.2 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const shapes = [
    <svg key="diamond" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2 L22 12 L12 22 L2 12 Z"/><path d="M12 6 L18 12 L12 18 L6 12 Z" fill="currentColor" opacity="0.4"/></svg>,
    <svg key="arrow-r" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4 L14 12 L4 20 Z M10 4 L20 12 L10 20 Z"/><path d="M10 7 L17 12 L10 17 Z" fill="currentColor" opacity="0.4"/></svg>,
    <svg key="hourglass" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 L18 2 L12 12 L18 22 L6 22 L12 12 Z"/><path d="M9 5 L15 5 L12 12 L15 19 L9 19 L12 12 Z" fill="currentColor" opacity="0.3"/></svg>,
    <svg key="arrow-l" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 4 L10 12 L20 20 Z M14 4 L4 12 L14 20 Z"/><path d="M14 7 L7 12 L14 17 Z" fill="currentColor" opacity="0.4"/></svg>,
    <svg key="half" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2 A10 10 0 0 1 12 22 Z" fill="currentColor" opacity="0.4"/></svg>,
  ];

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center gap-6 md:gap-10 py-12 overflow-hidden">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="transition-all duration-300"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: i * 0.1, duration: 0.6, type: "spring", stiffness: 200, damping: 15 }}
          style={{
            color: litIndex >= i ? 'var(--red)' : 'var(--border)',
            filter: litIndex === i ? 'drop-shadow(0 0 12px rgba(255,0,0,0.9))' : 'none',
          }}
        >
          {shape}
        </motion.div>
      ))}
    </div>
  );
};

const SpotlightCard = ({ children, className = "" }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  return (
    <div ref={divRef} onMouseMove={handleMouseMove} onMouseEnter={() => setOpacity(1)} onMouseLeave={() => setOpacity(0)} className={`relative rounded-3xl md:rounded-[2rem] bg-[var(--border)] overflow-hidden cursor-none shadow-xl ${className}`}>
      <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none z-0 rounded-[inherit]" style={{ opacity, background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.6), transparent 40%)` }} />
      <div className="absolute inset-[1px] rounded-[inherit] bg-[#0A0A0A]/95 backdrop-blur-md pointer-events-none z-0" />
      <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none z-10 rounded-[inherit]" style={{ opacity, background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)` }} />
      <div className="relative z-20 w-full h-full">{children}</div>
    </div>
  );
};

const CaseStudyModal = ({ item, onClose, onNext, onPrev }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onNext, onPrev]);

  if (!item) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* Nav arrows */}
      <button onClick={onPrev} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-10 h-10 flex items-center justify-center border border-[var(--border)] hover:border-[var(--red)] transition-colors cursor-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button onClick={onNext} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-10 h-10 flex items-center justify-center border border-[var(--border)] hover:border-[var(--red)] transition-colors cursor-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Content */}
      <motion.div
        className="relative z-40 w-[92vw] max-w-[1200px] h-[85vh] flex flex-col md:flex-row gap-0 overflow-hidden"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Left panel — Metadata */}
        <div className="w-full md:w-[320px] flex-shrink-0 bg-[#0A0A0A] border border-[var(--border)] p-8 flex flex-col overflow-y-auto">
          <div className="font-clash text-[var(--red)] text-xs tracking-widest uppercase mb-8">METADATA</div>

          <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-center font-clash text-sm">
              <span className="text-[var(--muted)] tracking-wider">YEAR</span>
              <span className="text-[var(--black)] font-bold">{item.year}</span>
            </div>
            <div className="w-full h-px bg-[var(--border)]" />
            <div className="flex justify-between items-center font-clash text-sm">
              <span className="text-[var(--muted)] tracking-wider">CONTEXT</span>
              <span className="text-[var(--black)] font-bold">{item.context}</span>
            </div>
            <div className="w-full h-px bg-[var(--border)]" />
            <div className="flex justify-between items-center font-clash text-sm">
              <span className="text-[var(--muted)] tracking-wider">CLIENT</span>
              <span className="text-[var(--black)] font-bold">{item.client}</span>
            </div>
            <div className="w-full h-px bg-[var(--border)]" />
            <div className="flex justify-between items-center font-clash text-sm">
              <span className="text-[var(--muted)] tracking-wider">TIME</span>
              <span className="text-[var(--black)] font-bold">{item.time}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <span className="font-clash text-[var(--muted)] text-xs tracking-wider">TAGS:</span>
            <div className="flex flex-wrap gap-2 mt-3">
              {item.tags.map((tag, i) => (
                <span key={i} className="font-clash text-[11px] px-4 py-2 border border-[var(--border)] text-[var(--black)] hover:border-[var(--red)] transition-colors">{tag}</span>
              ))}
            </div>
          </div>

          {/* Stacks */}
          <div className="mb-8">
            <span className="font-clash text-[var(--muted)] text-xs tracking-wider">STACKS:</span>
            <div className="flex flex-wrap gap-2 mt-3">
              {item.stacks.map((stack, i) => (
                <span key={i} className="font-clash text-[11px] px-4 py-2 border border-[var(--border)] text-[var(--black)] hover:border-[var(--red)] transition-colors">{stack}</span>
              ))}
            </div>
          </div>

          {/* Access button */}
          <a href={item.link} target="_blank" rel="noreferrer" className="mt-auto font-clash text-xs tracking-widest text-center py-3 border border-[var(--border)] hover:border-[var(--red)] hover:text-[var(--red)] transition-all cursor-none uppercase">
            ACCESS PROJECT
          </a>
        </div>

        {/* Right panel — Visuals & Description */}
        <div className="flex-1 bg-[#0D0D0D] border border-[var(--border)] border-l-0 p-8 overflow-y-auto flex flex-col gap-8">
          {/* Main screenshot with red corner brackets */}
          <div className="relative w-full aspect-video">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[var(--red)]" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[var(--red)]" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[var(--red)]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[var(--red)]" />
            <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
          </div>

          {/* Technical analysis */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[var(--red)] font-bold">&gt;&gt;</span>
              <span className="font-clash text-[var(--red)] text-sm tracking-widest uppercase">TECHNICAL_ANALYSIS</span>
            </div>
            <p className="font-clash text-sm md:text-base leading-relaxed text-[var(--black)]">
              {item.desc}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MagneticVideoCard = () => {
  const { cursorX, cursorY } = useContext(CursorContext);
  const cardRef = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawScale = useMotionValue(1);
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 25, mass: 1 };
  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);
  const scale = useSpring(rawScale, springConfig);
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let animationFrameId;
    const visibleRef = { current: false };
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) animationFrameId = requestAnimationFrame(updatePhysics);
    }, { rootMargin: '100px' });
    observer.observe(el);

    const updatePhysics = () => {
      if (!visibleRef.current || !cursorX || !cursorY) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const cX = cursorX.get();
      const cY = cursorY.get();
      const distX = cX - centerX;
      const distY = cY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      const isInside = Math.abs(distX) < rect.width / 2 && Math.abs(distY) < rect.height / 2;

      if (isInside) {
        setIsHovered(true);
        setSpotlightPos({ x: cX - rect.left, y: cY - rect.top });
        rawScale.set(1.08);
        rawX.set(0); rawY.set(0);
        rawRotateX.set((distY / (rect.height/2)) * 15);
        rawRotateY.set(-(distX / (rect.width/2)) * 15);
        el.style.zIndex = 30;
      } else {
        setIsHovered(false);
        const pushRadius = rect.width * 1.6;
        if (distance < pushRadius) {
          const force = (pushRadius - distance) / pushRadius;
          const easeForce = Math.pow(force, 1.5);
          rawScale.set(1);
          rawX.set(-(distX / distance) * easeForce * 35);
          rawY.set(-(distY / distance) * easeForce * 35);
          rawRotateX.set(0); rawRotateY.set(0);
          el.style.zIndex = 10;
        } else {
          rawScale.set(1); rawX.set(0); rawY.set(0); rawRotateX.set(0); rawRotateY.set(0);
          el.style.zIndex = 1;
        }
      }
      animationFrameId = requestAnimationFrame(updatePhysics);
    };
    return () => { cancelAnimationFrame(animationFrameId); observer.disconnect(); };
  }, [cursorX, cursorY, rawX, rawY, rawScale, rawRotateX, rawRotateY]);

  return (
    <div style={{ perspective: 1200 }} className="w-full aspect-[9/16] relative z-1">
      <motion.div ref={cardRef} style={{ x, y, scale, rotateX, rotateY, WebkitMaskImage: '-webkit-radial-gradient(white, black)', maskImage: 'radial-gradient(white, black)' }} className={`w-full h-full rounded-3xl md:rounded-[2rem] bg-[var(--border)] relative group overflow-hidden shadow-xl cursor-none flex items-center justify-center origin-center`}>
        <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none z-0 rounded-[inherit]" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(400px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(255,0,0,0.8), transparent 40%)` }} />
        <div className="absolute inset-[1px] rounded-[inherit] bg-[var(--bg)]/95 backdrop-blur-md pointer-events-none z-0" />
        <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none z-10 rounded-[inherit]" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(600px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(255,255,255,0.08), transparent 40%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none z-10 rounded-[inherit]" />
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[var(--red)] flex items-center justify-center pl-1 scale-90 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] transition-all duration-300 z-20 cursor-none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--bg)"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </motion.div>
    </div>
  );
};


// ================= CAREER TIMELINE SECTION =================

const careerData = [
  { year: 'JAN 2025 — PRESENT', role: 'Senior Video Editor', company: 'Visible Gain', desc: 'Creative advertising agency in Noida. Delivering impactful brand stories through model shoots, graphic design, video production, and digital campaigns.', details: ['End-to-end video production for brand campaigns', 'Model shoot direction & post-production', 'Graphic design & digital campaign delivery', 'Location: Noida Sector-63'] },
  { year: 'AUG 2024 — JAN 2025', role: 'Graphic Designer & Video Editor', company: 'Promotion4u', desc: 'Leading digital marketing agency in Meerut with 5+ years of experience excelling in digital media, serving 100+ clients across diversified niches.', details: ['Served 100+ clients across multiple industries', 'Created designs for digital, print, and motion media', 'Worked across diversified niches & industries', 'Location: Meerut (250001)'] },
  { year: '2022 — PRESENT', role: 'Freelance Creative', company: 'Self-Employed', desc: 'Working with a wide range of clients and well-known influencers across India and internationally. Delivering creative design solutions tailored for digital, print, and motion media.', details: ['Clients & influencers across India and internationally', 'Digital, print, and motion media solutions', 'Brand identity & social media content', 'Tools: Premiere Pro, After Effects, Photoshop, Illustrator, AI Tools'] },
];

const CareerCard = ({ item, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`flex-shrink-0 relative cursor-none transition-all duration-500 ease-out ${isHovered ? 'w-[360px] md:w-[450px]' : 'w-[250px] md:w-[300px]'}`}
      style={{ height: '70vh', minHeight: '500px', maxHeight: '650px' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card body */}
      <div className="w-full h-full relative overflow-hidden bg-[#0D0D0D] border border-[var(--border)] hover:border-[var(--red)]/50 transition-all duration-500 group">

        {/* Corner brackets */}
        <div className={`absolute top-3 left-3 w-4 h-4 border-t border-l transition-all duration-300 ${isHovered ? 'border-[var(--red)]' : 'border-transparent'}`} />
        <div className={`absolute top-3 right-3 w-4 h-4 border-t border-r transition-all duration-300 ${isHovered ? 'border-[var(--red)]' : 'border-transparent'}`} />
        <div className={`absolute bottom-3 left-3 w-4 h-4 border-b border-l transition-all duration-300 ${isHovered ? 'border-[var(--red)]' : 'border-transparent'}`} />
        <div className={`absolute bottom-3 right-3 w-4 h-4 border-b border-r transition-all duration-300 ${isHovered ? 'border-[var(--red)]' : 'border-transparent'}`} />

        {/* Red dots top */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
          <div className="w-1 h-1 rounded-full bg-[var(--red)]" />
          <div className="w-1 h-1 rounded-full bg-[var(--red)]" />
          <div className="w-1 h-1 rounded-full bg-[var(--red)]" />
        </div>

        {/* Vertical label on the side */}
        <div className="absolute top-1/2 -translate-y-1/2 right-2 writing-mode-vertical font-clash text-[8px] tracking-widest text-[var(--red)] uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
          {item.company}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Red accent line */}
          <div className={`h-[2px] bg-[var(--red)] mb-4 transition-all duration-500 ${isHovered ? 'w-full' : 'w-0'}`} />

          <div className="font-clash text-[9px] tracking-widest uppercase mb-2 text-[var(--red)]">
            {item.year}
          </div>
          <h3 className="font-clash font-bold text-lg md:text-xl text-[var(--black)] leading-tight mb-2">
            {item.role}
          </h3>

          {/* Expandable details on hover */}
          <div className={`transition-all duration-500 ease-out overflow-hidden ${isHovered ? 'max-h-[200px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}`}>
            <p className="font-clash text-[11px] leading-relaxed text-[var(--muted)] mb-3">{item.desc}</p>
            <div className="font-clash text-[9px] tracking-widest text-[var(--muted)] uppercase">
              [ VIEW DETAILS ]
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CountUp = ({ target, suffix = '', duration = 2, delay = 0 }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const delayMs = delay * 1000;
    let animId;
    const animate = (now) => {
      const elapsed = now - start - delayMs;
      if (elapsed < 0) { animId = requestAnimationFrame(animate); return; }
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [started, target, duration, delay]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const ExperienceStrip = () => {
  const stats = [
    { number: 3, suffix: '+', label: 'YEARS EXPERIENCE' },
    { number: 20, suffix: '+', label: 'CLIENTS SERVED' },
    { number: 50, suffix: '+', label: 'PROJECTS SHIPPED' },
  ];

  return (
    <section className="relative w-full z-10 overflow-hidden py-2">
      <div className="grid grid-cols-3 w-full">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="relative flex flex-col items-center justify-center py-12 md:py-16 bg-[var(--red)] overflow-hidden"
            initial={{ rotateX: -90, opacity: 0, transformOrigin: i === 0 ? 'top' : i === 2 ? 'bottom' : 'center' }}
            whileInView={{ rotateX: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: '800px' }}
          >
            <span className="font-clash font-bold text-[clamp(36px,6vw,72px)] leading-none text-[var(--bg)]">
              <CountUp target={stat.number} suffix={stat.suffix} duration={2} delay={i * 0.15 + 0.4} />
            </span>
            <span className="font-clash text-[8px] md:text-[10px] tracking-[0.2em] text-[var(--bg)] opacity-70 mt-3">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const CareerTimeline = () => {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      const atStart = container.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = container.scrollLeft >= maxScroll - 1 && e.deltaY > 0;

      if (atStart || atEnd) return;

      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <section className="relative w-full z-10 py-32 overflow-hidden">
      <div className="w-full max-w-[90rem] mx-auto relative z-10 px-4 md:px-8">

        {/* Header */}
        <ParticleFlyer delay={0.1} className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-6 gap-6">
            <motion.h2 className="font-supertalls text-[clamp(40px,8vw,80px)] leading-none text-[var(--black)] block m-0">
              CAREER
            </motion.h2>
            <div className="text-right font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col gap-1">
              <span>TIMELINE: <span className="text-[var(--red)]">ACTIVE</span></span>
              <span>ENTRIES_LOGGED: <span className="text-[var(--red)]">03</span></span>
            </div>
          </div>
        </ParticleFlyer>
      </div>

      {/* Horizontal scrolling cards */}
      <div className="relative w-full">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-6 justify-center flex-wrap px-4 md:px-8 pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {careerData.map((item, i) => (
            <CareerCard key={i} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom metadata */}
      <div className="mt-12 flex justify-center px-4">
        <span className="font-clash text-[8px] tracking-widest text-[var(--muted)] uppercase">// END_CAREER_LOG — ENTRIES: 03 — STATUS: ONGOING</span>
      </div>
    </section>
  );
};


// ================= TOOLKIT SECTION =================

const toolkitData = [
  { name: 'Premiere Pro', icon: 'Pr', color: '#9999FF', category: 'EDIT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Adobe_Premiere_Pro_CC_2026_icon.svg/1280px-Adobe_Premiere_Pro_CC_2026_icon.svg.png', video: '/assets/videos/videoplayback.mp4' },
  { name: 'After Effects', icon: 'Ae', color: '#9999FF', category: 'MOTION', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Adobe_After_Effects_CC_2026_icon.svg/1280px-Adobe_After_Effects_CC_2026_icon.svg.png', video: '/assets/videos/ae.mp4' },
  { name: 'Photoshop', icon: 'Ps', color: '#31A8FF', category: 'DESIGN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Adobe_Photoshop_CC_2026_icon.svg/1280px-Adobe_Photoshop_CC_2026_icon.svg.png', video: '/assets/videos/phsp.mp4' },
  { name: 'Illustrator', icon: 'Ai', color: '#FF9A00', category: 'DESIGN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Adobe_Illustrator_CC_icon.svg/960px-Adobe_Illustrator_CC_icon.svg.png', video: '/assets/videos/ai.mp4' },
  { name: 'Blender', icon: 'Bl', color: '#F5792A', category: '3D', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Blender_logo_no_text.svg/960px-Blender_logo_no_text.svg.png', video: '/assets/videos/blendee.mp4' },
  { name: 'Lightroom', icon: 'Lr', color: '#31A8FF', category: 'PHOTO' },
  { name: 'Kling', icon: 'Kl', color: '#00D4AA', category: 'AI', logo: 'https://www.freelogovectors.net/wp-content/uploads/2026/03/kling-ai-logo-icon_freelogovectors.net_.png', video: '/assets/videos/kling.mp4' },
  { name: 'Higgsfield', icon: 'Hf', color: '#FF3366', category: 'AI', logo: 'https://cdn.iconscout.com/icon/free/png-256/free-higgsfield-icon-svg-download-png-14426782.png?f=webp' },
];

const ToolkitSection = () => {
  return (
    <section className="relative w-full py-32 px-4 md:px-8 z-10 overflow-hidden">
      <div className="w-full max-w-[90rem] mx-auto relative z-10">

        {/* Header */}
        <ParticleFlyer delay={0.1} className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-6 gap-6">
            <motion.h2 className="font-supertalls text-[clamp(40px,8vw,80px)] leading-none text-[var(--black)] block m-0">
              MY TOOLKIT
            </motion.h2>
            <div className="text-right font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col gap-1">
              <span>ARSENAL: <span className="text-[var(--red)]">LOADED</span></span>
              <span>SOFTWARE_COUNT: <span className="text-[var(--red)]">{toolkitData.length}</span></span>
            </div>
          </div>
        </ParticleFlyer>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 w-full">
          {toolkitData.map((tool, i) => (
            <motion.div
              key={tool.name}
              className="relative flex flex-col items-center justify-center py-10 md:py-14 border border-dashed border-[var(--border)] cursor-none group hover:bg-white/[0.02] transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              {/* Logo / Icon */}
              <div className="mb-4 h-10 flex items-center justify-center">
                {tool.logo ? (
                  <img src={tool.logo} alt={tool.name} className="w-9 h-9 object-contain group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <span className="font-clash font-bold text-2xl" style={{ color: tool.color }}>{tool.icon}</span>
                )}
              </div>
              {/* Name */}
              <span className="font-clash font-bold text-sm md:text-base text-[var(--black)] group-hover:text-[var(--red)] transition-colors duration-300">
                {tool.name}
              </span>
              {/* Category */}
              <span className="font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] mt-1">
                {tool.category}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom metadata */}
        <div className="mt-16 flex justify-center">
          <span className="font-clash text-[8px] tracking-widest text-[var(--muted)] uppercase">// SYSTEM_ARSENAL — ALL TOOLS OPERATIONAL</span>
        </div>
      </div>
    </section>
  );
};


// ================= PREMIERE PRO TIMELINE (BACKGROUND) =================

const PremiereTimeline = () => {
  const tracks = [
    { label: 'V4', color: '#9b59b6', clips: [{ start: 5, width: 15, name: 'GLITCH.mogrt' }, { start: 48, width: 20, name: 'TRANS_03' }, { start: 75, width: 18, name: 'TITLE.mogrt' }] },
    { label: 'V3', color: '#e74c3c', clips: [{ start: 0, width: 30, name: 'HERO_COMP.mp4' }, { start: 35, width: 25, name: 'REEL_CUT_02' }, { start: 65, width: 30, name: 'OUTRO.mogrt' }] },
    { label: 'V2', color: '#FF0000', clips: [{ start: 2, width: 42, name: 'SHOWREEL_v3.mp4' }, { start: 50, width: 45, name: 'CONTACT_ANIM.aep' }] },
    { label: 'V1', color: '#2ecc71', clips: [{ start: 0, width: 95, name: 'BASE_EDIT_FINAL.mp4' }] },
    { label: 'A1', color: '#3498db', clips: [{ start: 0, width: 55, name: 'VO_MASTER.wav' }, { start: 60, width: 35, name: 'VO_OUTRO.wav' }] },
    { label: 'A2', color: '#e67e22', clips: [{ start: 2, width: 92, name: 'SCORE_ATMOSPHERIC.mp3' }] },
    { label: 'A3', color: '#1abc9c', clips: [{ start: 10, width: 20, name: 'SFX_WHOOSH.wav' }, { start: 40, width: 12, name: 'SFX_HIT.wav' }, { start: 62, width: 15, name: 'SFX_RISE.wav' }, { start: 82, width: 10, name: 'SFX_END.wav' }] },
  ];

  const timeMarkers = ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25', '00:30', '00:35', '00:40', '00:45', '00:50', '00:55', '01:00'];

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden opacity-[0.12]"
      style={{ transform: 'rotate(-8deg) scale(1.4)', transformOrigin: 'center center' }}
    >
      <div className="w-full h-full flex flex-col justify-center px-4">
        {/* Timeline ruler */}
        <div className="flex items-end mb-1 ml-[40px]">
          {timeMarkers.map((t, i) => (
            <div key={i} className="flex-1 flex flex-col items-start">
              <span className="font-clash text-[8px] text-white mb-1">{t}</span>
              <div className="w-[1px] h-2 bg-white/40" />
            </div>
          ))}
        </div>
        <div className="h-[1px] bg-white/30 ml-[40px] mb-2" />

        {/* Playhead */}
        <div className="relative ml-[40px] mb-1">
          <motion.div
            className="absolute top-0 z-20"
            animate={{ left: ['0%', '95%'] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          >
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-[var(--red)] rotate-45 -mb-0.5" />
              <div className="w-[2px] h-[260px] bg-[var(--red)]" />
            </div>
          </motion.div>
        </div>

        {/* Tracks */}
        <div className="flex flex-col gap-[2px]">
          {tracks.map((track, ti) => (
            <div key={ti} className="flex items-stretch">
              <div className="w-[40px] flex-shrink-0 flex items-center justify-center border-r border-white/20">
                <span className="font-clash text-[9px] tracking-wider text-white/70">{track.label}</span>
              </div>
              <div className="flex-1 relative h-8 border-b border-white/5">
                {track.clips.map((clip, ci) => (
                  <motion.div
                    key={ci}
                    className="absolute top-[2px] bottom-[2px] rounded-[2px] flex items-center overflow-hidden"
                    style={{
                      left: `${clip.start}%`,
                      width: `${clip.width}%`,
                      backgroundColor: `${track.color}33`,
                      borderLeft: `2px solid ${track.color}`,
                      borderRight: `1px solid ${track.color}66`,
                      borderTop: `1px solid ${track.color}44`,
                      borderBottom: `1px solid ${track.color}44`,
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, delay: ti * 0.08 + ci * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <span className="font-clash text-[7px] text-white/80 px-2 truncate whitespace-nowrap">{clip.name}</span>
                    {ci === 0 && (
                      <>
                        <div className="absolute top-1/2 -translate-y-1/2 left-[15%] w-[5px] h-[5px] bg-[#f1c40f] rotate-45" />
                        <div className="absolute top-1/2 -translate-y-1/2 left-[45%] w-[5px] h-[5px] bg-[#f1c40f] rotate-45" />
                        <div className="absolute top-1/2 -translate-y-1/2 left-[75%] w-[5px] h-[5px] bg-[#f1c40f] rotate-45" />
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Second pass of tracks (to fill the diagonal space) */}
        <div className="mt-6 flex flex-col gap-[2px]">
          {tracks.slice(0, 4).map((track, ti) => (
            <div key={ti} className="flex items-stretch">
              <div className="w-[40px] flex-shrink-0 flex items-center justify-center border-r border-white/20">
                <span className="font-clash text-[9px] tracking-wider text-white/70">{track.label}</span>
              </div>
              <div className="flex-1 relative h-8 border-b border-white/5">
                {track.clips.map((clip, ci) => (
                  <div
                    key={ci}
                    className="absolute top-[2px] bottom-[2px] rounded-[2px] flex items-center overflow-hidden"
                    style={{
                      left: `${clip.start + 10}%`,
                      width: `${clip.width * 0.8}%`,
                      backgroundColor: `${track.color}33`,
                      borderLeft: `2px solid ${track.color}`,
                      borderRight: `1px solid ${track.color}66`,
                      borderTop: `1px solid ${track.color}44`,
                      borderBottom: `1px solid ${track.color}44`,
                    }}
                  >
                    <span className="font-clash text-[7px] text-white/80 px-2 truncate whitespace-nowrap">{clip.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ================= DINO RUNNER GAME =================

const DinoRunner = () => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShouldLoad(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-[90rem] mx-auto px-4 md:px-12 py-16 z-10 relative">
      <div className="font-clash text-[9px] tracking-widest text-[var(--red)] uppercase mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[var(--red)] rounded-full animate-pulse" />
        // BREAK_PROTOCOL [MINI GAME]
      </div>
      <div className="border border-[var(--border)] overflow-hidden rounded-sm" style={{ minHeight: '150px' }}>
        {shouldLoad && <DinoGame />}
      </div>
      <div className="font-clash text-[8px] tracking-widest text-[var(--muted)] mt-3 text-center">
        SPACE / CLICK TO JUMP — DOWN ARROW TO DUCK / FAST FALL
      </div>
    </div>
  );
};
// ================= HERO SCREEN ISOLATED COMPONENTS =================

const QuoteReveal = () => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 50, stiffness: 300, mass: 0.5 });

  const prevProgress = useRef(0);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    return smoothProgress.on('change', (v) => {
      const velocity = (v - prevProgress.current) * 1000;
      prevProgress.current = v;
      const skew = Math.max(-15, Math.min(15, velocity * -8));
      const scaleX = 1 + Math.min(Math.abs(velocity) * 2, 0.15);
      el.style.transform = `translate3d(${80 - v * 200}%, 0, 0) skewX(${skew}deg) scaleX(${scaleX})`;
    });
  }, [smoothProgress]);

  return (
    <div ref={containerRef} className="relative z-10">
      <div className="w-full flex items-center justify-center overflow-hidden">
        <div className="w-full bg-[var(--red)] overflow-hidden py-24 md:py-32">
          <p
            ref={textRef}
            className="font-supertalls text-[clamp(50px,12vw,180px)] leading-none whitespace-nowrap text-[var(--bg)] will-change-transform"
            style={{ transform: 'translate3d(100%, 0, 0)' }}
          >
            MY TOOLS ARE DIGITAL MY LIMITS ARE NOT
          </p>
        </div>
      </div>
    </div>
  );
};

const InteractiveDotGrid = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let visible = true;
    const gap = 24;
    const dotSize = 0.6;
    const influenceRadius = 100;
    const dpr = Math.min(window.devicePixelRatio, 1.5);

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Draw ONE frame only — dots are static except near the cursor, so a
    // continuous rAF loop would redraw 660+ arcs 60x/sec for zero change.
    const draw = () => {
      if (!visible) return;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      for (let x = gap; x < w; x += gap) {
        for (let y = gap; y < h; y += gap) {
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let px = x;
          let py = y;

          if (dist < influenceRadius && dist > 0) {
            const force = (1 - dist / influenceRadius) * 6;
            px += (dx / dist) * force;
            py += (dy / dist) * force;
          }

          ctx.beginPath();
          ctx.arc(px, py, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
          ctx.fill();
        }
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; draw(); });
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    observer.observe(canvas);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      schedule();
    };
    window.addEventListener('mousemove', onMove);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

const ShowreelVideo = () => {
  const videoRef = useRef(null);

  // Play only while on screen; pause when scrolled away. A looping muted
  // autoplay video decodes frames forever otherwise (5.7MB mp4 = constant
  // battery/CPU on phones even when the section is off-screen).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { v.play().catch(() => {}); } else { v.pause(); }
      },
      { rootMargin: '200px' }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src="/assets/output-compressed.mp4"
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      className="w-full h-auto object-cover"
    />
  );
};

const HeroBackground = ({ hasLoaded }) => {
  const textContainerRef = useRef(null);

  useEffect(() => {
    const container = textContainerRef.current;
    if (!container) return;
    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      container.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      container.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <InteractiveDotGrid />
      <div className="absolute top-[42%] left-4 md:left-8 -translate-y-1/2">
        <motion.div
          ref={textContainerRef}
          className="flex flex-col items-start font-supertalls leading-none text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={hasLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            fontSize: 'clamp(60px, 12vw, 160px)',
            '--mx': '0px',
            '--my': '0px',
            color: 'transparent',
            backgroundImage: 'radial-gradient(400px circle at var(--mx) var(--my), #FFFFFF 0%, rgba(255,255,255,0.15) 70%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            letterSpacing: '0.02em',
          }}
        >
          <span className="tracking-[0.05em] block">ARNAV</span>
          <span className="tracking-[0.05em] block mt-2 md:mt-4">RAI</span>
        </motion.div>
        <motion.p
          className="font-clash text-[var(--muted)] tracking-[0.3em] uppercase mt-4 md:mt-6"
          style={{ fontSize: 'clamp(10px, 1.5vw, 16px)' }}
          initial={{ opacity: 0 }}
          animate={hasLoaded ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Creative. Technical. Limitless.
        </motion.p>
      </div>
    </div>
  );
};

const HeroForeground = ({ isBase, hasLoaded, titleIndex, titles }) => {
  const hudClass = isBase ? "opacity-[0.15] saturate-0" : "opacity-100";

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <ParticleFlyer delay={hasLoaded ? 0.2 : 0} className={`absolute top-12 left-6 md:top-8 md:left-8 font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col gap-1 transition-opacity duration-300 ${hudClass}`}>
        <span>CAM_04 [REC]</span>
        <span className="text-[var(--red)] flex items-center gap-2">
          <motion.div animate={!isBase ? { opacity: [1, 0, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }} className="w-3 h-3 rounded-full bg-[var(--red)]" />
          SIGNAL__STRONG
        </span>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.3 : 0} className={`absolute top-12 left-0 right-0 w-full flex flex-col items-center justify-center gap-3 transition-opacity duration-300 ${hudClass}`}>
        <motion.div
          id="top-secret-marker"
          initial={{ opacity: 0 }}
          animate={hasLoaded
            ? { opacity: 0.8, boxShadow: '0 0 12px white' }
            : { opacity: 0 }
          }
          transition={hasLoaded
            ? { duration: 1, delay: 1.6, ease: 'easeOut' }
            : {}
          }
          className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_white]"
        />
        <div className="border border-[var(--red)]/50 text-[var(--red)] text-[9px] md:text-[10px] px-4 py-1.5 tracking-[0.2em] bg-[var(--bg)]/50 backdrop-blur-sm font-clash">
          TOP SECRET // CASE #2026
        </div>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.2 : 0} className={`absolute top-12 right-6 md:top-8 md:right-8 font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col items-end gap-1 transition-opacity duration-300 ${hudClass}`}>
        <div className="flex flex-col border border-[var(--border)] bg-[var(--bg)]/50 backdrop-blur-sm">
          <span className="px-2 py-1 border-b border-[var(--border)] text-[var(--muted)] transition-colors">IN</span>
          <span className="px-2 py-1 text-[var(--red)] font-bold">EN</span>
        </div>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.4 : 0} className={`absolute top-[20%] left-4 md:left-8 -translate-y-1/2 -rotate-90 origin-center flex items-center gap-4 font-clash text-[10px] tracking-[0.2em] transition-opacity duration-300 ${hudClass}`}>
        <span className="font-bebas text-2xl text-white rotate-90">A.</span>
        <span className="text-white font-bold">Portfolio</span>
      </ParticleFlyer>


      <ParticleFlyer delay={hasLoaded ? 0.4 : 0} className={`absolute bottom-24 right-6 md:bottom-16 md:right-12 border border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm p-4 flex items-center gap-4 transition-opacity duration-300 ${hudClass}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <div className="flex flex-col font-clash">
          <span className="text-[8px] text-[var(--muted)] tracking-widest">INTERACTIVE_MODE</span>
          <span className="text-[12px] text-[var(--red)] font-bold tracking-widest">PREMIUM EDIT</span>
          <span className="text-[8px] text-[var(--muted)] tracking-widest flex items-center gap-1 mt-1">
            <span className="w-1 h-1 rounded-full bg-[var(--red)]" /> AVAILABLE
          </span>
        </div>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.3 : 0} className={`absolute bottom-24 left-6 md:bottom-16 md:left-8 font-clash text-[8px] md:text-[9px] text-[var(--muted)] flex flex-col gap-1 tracking-widest transition-opacity duration-300 ${hudClass}`}>
        <div className="flex items-center gap-2 mb-2">
          <motion.div animate={!isBase ? { opacity: [1, 0, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[var(--red)] rounded-full" />
          LIVE FEED
        </div>
        <span>LAT: 28.9845 N</span>
        <span>LON: 77.7064 E</span>
        <span>SECURE_GRID_99</span>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.5 : 0} className={`absolute bottom-6 right-6 md:bottom-4 md:right-12 font-clash text-[7px] md:text-[8px] text-right text-[var(--muted)] tracking-widest leading-loose transition-opacity duration-300 ${hudClass}`}>
        12,187th investigator on this case<br/>
        SYS: DIAGNOSTIC<br/>
        <span className="text-[var(--red)] font-bold">STABLE</span>
      </ParticleFlyer>

      {/* Subtitle text */}
      <div className="absolute top-[64%] md:top-[66%] left-4 md:left-8 text-left text-[10px] md:text-[12px] font-clash tracking-[0.15em] flex flex-col items-start opacity-100">
        <ParticleFlyer delay={hasLoaded ? 0.6 : 0}>
          <div className="text-[var(--muted)] mb-1.5 flex items-center gap-[6px]">
            <span className="text-[var(--red)] font-bold flex items-center h-full">
              <ParticleTextSwap text={titles[titleIndex].left} />
            </span>
            <span className="text-[var(--black)] font-bold flex items-center h-full">
              <ParticleTextSwap text={titles[titleIndex].right} />
              <span className="ml-[1px]">.</span>
            </span>
          </div>
        </ParticleFlyer>
        <ParticleFlyer delay={hasLoaded ? 0.7 : 0}>
          <div className="text-[var(--muted)] mb-1.5">
            <span className="text-[var(--red)]">Raw & Uncut</span> Storytelling & <span className="text-[var(--red)]">Interactivity</span>.
          </div>
        </ParticleFlyer>
        <ParticleFlyer delay={hasLoaded ? 0.8 : 0}>
          <div className="text-[var(--muted)]">
            Seeking freelance opportunities.
          </div>
        </ParticleFlyer>
      </div>
    </div>
  );
};

// --- DYNAMIC SWEEPING RED THREAD (SINE WAVE) ---
const CurvedThread = ({ hasLoaded }) => {
  const { scrollYProgress } = useScroll();
  
  // Slowed down the acceleration. 
  // It now maps almost 1:1 with the scroll, finishing the drawing right as you reach the end of the page (95% scroll)
  const drawProgress = useTransform(scrollYProgress, [0, 0.95], [0, 1]);
  
  const [pathDef, setPathDef] = useState("");
  const [circlePos, setCirclePos] = useState({ topY: 0, bottomY: 0, x: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const vh = window.innerHeight;

      // Start from the very top of the scroll content container
      let topY = 0;
      
      // End circle perfectly above the "CHANNEL OPEN" text
      const channelEl = document.getElementById('channel-open-marker');
      let bottomY = h - (vh * 0.5) - 100; // Fallback
      
      if (channelEl && containerRef.current) {
        const channelRect = channelEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate absolute Y position relative to the SVG container
        // Increased the offset from 24 to 64 to avoid overlapping
        bottomY = channelRect.top - containerRect.top - 64; 
      }

      const midX = w / 2;

      setCirclePos({ topY, bottomY, x: midX });

      if (h < vh * 2) {
         setPathDef(`M ${midX} ${topY} L ${midX} ${bottomY}`);
         return;
      }

      // Generate a perfect mathematical Sine Curve!
      const amplitude = w > 768 ? w * 0.35 : w * 0.45;
      const steps = 150; // High resolution for perfect smoothness
      let d = `M ${midX} ${topY} `;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Linear interpolation for Y
        const currentY = topY + t * (bottomY - topY);
        // Sine wave for X (1 full cycle: right, left, center)
        const currentX = midX + Math.sin(t * Math.PI * 2) * amplitude;
        d += `L ${currentX} ${currentY} `;
      }
      
      setPathDef(d);
    };

    updatePath();
    const observer = new ResizeObserver(updatePath);
    if (containerRef.current) observer.observe(containerRef.current);

    const timeout = setTimeout(updatePath, 500);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [hasLoaded]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Unlit Tracking Groove */}
        <path d={pathDef} stroke="var(--border)" strokeWidth="1" fill="none" opacity="0.3" />
        
        {/* The Live Red Thread */}
        <motion.path 
          d={pathDef} 
          stroke="var(--red)" 
          strokeWidth="2" 
          fill="none" 
          style={{ pathLength: drawProgress, filter: 'drop-shadow(0 0 8px rgba(255,0,0,0.8))' }} 
        />

        {/* Removed redundant top anchor circle; the glowing white dot now acts as the true source */}
        
        {/* Bottom Anchor Circle (Increased radius) */}
        <circle cx={circlePos.x} cy={circlePos.bottomY} r={10} fill="var(--black)" stroke="var(--border)" strokeWidth="2" className="drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
      </svg>
    </div>
  );
};


// --- SCROLL FX: velocity motion blur on titles, opacity reveals, portrait face effect ---
// GPU-safe: filter updates only on viewport-visible small text layers; the portrait
// uses transform-only parallax + a one-shot blur transition (no per-frame filter on
// big layers). Framer keeps ownership of transforms — we never touch transform here.
const ScrollFX = () => {
  const rafRef = useRef(0);
  const lastY = useRef(0);
  const idleT = useRef(0);
  const titlesRef = useRef([]);
  const visible = useRef(new Set());
  const pinnedRef = useRef(0);

  useEffect(() => {
    // Big section titles only — exclude the scrolling marquee (bg-colored class)
    const titles = Array.from(document.querySelectorAll('h2.font-supertalls'))
      .filter((t) => !t.className.includes('text-[var(--bg)]'))
      .slice(0, 12);
    titlesRef.current = titles;

    titles.forEach((t) => {
      t.classList.add('fx-reveal');
      t.style.willChange = 'filter';
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('fx-in'); visible.current.add(e.target); }
        else { visible.current.delete(e.target); }
      });
    }, { threshold: 0.2 });
    titles.forEach((t) => io.observe(t));

    const portrait = document.getElementById('fx-portrait');
    const hero = document.getElementById('section-hero');
    const deck = hero ? hero.parentElement : null;
    const measurePin = () => {
      pinnedRef.current = deck ? Math.max(deck.getBoundingClientRect().height - window.innerHeight, 0) : 0;
    };
    measurePin();

    lastY.current = window.scrollY;
    const loop = () => {
      const y = window.scrollY;
      const vel = Math.abs(y - lastY.current);
      lastY.current = y;
      // velocity motion blur: fast scroll -> titles blur (capped 9px), idle -> sharp
      const blur = Math.min(vel * 0.035, 9);
      if (blur > 0.5) {
        titlesRef.current.forEach((t) => {
          if (visible.current.has(t)) t.style.filter = `blur(${blur.toFixed(2)}px)`;
        });
        idleT.current = 0;
      } else if (idleT.current++ > 14) {
        titlesRef.current.forEach((t) => { if (t.style.filter) t.style.filter = ''; });
      }
      // portrait: parallax lift + subtle scale while the card covers it; one-shot blur near the end
      if (portrait) {
        const s = Math.min(y, pinnedRef.current);
        portrait.style.transform = `translateY(${(s * 0.07).toFixed(1)}px) scale(${(1 + s * 0.00004).toFixed(4)})`;
        portrait.style.filter = s > pinnedRef.current * 0.62 ? 'blur(5px)' : '';
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener('resize', measurePin);
    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener('resize', measurePin);
      titles.forEach((t) => { t.classList.remove('fx-reveal', 'fx-in'); t.style.filter = ''; t.style.willChange = ''; });
    };
  }, []);

  return (
    <style>{`
      .fx-reveal { opacity: 0 !important; transition: opacity 1s cubic-bezier(0.22, 0.61, 0.36, 1) !important; }
      .fx-reveal.fx-in { opacity: 1 !important; }
      #fx-portrait { will-change: transform, filter; transition: filter 0.7s ease; }
    `}</style>
  );
};

// --- EDIT FX: glitch text, editing HUD chips, signature glow (CSS-only, GPU-light) ---
// Glitch animates ONLY brief RGB-split bursts (~4 frames every ~4s) on small text
// layers; chips are static + tiny transform/opacity loops. All compositor-friendly.
const EditFX = () => (
  <style>{`
    /* --- glitch text (needs data-text attr) --- */
    .fx-glitch { position: relative; }
    .fx-glitch::before, .fx-glitch::after {
      content: attr(data-text);
      position: absolute; left: 0; top: 0; width: 100%;
      pointer-events: none; opacity: 0; will-change: transform, clip-path;
    }
    .fx-glitch::before { color: #ff2a2a; animation: glitchA 5.2s steps(1) infinite; }
    .fx-glitch::after  { color: #2af2ff; animation: glitchB 4.1s steps(1) infinite; }
    @keyframes glitchA {
      0%, 92%, 100% { opacity: 0; transform: translate(0); }
      93% { opacity: .85; transform: translate(-3px, -2px); clip-path: inset(12% 0 58% 0); }
      94% { opacity: .85; transform: translate(3px, 1px);  clip-path: inset(62% 0 8% 0); }
      95% { opacity: .85; transform: translate(-2px, 2px); clip-path: inset(30% 0 42% 0); }
      96% { opacity: .85; transform: translate(2px, -1px); clip-path: inset(82% 0 2% 0); }
    }
    @keyframes glitchB {
      0%, 88%, 100% { opacity: 0; transform: translate(0); }
      89% { opacity: .7; transform: translate(3px, 1px);  clip-path: inset(45% 0 22% 0); }
      90% { opacity: .7; transform: translate(-3px, -2px); clip-path: inset(6% 0 78% 0); }
      91% { opacity: .7; transform: translate(2px, 2px);  clip-path: inset(70% 0 12% 0); }
    }

    /* --- editing HUD chips --- */
    .edit-chip {
      display: inline-flex; align-items: center; gap: 7px;
      border: 1px solid rgba(255, 0, 0, 0.35); background: rgba(5, 5, 5, 0.65);
      padding: 5px 10px; font-size: 9px; letter-spacing: 0.18em;
      font-family: 'Courier New', monospace; color: #ff4d4d;
      text-transform: uppercase; backdrop-filter: blur(3px);
    }
    .rec-dot { width: 7px; height: 7px; border-radius: 50%; background: #ff2a2a; box-shadow: 0 0 8px rgba(255, 0, 0, 0.9); animation: rec-blink 1.2s steps(1) infinite; }
    @keyframes rec-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0.15; } }
    .wave { display: inline-flex; align-items: center; gap: 2px; height: 14px; }
    .wave i { width: 2px; background: var(--red); transform-origin: center; animation: wave-bounce 0.9s ease-in-out infinite; }
    @keyframes wave-bounce { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
    .scrubber { position: relative; width: 88px; height: 3px; background: rgba(255, 255, 255, 0.14); overflow: visible; }
    .scrubber::after { content: ''; position: absolute; top: -3px; left: 0; width: 2px; height: 9px; background: var(--red); box-shadow: 0 0 6px rgba(255, 0, 0, 0.8); animation: scrub-run 3.4s ease-in-out infinite; }
    @keyframes scrub-run { 0%, 100% { left: 0; } 50% { left: calc(100% - 2px); } }
    .cut-tick { width: 8px; height: 1px; background: var(--red); position: relative; }
    .cut-tick::after { content: '✂'; position: absolute; left: 2px; top: -5px; font-size: 8px; color: var(--red); }

    /* --- signature --- */
    .sig {
      font-family: 'Great Vibes', cursive;
      font-size: clamp(30px, 5.5vw, 46px); line-height: 1; color: #ffffff;
      text-shadow: 0 0 12px rgba(255, 0, 0, 0.9), 0 0 34px rgba(255, 0, 0, 0.45), 0 0 70px rgba(255, 0, 0, 0.25);
    }
    .edit-glow { filter: drop-shadow(0 0 16px rgba(255, 0, 0, 0.75)); animation: sig-float 5.5s ease-in-out infinite; }
    @keyframes sig-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  `}</style>
);

// --- BOLD ICONS ---
const AdobeIcon = ({ text }) => (
  <span className="font-clash font-bold text-2xl md:text-3xl tracking-tighter drop-shadow-md text-[var(--red)]">
    {text}
  </span>
);

const IconSound = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
    <path d="M12 2v20M17 7v10M22 10v4M7 7v10M2 10v4"/>
  </svg>
);

const IconStory = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
    <rect x="2" y="2" width="20" height="20" rx="4" ry="4"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
  </svg>
);

const IconColor = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="14.31" y1="8" x2="20.05" y2="17.94"></line>
    <line x1="9.69" y1="8" x2="21.17" y2="8"></line>
    <line x1="7.38" y1="12" x2="13.12" y2="2.06"></line>
    <line x1="9.69" y1="16" x2="3.95" y2="6.06"></line>
    <line x1="14.31" y1="16" x2="2.83" y2="16"></line>
    <line x1="16.62" y1="12" x2="10.88" y2="21.94"></line>
  </svg>
);

const IconDirection = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
    <path d="M20.2 6 3 11l-.9-2.4L22 3.8z"/>
    <path d="m7 5-2.9-1.2L2.2 7l2.9 1.2zM14.6 2l-2.9-1.2-1.9 3.2 2.9 1.2zM10.8 3.5l-2.9-1.2-1.9 3.2 2.9 1.2zM18.4 4.9l-2.9-1.2-1.9 3.2 2.9 1.2z"/>
    <path d="M4 22h16a2 2 0 0 0 2-2V10H2v10a2 2 0 0 0 2 2z"/>
  </svg>
);

const IconLocation = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconClock = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const IgIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const YtIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
);

// --- DATA STRUCTURES ---
const BRANDS_DATA = [
  { id: "B_01", name: "Red Bull", logo: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=400&auto=format&fit=crop", link: "https://instagram.com", type: "ig" },
  { id: "B_02", name: "Nike", logo: "https://images.unsplash.com/photo-1617069151590-50d4537b0d77?q=80&w=400&auto=format&fit=crop", link: "https://youtube.com", type: "yt" },
  { id: "B_03", name: "Sony", logo: "https://images.unsplash.com/photo-1541887019-3eec5285741f?q=80&w=400&auto=format&fit=crop", link: "https://instagram.com", type: "ig" },
  { id: "B_04", name: "Razer", logo: "https://images.unsplash.com/photo-1590135898014-9fc543b593eb?q=80&w=400&auto=format&fit=crop", link: "https://youtube.com", type: "yt" }
];

const CREATORS_DATA = [
  // TODO: replace with Arnav's real creator names + links (yt/ig)
  { id: "C_01", name: "Creator One", dp: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop", yt: "https://youtube.com", ig: "https://instagram.com" },
  { id: "C_02", name: "Creator Two", dp: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?q=80&w=400&auto=format&fit=crop", yt: "https://youtube.com", ig: "https://instagram.com" },
  { id: "C_03", name: "Creator Three", dp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop", yt: "https://youtube.com", ig: "https://instagram.com" },
  { id: "C_04", name: "Creator Four", dp: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop", yt: "https://youtube.com", ig: "https://instagram.com" }
];

const EVIDENCE_SECTORS = [
  { id: "KINETIC_CUTS", label: "// KINETIC_CUTS [VIDEO EDITING]" },
  { id: "GRID_ARCHIVES", label: "// GRID_ARCHIVES [SOCIAL GRIDS]" },
  { id: "CONTENT_DEPLOYMENTS", label: "// CONTENT_DEPLOYMENTS [SOCIAL POSTS]" },
  { id: "BRAND_IDENTITIES", label: "// BRAND_IDENTITIES [LOGO FOLIO]" }
];

const EVIDENCE_DATA = [
  // Video Editing
  // TODO: swap these in for Arnav's REAL project names, images, and links
  { id: "01", sector: "KINETIC_CUTS", title: "Ophelia", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop", year: "March 2025", context: "Commercial", client: "Ophelia Studios", time: "5 days", tags: ["Color Grading", "Motion Graphics"], stacks: ["Premiere Pro", "After Effects"], desc: "A high-contrast cinematic commercial edit blending surreal visuals with precise color grading. The client wanted an ethereal mood that pulled viewers into a dreamlike narrative.", link: "#" },
  { id: "02", sector: "KINETIC_CUTS", title: "Launch Reel", img: "https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=800&auto=format&fit=crop", year: "January 2025", context: "Professional", client: "Visible Gain", time: "3 days", tags: ["Video Editing", "Sound Design"], stacks: ["Premiere Pro", "Audition"], desc: "Fast-paced brand reel for a lifestyle brand launch. Integrated kinetic typography with product shots to maximize retention in the first 3 seconds.", link: "#" },
  { id: "03", sector: "KINETIC_CUTS", title: "2026 Greet", img: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=800&auto=format&fit=crop", year: "December 2025", context: "Personal", client: "Self-Initiated", time: "2 days", tags: ["Motion Graphics", "Typography"], stacks: ["After Effects", "Illustrator"], desc: "A personal new year greeting animation exploring glitch aesthetics and bold type treatments. Shared across social media to celebrate the creative community.", link: "#" },
  { id: "04", sector: "KINETIC_CUTS", title: "Ciao", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop", year: "November 2024", context: "Freelance", client: "Indie Artist", time: "4 days", tags: ["Music Video", "VFX"], stacks: ["Premiere Pro", "After Effects", "Blender"], desc: "Lyric video for an indie artist combining 3D environments with hand-drawn frame-by-frame animation overlays. Delivered across 3 aspect ratios for multi-platform release.", link: "#" },
  // Social Grids
  { id: "05", sector: "GRID_ARCHIVES", title: "H.A.N.D.S. Grid", img: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800&auto=format&fit=crop", year: "February 2025", context: "Professional", client: "Promotion4u", time: "2 days", tags: ["Grid Design", "Brand Identity"], stacks: ["Photoshop", "Illustrator"], desc: "A cohesive 9-post Instagram grid design for a wellness brand. Each tile works independently while forming a larger visual narrative when viewed together.", link: "#" },
  { id: "06", sector: "GRID_ARCHIVES", title: "Apogée Sequence", img: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=800&auto=format&fit=crop", year: "October 2024", context: "Freelance", client: "Apogée Fashion", time: "3 days", tags: ["Social Media", "Photography"], stacks: ["Photoshop", "Lightroom"], desc: "Carousel sequence for a fashion brand's seasonal drop. Designed to maximize swipe-through rate with progressive reveal storytelling.", link: "#" },
  // Social Posts
  { id: "07", sector: "CONTENT_DEPLOYMENTS", title: "Cyberpunk Campaign", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop", year: "September 2024", context: "Freelance", client: "Tech Influencer", time: "1 day", tags: ["Social Content", "Graphic Design"], stacks: ["Photoshop", "AI Tools"], desc: "Cyberpunk-themed content series for a tech influencer's product review campaign. Neon-heavy palette with HUD-style overlays.", link: "#" },
  // Logos
  { id: "08", sector: "BRAND_IDENTITIES", title: "Nexus Logomark", img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop", year: "August 2024", context: "Professional", client: "Nexus Gaming", time: "5 days", tags: ["Logo Design", "Brand Identity"], stacks: ["Illustrator", "Photoshop"], desc: "Minimal logomark for a gaming community. Explored geometric forms that convey both connection and competition. Delivered brand guide with usage rules.", link: "#" },
];

const POSTS_DATA = [
  { id: "P01", title: "Neon Drift", subtitle: "Motion Poster", img: "https://images.unsplash.com/photo-1614854262318-831574f15f1f?q=80&w=800&auto=format&fit=crop" },
  { id: "P02", title: "Kyoto Nights", subtitle: "Social Campaign", img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=800&auto=format&fit=crop" },
  { id: "P03", title: "Voltage", subtitle: "Brand Identity", img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=800&auto=format&fit=crop" },
  { id: "P04", title: "Fractured", subtitle: "Album Artwork", img: "https://images.unsplash.com/photo-1633986210655-88e6ac1c1147?q=80&w=800&auto=format&fit=crop" },
  { id: "P05", title: "Meridian", subtitle: "Event Visual", img: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=800&auto=format&fit=crop" },
  { id: "P06", title: "Obsidian", subtitle: "Thumbnail Pack", img: "https://images.unsplash.com/photo-1604076913837-52ab5f6f5ce0?q=80&w=800&auto=format&fit=crop" },
  { id: "P07", title: "Catalyst", subtitle: "Reel Cover", img: "https://images.unsplash.com/photo-1614850523011-8f49ffc73908?q=80&w=800&auto=format&fit=crop" },
];

export default function App() {
  const [isMounted, setIsMounted] = useState(false);

  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(15);

  const [titleIndex, setTitleIndex] = useState(0);
  const titles = useMemo(() => [{ left: "MOTION", right: "DESIGNER" }, { left: "VIDEO", right: "EDITOR" }], []);

  const [navVisible, setNavVisible] = useState(false);
  
  // Carousel State
  const [activeSector, setActiveSector] = useState("KINETIC_CUTS");
  const filteredEvidence = useMemo(() => EVIDENCE_DATA.filter(item => item.sector === activeSector), [activeSector]);
  const carouselRef = useRef(null);

  // Case Study Modal State
  const [caseStudyItem, setCaseStudyItem] = useState(null);

  // Posts Cover Flow State
  const [activePostIndex, setActivePostIndex] = useState(Math.floor(POSTS_DATA.length / 2));

  // Scroll Hijacking for the Carousel
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // If user is natively scrolling horizontally (like on a trackpad), let them do it
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const isScrollingRight = e.deltaY > 0;
      const isScrollingLeft = e.deltaY < 0;
      
      // Check if there is room to scroll horizontally in the direction intended
      const canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);
      const canScrollLeft = container.scrollLeft > 0;

      if ((isScrollingRight && canScrollRight) || (isScrollingLeft && canScrollLeft)) {
        e.preventDefault(); // Stop the page from moving up/down
        container.scrollLeft += e.deltaY; // Translate vertical wheel to horizontal scroll
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [filteredEvidence]); // Re-bind if content changes

  const handleArrowScroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = window.innerWidth * 0.4;
      carouselRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  // Initialize cursor physics values globally at the top level of the component
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const wellX = useSpring(cursorX, { damping: 28, stiffness: 200, mass: 0.2 });
  const wellY = useSpring(cursorY, { damping: 28, stiffness: 200, mass: 0.2 });

  // Native window scroll tracker
  const { scrollYProgress, scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Smooth out the scroll progress for the star so it glides natively
  const smoothScrollProgress = useSpring(scrollYProgress, { damping: 28, stiffness: 200, mass: 0.2 });

  // The Star smoothly tracks across the absolute bottom
  const starLeft = useTransform(smoothScrollProgress, [0, 1], ["0%", "100%"]);
  
  // Velocity-based stretching/squishing physics for the star (adjusted for native pixel scrolling)
  const starScaleX = useTransform(scrollVelocity, [-2000, 0, 2000], [2.5, 1, 2.5]);
  const starSkewX = useTransform(scrollVelocity, [-2000, 0, 2000], [35, 0, -35]);
  const tailRotate = useTransform(scrollVelocity, v => v < 0 ? 180 : 0);
  const tailScaleX = useTransform(scrollVelocity, [-1000, 0, 1000], [1.5, 0, 1.5]);
  const tailOpacity = useTransform(scrollVelocity, [-200, 0, 200], [1, 0, 1]);

  // Make Nav visible after 100px of scrolling
  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavVisible(latest > 100);
  });


  useEffect(() => {
    if (!hasLoaded) return;
    const interval = setInterval(() => setTitleIndex(prev => (prev + 1) % titles.length), 5000);
    return () => clearInterval(interval);
  }, [hasLoaded, titles.length]);

  useEffect(() => {
    setIsMounted(true);

    let resourcesLoaded = 0;
    const totalResources = 1;

    const checkResourceLoad = () => {
      resourcesLoaded++;
      const newTarget = 15 + (resourcesLoaded / totalResources) * 85;
      setTargetProgress(newTarget);
    };

    // Gate on DOMContentLoaded, NOT window 'load' — window load waits for the
    // autoplay video, every font and every image (8-10s on slow machines).
    // The app is interactive at DOMContentLoaded; heavy media loads lazily.
    if (document.readyState === 'complete' || document.readyState === 'interactive') checkResourceLoad();
    else window.addEventListener('DOMContentLoaded', checkResourceLoad);

    const fallbackTimer = setTimeout(() => { setTargetProgress(100); }, 5000);

    return () => {
      window.removeEventListener('DOMContentLoaded', checkResourceLoad);
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    let animationFrameId;
    const lerp = () => {
      setLoadingProgress((prev) => {
        const diff = targetProgress - prev;
        if (diff > 0.1) return prev + diff * 0.08; 
        else if (targetProgress === 100 && prev >= 99.5) return 100; 
        return prev;
      });
      animationFrameId = requestAnimationFrame(lerp);
    };
    animationFrameId = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetProgress]);

  useEffect(() => {
    if (loadingProgress === 100) {
      const delay = setTimeout(() => {
        setHasLoaded(true);
        document.body.classList.remove('loading');
        SFX.spaceEnter();
      }, 400);
      return () => clearTimeout(delay);
    } else {
      document.body.classList.add('loading');
    }
  }, [loadingProgress]);

  useEffect(() => {
    const move = (e) => { cursorX.set(e.clientX); cursorY.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); };
  }, [cursorX, cursorY]);

  if (!isMounted) return null;

  return (
    <CursorContext.Provider value={{ cursorX, cursorY }}>
      <div className="relative w-full min-h-screen bg-[var(--bg)] font-clash text-[var(--black)] selection:bg-[var(--red)] selection:text-[var(--bg)]">
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

        {/* Film grain noise overlay */}
        <div className="noise-overlay fixed inset-0 pointer-events-none z-[9000]" />


        {/* DYNAMIC SCROLL FX: motion blur, reveals, portrait face effect */}
        <ScrollFX />

        {/* EDIT FX: glitch, editing chips, signature glow */}
        <EditFX />

        {/* ============ STACK DECK: the video card slides over the pinned hero ============ */}
        {/* Height is auto: hero (100vh, sticky) + the video card's natural height.
            Hardcoding 56.25vw was wrong — the showreel is 1920x892 (21:9), so its
            height is ~46.5vw; a fixed taller value left phantom space after the card. */}
        <div className="relative z-10">

        {/* ================= HERO SECTION ================= */}
        <section id="section-hero" className="sticky top-0 w-full h-screen flex items-center justify-center z-10 overflow-visible">


          {/* BACKGROUND LAYER (z-10): Main Typography with self-contained spotlight */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <HeroBackground hasLoaded={hasLoaded} />
          </div>

          {/* GALAXY LAYER (z-95) - rendered once for performance */}
          <div className="absolute top-1/2 right-0 translate-x-[40%] -translate-y-1/2 w-[600px] h-[600px] pointer-events-none scale-50 md:scale-75 xl:scale-100 z-[95]">
            <OrbitalRing
              radius={320}
              duration={35}
              reverse={false}
              items={[
                { label: "Adobe Photoshop", icon: <AdobeIcon text="Ps"/> },
                { label: "Adobe After Effects", icon: <AdobeIcon text="Ae"/> },
                { label: "Adobe Premiere Pro", icon: <AdobeIcon text="Pr"/> },
                { label: "Adobe Illustrator", icon: <AdobeIcon text="Ai"/> },
                { label: "Lightroom", icon: <AdobeIcon text="Lr"/> }
              ]}
            />
            <OrbitalRing
              radius={210}
              duration={25}
              reverse={true}
              items={[
                { label: "Blender", icon: <img src="/assets/photos/blender logo.png" alt="Blender" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" /> },
                { label: "Kling", icon: <img src="/assets/photos/kling logo.png" alt="Kling" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" /> },
                { label: "Higgsfield", icon: <img src="/assets/photos/higgsfield logo.png" alt="Higgsfield" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" /> }
              ]}
            />
          </div>

          {/* PORTRAIT LAYER (z-90) */}
          <motion.div
            initial={{ x: "-50%", y: 100, opacity: 0 }}
            animate={{ x: "-50%", y: hasLoaded ? 0 : 100, opacity: hasLoaded ? 1 : 0, filter: hasLoaded ? "blur(0px)" : "blur(20px)", scale: hasLoaded ? 1 : 0.9 }}
            transition={{ delay: hasLoaded ? 0.8 : 0, duration: 1, ease: "easeOut" }}
            className="absolute bottom-0 left-1/2 z-[90] pointer-events-none w-[130vw] sm:w-[110vw] md:w-[95vw] lg:w-[85vw] xl:w-[75vw] 2xl:w-[70vw] origin-bottom"
            style={{ minHeight: '60vh' }}
          >
            <div id="fx-portrait" className="relative w-full">
              <motion.img
                src="/assets/photos/DSC00747-01.webp"
                alt="Arnav Rai"
                className="relative w-full h-auto min-h-[60vh] object-bottom"
                style={{ objectFit: 'cover' }}
                initial={{ filter: 'drop-shadow(0 0 0px rgba(255,0,0,0))' }}
                animate={{ filter: hasLoaded ? 'drop-shadow(0 0 40px rgba(255,0,0,0.25)) drop-shadow(0 0 80px rgba(255,0,0,0.1))' : 'drop-shadow(0 0 0px rgba(255,0,0,0))' }}
                transition={{ delay: hasLoaded ? 2 : 0, duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* FOREGROUND LAYER (z-100): HUD Elements & Subtitles */}
          <div className="absolute inset-0 z-[100] pointer-events-none">
            <HeroForeground isBase={false} hasLoaded={hasLoaded} titleIndex={titleIndex} titles={titles} />
          </div>

          {/* EDITING HUD CHIPS (z-110) — the editor's touch */}
          <div className="absolute bottom-6 left-6 z-[110] pointer-events-none flex flex-col items-start gap-2">
            <div className="edit-chip"><span className="rec-dot" /> REC <span className="opacity-60">00:01:23:07</span></div>
            <div className="edit-chip"><span className="wave"><i style={{ height: '8px' }} /><i style={{ height: '13px' }} /><i style={{ height: '6px' }} /><i style={{ height: '11px' }} /><i style={{ height: '9px' }} /><i style={{ height: '13px' }} /><i style={{ height: '7px' }} /></span> <span className="opacity-60">LUT_04</span></div>
            <div className="edit-chip"><span className="scrubber" /> <span className="opacity-60">✂ HORNET_CUT</span></div>
          </div>
        </section>

          {/* SHOWREEL VIDEO — the card that slides up over the pinned hero (flat edges = true stack) */}
          <section className="relative w-full z-20 bg-[#0A0A0A] border-t-2 border-[var(--red)]/50 shadow-[0_-24px_80px_rgba(0,0,0,0.95)] overflow-hidden">
            <ShowreelVideo />
          </section>
        </div>

        {/* ================= CONTINUOUS SCROLL CONTENT (STACKING CARDS) ================= */}
        <div className="relative w-full pb-32 z-10 bg-[var(--bg)]">

          {/* CurvedThread disabled for stacking card layout */}

          {/* ================= SCROLL QUOTE SECTION ================= */}
          <div className="sticky top-0 w-full bg-[var(--bg)] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[11] overflow-hidden">
            <QuoteReveal />
          </div>

          {/* ABOUT SECTION */}
          <section id="section-intro" className="sticky top-0 relative w-full min-h-screen flex flex-col justify-center px-4 md:px-8 py-32 bg-[var(--bg)] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[12]">
            <div className="w-full max-w-[90rem] mx-auto relative z-10 pl-2 sm:pl-6 md:pl-10 lg:pl-[5%]">
              
              {/* Top absolute metadata */}
              <ParticleFlyer delay={0.1}>
                <div className="absolute top-0 right-4 md:right-12 text-right font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col gap-1">
                   <span>CASE FILE #A-026</span>
                   <span>STATUS: <span className="text-[var(--red)]">ACTIVE</span></span>
                </div>
              </ParticleFlyer>

              <ParticleFlyer delay={0.1} className="mb-6 md:mb-8">
                <motion.h2 
                  className="font-supertalls text-[clamp(40px,8vw,80px)] leading-none text-[var(--black)] pointer-events-auto block m-0"
                  style={{ marginBottom: '-0.15em' }}
                >
                  ABOUT
                </motion.h2>
              </ParticleFlyer>

              <div className="w-full max-w-[85rem] pointer-events-auto relative z-20 flex flex-col lg:flex-row gap-6">
                
                {/* COLUMN 1: Profile & Meta */}
                <div className="w-full lg:w-[22%] shrink-0 flex flex-col border border-[var(--border)] bg-[#050505]/70 backdrop-blur-sm p-6 transition-all duration-500 hover:border-[var(--red)]/40">
                  <ParticleFlyer delay={0.2}>
                    <h3 className="font-clash font-bold text-sm md:text-base tracking-widest mb-6 uppercase text-center">ARNAV RAI</h3>
                    
                    {/* Image Box with Scanline & Crosshairs */}
                    <div className="relative w-full aspect-square border border-[var(--border)] bg-[#111] overflow-hidden mb-6 group cursor-none">
                      {/* Crosshairs */}
                      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--red)] z-10" />
                      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--red)] z-10" />
                      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--red)] z-10" />
                      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--red)] z-10" />
                      
                      
                      <img src="/assets/photos/DSC00747-01.webp" alt="Arnav Profile" loading="lazy" className="w-full h-full object-cover object-top opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500" />
                      
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 font-clash text-[9px] md:text-[10px] uppercase mb-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[var(--muted)]">CLASS:</span>
                        <span className="font-bold">MOTION_DESIGN</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[var(--muted)]">XP_LEVEL:</span>
                        <span className="font-bold">SENIOR_GRADE</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[var(--muted)]">LANG_1:</span>
                        <span className="font-bold">EN (Fluent)</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[var(--muted)]">LANG_2:</span>
                        <span className="font-bold">HI (Native)</span>
                      </div>
                    </div>

                    {/* Alert Box */}
                    <div className="border border-[var(--red)] p-4 flex flex-col gap-2 relative overflow-hidden group cursor-none">
                      <div className="absolute inset-0 bg-[var(--red)]/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      <div className="flex items-center gap-2 font-clash text-[8px] text-[var(--red)] tracking-widest">
                        <div className="w-1.5 h-1.5 bg-[var(--red)] rounded-full animate-pulse" />
                        SYSTEM_ALERT
                      </div>
                      <div className="font-clash font-bold text-lg text-[var(--black)] leading-none mt-1 relative z-10">
                        OPEN TO WORK
                      </div>
                      <div className="flex justify-between items-center font-clash text-[7px] text-[var(--muted)] mt-2 relative z-10">
                        <span>// CONTRACTS: ENABLED</span>
                        <span>[REMOTE_READY]</span>
                      </div>
                    </div>
                  </ParticleFlyer>
                </div>

                {/* COLUMN 2: Main Text Content & Logs */}
                <div className="flex-1 flex flex-col border border-[var(--border)] bg-[#050505]/70 backdrop-blur-sm p-6 md:p-10 transition-all duration-500 hover:border-[var(--red)]/40">
                  <ParticleFlyer delay={0.3}>
                    <div className="flex justify-between items-center border-b border-[var(--border)] pb-3 mb-8 font-clash text-[9px] md:text-[10px] tracking-widest">
                      <span className="text-[var(--muted)] uppercase">Competence_Analysis_Report</span>
                      <span className="text-[var(--red)] uppercase">[Read_Only]</span>
                    </div>
                    
                    <div className="font-clash text-sm md:text-base text-[var(--black)] leading-loose mb-12">
                      Motion Designer and Video Editor obsessed with the fusion of <span className="bg-[var(--red)]/15 text-[var(--red)] px-1.5 py-0.5 whitespace-nowrap">technical rigor</span> and <span className="bg-[var(--red)]/15 text-[var(--red)] px-1.5 py-0.5 whitespace-nowrap">visual impact</span>. I don't just cut footage—I engineer kinetic visual narratives that demand attention and perform at the highest level. Every frame is treated as a critical asset.
                    </div>

                    {/* Academic Log */}
                    <div className="mb-10">
                      <div className="font-clash text-[10px] tracking-widest text-[var(--muted)] uppercase mb-6">
                        // ACADEMIC_LOG [EDUCATION]
                      </div>
                      
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 font-clash">
                            <span className="text-[var(--red)] font-bold text-xs md:text-sm tracking-wider">[UNIVERSITY OF MEDIA]</span>
                            <span className="text-[8px] md:text-[9px] text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 bg-[#111]">2018-2021</span>
                          </div>
                          <span className="font-clash text-xs md:text-sm text-[var(--black)]">BACHELOR - Digital Media & Video Production</span>
                        </div>
                      </div>
                    </div>

                    {/* Experience Log */}
                    <div>
                      <div className="font-clash text-[10px] tracking-widest text-[var(--muted)] uppercase mb-6">
                        // FIELD_OPERATIONS [EXPERIENCE]
                      </div>
                      
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 font-clash">
                            <span className="text-[var(--red)] font-bold text-xs md:text-sm tracking-wider">[3+ YEARS ACTIVE DUTY]</span>
                            <span className="text-[8px] md:text-[9px] text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 bg-[#111]">2021-PRESENT</span>
                          </div>
                          <span className="font-clash text-xs md:text-sm text-[var(--black)]">VARIOUS - Freelance Motion Designer & Premium Editor</span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 font-clash">
                            <span className="text-[var(--red)] font-bold text-xs md:text-sm tracking-wider">[AGENCY DEPLOYMENTS]</span>
                            <span className="text-[8px] md:text-[9px] text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 bg-[#111]">2022-2024</span>
                          </div>
                          <span className="font-clash text-xs md:text-sm text-[var(--black)]">MULTIPLE - High-Retention Social Media Campaigns</span>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                          <div className="flex items-center gap-3 font-clash">
                            <span className="text-[var(--red)] font-bold text-xs md:text-sm tracking-wider">[TOTAL_RUNTIME]</span>
                          </div>
                          <span className="font-clash text-xs md:text-sm text-[var(--black)]">Continuous Learning Protocol & Execution</span>
                        </div>
                      </div>
                    </div>
                  </ParticleFlyer>
                </div>

                {/* COLUMN 3: Sidebar Skills / Inventory */}
                <div className="w-full lg:w-[25%] shrink-0 flex flex-col border border-[var(--border)] bg-[#050505]/70 backdrop-blur-sm p-6 transition-all duration-500 hover:border-[var(--red)]/40">
                  <ParticleFlyer delay={0.4}>
                    <div className="font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] uppercase mb-8 text-right md:text-center border-b border-[var(--border)] pb-3">
                      Equipment_Inventory
                    </div>
                    
                    {/* Hard Skills */}
                    <div className="mb-8">
                      <div className="font-clash text-[9px] text-[var(--red)] tracking-widest uppercase mb-4">HARD SKILLS</div>
                      <div className="grid grid-cols-2 gap-2">
                        {["After Effects", "Premiere Pro", "Photoshop", "Blender", "Lightroom", "Illustrator"].map((skill, index) => (
                          <div key={index} className="border border-[var(--border)] px-2 py-2 flex items-center justify-center text-center font-clash text-[9px] md:text-[10px] text-[var(--muted)] hover:text-[var(--red)] hover:border-[var(--red)] hover:bg-[var(--red)]/5 transition-all duration-300 cursor-none">
                            {skill}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Soft Skills */}
                    <div className="mb-12">
                      <div className="font-clash text-[9px] text-[var(--red)] tracking-widest uppercase mb-4">SOFT SKILLS</div>
                      <div className="grid grid-cols-2 gap-2">
                        {["Pacing & Rhythm", "Sound Design", "Storytelling", "Color Grading", "Autonomy", "Creativity"].map((skill, index) => (
                          <div key={index} className="border border-[var(--border)] px-2 py-2 flex items-center justify-center text-center font-clash text-[9px] md:text-[10px] text-[var(--muted)] hover:text-[var(--red)] hover:border-[var(--red)] hover:bg-[var(--red)]/5 transition-all duration-300 cursor-none">
                            {skill}
                          </div>
                        ))}
                      </div>
                    </div>

                  </ParticleFlyer>
                </div>

              </div>
            </div>
          </section>

          {/* ================= EXPERIENCE + CAREER (CARD) ================= */}
          <div className="sticky top-0 w-full bg-[#050505] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[13] overflow-hidden">
            <ExperienceStrip />
            <CareerTimeline />
          </div>

          {/* ================= WORKED WITH SECTION ================= */}
          <section id="section-worked-with" className="sticky top-0 relative w-full min-h-screen flex flex-col justify-center py-24 bg-[var(--bg)] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[14] overflow-hidden">
            <div className="w-full max-w-[90rem] mx-auto relative z-10 pl-4 sm:pl-8 md:pl-12 lg:pl-[5%] pr-4 md:pr-12 mb-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-6 gap-6 mb-16">
                <ParticleFlyer delay={0.1}>
                  <motion.h2 className="font-supertalls text-[clamp(40px,8vw,80px)] leading-none text-[var(--black)] pointer-events-auto block m-0">
                    WORKED WITH
                  </motion.h2>
                </ParticleFlyer>
                <ParticleFlyer delay={0.2} className="flex items-end gap-8">
                  <div className="text-right font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col gap-1">
                    <span>CLEARANCE: <span className="text-[var(--red)]">LEVEL 5</span></span>
                    <span>ENTITIES_DECRYPTED: <span className="text-[var(--red)]">ACTIVE</span></span>
                  </div>
                </ParticleFlyer>
              </div>

              {/* Brands Grid */}
              <div className="mb-20">
                <ParticleFlyer delay={0.3}>
                  <div className="font-clash text-[10px] tracking-widest text-[var(--red)] uppercase mb-8 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[var(--red)] rounded-full animate-pulse" />
                    // CORPORATE_ENTITIES [BRANDS]
                  </div>
                </ParticleFlyer>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {BRANDS_DATA.map((brand, i) => (
                    <ParticleFlyer key={brand.id} delay={0.4 + i * 0.1}>
                      <div className="relative aspect-square border border-[var(--border)] bg-[#050505] overflow-hidden group cursor-none transition-all duration-500 hover:border-[var(--red)]/50">
                        {/* Crosshairs */}
                        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[var(--red)] z-10" />
                        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[var(--red)] z-10" />
                        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[var(--red)] z-10" />
                        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[var(--red)] z-10" />

                        {/* Image */}
                        <img src={brand.logo} alt={brand.name} loading="lazy" className="w-full h-full object-cover opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
                        

                        {/* Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />

                        {/* Social Link Overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 scale-50 group-hover:scale-100">
                          <a href={brand.link} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center text-[var(--black)] hover:bg-[var(--red)] hover:border-[var(--red)] hover:text-[var(--bg)] transition-all cursor-none">
                             {brand.type === 'ig' ? <IgIcon/> : <YtIcon/>}
                          </a>
                        </div>

                        {/* Details */}
                        <div className="absolute bottom-4 left-4 flex flex-col z-20 pointer-events-none">
                          <span className="font-clash text-[8px] text-[var(--red)] tracking-widest uppercase mb-1">ID: {brand.id}</span>
                          <span className="font-supertalls text-2xl md:text-3xl text-[var(--black)] leading-none">{brand.name}</span>
                        </div>
                      </div>
                    </ParticleFlyer>
                  ))}
                </div>
              </div>

              {/* Creators Grid */}
              <div>
                <ParticleFlyer delay={0.4}>
                  <div className="font-clash text-[10px] tracking-widest text-[var(--red)] uppercase mb-8 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[var(--red)] rounded-full animate-pulse" />
                    // TARGET_PROFILES [CREATORS]
                  </div>
                </ParticleFlyer>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {CREATORS_DATA.map((creator, i) => (
                    <ParticleFlyer key={creator.id} delay={0.5 + i * 0.1}>
                      <div className="relative aspect-square border border-[var(--border)] bg-[#050505] overflow-hidden group cursor-none transition-all duration-500 hover:border-[var(--red)]/50">
                        {/* Animated Top Red Line */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--red)] z-20 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                        {/* Image */}
                        <img src={creator.dp} alt={creator.name} loading="lazy" className="w-full h-full object-cover opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
                        
                        {/* Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />

                        {/* Social Links Overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-3 scale-50 group-hover:scale-100">
                          {creator.ig && (
                            <a href={creator.ig} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center text-[var(--black)] hover:bg-[var(--red)] hover:border-[var(--red)] hover:text-[var(--bg)] transition-all cursor-none">
                               <IgIcon/>
                            </a>
                          )}
                          {creator.yt && (
                            <a href={creator.yt} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center text-[var(--black)] hover:bg-[var(--red)] hover:border-[var(--red)] hover:text-[var(--bg)] transition-all cursor-none">
                               <YtIcon/>
                            </a>
                          )}
                        </div>

                        {/* Details */}
                        <div className="absolute bottom-4 left-4 flex flex-col z-20 pointer-events-none">
                          <span className="font-clash text-[8px] text-[var(--red)] tracking-widest uppercase mb-1">ID: {creator.id}</span>
                          <span className="font-supertalls text-2xl md:text-3xl text-[var(--black)] leading-none">{creator.name}</span>
                        </div>
                      </div>
                    </ParticleFlyer>
                  ))}
                </div>
              </div>

            </div>
          </section>


          {/* EVIDENCE BOARD SECTION */}
          <section id="section-works" className="sticky top-0 relative w-full min-h-screen flex flex-col justify-center py-24 bg-[#050505] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[15] overflow-hidden">
            {/* Header Container */}
            <div className="w-full max-w-[90rem] mx-auto relative z-10 pl-4 sm:pl-8 md:pl-12 lg:pl-[5%] pr-4 md:pr-12 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-6 gap-6">
                <ParticleFlyer delay={0.1}>
                  <motion.h2 className="font-supertalls text-[clamp(40px,8vw,80px)] leading-none text-[var(--black)] pointer-events-auto block m-0">
                    EVIDENCE BOARD
                  </motion.h2>
                </ParticleFlyer>

                <ParticleFlyer delay={0.2} className="flex items-end gap-8">
                  {/* Functional Navigation Arrows */}
                  <div className="hidden md:flex gap-2 mb-1">
                    <button onClick={() => handleArrowScroll(-1)} className="w-8 h-8 flex items-center justify-center border border-[var(--border)] bg-[#050505]/70 backdrop-blur-sm transition-colors text-[var(--muted)] hover:text-[var(--red)] hover:border-[var(--red)] cursor-none">&lt;</button>
                    <button onClick={() => handleArrowScroll(1)} className="w-8 h-8 flex items-center justify-center border border-[var(--border)] bg-[#050505]/70 backdrop-blur-sm transition-colors text-[var(--muted)] hover:text-[var(--red)] hover:border-[var(--red)] cursor-none">&gt;</button>
                  </div>
                  
                  {/* Right Meta Data */}
                  <div className="text-right font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col gap-1">
                    <span>SECTOR: {activeSector.replace('_', ' ')}</span>
                    <span>SCANNING: <span className="text-[var(--red)]">ACTIVE</span></span>
                  </div>
                </ParticleFlyer>
              </div>
              
              {/* Category Filter Tabs */}
              <ParticleFlyer delay={0.3} className="pt-6 pb-2">
                <div className="flex gap-4 md:gap-8 overflow-x-auto hide-scrollbar cursor-none">
                  {EVIDENCE_SECTORS.map((sector) => (
                    <button
                      key={sector.id}
                      onClick={() => { SFX.click(); setActiveSector(sector.id); }}
                      onMouseEnter={() => SFX.hover()}
                      className={`font-clash text-[9px] md:text-[10px] tracking-widest whitespace-nowrap transition-colors duration-300 flex items-center gap-2 cursor-none ${
                        activeSector === sector.id ? "text-[var(--red)] font-bold" : "text-[var(--muted)] hover:text-[var(--black)]"
                      }`}
                    >
                      {activeSector === sector.id && <span className="w-1.5 h-1.5 bg-[var(--red)] rounded-full animate-pulse" />}
                      {sector.label}
                    </button>
                  ))}
                </div>
              </ParticleFlyer>
            </div>

            {/* Horizontal Scroll-Locked Carousel */}
            <div className="w-full relative z-20">
               <div 
                  ref={carouselRef}
                  className="flex overflow-x-auto hide-scrollbar gap-6 md:gap-8 pb-12 snap-x snap-mandatory pl-4 sm:pl-8 md:pl-12 lg:pl-[10vw] pr-[10vw]"
               >
                 <AnimatePresence mode="popLayout">
                   {filteredEvidence.map((work, i) => (
                     <motion.div 
                        key={work.id} 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="shrink-0"
                     >
                       <div className="flex flex-col gap-4 w-[280px] md:w-[320px] lg:w-[360px] snap-center group cursor-none" onClick={() => { SFX.click(); setCaseStudyItem(work); }}>

                         {/* Glass Card */}
                         <div className="relative aspect-[3/4] border border-[var(--border)] bg-[#050505] overflow-hidden transition-all duration-500 hover:border-[var(--red)]/50">
                           {/* Animated Top Red Line */}
                           <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--red)] z-20 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                           
                           {/* Vertical Label */}
                           <div className="absolute top-6 left-3 font-clash text-[8px] tracking-[0.3em] text-[var(--red)] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                             EVIDENCE #{work.id}
                           </div>
                           
                           {/* Image (Grayscale to Color) */}
                           <img src={work.img} alt={work.title} loading="lazy" className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" />
                           
                           {/* Vignette Shadow */}
                           <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80 pointer-events-none" />
                         </div>

                         {/* Title Area */}
                         <div className="flex flex-col gap-1 px-1">
                           <span className="font-clash text-[10px] text-[var(--red)] tracking-widest">EVIDENCE #{work.id}</span>
                           <span className="font-supertalls text-3xl md:text-4xl text-[var(--black)] tracking-wide">{work.title}</span>
                         </div>

                       </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>
            </div>
          </section>



          {/* ================= POSTS SHOWCASE (3D COVER FLOW) ================= */}
          <section id="section-posts" className="sticky top-0 relative w-full min-h-screen flex flex-col justify-center py-24 bg-[var(--bg)] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[16] overflow-hidden">
            <div className="w-full max-w-[90rem] mx-auto relative z-10 pl-4 sm:pl-8 md:pl-12 lg:pl-[5%] pr-4 md:pr-12 mb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-6 gap-6">
                <ParticleFlyer delay={0.1}>
                  <motion.h2 className="font-supertalls text-[clamp(40px,8vw,80px)] leading-none text-[var(--black)] pointer-events-auto block m-0">
                    POSTS SHOWCASE
                  </motion.h2>
                </ParticleFlyer>
                <ParticleFlyer delay={0.2}>
                  <div className="text-right font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col gap-1">
                    <span>FILE: {POSTS_DATA[activePostIndex]?.id}</span>
                    <span>MODE: <span className="text-[var(--red)]">COVER FLOW</span></span>
                  </div>
                </ParticleFlyer>
              </div>
            </div>

            {/* 3D Cover Flow Container */}
            <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ perspective: '1200px', height: '500px' }}>
              <motion.div
                className="relative w-full h-full flex items-center justify-center cursor-none"
                style={{ transformStyle: 'preserve-3d' }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  const threshold = 50;
                  if (info.offset.x < -threshold) {
                    setActivePostIndex(prev => (prev + 1) % POSTS_DATA.length);
                  } else if (info.offset.x > threshold) {
                    setActivePostIndex(prev => (prev - 1 + POSTS_DATA.length) % POSTS_DATA.length);
                  }
                }}
              >
                {POSTS_DATA.map((post, i) => {
                  let offset = i - activePostIndex;
                  const half = Math.floor(POSTS_DATA.length / 2);
                  if (offset > half) offset -= POSTS_DATA.length;
                  if (offset < -half) offset += POSTS_DATA.length;
                  const absOffset = Math.abs(offset);
                  const isActive = offset === 0;
                  const translateX = offset * 280;
                  const rotateY = offset * -35;
                  const translateZ = isActive ? 0 : -150 * absOffset;
                  const scale = isActive ? 1 : Math.max(0.7, 0.85 - absOffset * 0.05);
                  const opacity = isActive ? 1 : Math.max(0.4, 1 - absOffset * 0.25);
                  const blur = isActive ? 0 : Math.min(absOffset * 2, 6);

                  return (
                    <motion.div
                      key={post.id}
                      className="absolute cursor-none"
                      animate={{
                        x: translateX,
                        scale,
                        opacity,
                        rotateY,
                        z: translateZ,
                        filter: `blur(${blur}px)`,
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 26, mass: 1 }}
                      style={{ zIndex: 100 - absOffset }}
                      onClick={() => setActivePostIndex(i)}
                    >
                      <div className={`relative w-[260px] md:w-[300px] aspect-[3/4] border bg-[#050505] overflow-hidden group transition-all duration-300 ${isActive ? 'border-[var(--red)]/60 shadow-[0_0_40px_rgba(255,0,0,0.3)]' : 'border-[var(--border)]'}`}>
                        {/* Top red line on active */}
                        <div className={`absolute top-0 left-0 w-full h-[2px] bg-[var(--red)] z-20 transition-transform duration-500 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />

                        {/* Crosshairs */}
                        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[var(--red)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[var(--red)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[var(--red)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[var(--red)] z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Image */}
                        <img
                          src={post.img}
                          alt={post.title}
                          className={`w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100 ${isActive ? 'opacity-90 grayscale-0' : 'opacity-40 grayscale'}`}
                        />

                        {/* Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/30 to-transparent opacity-80 pointer-events-none" />

                        {/* Reflection/Glow on active */}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--red)]/10 to-transparent pointer-events-none" />
                        )}

                        {/* Details */}
                        <div className="absolute bottom-4 left-4 right-4 flex flex-col z-20 pointer-events-none">
                          <span className="font-clash text-[8px] text-[var(--red)] tracking-widest uppercase mb-1">{post.subtitle}</span>
                          <span className="font-supertalls text-2xl md:text-3xl text-[var(--black)] leading-none">{post.title}</span>
                        </div>

                        {/* ID badge */}
                        <div className="absolute top-3 right-3 font-clash text-[7px] text-[var(--muted)] tracking-widest z-20">
                          {post.id}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Navigation Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {POSTS_DATA.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePostIndex(i)}
                  className={`w-2 h-2 transition-all duration-300 cursor-none ${
                    i === activePostIndex
                      ? 'bg-[var(--red)] scale-125 shadow-[0_0_8px_rgba(255,0,0,0.8)]'
                      : 'bg-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                />
              ))}
            </div>

            {/* Active Post Info */}
            <div className="flex justify-center mt-6">
              <div className="font-clash text-[9px] tracking-widest text-[var(--muted)] flex items-center gap-4">
                <span>DRAG TO NAVIGATE</span>
                <span className="text-[var(--red)]">|</span>
                <span>{activePostIndex + 1} / {POSTS_DATA.length}</span>
              </div>
            </div>
          </section>


          {/* ================= TOOLKIT (CARD) ================= */}
          <div className="sticky top-0 w-full bg-[#050505] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[17] overflow-hidden">
            <ToolkitSection />
          </div>

          {/* ================= DINO GAME (CARD) ================= */}
          <div className="sticky top-0 w-full bg-[var(--bg)] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[18] overflow-hidden">
            <DinoRunner />
          </div>

          {/* ================= CONTACT FOOTER SECTION ================= */}
          <section id="section-contact" className="sticky top-0 relative w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-12 bg-[var(--bg)] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] z-[19] pb-12 overflow-hidden">
            {/* Premiere Pro Timeline Background */}
            <PremiereTimeline />

            <ParticleFlyer delay={0.1} className="w-full max-w-5xl mx-auto flex flex-col items-center mt-24">
               
               {/* Marker for Red Thread to latch onto */}
               <div id="channel-open-marker" className="text-[var(--red)] font-clash text-[10px] tracking-[0.2em] flex items-center gap-2 mb-16">
                 <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-[var(--red)] rounded-full" /> 
                 CHANNEL OPEN
               </div>
               
               {/* Typography */}
               <div className="relative mb-16 text-center flex flex-col items-center">
                 <h2 className="font-supertalls text-[clamp(60px,12vw,140px)] leading-none text-[var(--black)] m-0 fx-glitch" data-text="GET IN TOUCH">
                   GET IN TOUCH
                 </h2>
               </div>

               {/* Dossier Contact Details */}
               <div className="w-full md:w-auto border border-[var(--border)] bg-[#050505]/70 backdrop-blur-sm p-8 md:p-12 flex flex-col md:flex-row gap-12 md:gap-24 transition-all duration-500 hover:border-[var(--red)]/40 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--red)] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  
                  <div className="flex flex-col gap-8 justify-center">
                      {/* Phone */}
                      <div className="flex flex-col gap-2">
                         <span className="font-clash text-[9px] tracking-widest text-[var(--muted)] uppercase">// Secure_Line [Phone]</span>
                         <div className="flex items-center gap-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            <a href="tel:+919027373226" className="font-clash text-sm md:text-lg text-[var(--black)] hover:text-[var(--red)] transition-colors cursor-none border-b border-[var(--border)] hover:border-[var(--red)] pb-1">
                              +91 9027373226
                            </a>
                         </div>
                      </div>
                      
                      {/* Email */}
                      <div className="flex flex-col gap-2">
                         <span className="font-clash text-[9px] tracking-widest text-[var(--muted)] uppercase">// Direct_Comms [Email]</span>
                         <div className="flex items-center gap-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <a href="mailto:thearnavrai666@gmail.com" className="font-clash text-sm md:text-lg text-[var(--black)] hover:text-[var(--red)] transition-colors cursor-none border-b border-[var(--border)] hover:border-[var(--red)] pb-1">
                              thearnavrai666@gmail.com
                            </a>
                         </div>
                      </div>
                  </div>

                  <div className="flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-[var(--border)] pt-8 md:pt-0 md:pl-12">
                      <span className="font-clash text-[9px] tracking-widest text-[var(--red)] uppercase mb-6 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse">
                        ▼ INITIATE_LINK
                      </span>
                      
                      <a 
                        href="https://linktr.ee/thearnavrai" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex flex-col items-center gap-4 group/link cursor-none"
                      >
                        <div className="w-16 h-16 bg-[var(--red)] rounded-[1rem] flex items-center justify-center transform group-hover/link:scale-110 group-hover/link:-rotate-[10deg] transition-all duration-300 shadow-[0_0_20px_rgba(255,0,0,0.4)] relative">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"></line></svg>
                        </div>
                        <span className="font-clash text-xs border-b border-[var(--black)] pb-0.5 text-[var(--black)] group-hover/link:text-[var(--red)] group-hover/link:border-[var(--red)] transition-colors">
                          My social accounts.
                        </span>
                      </a>
                  </div>
               </div>
            </ParticleFlyer>

            {/* Absolute bottom details */}
            <div className="absolute bottom-32 md:bottom-36 left-1/2 -translate-x-1/2 font-clash text-[10px] tracking-widest text-[var(--muted)] flex gap-1.5 items-center whitespace-nowrap">
              <span>Country of origin:</span>
              <span className="text-white font-bold flex gap-[1px]">
                <span className="text-[#138808]">I</span>
                <span className="text-white">n</span>
                <span className="text-[#FF9933]">dia</span>
              </span>
            </div>

            <div className="absolute bottom-32 md:bottom-36 right-6 md:right-12 font-clash text-[10px] tracking-widest text-[var(--muted)] text-right">
              SYS: <span className="text-[var(--red)] font-bold animate-pulse">OFFLINE</span><br/>
              END_OF_FILE
            </div>

            {/* THE SIGNATURE — Hornet brand mark */}
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 font-clash text-[10px] tracking-widest text-[var(--red)] opacity-70 pointer-events-none">
              <img src="/assets/photos/hornet.png" alt="Hornet" className="w-16 md:w-20 brightness-150" />
              <span>#stAycReative</span>
            </div>
          </section>


        </div>{/* End continuous scroll container wrapper */}

        {/* ================= CASE STUDY MODAL ================= */}
        <AnimatePresence>
          {caseStudyItem && (
            <CaseStudyModal
              item={caseStudyItem}
              onClose={() => setCaseStudyItem(null)}
              onNext={() => {
                const allItems = EVIDENCE_DATA;
                const idx = allItems.findIndex(x => x.id === caseStudyItem.id);
                setCaseStudyItem(allItems[(idx + 1) % allItems.length]);
              }}
              onPrev={() => {
                const allItems = EVIDENCE_DATA;
                const idx = allItems.findIndex(x => x.id === caseStudyItem.id);
                setCaseStudyItem(allItems[(idx - 1 + allItems.length) % allItems.length]);
              }}
            />
          )}
        </AnimatePresence>

        {/* ================= PRELOADER ================= */}
        <AnimatePresence>
          {!hasLoaded && (
            <motion.div
              key="preloader"
              className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050505]"
              initial={{ y: 0, boxShadow: '0 0 0px rgba(255,0,0,0)' }}
              exit={{ y: '-100%', boxShadow: '0 20px 40px rgba(255,0,0,0.3), 0 10px 20px rgba(0,0,0,0.8)' }}
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

              {/* Bottom edge glow that intensifies on exit */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px z-30 pointer-events-none"
                initial={{ opacity: 0, boxShadow: '0 0 0px rgba(255,0,0,0)' }}
                exit={{ opacity: 1, boxShadow: '0 0 15px 4px rgba(255,0,0,0.5), 0 0 30px 8px rgba(255,0,0,0.2)' }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeIn' }}
                style={{ background: 'var(--red)' }}
              />

              {/* PRELOADER CONTENT */}
              <motion.div
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center"
              >
                {/* Multilingual greeting — Windows OOBE style */}
                <GreetingCycle progress={loadingProgress} />

                {/* Bottom: percentage + progress bar */}
                <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-16 md:right-16 flex flex-col items-end gap-4">
                  <div className="font-bebas text-[clamp(60px,10vw,140px)] leading-none text-[var(--black)]">
                    {Math.floor(loadingProgress)}%
                  </div>
                  <div className="w-full h-[1px] bg-[var(--border)] relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
                      style={{ left: `${loadingProgress}%` }}
                    >
                      <div className="absolute right-[50%] h-[2px] w-[100px] origin-right" style={{ background: "linear-gradient(to right, transparent, var(--red))", boxShadow: '0 0 10px rgba(255,0,0,0.8)' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM PROGRESS BAR WITH SCANNER LINE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: hasLoaded ? 1 : 0, y: hasLoaded ? 0 : 20 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-12 left-8 right-8 md:left-16 md:right-16 h-[1px] z-[100] pointer-events-none hidden md:block"
        >
          {/* Overflow wrapper: Hides horizontal bleed without cutting off the vertical glow */}
          <div className="absolute -top-8 -bottom-8 left-0 right-0 overflow-hidden">
            {/* The actual track line */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[1px] bg-[var(--border)]" />
            
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
              style={{ left: starLeft }}
            >
              <motion.div
                className="absolute right-[50%] h-[2px] w-[100px] origin-right"
                style={{
                  background: "linear-gradient(to right, transparent, var(--red))",
                  rotate: tailRotate,
                  scaleX: tailScaleX,
                  opacity: tailOpacity,
                  boxShadow: '0 0 10px rgba(255,0,0,0.8)'
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Dynamic Target Coordinates attached to cursor */}
        {hasLoaded && <TrackedCoordinates />}

        {/* OUTER CURSOR (TRAILING RED OUTLINE) */}
        <motion.div
          className="fixed top-0 left-0 z-[9998] pointer-events-none rounded-full border border-[var(--red)] w-8 h-8"
          style={{ x: wellX, y: wellY, translateX: '-50%', translateY: '-50%' }}
          transition={{ duration: 0.2 }}
        />

        {/* INNER CURSOR (SQUARE) */}
        <motion.div
          className="fixed top-0 left-0 z-[9999] pointer-events-none flex items-center justify-center"
          style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
        >
          <div className="w-1.5 h-1.5 bg-[var(--black)] shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        </motion.div>
      </div>
    </CursorContext.Provider>
  );
}