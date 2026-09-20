import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './CurvedThread.css';
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export default function CurvedThread({ enabled }) {
  const ref = useRef(null);
  const [geometry, setGeometry] = useState({ width: 0, end: 0, path: '', endX: 0, sections: [] });
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
    const sectionSelector = '#section-digital-tools, #section-intro, #section-services, #section-career, #section-worked-with, #section-works, #section-posts, #section-toolkit, #section-mentors, #section-play, #section-contact';
    const measure = () => {
      frame = 0;
      const bounds = root.getBoundingClientRect();
      const marker = root.querySelector('#channel-open-marker')?.firstElementChild;
      const markerRect = marker?.getBoundingClientRect();
      const target = markerRect ? { x: markerRect.left - bounds.left, y: markerRect.top - bounds.top } : null;
      const bottom = Math.max(1, target ? target.y + markerRect.height / 2 : bounds.height - innerHeight);
      const width = bounds.width;
      const endX = target ? target.x + markerRect.width / 2 : width / 2;
      rootTop.set(bounds.top + window.scrollY);
      end.set(bottom);
      viewport.set(innerHeight);
      const sections = [...root.querySelectorAll(sectionSelector)]
        .map(element => ({ element, left: element.getBoundingClientRect().left - bounds.left, top: element.getBoundingClientRect().top - bounds.top }));
      setGeometry(previous => {
        if (previous.width === width && previous.endX === endX && Math.abs(previous.end - bottom) < .1 && previous.sections.length === sections.length && sections.every((item, index) => Math.abs(item.top - previous.sections[index].top) < .1 && Math.abs(item.left - previous.sections[index].left) < .1)) return previous;
        const points = Array.from({ length: 161 }, (_, index) => {
          const t = index / 160;
          return `${index ? 'L' : 'M'} ${(width / 2 + Math.sin(t * Math.PI * 2) * width * 0.38 + Math.pow(t, 4) * (endX - width / 2)).toFixed(1)} ${(t * bottom).toFixed(1)}`;
        });
        return { width, end: bottom, endX, path: points.join(' '), sections };
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    root.querySelectorAll(sectionSelector).forEach(element => observer.observe(element));
    // The contact entrance translates without resizing; follow its actual dot.
    const contactEntrance = root.querySelector('#channel-open-marker')?.parentElement;
    const entranceObserver = new MutationObserver(schedule);
    if (contactEntrance) entranceObserver.observe(contactEntrance, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      entranceObserver.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, rootTop, end, viewport]);

  const drawing = (top, left = 0) => (
    <svg width={geometry.width} height={geometry.end + 14} className="absolute left-0 overflow-visible" style={{ top, left }}>
      <path d={geometry.path} stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.1" />
      <motion.path d={geometry.path} stroke="var(--red)" strokeWidth="1.5" fill="none" opacity="0.5" style={{ pathLength: reducedMotion ? 1 : progress }} />
      <circle cx={geometry.endX} cy={geometry.end} r="5" fill="var(--red)" opacity="0.65" />
    </svg>
  );
  return (
    <>
      <div ref={ref} data-sine-line="" data-audio-decoration="" aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {geometry.width > 0 && drawing(0)}
      </div>
      {geometry.sections.map(({ element, top, left }) => createPortal(
        <div data-sine-local="" data-audio-decoration="" aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {drawing(-top, -left)}
        </div>, element, element.id
      ))}
    </>
  );
}
