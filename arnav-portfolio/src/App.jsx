import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useVelocity, useMotionTemplate, useScroll, useMotionValueEvent } from 'framer-motion';

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Poppins:wght@600&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,300,400,500,600,700&display=swap');

  /* --- CUSTOM SUPERTALLS FONT FIXED DEFINITIONS --- */
  @font-face {
    font-family: 'Supertalls';
    /* Loading directly from remote URL */
    src: url('https://files.catbox.moe/p0is34.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'Supertalls';
    src: url('/Supertalls Italic.otf') format('opentype');
    font-weight: normal;
    font-style: italic;
    font-display: swap;
  }

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
    background-image: radial-gradient(var(--border) 1px, transparent 1px);
    background-size: 32px 32px;
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
  .font-supertalls { font-family: 'Supertalls', serif; }

  /* Pure White Text */
  .cinematic-text {
    font-family: 'Supertalls', serif;
    color: #FFFFFF;
    letter-spacing: 0.02em;
  }
  
  /* Unlit Dark Base Text */
  .base-cinematic-text {
    font-family: 'Supertalls', serif;
    color: rgba(255, 255, 255, 0.15); 
    letter-spacing: 0.02em;
  }

  @keyframes scan {
    0% { top: 0%; opacity: 0; }
    10% { opacity: 0.5; }
    90% { opacity: 0.5; }
    100% { top: 100%; opacity: 0; }
  }

  @keyframes spin-forward { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes spin-backward { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
`;

// Global contexts
const CursorContext = React.createContext({ cursorX: null, cursorY: null });

// --- PHYSICS ENGINES ---

const ParticleFlyer = ({ children, className, style, delay = 0 }) => (
  <motion.div
    className={className} style={style}
    initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, duration: 0.8, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const ParticleTextSwap = ({ text }) => (
  <span className="relative inline-flex items-center justify-center whitespace-nowrap">
    <AnimatePresence mode="wait">
      <motion.span
        key={text}
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
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

// --- RUNNING TIMECODE ---
const Timecode = () => {
  const [time, setTime] = useState("");
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame = (frame + 1) % 30;
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      const ff = String(frame).padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}:${ff}`);
    }, 1000 / 10);
    return () => clearInterval(interval);
  }, []);
  return <span className="text-[var(--red)]">{time}</span>;
};

// --- DYNAMIC HUD COORDINATES ---
const TrackedCoordinates = () => {
  const { cursorX, cursorY } = useContext(CursorContext);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let intervalId;
    intervalId = setInterval(() => {
      if (cursorX && cursorY) {
        setCoords({ x: Math.floor(cursorX.get()), y: Math.floor(cursorY.get()) });
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, [cursorX, cursorY]);

  const springX = useSpring(cursorX, { damping: 40, stiffness: 300, mass: 0.5 });
  const springY = useSpring(cursorY, { damping: 40, stiffness: 300, mass: 0.5 });

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[110] flex items-center gap-1.5 font-clash text-[8px] md:text-[9px] text-[var(--red)] tracking-widest mix-blend-difference"
      style={{ x: springX, y: springY, translateX: '24px', translateY: '24px' }}
    >
      <div className="w-1.5 h-1.5 bg-[var(--red)]" />
      <span>X {coords.x} Y {coords.y}</span>
    </motion.div>
  );
};

const UnicornBackground = ({ active }) => {
  useEffect(() => {
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false };
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.9/dist/unicornStudio.umd.js";
      script.onload = () => { if (window.UnicornStudio.init) window.UnicornStudio.init(); };
      document.head.appendChild(script);
    } else if (window.UnicornStudio.init) {
      window.UnicornStudio.init();
    }

    const interval = setInterval(() => {
      document.querySelectorAll('a[href*="unicorn.studio"]').forEach(node => {
        node.style.display = 'none';
        if(node.parentElement) {
          node.parentElement.style.display = 'none';
          node.parentElement.style.opacity = '0';
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: active ? 0.6 : 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <div className="w-full h-full" data-us-project="3dLwfaI5FrrmnY0LS0oc"></div>
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
    <div className="relative group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[var(--red)] border-2 border-[#FF5555] text-white transition-all duration-300 cursor-none shadow-[0_0_20px_rgba(255,0,0,0.5)] hover:shadow-[0_0_40px_rgba(255,0,0,0.9)] hover:scale-110">
      {children}
      {/* Sleek Tooltip that slides up on hover */}
      <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 font-clash text-[10px] md:text-[11px] font-bold tracking-widest text-[var(--black)] bg-[#111] border border-[var(--red)] px-4 py-2 rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-2xl translate-y-2 group-hover:translate-y-0">
        {label}
      </div>
    </div>
  );
};

const OrbitalRing = ({ radius, duration, reverse, items }) => {
  const spin = reverse ? "spin-backward" : "spin-forward";
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: radius * 2, height: radius * 2 }}>
      <div className="absolute inset-0 rounded-full border border-dashed border-[var(--border)] opacity-40 pointer-events-none" />
      <div className="absolute inset-0" style={{ animation: `${spin} ${duration}s linear infinite`, willChange: 'transform' }}>
        {items.map((item, i) => {
          const angle = (i * 360) / items.length;
          const x = Math.cos(angle * Math.PI / 180) * radius;
          const y = Math.sin(angle * Math.PI / 180) * radius;
          return (
            <div key={i} className="absolute flex justify-center items-center pointer-events-auto" style={{ top: `calc(50% + ${y}px)`, left: `calc(50% + ${x}px)`, transform: 'translate(-50%, -50%)' }}>
              <div style={{ animation: `${reverse ? 'spin-forward' : 'spin-backward'} ${duration}s linear infinite`, willChange: 'transform' }}>
                <GalaxyIcon label={item.label}>
                  {item.icon}
                </GalaxyIcon>
              </div>
            </div>
          );
        })}
      </div>
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



// ================= HERO SCREEN ISOLATED COMPONENTS =================

const HeroBackground = ({ isBase, hasLoaded }) => {
  const textClass = isBase ? "base-cinematic-text" : "cinematic-text";

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <div className="absolute top-[42%] left-4 md:left-8 -translate-y-1/2 flex flex-col items-start" style={{ fontSize: 'clamp(60px, 12vw, 160px)' }}>
        <ParticleFlyer delay={hasLoaded ? 0.1 : 0} className="flex justify-start relative z-10">
          {/* Added tracking to space the letters horizontally */}
          <h1 className={`${textClass} font-supertalls leading-none text-left tracking-[0.05em]`}>ARNAV</h1>
        </ParticleFlyer>
        
        {/* Removed the ml-8 md:ml-24 horizontal indent to snap it back to the left */}
        <ParticleFlyer delay={hasLoaded ? 0.2 : 0} className="flex justify-start relative z-20 mt-2 md:mt-4">
          <h1 className={`${textClass} font-supertalls leading-none text-left tracking-[0.05em]`}>RAI</h1>
        </ParticleFlyer>
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
        <motion.div id={isBase ? "top-secret-marker" : undefined} animate={!isBase ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}} transition={{ repeat: Infinity, duration: 3 }} className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_white]" />
        <div className="border border-[var(--red)]/50 text-[var(--red)] text-[9px] md:text-[10px] px-4 py-1.5 tracking-[0.2em] bg-[var(--bg)]/50 backdrop-blur-sm font-clash">
          TOP SECRET // CASE #2026
        </div>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.2 : 0} className={`absolute top-12 right-6 md:top-8 md:right-8 font-clash text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col items-end gap-1 transition-opacity duration-300 ${hudClass}`}>
        <Timecode />
        <span>ISO 800</span>
        <div className="flex flex-col border border-[var(--border)] mt-2 bg-[var(--bg)]/50 backdrop-blur-sm">
          <span className="px-2 py-1 border-b border-[var(--border)] text-[var(--muted)] transition-colors">IN</span>
          <span className="px-2 py-1 text-[var(--red)] font-bold">EN</span>
        </div>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.4 : 0} className={`absolute top-[20%] left-4 md:left-8 -translate-y-1/2 -rotate-90 origin-center flex items-center gap-4 font-clash text-[10px] tracking-[0.2em] transition-opacity duration-300 ${hudClass}`}>
        <span className="font-bebas text-2xl text-white rotate-90">A.</span>
        <span className="text-white font-bold">Portfolio</span>
      </ParticleFlyer>

      {/* Magnetic Floating Elements */}
      <ParticleFlyer delay={hasLoaded ? 0.3 : 0} className={`absolute top-[15%] right-[10%] md:right-[12%] z-[100] transition-opacity duration-300 ${hudClass}`}>
        <span className="font-clash text-[10px] md:text-[11px] text-[var(--black)] bg-[#1A1A1A]/90 px-3 py-1.5 rotate-[6deg] inline-block border border-[var(--border)] shadow-xl">SERIOUSLY</span>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.4 : 0} className={`absolute top-[23%] right-[8%] md:right-[10%] z-[100] transition-opacity duration-300 ${hudClass}`}>
        <span className="font-clash text-[10px] md:text-[11px] text-[var(--black)] bg-[#1A1A1A]/90 px-3 py-1.5 -rotate-[8deg] inline-block border border-[var(--border)] shadow-xl">GOOD</span>
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
        <span>LAT: 48.8566 N</span>
        <span>LON: 2.3522 E</span>
        <span>SECURE_GRID_99</span>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.5 : 0} className={`absolute bottom-6 right-6 md:bottom-4 md:right-12 font-clash text-[7px] md:text-[8px] text-right text-[var(--muted)] tracking-widest leading-loose transition-opacity duration-300 ${hudClass}`}>
        12187eme enqueteur sur cette affaire<br/>
        SYS: DIAGNOSTIC<br/>
        <span className="text-[var(--red)] font-bold">STABLE</span>
      </ParticleFlyer>

      {/* Removed the dynamic hudClass so this block stays permanently visible at full opacity */}
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

      // Start circle latches exactly onto the white TOP SECRET marker
      const topEl = document.getElementById('top-secret-marker');
      let topY = vh * 0.15; // Fallback
      
      if (topEl && containerRef.current) {
        const topRect = topEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate precise vertical center of the white dot
        topY = topRect.top - containerRect.top + (topRect.height / 2);
      }
      
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
    
    const timeout = setTimeout(updatePath, 200);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [hasLoaded]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
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

// --- BOLD ICONS ---
const AdobeIcon = ({ text }) => (
  <span className="font-clash font-bold text-2xl md:text-3xl tracking-tighter drop-shadow-md text-white">
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
  { id: "01", sector: "KINETIC_CUTS", title: "Ophelia", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop" },
  { id: "02", sector: "KINETIC_CUTS", title: "J. Pancras", img: "https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=800&auto=format&fit=crop" },
  { id: "03", sector: "KINETIC_CUTS", title: "2026 Greet", img: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=800&auto=format&fit=crop" },
  { id: "04", sector: "KINETIC_CUTS", title: "Ciao", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop" },
  // Social Grids
  { id: "05", sector: "GRID_ARCHIVES", title: "H.A.N.D.S. Grid", img: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800&auto=format&fit=crop" },
  { id: "06", sector: "GRID_ARCHIVES", title: "Apogée Sequence", img: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=800&auto=format&fit=crop" },
  // Social Posts
  { id: "07", sector: "CONTENT_DEPLOYMENTS", title: "Cyberpunk Campaign", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop" },
  // Logos
  { id: "08", sector: "BRAND_IDENTITIES", title: "Nexus Logomark", img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop" },
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

  const maskImage = useMotionTemplate`radial-gradient(900px circle at ${cursorX}px ${cursorY}px, black 0%, rgba(0,0,0,0.3) 40%, transparent 70%)`;

  useEffect(() => {
    if (!hasLoaded) return;
    const interval = setInterval(() => setTitleIndex(prev => (prev + 1) % titles.length), 5000);
    return () => clearInterval(interval);
  }, [hasLoaded, titles.length]);

  useEffect(() => {
    setIsMounted(true);

    let resourcesLoaded = 0;
    const totalResources = 2; 

    const checkResourceLoad = () => {
      resourcesLoaded++;
      const newTarget = 15 + (resourcesLoaded / totalResources) * 85;
      setTargetProgress(newTarget);
    };

    if (document.readyState === 'complete') checkResourceLoad();
    else window.addEventListener('load', checkResourceLoad);

    const img = new Image();
    img.src = "https://i.ibb.co/JbHp8w7/Whats-App-Image-2026-04-25-at-1-18-58-PM-Photoroom.png";
    img.onload = checkResourceLoad;
    img.onerror = checkResourceLoad;

    const fallbackTimer = setTimeout(() => { setTargetProgress(100); }, 5000);

    return () => {
      window.removeEventListener('load', checkResourceLoad);
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (loadingProgress === 100) return;
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
  }, [targetProgress, loadingProgress]);

  useEffect(() => {
    if (loadingProgress === 100) {
      const delay = setTimeout(() => {
        setHasLoaded(true);
        document.body.classList.remove('loading');
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
      <div className="relative w-full min-h-screen bg-[var(--bg)] font-clash text-[var(--black)] selection:bg-[var(--red)] selection:text-[var(--bg)] overflow-x-hidden">
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

        {/* DYNAMIC BACKGROUNDS */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <UnicornBackground active={true} />
        </div>

        {/* THE DYNAMIC CURVED RED THREAD */}
        <CurvedThread hasLoaded={hasLoaded} />

        {/* ================= HERO SECTION ================= */}
        <section id="section-hero" className="relative w-full h-screen flex items-center justify-center z-10">
          {/* Dynamic Target Coordinates attached to cursor */}
          {hasLoaded && <TrackedCoordinates />}

          {/* BACKGROUND LAYER (z-10): Galaxy & Main Typography */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <HeroBackground isBase={true} hasLoaded={hasLoaded} />
            <motion.div className="absolute inset-0 pointer-events-none" style={{ maskImage, WebkitMaskImage: maskImage }}>
              <HeroBackground isBase={false} hasLoaded={hasLoaded} />
            </motion.div>
          </div>

          {/* GALAXY LAYER (z-15) - rendered once for performance */}
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none scale-50 md:scale-75 xl:scale-100 z-[15]">
            <OrbitalRing 
              radius={320} 
              duration={35} 
              reverse={false} 
              items={[
                { label: "Adobe Photoshop", icon: <AdobeIcon text="Ps"/> },
                { label: "Adobe After Effects", icon: <AdobeIcon text="Ae"/> },
                { label: "Adobe Premiere Pro", icon: <AdobeIcon text="Pr"/> },
                { label: "Adobe Illustrator", icon: <AdobeIcon text="Ai"/> }
              ]} 
            />
            <OrbitalRing 
              radius={230} 
              duration={25} 
              reverse={true} 
              items={[
                { label: "Sound Design", icon: <IconSound/> },
                { label: "Storytelling", icon: <IconStory/> },
                { label: "Color Grading", icon: <IconColor/> },
                { label: "Direction", icon: <IconDirection/> }
              ]} 
            />
            <OrbitalRing 
              radius={140} 
              duration={15} 
              reverse={false} 
              items={[
                { label: "Noida, India", icon: <IconLocation/> },
                { label: "3+ Years", icon: <IconClock/> }
              ]} 
            />
            <motion.div initial={{ scale: 0 }} animate={{ scale: hasLoaded ? 1 : 0 }} transition={{ delay: 0.7, type: "spring", stiffness: 150, damping: 20 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg)] px-6 py-2.5 rounded-full border border-[var(--border)] text-[var(--red)] font-bold tracking-widest shadow-xl">
              #stAycReative
            </motion.div>
          </div>

          {/* PORTRAIT LAYER (z-90) */}
          <motion.div
            initial={{ x: "-50%", y: 100, opacity: 0 }}
            animate={{ x: "-50%", y: hasLoaded ? 0 : 100, opacity: hasLoaded ? 1 : 0, filter: hasLoaded ? "blur(0px)" : "blur(20px)", scale: hasLoaded ? 1 : 0.9 }}
            transition={{ delay: hasLoaded ? 0.8 : 0, duration: 1, ease: "easeOut" }}
            className="absolute bottom-0 left-1/2 z-[90] pointer-events-none w-[130vw] sm:w-[110vw] md:w-[95vw] lg:w-[85vw] xl:w-[75vw] 2xl:w-[70vw] origin-bottom"
            style={{ minHeight: '60vh' }}
          >
            <img src="https://i.ibb.co/JbHp8w7/Whats-App-Image-2026-04-25-at-1-18-58-PM-Photoroom.png" alt="Arnav Rai" className="w-full h-auto min-h-[60vh] object-bottom drop-shadow-[0_-10px_50px_rgba(0,0,0,0.8)]" style={{ objectFit: 'cover' }} />
          </motion.div>

          {/* FOREGROUND LAYER (z-100): HUD Elements & Subtitles */}
          <div className="absolute inset-0 z-[100] pointer-events-none">
            <HeroForeground isBase={true} hasLoaded={hasLoaded} titleIndex={titleIndex} titles={titles} />
            <motion.div className="absolute inset-0 pointer-events-none" style={{ maskImage, WebkitMaskImage: maskImage }}>
              <HeroForeground isBase={false} hasLoaded={hasLoaded} titleIndex={titleIndex} titles={titles} />
            </motion.div>
          </div>
        </section>


        {/* ================= CONTINUOUS SCROLL CONTENT ================= */}
        <div className="relative w-full pb-32 z-10">

          {/* ABOUT SECTION */}
          <section id="section-intro" className="relative w-full min-h-screen flex flex-col justify-center px-4 md:px-8 py-32">
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
                      
                      {/* Scanline */}
                      <div className="absolute left-0 w-full h-[2px] bg-[var(--red)] shadow-[0_0_12px_rgba(255,0,0,1)] z-20 opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2.5s_linear_infinite]" />
                      
                      <img src="https://i.ibb.co/JbHp8w7/Whats-App-Image-2026-04-25-at-1-18-58-PM-Photoroom.png" alt="Arnav Profile" className="w-full h-full object-cover object-top opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500" />
                      
                      <div className="absolute bottom-1 left-2 font-clash text-[6px] text-[var(--red)] tracking-widest">ID: PRF_001_AR</div>
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
                        {["After Effects", "Premiere Pro", "Photoshop", "DaVinci", "Figma", "Illustrator"].map((skill, index) => (
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

          {/* ================= WORKED WITH SECTION ================= */}
          <section id="section-worked-with" className="relative w-full min-h-screen flex flex-col justify-center py-24 z-10 overflow-hidden">
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
                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
                        
                        {/* Scanline */}
                        <div className="absolute left-0 w-full h-[2px] bg-[var(--red)] shadow-[0_0_12px_rgba(255,0,0,1)] z-20 opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2.5s_linear_infinite]" />

                        {/* Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />

                        {/* Social Link Overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 scale-50 group-hover:scale-100">
                          <a href={brand.link} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[var(--red)] flex items-center justify-center text-[var(--black)] hover:bg-white hover:text-[var(--red)] transition-colors cursor-none shadow-[0_0_20px_rgba(255,0,0,0.5)]">
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
                        <img src={creator.dp} alt={creator.name} className="w-full h-full object-cover opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
                        
                        {/* Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />

                        {/* Social Links Overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-3 scale-50 group-hover:scale-100">
                          {creator.ig && (
                            <a href={creator.ig} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[var(--red)] flex items-center justify-center text-[var(--black)] hover:bg-white hover:text-[var(--red)] transition-colors cursor-none shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                               <IgIcon/>
                            </a>
                          )}
                          {creator.yt && (
                            <a href={creator.yt} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[var(--red)] flex items-center justify-center text-[var(--black)] hover:bg-white hover:text-[var(--red)] transition-colors cursor-none shadow-[0_0_15px_rgba(255,0,0,0.4)]">
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
          <section id="section-works" className="relative w-full min-h-screen flex flex-col justify-center py-24 z-10 overflow-hidden">
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
                      onClick={() => setActiveSector(sector.id)}
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
                       <div className="flex flex-col gap-4 w-[280px] md:w-[320px] lg:w-[360px] snap-center group cursor-none">
                         
                         {/* Glass Card */}
                         <div className="relative aspect-[3/4] border border-[var(--border)] bg-[#050505] overflow-hidden transition-all duration-500 hover:border-[var(--red)]/50">
                           {/* Animated Top Red Line */}
                           <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--red)] z-20 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                           
                           {/* Vertical Label */}
                           <div className="absolute top-6 left-3 font-clash text-[8px] tracking-[0.3em] text-[var(--red)] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                             EVIDENCE #{work.id}
                           </div>
                           
                           {/* Image (Grayscale to Color) */}
                           <img src={work.img} alt={work.title} className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100" />
                           
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

          {/* ================= CONTACT FOOTER SECTION ================= */}
          <section id="section-contact" className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-12 z-10 pb-12">
            <ParticleFlyer delay={0.1} className="w-full max-w-5xl mx-auto flex flex-col items-center mt-24">
               
               {/* Marker for Red Thread to latch onto */}
               <div id="channel-open-marker" className="text-[var(--red)] font-clash text-[10px] tracking-[0.2em] flex items-center gap-2 mb-16">
                 <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-[var(--red)] rounded-full" /> 
                 CHANNEL OPEN
               </div>
               
               {/* Typography inspired by reference */}
               <div className="relative mb-16 text-center flex flex-col items-center">
                 <span className="font-dancing text-[var(--red)] text-[clamp(40px,8vw,70px)] absolute -top-6 -left-6 md:-top-10 md:-left-12 -rotate-[15deg] z-20 drop-shadow-lg">
                   Get in
                 </span>
                 <h2 className="font-supertalls text-[clamp(60px,12vw,140px)] leading-none text-[var(--black)] relative z-10 m-0">
                   TOUCH
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-12 font-clash text-[10px] tracking-widest text-[var(--muted)] flex gap-1.5 items-center whitespace-nowrap">
              <span>Country of origin:</span>
              <span className="text-white font-bold flex gap-[1px]">
                <span className="text-[#138808]">I</span>
                <span className="text-white">n</span>
                <span className="text-[#FF9933]">dia</span>
              </span>
            </div>
            
            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 font-clash text-[10px] tracking-widest text-[var(--muted)] text-right">
              SYS: <span className="text-[var(--red)] font-bold animate-pulse">OFFLINE</span><br/>
              END_OF_FILE
            </div>
          </section>

        </div>{/* End continuous scroll container wrapper */}

        {/* ================= PRELOADER ================= */}
        <AnimatePresence>
          {!hasLoaded && (
            <motion.div
              key="preloader"
              exit={{ opacity: 1 }} // Keep wrapper while curtains slide
              transition={{ duration: 1.2 }}
              className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
            >
              {/* TOP CURTAIN (Camel eyelid lid) */}
              <motion.div 
                initial={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ duration: 1.2, ease: [0.7, 0, 0.3, 1] }}
                className="absolute inset-0 bottom-1/2 bg-[#050505]"
              />
              
              {/* BOTTOM CURTAIN (Camel eyelid lid) */}
              <motion.div 
                initial={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 1.2, ease: [0.7, 0, 0.3, 1] }}
                className="absolute inset-0 top-1/2 bg-[#050505]"
              />

              {/* PRELOADER CONTENT (Fades as lids open) */}
              <motion.div 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center"
              >
                <div className="absolute top-1/2 left-8 right-8 md:left-16 md:right-16 h-[1px] bg-[var(--border)] -translate-y-1/2">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
                    style={{ left: `${loadingProgress}%` }}
                  >
                    <div className="absolute right-[50%] h-[2px] w-[100px] origin-right" style={{ background: "linear-gradient(to right, transparent, var(--red))", boxShadow: '0 0 10px rgba(255,0,0,0.8)' }} />
                  </div>
                </div>
                
                {/* Restored to Bottom Right */}
                <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 font-bebas text-[clamp(60px,10vw,140px)] leading-none text-[var(--black)]">
                  {Math.floor(loadingProgress)}%
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