import { useEffect, useRef, useState } from 'react';

export default function TubesBackground() {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!canvasRef.current) return;
      try {
        const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
        const TubesCursor = module.default;
        if (!mounted) return;

        appRef.current = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ["#FF0000", "#8B0000", "#CC0000"],
            lights: {
              intensity: 150,
              colors: ["#FF0000", "#FF3333", "#990000", "#FF6666"]
            }
          }
        });
        setLoaded(true);
      } catch (e) {
        console.error("TubesBackground failed:", e);
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none', opacity: loaded ? 1 : 0, transition: 'opacity 1s ease' }}
    />
  );
}
