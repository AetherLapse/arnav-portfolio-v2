import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import AudioWaveCard from '../AudioWaveCard';
import { createAudioCardLayout, CARD_DEPTHS } from '../data/audioCardLayout';
import { useSharedCardPointer } from '../hooks/useSharedCardPointer';

function DepthLayer({ depth, layout, pointer, scrollY, rootTop, reducedMotion }) {
  const { scrollSpeed, pointerScale } = CARD_DEPTHS[depth];
  // One transform per depth plane; all cards within it move in unison.
  const x = useTransform(pointer.x, value => value * pointerScale);
  const y = useTransform(() => (scrollY.get() - rootTop.get()) * (1 - scrollSpeed) + pointer.y.get() * pointerScale);
  return <motion.div data-card-parallax-layer={depth} className="absolute inset-0"
    style={{ x: reducedMotion ? 0 : x, y: reducedMotion ? 0 : y, zIndex: depth === 'blurred' ? 3 : depth === 'regular' ? 2 : 1 }}>
    {layout.cards.filter(card => card.depth === depth).map(card => (
      <AudioWaveCard key={card.name} {...card}
        top={reducedMotion ? card.top : scrollSpeed * card.top + (1 - scrollSpeed) * layout.viewportHeight / 2}
        className="absolute" />
    ))}
  </motion.div>;
}

export default function AudioWaveScatter({ enabled }) {
  const layerRef = useRef(null);
  const [layout, setLayout] = useState({ cards: [], viewportHeight: 0 });
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const rootTop = useMotionValue(0);
  const pointer = useSharedCardPointer(layerRef, enabled && !reducedMotion);
  useEffect(() => {
    if (!enabled) return;
    const root = layerRef.current.parentElement;
    let frame = 0;
    let resizeTimer = 0;
    let disposed = false;
    let viewportKey = '';
    let fontsReady = false;
    const intrinsicSizes = new Map();

    const measure = () => {
      frame = 0;
      if (disposed || !fontsReady) return;
      const nextKey = `${root.clientWidth}:${window.innerHeight}`;
      if (nextKey === viewportKey) return;
      viewportKey = nextKey;
      if (root.clientWidth < 768) {
        intrinsicSizes.forEach((value, section) => { section.style.containIntrinsicBlockSize = value; });
        intrinsicSizes.clear();
        setLayout({ cards: [], viewportHeight: window.innerHeight });
        return;
      }

      // Force layout (not paint) for skipped sections in this synchronous pass.
      // Restoring the class before yielding keeps content-visibility's normal
      // rendering savings, while placement uses real sizes and resting poses.
      root.classList.add('audio-measuring');
      let next;
      let clipTop = 0;
      try {
        root.querySelectorAll('section').forEach(section => {
          if (!intrinsicSizes.has(section)) intrinsicSizes.set(section, section.style.containIntrinsicBlockSize);
          const style = getComputedStyle(section);
          const contentHeight = section.getBoundingClientRect().height
            - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
            - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth);
          // Keep the measured space even while the section is skipped. Without
          // this, its old 900px estimate shifts everything as it enters view.
          section.style.containIntrinsicBlockSize = `${Math.max(0, contentHeight)}px`;
        });
        const bounds = root.getBoundingClientRect();
        rootTop.set(bounds.top + window.scrollY);
        const elements = [...root.querySelectorAll('h1, h2, h3, h4, p, button, a, input, textarea, canvas, video, img, [class*="border"], [data-audio-obstacle], [data-audio-surface], span, li, div')]
          .filter(element => !element.closest('[data-audio-scatter]')
            && !element.closest('[data-audio-decoration]')
            && !element.hasAttribute('data-audio-layout')
            && element.tagName !== 'SECTION'
            && !element.matches('#section-digital-tools')
            && !element.closest('#section-digital-tools')
            && (element.matches('h1, h2, h3, h4, p, button, a, input, textarea, canvas, video, img, [class*="border"], [data-audio-obstacle], [data-audio-surface]')
              || (!element.childElementCount && element.textContent.trim())));
        const obstacles = elements.map(element => {
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height) return null;
          return { surface: element.hasAttribute('data-audio-surface') || element.matches('img, video, canvas, .mentor-frame'), left: rect.left - bounds.left - 12, right: rect.right - bounds.left + 12,
            top: rect.top - bounds.top - 16, bottom: rect.bottom - bounds.top + 16 };
        }).filter(Boolean);
        const regions = {};
        for (const element of root.querySelectorAll('section[id], [data-audio-region="creative"], #section-play')) {
          if (element.id === 'section-hero') continue;
          const rect = element.getBoundingClientRect();
          if (rect.height < 100) continue;
          regions[element.id || 'section-creative'] = { top: rect.top - bounds.top, height: rect.height };
        }
        if (root.querySelector('#section-hero')) clipTop = regions['section-showreel']?.top || 0;
        next = createAudioCardLayout(bounds.width, bounds.height, obstacles, window.innerHeight, regions);
      } finally {
        root.classList.remove('audio-measuring');
      }
      setLayout({ cards: next, viewportHeight: window.innerHeight, clipTop });
    };
    const schedule = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!disposed && !frame) frame = requestAnimationFrame(measure);
      }, 150);
    };
    // Scroll, image load and section-height notifications must never reroll
    // existing cards. Only a real viewport resize starts a new placement pass.
    window.addEventListener('resize', schedule);
    document.fonts.ready.then(() => {
      if (disposed) return;
      fontsReady = true;
      frame = requestAnimationFrame(measure);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', schedule);
      root.classList.remove('audio-measuring');
      intrinsicSizes.forEach((value, section) => { section.style.containIntrinsicBlockSize = value; });
    };
  }, [enabled, rootTop]);

  return (
    <div ref={layerRef} data-audio-scatter="" aria-hidden="true"
      className="absolute inset-0 z-30 hidden md:block overflow-hidden pointer-events-none"
      style={{ clipPath: layout.clipTop ? `inset(${layout.clipTop}px 0 0)` : undefined }}>
      {Object.keys(CARD_DEPTHS).map(depth => (
        <DepthLayer key={depth} depth={depth} layout={layout} pointer={pointer} scrollY={scrollY} rootTop={rootTop} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}
