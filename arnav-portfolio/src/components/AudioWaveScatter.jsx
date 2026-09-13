import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import AudioWaveCard from '../AudioWaveCard';
import { createAudioCardLayout, CARD_SCROLL_SPEED, BLURRED_SCROLL_SPEED, BLURRED_POINTER_MULTIPLIER } from '../data/audioCardLayout';
import { useSharedCardPointer } from '../hooks/useSharedCardPointer';

export default function AudioWaveScatter({ enabled }) {
  const layerRef = useRef(null);
  const [layout, setLayout] = useState({ cards: [], viewportHeight: 0 });
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const rootTop = useMotionValue(0);
  const pointer = useSharedCardPointer(layerRef, enabled && !reducedMotion);
  // Scroll stays direct; the only smoothing is the shared mouse offset.
  const layerY = useTransform(() => (scrollY.get() - rootTop.get()) * (1 - CARD_SCROLL_SPEED) + pointer.y.get());

  const blurredY = useTransform(() => (scrollY.get() - rootTop.get()) * (1 - BLURRED_SCROLL_SPEED) + pointer.y.get() * BLURRED_POINTER_MULTIPLIER);
  const blurredX = useTransform(pointer.x, value => value * BLURRED_POINTER_MULTIPLIER);

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
        const elements = [...root.querySelectorAll('h1, h2, h3, h4, p, button, a, input, textarea, canvas, video, img, [class*="border"], [data-audio-obstacle], span, li, div')]
          .filter(element => !element.closest('[data-audio-scatter]')
            && !element.closest('[data-audio-decoration]')
            && !element.hasAttribute('data-audio-layout')
            && (element.tagName !== 'SECTION' || element.hasAttribute('data-audio-obstacle'))
            && (!element.closest('[data-audio-obstacle]') || element.hasAttribute('data-audio-obstacle'))
            && (element.matches('h1, h2, h3, h4, p, button, a, input, textarea, canvas, video, img, [class*="border"], [data-audio-obstacle]')
              || (!element.childElementCount && element.textContent.trim())));
        const obstacles = elements.map(element => {
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height) return null;
          return { surface: element.hasAttribute('data-audio-surface'), left: rect.left - bounds.left - 12, right: rect.right - bounds.left + 12,
            top: rect.top - bounds.top - 16, bottom: rect.bottom - bounds.top + 16 };
        }).filter(Boolean);
        const regions = {};
        for (const [name, selector] of Object.entries({ contact: '#section-contact', creative: '[data-audio-region="creative"]' })) {
          const element = root.querySelector(selector);
          if (element) {
            const rect = element.getBoundingClientRect();
            regions[name] = { top: rect.top - bounds.top, height: rect.height };
          }
        }
        next = createAudioCardLayout(bounds.width, bounds.height, obstacles, window.innerHeight, regions);
      } finally {
        root.classList.remove('audio-measuring');
      }
      setLayout({ cards: next, viewportHeight: window.innerHeight });
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
      className="absolute inset-0 z-30 hidden md:block overflow-hidden pointer-events-none">
      {[true, false].map(blurred => (
        <motion.div key={String(blurred)} data-card-parallax-layer={blurred ? 'blurred' : 'regular'}
          className="absolute inset-0" style={{ x: reducedMotion ? 0 : blurred ? blurredX : pointer.x, y: reducedMotion ? 0 : blurred ? blurredY : layerY }}>
          {layout.cards.filter(card => card.blurred === blurred).map(card => (
            <AudioWaveCard key={card.name} {...card}
              top={reducedMotion ? card.top : card.scrollSpeed * card.top + (1 - card.scrollSpeed) * layout.viewportHeight / 2}
              className="absolute" />
          ))}
        </motion.div>
      ))}
    </div>
  );
}
