import { useEffect, useRef } from 'react';

const InteractiveDotGrid = ({ active }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    if (!active || !window.matchMedia('(pointer: fine)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let visible = true;
    const gap = 24;
    const dotSize = 0.6;
    const influenceRadius = 100;
    const dpr = Math.min(window.devicePixelRatio, 1.5);

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      schedule();
    };


    // Draw ONE frame only — dots are static except near the cursor, so a
    // continuous rAF loop would redraw 660+ arcs 60x/sec for zero change.
    const draw = () => {
      if (!visible) return;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
      ctx.beginPath();
      for (let x = gap; x < w; x += gap) {
        for (let y = gap; y < h; y += gap) {
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let px = x;
          let py = y;

          if (dist < influenceRadius && dist > 0) {
            const force = (1 - dist / influenceRadius) * 6;
            px += (dx / dist) * force;
            py += (dy / dist) * force;
          }

          ctx.moveTo(px + dotSize, py);
          ctx.arc(px, py, dotSize, 0, Math.PI * 2);

        }
      }
      ctx.fill();
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; draw(); });
    };

    resize();
    window.addEventListener('resize', resize);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    observer.observe(canvas);

    const onMove = (e) => {
      if (!visible) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      schedule();
    };
    window.addEventListener('mousemove', onMove);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      observer.disconnect();
    };
  }, [active]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

export default InteractiveDotGrid;
