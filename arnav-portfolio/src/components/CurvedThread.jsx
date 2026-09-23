import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './CurvedThread.css';
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export default function CurvedThread({ enabled }) {
  const ref = useRef(null);
  const clipId = useId().replace(/:/g, '');
  const [geometry, setGeometry] = useState({ width: 0, end: 0, path: '', endX: 0, sections: [] });
  const rootTop = useMotionValue(0);
  const end = useMotionValue(1);
  const start = useMotionValue(0);
  const viewport = useMotionValue(0);
  const revealAt = useMotionValue(Infinity);
  const { scrollY } = useScroll();
  const reducedMotion = useReducedMotion();
  const lineOpacity = useTransform(() => scrollY.get() >= revealAt.get() ? 1 : 0);
  // Reveal by page Y, not a fraction of arc length: a curved path's distance
  // is different from the vertical distance the visitor has scrolled.
  const drawHeight = useTransform(() => reducedMotion ? end.get() + 14 :
    Math.max(start.get(), Math.min(end.get() + 14, scrollY.get() + viewport.get() * 0.8 - rootTop.get())));

  useEffect(() => {
    if (!enabled) return;
    const root = ref.current.parentElement;
    let frame = 0;
    const sectionSelector = '#section-digital-tools, #section-intro, #section-services, #section-career, #section-worked-with, #section-works, #section-posts, #section-social-grids, #section-toolkit, #section-mentors, #section-play, #section-contact';
    const measure = () => {
      frame = 0;
      const bounds = ref.current.getBoundingClientRect();
      const startMarker = root.querySelector('#sine-start-marker');
      const startRect = startMarker?.getBoundingClientRect();
      const startX = startRect ? startRect.left + startRect.width / 2 - bounds.left : bounds.width / 2;
      const quote = root.querySelector('#section-digital-tools');
      const sticky = startMarker?.parentElement;
      // Anchor to the dot's final, unpinned position. The path never reshapes
      // while the quote is typing or the viewport is scrolling through it.
      const quoteRect = quote?.getBoundingClientRect();
      const stickyRect = sticky?.getBoundingClientRect();
      const releaseY = quoteRect && stickyRect ? quoteRect.bottom + window.scrollY - stickyRect.height : 0;
      revealAt.set(releaseY);
      const remainingTravel = quoteRect && stickyRect ? quoteRect.bottom - stickyRect.bottom : 0;
      const startY = startRect ? startRect.top + startRect.height / 2 - bounds.top + remainingTravel : 0;
      const marker = root.querySelector('#channel-open-marker')?.firstElementChild;
      const markerRect = marker?.getBoundingClientRect();
      const target = markerRect ? { x: markerRect.left - bounds.left, y: markerRect.top - bounds.top } : null;
      const bottom = Math.max(1, target ? target.y + markerRect.height / 2 : bounds.height - innerHeight);
      const width = bounds.width;
      const endX = target ? target.x + markerRect.width / 2 : width / 2;
      rootTop.set(bounds.top + window.scrollY);
      end.set(bottom);
      start.set(startY);
      viewport.set(innerHeight);
      const sections = [...root.querySelectorAll(sectionSelector)]
        .map(element => {
          const local = element.querySelector(':scope > [data-sine-local]');
          const rect = (local || element).getBoundingClientRect();
          return { element, left: rect.left - bounds.left, top: rect.top - bounds.top };
        });
      setGeometry(previous => {
        if (previous.width === width && previous.startX === startX && Math.abs(previous.startY - startY) < .1 && previous.endX === endX && Math.abs(previous.end - bottom) < .1 && previous.sections.length === sections.length && sections.every((item, index) => Math.abs(item.top - previous.sections[index].top) < .1 && Math.abs(item.left - previous.sections[index].left) < .1)) return previous;
        const points = Array.from({ length: 161 }, (_, index) => {
          const t = index / 160;
          return `${index ? 'L' : 'M'} ${(startX + Math.sin(t * Math.PI * 2) * width * 0.38 + Math.pow(t, 4) * (endX - startX)).toFixed(1)} ${(startY + t * (bottom - startY)).toFixed(1)}`;
        });
        return { width, startX, startY, end: bottom, endX, path: points.join(' '), sections };
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    root.querySelectorAll('section, #section-digital-tools, #section-play').forEach(element => observer.observe(element));
    const startMarker = root.querySelector('#sine-start-marker');
    if (startMarker) observer.observe(startMarker);
    // The contact entrance translates without resizing; follow its actual dot.
    const contactEntrance = root.querySelector('#channel-open-marker')?.parentElement;
    const entranceObserver = new MutationObserver(schedule);
    if (contactEntrance) entranceObserver.observe(contactEntrance, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', schedule);
    // content-visibility can move sections without resizing the section itself.
    // Refresh offsets together on scroll and on skipped-content activation.
    window.addEventListener('scroll', schedule, { passive: true });
    root.addEventListener('contentvisibilityautostatechange', schedule, true);
    let disposed = false;
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      disposed = true;
      observer.disconnect();
      entranceObserver.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      root.removeEventListener('contentvisibilityautostatechange', schedule, true);
    };
  }, [enabled, rootTop, start, end, viewport, revealAt]);

  const drawing = (top, left = 0, key = 'root') => (
    // Keep layout on a native SVG; animate only the inner group and reveal.
    <svg width={geometry.width} height={geometry.end + 14} className="absolute left-0 overflow-visible" style={{ top, left }}>
      <defs>
        <clipPath id={`${clipId}-${key}`} clipPathUnits="userSpaceOnUse">
          <motion.rect x="-2" y="0" width={geometry.width + 4} height={drawHeight} />
        </clipPath>
      </defs>
      <motion.g style={{ opacity: lineOpacity }}>
        <path d={geometry.path} stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.1" />
        <path d={geometry.path} stroke="var(--red)" strokeWidth="1.5" fill="none" opacity="0.5" clipPath={`url(#${clipId}-${key})`} />
        <circle cx={geometry.endX} cy={geometry.end} r="5" fill="var(--red)" opacity="0.65" />
      </motion.g>
    </svg>
  );
  return (
    <>
      <div ref={ref} data-sine-line="" data-audio-decoration="" aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {geometry.width > 0 && drawing(0)}
      </div>
      {geometry.sections.map(({ element, top, left }) => createPortal(
        <div data-sine-local="" data-sine-offset={top} data-audio-decoration="" aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {drawing(-top, -left, element.id)}
        </div>, element, element.id
      ))}
    </>
  );
}
