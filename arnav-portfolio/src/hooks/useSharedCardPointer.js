import { useEffect } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { CARD_POINTER_X, CARD_POINTER_Y } from '../data/audioCardLayout';

// One smoothed offset for the entire card layer, never one animation per card.
export function useSharedCardPointer(ref, enabled) {
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, { stiffness: 180, damping: 28, mass: 0.5 });
  const y = useSpring(targetY, { stiffness: 180, damping: 28, mass: 0.5 });

  useEffect(() => {
    const reset = () => { targetX.set(0); targetY.set(0); };
    if (!enabled || !ref.current) { reset(); return; }
    const media = matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let visible = false;
    const move = event => {
      if (event.pointerType !== 'mouse') return;
      const normalized = (value, size) => Math.max(-1, Math.min(1, value / size * 2 - 1));
      targetX.set(-normalized(event.clientX, innerWidth) * CARD_POINTER_X);
      targetY.set(-normalized(event.clientY, innerHeight) * CARD_POINTER_Y);
    };
    const sync = () => {
      window.removeEventListener('pointermove', move);
      if (visible && media.matches && !document.hidden) window.addEventListener('pointermove', move, { passive: true });
      else reset();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(ref.current);
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    document.documentElement.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      document.documentElement.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      window.removeEventListener('pointermove', move);
    };
  }, [enabled, ref, targetX, targetY]);

  return { x, y };
}
