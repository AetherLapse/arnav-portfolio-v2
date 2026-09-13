import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export default function CurvedThread({ enabled }) {
  const ref = useRef(null);
  const [geometry, setGeometry] = useState({ width: 0, end: 0, path: '', sections: [] });
  const rootTop = useMotionValue(0);
  const end = useMotionValue(1);
  const viewport = useMotionValue(0);
  const { scrollY } = useScroll();
  const reducedMotion = useReducedMotion();
  const progress = useTransform(() => Math.max(0, Math.min(1, (scrollY.get() + viewport.get() * 0.7 - rootTop.get()) / end.get())));

  useEffect(() => {
    if (!enabled) return;
    const root = ref.current.parentElement;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = root.getBoundingClientRect();
      const marker = root.querySelector('#channel-open-marker');
      const bottom = Math.max(1, marker ? marker.getBoundingClientRect().top - bounds.top - 64 : bounds.height - innerHeight);
      const width = bounds.width;
      rootTop.set(bounds.top + window.scrollY);
      end.set(bottom);
      viewport.set(innerHeight);
      const sections = [...root.querySelectorAll('#section-intro, #section-career, #section-toolkit, #section-contact')]
        .map(element => ({ element, top: element.getBoundingClientRect().top - bounds.top }));
      setGeometry(previous => {
        if (previous.width === width && Math.abs(previous.end - bottom) < 1 && previous.sections.length === sections.length && sections.every((item, index) => Math.abs(item.top - previous.sections[index].top) < 1)) return previous;
        const points = Array.from({ length: 161 }, (_, index) => {
          const t = index / 160;
          return `${index ? 'L' : 'M'} ${(width / 2 + Math.sin(t * Math.PI * 2) * width * 0.38).toFixed(1)} ${(t * bottom).toFixed(1)}`;
        });
        return { width, end: bottom, path: points.join(' '), sections };
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, rootTop, end, viewport]);

  const drawing = top => (
    <svg width={geometry.width} height={geometry.end + 14} className="absolute left-0 overflow-visible" style={{ top }}>
      <path d={geometry.path} stroke="var(--red)" strokeWidth="1" fill="none" opacity="0.1" />
      <motion.path d={geometry.path} stroke="var(--red)" strokeWidth="1.5" fill="none" opacity="0.5" style={{ pathLength: reducedMotion ? 1 : progress }} />
      <circle cx={geometry.width / 2} cy={geometry.end} r="5" fill="var(--red)" opacity="0.65" />
    </svg>
  );
  return (
    <>
      <div ref={ref} data-sine-line="" data-audio-decoration="" aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {geometry.width > 0 && drawing(0)}
      </div>
      {geometry.sections.map(({ element, top }) => createPortal(
        <div data-sine-local="" data-audio-decoration="" aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {drawing(-top)}
        </div>, element, element.id
      ))}
    </>
  );
}
