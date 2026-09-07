import { useEffect, useRef, useState } from 'react';

const MAX_RENDER_PIXELS = 1_500_000;

export default function TubesBackground({ active = true }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    let mounted = true;
    let instance;

    const init = async () => {
      if (!canvasRef.current) return;
      try {
        const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
        if (!mounted) return;

        instance = module.default(canvasRef.current, {
          tubes: {
            count: 12,
            colors: ['#FF0000', '#8B0000', '#CC0000'],
            lights: {
              intensity: 60,
              colors: ['#FF0000', '#FF3333', '#990000', '#FF6666'],
            },
          },
        });

        const { three } = instance;
        // The library forces DPR 2. A soft background does not need four times
        // the pixels; cap resolution before its first frame, including bloom.
        three.minPixelRatio = 1;
        three.maxPixelRatio = 1;
        three.onAfterResize = ({ width, height }) => {
          const ratio = Math.min(1, Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height)));
          three.renderer.setPixelRatio(ratio);
          three.size.pixelRatio = ratio;
        };
        three.resize();

        // The library pauses outside the viewport, but cannot detect the
        // showreel covering this sticky canvas. Skip both geometry and bloom.
        const update = three.onBeforeRender;
        const render = three.render;
        three.onBeforeRender = time => {
          if (activeRef.current) update.call(three, time);
        };
        three.render = () => {
          if (activeRef.current) render.call(three);
        };
        setLoaded(true);
      } catch (error) {
        console.error('TubesBackground failed:', error);
      }
    };

    init();
    return () => {
      mounted = false;
      instance?.bloomPass?.dispose();
      instance?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'auto', pointerEvents: 'none', opacity: loaded ? 0.6 : 0, transition: 'opacity 1s ease' }}
    />
  );
}
