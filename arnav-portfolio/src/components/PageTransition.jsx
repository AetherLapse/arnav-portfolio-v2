import { useEffect, useRef } from 'react';

const clamp = value => Math.max(0, Math.min(1, value));
// The moving diagonal band shrinks full squares down to points, then clears them.
function sweepScale(diagonal, progress, covering = false) {
  const eased = 1 - Math.pow(1 - progress, 3);
  const local = clamp((eased * 1.3 - diagonal) / .3);
  return covering ? local : 1 - local;
}

export default function PageTransition({ active, onMidpoint, onComplete }) {
  const ref = useRef(null);
  const callbacks = useRef({ onMidpoint, onComplete });
  useEffect(() => { callbacks.current = { onMidpoint, onComplete }; }, [onMidpoint, onComplete]);

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      callbacks.current.onMidpoint?.();
      callbacks.current.onComplete?.();
      return;
    }
    let frame;
    let width, height, cells;
    let progress = 0;
    let covering = true;
    let started;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ff0000';
      for (const cell of cells) {
        const scale = sweepScale(cell.diagonal, progress, covering);
        if (scale <= .001) continue;
        const size = (cell.size + .5) * scale;
        ctx.fillRect(cell.x + (cell.size - size) / 2, cell.y + (cell.size - size) / 2, size, size);
      }
    };
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const size = width < 768 ? 24 : 36;
      const columns = Math.ceil(width / size);
      const rows = Math.ceil(height / size);
      cells = Array.from({ length: columns * rows }, (_, index) => {
        const col = index % columns, row = Math.floor(index / columns);
        return { x: col * size, y: row * size, size, diagonal: (col + row) / Math.max(1, columns + rows - 2) };
      });
      draw();
    };
    const tick = now => {
      started ??= now;
      progress = Math.min(1, (now - started) / (covering ? 500 : 1800));
      draw();
      if (progress < 1) { frame = requestAnimationFrame(tick); return; }
      if (covering) {
        callbacks.current.onMidpoint?.();
        // Keep a fully covered paint while React swaps the destination view.
        frame = requestAnimationFrame(() => {
          covering = false;
          started = undefined;
          frame = requestAnimationFrame(tick);
        });
      } else callbacks.current.onComplete?.();
    };
    resize();
    frame = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [active]);

  return <canvas ref={ref} aria-hidden="true" data-page-transition={active ? 'active' : 'idle'}
    className="fixed inset-0 w-full h-full z-[250]" style={{ pointerEvents: active ? 'auto' : 'none' }} />;
}
