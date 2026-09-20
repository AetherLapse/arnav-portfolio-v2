import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowUpRight, LayoutGrid, Orbit } from 'lucide-react';
import InteractiveDotGrid from '../components/InteractiveDotGrid';
import PageLink from '../components/PageLink';
import './RealmPage.css';

function RealmImage({ project }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="realm-image-fallback">{project.title}<small>Preview unavailable</small></span>
    : <img src={project.img} alt="" decoding="async" draggable="false" onError={() => setFailed(true)} />;
}

function SpiralFrame({ project, index, count, progress, blurStrength, onOpen }) {
  // Equal angular/vertical spacing makes one continuous helix. Wrapping occurs
  // beyond the viewport; scroll drives both axes with no independent floating.
  const transform = useTransform(progress, value => {
    const position = ((index - value * 16 + count * 2) % count) - count / 2;
    return `translateY(calc(${position} * var(--realm-pitch))) rotateY(${position * 65}deg) translateZ(var(--realm-radius))`;
  });
  const facing = useTransform(progress, value => {
    const position = ((index - value * 16 + count * 2) % count) - count / 2;
    const reverse = Math.cos(position * 65 * Math.PI / 180) < 0;
    return `translate(-50%, -50%) rotateY(${reverse ? 180 : 0}deg)`;
  });
  const filter = useTransform(() => {
    const position = ((index - progress.get() * 16 + count * 2) % count) - count / 2;
    const edge = Math.max(0, Math.min(1, (Math.abs(position) - 1.5) / 3.5));
    const falloff = edge * edge * (3 - 2 * edge);
    return `blur(${(falloff * (3 + blurStrength.get() * 7)).toFixed(2)}px)`;
  });
  return <motion.div className="realm-orbit-frame" style={{ transform }}>
    <motion.button className="realm-artwork" style={{ transform: facing, filter }} tabIndex={-1} aria-label={`View ${project.title}`} onClick={() => onOpen(project)}>
      <RealmImage project={project} />
      <span className="realm-artwork-title">{project.title}<ArrowUpRight size={13} aria-hidden="true" /></span>
    </motion.button>
  </motion.div>;
}

export default function RealmPage({ projects, onOpenProject, navigate, entered }) {
  const root = useRef(null);
  const [ready, setReady] = useState(false);
  const [settled, setSettled] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 95, damping: 28, mass: 0.4 });
  const velocity = useVelocity(progress);
  const speed = useTransform(velocity, value => Math.min(1, Math.abs(value) * 6));
  const blurStrength = useSpring(speed, { stiffness: 150, damping: 25 });
  const showIndex = indexOpen || reducedMotion;
  const collection = [...projects, ...projects, ...projects];

  useEffect(() => {
    if (!entered) return;
    let disposed = false;
    let minimumTimer;
    let timeout;
    const images = projects.map(project => {
      const image = new Image();
      const done = () => { if (!disposed) setSettled(value => value + 1); };
      image.onload = done;
      image.onerror = done;
      image.src = project.img;
      return image;
    });
    // Keep the entrance bounded even when an external preview is unavailable.
    const minimum = new Promise(resolve => { minimumTimer = setTimeout(resolve, reducedMotion ? 0 : 1300); });
    const previews = Promise.all(images.map(image => image.decode().catch(() => {})));
    const deadline = new Promise(resolve => { timeout = setTimeout(resolve, 3500); });
    Promise.all([minimum, Promise.race([previews, deadline])]).then(() => {
      if (!disposed) setReady(true);
    });
    return () => {
      disposed = true;
      clearTimeout(minimumTimer);
      clearTimeout(timeout);
      images.forEach(image => { image.onload = null; image.onerror = null; });
    };
  }, [entered, projects, reducedMotion]);

  return <main ref={root} className={`realm-page ${showIndex ? 'realm-page-index' : ''}`} aria-labelledby="realm-heading" aria-busy={!ready}>
    <div className="realm-viewport">
      <div className="realm-background" aria-hidden="true">
        <InteractiveDotGrid active={entered} />
      </div>
      <header className="realm-header">
        <h1 id="realm-heading" tabIndex={-1} className="font-dragon">MY REALM<span>.</span></h1>
        <p>A world made of moving images.</p>
      </header>
      <div className="realm-view-controls">
        <PageLink href="/" navigate={navigate}><ArrowLeft size={14} aria-hidden="true" /> Home</PageLink>
        {!reducedMotion && <button onClick={() => setIndexOpen(value => !value)} aria-pressed={indexOpen}>
          {indexOpen ? <Orbit size={15} aria-hidden="true" /> : <LayoutGrid size={15} aria-hidden="true" />}{indexOpen ? 'Spiral view' : 'Project index'}
        </button>}
      </div>
      {showIndex ? <div className="realm-index" aria-label="Project index">
        {projects.map(project => <button key={project.id} onClick={() => onOpenProject(project)}>
          <RealmImage project={project} /><span>{project.title}<ArrowUpRight size={16} aria-hidden="true" /></span>
        </button>)}
        {!projects.length && <p>New work is on its way.</p>}
      </div> : <div className="realm-perspective" aria-label="Spiral gallery. Scroll to rotate the work, or use Project index to browse with a keyboard.">
        <motion.div className="realm-arrival" initial={{ scale: 0.55, y: 100 }} animate={ready ? { scale: 1, y: 0 } : { scale: 0.55, y: 100 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          <div className="realm-tower">
            {collection.map((project, index) => <SpiralFrame key={`${project.id}-${index}`} project={project} index={index} count={collection.length} progress={progress} blurStrength={blurStrength} onOpen={onOpenProject} />)}
          </div>
        </motion.div>
      </div>}
      {!showIndex && <footer className="realm-footer"><span><ArrowDown size={14} aria-hidden="true" /> Scroll to move through the spiral</span><span>Select a frame to explore</span></footer>}
      <AnimatePresence>
        {!ready && <motion.div className="realm-entrance" key="entrance" exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.55 }}>
          <span className="realm-entrance-label">ARNAV RAI / ENTERING</span>
          <div className="realm-entrance-orbit" aria-hidden="true"><i /><i /><i /></div>
          <p className="font-dragon">MY REALM<span>.</span></p>
          <span role="status">Preparing the collection · {Math.min(settled, projects.length)} / {projects.length}</span>
        </motion.div>}
      </AnimatePresence>
    </div>
  </main>;
}
