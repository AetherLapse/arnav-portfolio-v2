import { useEffect } from 'react';

// One geometry read and one pair of style writes per frame, only while visible.
export function usePointerSpotlight(ref, xProperty, yProperty, enabled = true) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    let frame = 0;
    let visible = false;
    let pointerX = 0;
    let pointerY = 0;

    const update = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty(xProperty, `${pointerX - rect.left}px`);
      element.style.setProperty(yProperty, `${pointerY - rect.top}px`);
    };
    const onMove = event => {
      if (!visible || document.hidden) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(element);
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [ref, xProperty, yProperty, enabled]);
}
