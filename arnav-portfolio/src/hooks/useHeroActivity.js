import { useEffect, useState } from 'react';

// IntersectionObserver alone cannot tell when the showreel covers the sticky hero.
export function useHeroActivity(heroRef, enabled) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!enabled || !hero) return;
    const cover = hero.nextElementSibling;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const coverTop = cover?.getBoundingClientRect().top ?? Infinity;
      setVisible(!document.hidden && rect.bottom > 0 && rect.top < window.innerHeight && coverTop > 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new IntersectionObserver(schedule);
    observer.observe(hero);
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(hero);
    if (cover) resizeObserver.observe(cover);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const onVisibilityChange = () => {
      if (document.hidden) setVisible(false);
      else schedule();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [heroRef, enabled]);

  return enabled && visible;
}
