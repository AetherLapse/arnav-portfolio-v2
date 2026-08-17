import { useRef, useEffect, useState } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const getAnchorAndDir = (origin, w, h) => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left': return { anchor: [0, -outside * h], dir: [0.7, 0.7] };
    case 'top-right': return { anchor: [w, -outside * h], dir: [-0.7, 0.7] };
    case 'left': return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case 'right': return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left': return { anchor: [0, (1 + outside) * h], dir: [0.7, -0.7] };
    case 'bottom-center': return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-right': return { anchor: [w, (1 + outside) * h], dir: [-0.7, -0.7] };
    default: return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

export default function LightRays({
  raysOrigin = 'top-center',
  raysColor = '#FF0000',
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.02,
  distortion = 0.05,
  className = ''
}) {
  const containerRef = useRef(null);
  const uniformsRef = useRef(null);
  const rendererRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const animationIdRef = useRef(null);
  const meshRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const container = containerRef.current;
    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 1.5), alpha: true });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(gl.canvas);

    const vert = `attribute vec2 position; varying vec2 vUv; void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;

    const frag = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec2 rayPos;
      uniform vec2 rayDir;
      uniform vec3 raysColor;
      uniform float raysSpeed;
      uniform float lightSpread;
      uniform float rayLength;
      uniform float pulsating;
      uniform float fadeDistance;
      uniform vec2 mousePos;
      uniform float mouseInfluence;
      uniform float noiseAmount;
      uniform float distortion;
      varying vec2 vUv;

      float noise(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453); }

      float rayStrength(vec2 src, vec2 refDir, vec2 coord, float sA, float sB, float speed) {
        vec2 toCoord = coord - src;
        vec2 dn = normalize(toCoord);
        float cosA = dot(dn, refDir);
        float d = distortion * sin(iTime * 1.5 + length(toCoord) * 0.005);
        float da = cosA + d;
        float spread = pow(max(da, 0.0), 1.0 / max(lightSpread, 0.001));
        float dist = length(toCoord);
        float maxDist = max(iResolution.x, iResolution.y) * rayLength;
        float lenFall = clamp((maxDist - dist) / maxDist, 0.0, 1.0);
        float fadeFact = fadeDistance * max(iResolution.x, iResolution.y);
        float fadeFall = clamp((fadeFact - dist) / fadeFact, 0.0, 1.0);
        float pulse = pulsating > 0.5 ? (0.85 + 0.15 * sin(iTime * speed * 4.0)) : 1.0;
        float base = clamp(
          (0.5 + 0.2 * sin(da * sA + iTime * speed)) +
          (0.3 + 0.2 * cos(-da * sB + iTime * speed * 0.8)), 0.0, 1.0);
        return base * lenFall * fadeFall * spread * pulse;
      }

      void main() {
        vec2 coord = gl_FragCoord.xy;
        vec2 fDir = normalize(rayDir);
        if (mouseInfluence > 0.0) {
          vec2 msp = mousePos * iResolution.xy;
          vec2 md = normalize(msp - rayPos);
          fDir = normalize(mix(fDir, md, mouseInfluence));
        }
        float r1 = rayStrength(rayPos, fDir, coord, 45.2, 31.4, 0.8 * raysSpeed);
        float r2 = rayStrength(rayPos, fDir, coord, 28.5, 19.8, 1.2 * raysSpeed);
        float r3 = rayStrength(rayPos, fDir, coord, 12.1, 56.2, 0.5 * raysSpeed);
        float combined = (r1 * 0.4 + r2 * 0.4 + r3 * 0.2);
        combined = pow(combined, 0.7) * 1.5;
        vec3 col = raysColor * combined;
        if (noiseAmount > 0.0) { col *= (1.0 - noiseAmount + noiseAmount * noise(coord * 0.01 + iTime * 0.05)); }
        gl_FragColor = vec4(col, combined);
      }
    `;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      rayPos: { value: [0, 0] },
      rayDir: { value: [0, 1] },
      raysColor: { value: hexToRgb(raysColor) },
      raysSpeed: { value: raysSpeed },
      lightSpread: { value: lightSpread },
      rayLength: { value: rayLength },
      pulsating: { value: pulsating ? 1.0 : 0.0 },
      fadeDistance: { value: fadeDistance },
      mousePos: { value: [0.5, 0.5] },
      mouseInfluence: { value: mouseInfluence },
      noiseAmount: { value: noiseAmount },
      distortion: { value: distortion }
    };
    uniformsRef.current = uniforms;

    const geometry = new Triangle(gl);
    const program = new Program(gl, { vertex: vert, fragment: frag, uniforms, transparent: true });
    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    const updateSize = () => {
      if (!container || !renderer) return;
      const { clientWidth: wCSS, clientHeight: hCSS } = container;
      renderer.setSize(wCSS, hCSS);
      const dpr = renderer.dpr;
      uniforms.iResolution.value = [wCSS * dpr, hCSS * dpr];
      const { anchor, dir } = getAnchorAndDir(raysOrigin, wCSS * dpr, hCSS * dpr);
      uniforms.rayPos.value = anchor;
      uniforms.rayDir.value = dir;
    };

    const loop = (t) => {
      if (!rendererRef.current || !meshRef.current) return;
      uniforms.iTime.value = t * 0.001;
      if (followMouse && mouseInfluence > 0) {
        smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * 0.05;
        smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * 0.05;
        uniforms.mousePos.value = [smoothMouseRef.current.x, 1.0 - smoothMouseRef.current.y];
      }
      renderer.render({ scene: mesh });
      animationIdRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', updateSize);
    updateSize();
    animationIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', updateSize);
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
      rendererRef.current = null;
      meshRef.current = null;
    };
  }, [isVisible, raysOrigin, raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, followMouse, mouseInfluence, noiseAmount, distortion]);

  useEffect(() => {
    if (!followMouse) return;
    const handleMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [followMouse]);

  return <div ref={containerRef} className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`} />;
}
