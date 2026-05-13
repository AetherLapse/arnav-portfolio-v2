import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useVelocity, useMotionTemplate, useScroll, useMotionValueEvent } from 'framer-motion';

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Poppins:wght@600&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

  :root {
    --bg: #0A0A0A;          
    --black: #F5F0E8;       
    --red: #E63946;         
    --red-soft: rgba(230,57,70,0.08);
    --muted: #888888;       
    --border: rgba(255,255,255,0.12); 
    --white: #1A1A1A;       
  }

  body {
    background-color: var(--bg);
    background-image: radial-gradient(var(--border) 1px, transparent 1px);
    background-size: 32px 32px;
    color: var(--black);
    font-family: 'Space Mono', monospace;
    overflow-x: hidden; 
    overflow-y: auto;
    margin: 0;
    padding: 0;
    /* Native scrollbar hiding for smooth cinematic feel */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  body::-webkit-scrollbar {
    display: none;
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
  .font-space { font-family: 'Space Mono', monospace; }
  .font-playfair { font-family: 'Playfair Display', serif; }

  /* Pure White Text */
  .cinematic-text {
    font-family: 'Playfair Display', serif;
    color: #FFFFFF;
    letter-spacing: 0.02em;
  }
  
  /* Unlit Dark Base Text */
  .base-cinematic-text {
    font-family: 'Playfair Display', serif;
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
const MagneticRepulsion = ({ children, repulsionForce = 40, radius = 200, className = "" }) => {
  const { cursorX, cursorY } = useContext(CursorContext);
  const triggerRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.2 });

  useEffect(() => {
    let animationFrameId;
    const checkDistance = () => {
      if (!triggerRef.current || !cursorX || !cursorY) return;
      const rect = triggerRef.current.getBoundingClientRect();
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
    animationFrameId = requestAnimationFrame(checkDistance);
    return () => cancelAnimationFrame(animationFrameId);
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

  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.2 });

  useEffect(() => {
    let animationFrameId;
    const checkDistance = () => {
      if (!triggerRef.current || !cursorX || !cursorY) return;
      const rect = triggerRef.current.getBoundingClientRect();
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
    animationFrameId = requestAnimationFrame(checkDistance);
    return () => cancelAnimationFrame(animationFrameId);
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
  return <span>{time}</span>;
};

// --- DYNAMIC HUD COORDINATES ---
const TrackedCoordinates = () => {
  const { cursorX, cursorY } = useContext(CursorContext);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId;
    let frameCount = 0;
    const updatePos = () => {
      frameCount++;
      if (frameCount % 3 === 0 && cursorX && cursorY) {
        setCoords({ x: Math.floor(cursorX.get()), y: Math.floor(cursorY.get()) });
      }
      animationFrameId = requestAnimationFrame(updatePos);
    };
    animationFrameId = requestAnimationFrame(updatePos);
    return () => cancelAnimationFrame(animationFrameId);
  }, [cursorX, cursorY]);

  const springX = useSpring(cursorX, { damping: 40, stiffness: 300, mass: 0.5 });
  const springY = useSpring(cursorY, { damping: 40, stiffness: 300, mass: 0.5 });

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[110] flex items-center gap-1.5 font-space text-[8px] md:text-[9px] text-[var(--red)] tracking-widest mix-blend-difference"
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

const Pill = ({ variant, children }) => {
  const styles = {
    white: "bg-[var(--bg)] text-[var(--black)] border border-[var(--border)]",
    red: "bg-[var(--red)] text-[var(--black)] border border-[var(--red)]",
    gray: "bg-[var(--white)] text-[var(--muted)] border border-[var(--border)]"
  };
  return <div className={`whitespace-nowrap px-4 py-1.5 rounded-full font-space text-[11px] font-bold shadow-sm ${styles[variant]}`}>{children}</div>;
};

const OrbitalRing = ({ radius, duration, reverse, items, itemVariant }) => {
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
                <Pill variant={itemVariant}>{item}</Pill>
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
    const updatePhysics = () => {
      if (!cardRef.current || !cursorX || !cursorY) return;
      const rect = cardRef.current.getBoundingClientRect();
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
        cardRef.current.style.zIndex = 30;
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
          cardRef.current.style.zIndex = 10;
        } else {
          rawScale.set(1); rawX.set(0); rawY.set(0); rawRotateX.set(0); rawRotateY.set(0);
          cardRef.current.style.zIndex = 1;
        }
      }
      animationFrameId = requestAnimationFrame(updatePhysics);
    };
    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [cursorX, cursorY, rawX, rawY, rawScale, rawRotateX, rawRotateY]);

  return (
    <div style={{ perspective: 1200 }} className="w-full aspect-[9/16] relative z-1">
      <motion.div ref={cardRef} style={{ x, y, scale, rotateX, rotateY, WebkitMaskImage: '-webkit-radial-gradient(white, black)', maskImage: 'radial-gradient(white, black)' }} className={`w-full h-full rounded-3xl md:rounded-[2rem] bg-[var(--border)] relative group overflow-hidden shadow-xl cursor-none flex items-center justify-center origin-center`}>
        <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none z-0 rounded-[inherit]" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(400px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(230,57,70,0.8), transparent 40%)` }} />
        <div className="absolute inset-[1px] rounded-[inherit] bg-[var(--bg)]/95 backdrop-blur-md pointer-events-none z-0" />
        <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none z-10 rounded-[inherit]" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(600px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(255,255,255,0.08), transparent 40%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none z-10 rounded-[inherit]" />
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[var(--red)] flex items-center justify-center pl-1 scale-90 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(230,57,70,0.6)] transition-all duration-300 z-20 cursor-none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--bg)"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </motion.div>
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
          <h1 className={`${textClass} font-black leading-none text-left`} style={{ paddingBottom: '0.05em' }}>ARNAV</h1>
        </ParticleFlyer>
        <ParticleFlyer delay={hasLoaded ? 0.2 : 0} className="flex justify-start relative z-20" style={{ marginTop: '-0.15em' }}>
          <h1 className={`${textClass} font-black leading-none text-left`} style={{ paddingTop: '0.05em' }}>RAI</h1>
        </ParticleFlyer>
      </div>
    </div>
  );
};

const HeroForeground = ({ isBase, hasLoaded, titleIndex, titles }) => {
  const hudClass = isBase ? "opacity-[0.15] saturate-0" : "opacity-100";

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <ParticleFlyer delay={hasLoaded ? 0.2 : 0} className={`absolute top-12 left-6 md:top-8 md:left-8 font-space text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col gap-1 transition-opacity duration-300 ${hudClass}`}>
        <span>CAM_04 [REC]</span>
        <span className="text-[var(--red)] flex items-center gap-2">
          <motion.div animate={!isBase ? { opacity: [1, 0, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }} className="w-3 h-3 rounded-full bg-[var(--red)]" />
          SIGNAL__STRONG
        </span>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.3 : 0} className={`absolute top-12 left-0 right-0 w-full flex flex-col items-center justify-center gap-3 transition-opacity duration-300 ${hudClass}`}>
        <motion.div animate={!isBase ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}} transition={{ repeat: Infinity, duration: 3 }} className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_white]" />
        <div className="border border-[var(--red)]/50 text-[var(--red)] text-[9px] md:text-[10px] px-4 py-1.5 tracking-[0.2em] bg-[var(--bg)]/50 backdrop-blur-sm">
          TOP SECRET // CASE #2026
        </div>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.2 : 0} className={`absolute top-12 right-6 md:top-8 md:right-8 font-space text-[9px] md:text-[10px] tracking-widest text-[var(--muted)] flex flex-col items-end gap-1 transition-opacity duration-300 ${hudClass}`}>
        <Timecode />
        <span>ISO 800</span>
        <div className="flex flex-col border border-[var(--border)] mt-2 bg-[var(--bg)]/50 backdrop-blur-sm">
          <span className="px-2 py-1 border-b border-[var(--border)] text-[var(--muted)] transition-colors">IN</span>
          <span className="px-2 py-1 text-[var(--red)] font-bold">EN</span>
        </div>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.4 : 0} className={`absolute top-[20%] left-4 md:left-8 -translate-y-1/2 -rotate-90 origin-center flex items-center gap-4 font-space text-[10px] tracking-[0.2em] transition-opacity duration-300 ${hudClass}`}>
        <span className="font-bebas text-2xl text-white rotate-90">A.</span>
        <span className="text-white font-bold">Portfolio</span>
      </ParticleFlyer>

      {/* Magnetic Floating Elements */}
      <ParticleFlyer delay={hasLoaded ? 0.3 : 0} className={`absolute top-[15%] right-[10%] md:right-[12%] z-[100] transition-opacity duration-300 ${hudClass}`}>
        <MagneticAttraction radius={300} force={0.3}>
          <span className="font-space text-[10px] md:text-[11px] text-[var(--black)] bg-[#1A1A1A]/90 px-3 py-1.5 rotate-[6deg] inline-block border border-[var(--border)] shadow-xl">SERIOUSLY</span>
        </MagneticAttraction>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.4 : 0} className={`absolute top-[23%] right-[8%] md:right-[10%] z-[100] transition-opacity duration-300 ${hudClass}`}>
        <MagneticAttraction radius={300} force={0.4}>
          <span className="font-space text-[10px] md:text-[11px] text-[var(--black)] bg-[#1A1A1A]/90 px-3 py-1.5 -rotate-[8deg] inline-block border border-[var(--border)] shadow-xl">GOOD</span>
        </MagneticAttraction>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.4 : 0} className={`absolute bottom-24 right-6 md:bottom-16 md:right-12 border border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm p-4 flex items-center gap-4 transition-opacity duration-300 ${hudClass}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <div className="flex flex-col font-space">
          <span className="text-[8px] text-[var(--muted)] tracking-widest">INTERACTIVE_MODE</span>
          <span className="text-[12px] text-[var(--red)] font-bold tracking-widest">PREMIUM EDIT</span>
          <span className="text-[8px] text-[var(--muted)] tracking-widest flex items-center gap-1 mt-1">
            <span className="w-1 h-1 rounded-full bg-[var(--red)]" /> AVAILABLE
          </span>
        </div>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.3 : 0} className={`absolute bottom-24 left-6 md:bottom-16 md:left-8 font-space text-[8px] md:text-[9px] text-[var(--muted)] flex flex-col gap-1 tracking-widest transition-opacity duration-300 ${hudClass}`}>
        <div className="flex items-center gap-2 mb-2">
          <motion.div animate={!isBase ? { opacity: [1, 0, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[var(--red)] rounded-full" />
          LIVE FEED
        </div>
        <span>LAT: 48.8566 N</span>
        <span>LON: 2.3522 E</span>
        <span>SECURE_GRID_99</span>
      </ParticleFlyer>

      <ParticleFlyer delay={hasLoaded ? 0.5 : 0} className={`absolute bottom-6 right-6 md:bottom-4 md:right-12 font-space text-[7px] md:text-[8px] text-right text-[var(--muted)] tracking-widest leading-loose transition-opacity duration-300 ${hudClass}`}>
        12187eme enqueteur sur cette affaire<br/>
        SYS: DIAGNOSTIC<br/>
        <span className="text-[var(--red)] font-bold">STABLE</span>
      </ParticleFlyer>

      <div className={`absolute top-[64%] md:top-[66%] left-4 md:left-8 text-left text-[10px] md:text-[12px] font-space tracking-[0.15em] flex flex-col items-start transition-opacity duration-300 ${hudClass}`}>
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


const WORKS_SUBSECTIONS = ["VIDEO EDITING", "SOCIAL MEDIA GRIDS", "SOCIAL MEDIA POSTS", "LOGO FOLIO", "FREESTYLE ARTWORKS"];

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [isInvertHovered, setIsInvertHovered] = useState(false);

  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(15);

  const [titleIndex, setTitleIndex] = useState(0);
  const titles = useMemo(() => [{ left: "MOTION", right: "DESIGNER" }, { left: "VIDEO", right: "EDITOR" }], []);

  const [navVisible, setNavVisible] = useState(false);

  // Initialize cursor physics values globally at the top level of the component
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const wellX = useSpring(cursorX, { damping: 28, stiffness: 200, mass: 0.2 });
  const wellY = useSpring(cursorY, { damping: 28, stiffness: 200, mass: 0.2 });

  // Native window scroll tracker - no container ref needed!
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
      <div className="relative w-full min-h-screen bg-[var(--bg)] font-space text-[var(--black)] selection:bg-[var(--red)] selection:text-[var(--bg)] overflow-x-hidden">
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

        {/* DYNAMIC BACKGROUNDS */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <UnicornBackground active={true} />
        </div>

        {/* ================= HERO SECTION ================= */}
        <section className="relative w-full h-screen flex items-center justify-center">
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
            <OrbitalRing radius={300} duration={30} reverse={false} itemVariant="gray" items={["Adobe Photoshop", "Adobe After Effects", "Adobe Premiere Pro", "Colorist"]} />
            <OrbitalRing radius={220} duration={20} reverse={true} itemVariant="red" items={["Motion Designer", "Video Editor", "Director"]} />
            <OrbitalRing radius={150} duration={12} reverse={false} itemVariant="white" items={["Noida, India 📍", "3+ Years"]} />
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
        <div className="relative w-full pb-32">

          {/* INTRODUCTION SECTION */}
          <section className="relative w-full min-h-screen flex flex-col justify-center px-4 md:px-12 py-24">
            <div className="w-full max-w-7xl mx-auto relative z-10 pl-12 sm:pl-[60px] md:pl-[100px] lg:pl-[15%]">
              <ParticleFlyer delay={0.1}>
                <motion.h2 className="font-bebas text-[clamp(60px,10vw,120px)] leading-none mb-8 md:mb-12 text-[var(--black)] pointer-events-auto w-fit block" onMouseEnter={() => setIsInvertHovered(true)} onMouseLeave={() => setIsInvertHovered(false)}>
                  INTRODUCTION
                </motion.h2>
              </ParticleFlyer>
              <div className="w-full max-w-3xl pointer-events-auto relative z-20">
                <ParticleFlyer delay={0.2}>
                  <div className="bg-[var(--white)]/40 backdrop-blur-md pl-8 p-6 md:pl-10 md:p-8 cursor-none shadow-xl border-l-2 border-[var(--red)] relative overflow-hidden group">
                    <div className="absolute left-0 w-full h-[1px] bg-[var(--red)] opacity-0 group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                    <motion.p initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="font-space text-sm md:text-base text-[var(--black)] leading-relaxed mb-4 md:mb-6">
                      I’m a Motion Designer and Video Editor. For over three years, I’ve been cutting and animating bold, high-retention visual narratives that actually make people stop and watch.
                    </motion.p>
                    <motion.p initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="font-space text-sm md:text-base text-[var(--black)] leading-relaxed mb-4 md:mb-6">
                      I operate at the intersection of raw storytelling and strict technical execution. Give me <ScrambleText delay={0.6}>After Effects</ScrambleText>, <ScrambleText delay={0.7}>Premiere Pro</ScrambleText>, <ScrambleText delay={0.8}>Photoshop</ScrambleText>, and <ScrambleText delay={0.9}>Audition</ScrambleText>, and I’ll turn raw footage and static concepts into kinetic reality.
                    </motion.p>
                    <motion.p initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.6 }} className="font-space text-sm md:text-base text-[var(--black)] leading-relaxed">
                      I don't do fluff. I care about pacing, workflow, and the final impact. Every frame I cut or craft is engineered not just to look striking, but to hold attention and perform.
                    </motion.p>
                  </div>
                </ParticleFlyer>
              </div>
            </div>
          </section>

          {/* MY WORKS SECTION */}
          <section className="relative w-full min-h-screen flex flex-col justify-center px-4 md:px-12 py-24">
            <div className="w-full max-w-7xl mx-auto pl-12 sm:pl-[60px] md:pl-[100px] lg:pl-[15%]">
              <ParticleFlyer delay={0.1}>
                <motion.h2 className="font-bebas text-[clamp(60px,10vw,120px)] leading-none mb-12 md:mb-16 text-[var(--black)]" onMouseEnter={() => setIsInvertHovered(true)} onMouseLeave={() => setIsInvertHovered(false)}>
                  MY WORKS
                </motion.h2>
              </ParticleFlyer>
              <ParticleFlyer delay={0.2}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-24">
                  {Array.from({ length: 6 }).map((_, i) => <MagneticVideoCard key={`work-${i}`} />)}
                </div>
              </ParticleFlyer>
            </div>
          </section>

          {/* Extra spacing to ensure scroll */}
          <div className="h-screen pointer-events-none"></div>

        </div>{/* End continuous scroll container wrapper */}

        {/* ================= PRELOADER ================= */}
        <AnimatePresence>
          {!hasLoaded && (
            <motion.div
              key="preloader"
              exit={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed inset-0 bg-[#050505] z-[200] flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="absolute top-1/2 left-8 right-8 md:left-16 md:right-16 h-[1px] bg-[var(--border)] -translate-y-1/2">
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
                  style={{ left: `${loadingProgress}%` }}
                >
                  <div className="absolute right-[50%] h-[2px] w-[100px] origin-right" style={{ background: "linear-gradient(to right, transparent, var(--red))", boxShadow: '0 0 10px rgba(255,42,42,0.8)' }} />
                  <div className="text-[var(--red)] text-2xl drop-shadow-[0_0_8px_var(--red)] relative z-10">✦</div>
                </div>
              </div>
              <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 font-bebas text-[clamp(60px,10vw,140px)] leading-none text-[var(--black)]">
                {Math.floor(loadingProgress)}%
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flash reveal effect */}
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={hasLoaded ? { scale: [0, 1, 1, 250], opacity: [0, 1, 1, 0] } : {}} transition={{ times: [0, 0.14, 0.14, 1], duration: 1.05, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="fixed top-1/2 left-1/2 w-[20px] h-[20px] rounded-full bg-[var(--black)] z-[150] pointer-events-none" style={{ marginLeft: -10, marginTop: -10, boxShadow: '0 0 20px 10px rgba(255,255,255,0.5)' }} />

        {/* BOTTOM PROGRESS BAR WITH STAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: hasLoaded ? 1 : 0, y: hasLoaded ? 0 : 20 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-12 left-8 right-8 md:left-16 md:right-16 h-[1px] bg-[var(--border)] z-[100] pointer-events-none hidden md:block"
        >
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
                opacity: tailOpacity
              }}
            />
            <motion.div
              className="text-[var(--red)] text-2xl drop-shadow-[0_0_8px_var(--red)]"
              style={{ scaleX: starScaleX, skewX: starSkewX }}
            >
              ✦
            </motion.div>
          </motion.div>
        </motion.div>

        {/* INVERT HOVER BUBBLE */}
        <motion.div className="fixed top-0 left-0 pointer-events-none z-[80] rounded-full bg-white" style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%', mixBlendMode: 'difference', filter: 'blur(10px)' }} animate={{ width: isInvertHovered ? 80 : 0, height: isInvertHovered ? 80 : 0, opacity: isInvertHovered ? 1 : 0 }} />

        {/* OUTER CURSOR (TRAILING RED OUTLINE) */}
        <motion.div
          className="fixed top-0 left-0 z-[9998] pointer-events-none rounded-full border border-[var(--red)] w-8 h-8"
          style={{ x: wellX, y: wellY, translateX: '-50%', translateY: '-50%' }}
          animate={{
            scale: isInvertHovered ? 1.5 : 1,
            backgroundColor: isInvertHovered ? 'rgba(230,57,70,0.1)' : 'transparent'
          }}
          transition={{ duration: 0.2 }}
        />

        {/* INNER CURSOR (STAR) */}
        <motion.div
          className="fixed top-0 left-0 z-[9999] pointer-events-none text-[var(--black)] text-sm flex items-center justify-center drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
          style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
        >
          ✦
        </motion.div>
      </div>
    </CursorContext.Provider>
  );
}