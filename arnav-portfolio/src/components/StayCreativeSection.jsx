import { useEffect, useRef } from 'react';
import './StayCreativeSection.css';

const TEXT = '#stAycReative';
const WEIGHTS = [200, 500];

export default function StayCreativeSection() {
  const textRef = useRef(null);

  useEffect(() => {
    const element = textRef.current;
    const letters = [...element.querySelectorAll('[data-bulge-letter]')];
    const slots = [...element.querySelectorAll('.stay-creative-slot')];
    // Load the variable face before the first hover.
    WEIGHTS.forEach(weight => {
      document.fonts.load(`${weight} 16px "Roboto Condensed"`).catch(() => {});
    });
    let frame = 0;
    let hasPosition = false;
    let active = false;
    let x = 0;
    let y = 0;

    let lastUpdate = 0;
    const lastWeights = Array(letters.length).fill(200);
    const setWeight = (index, weight) => {
      if (weight === lastWeights[index]) return;
      lastWeights[index] = weight;
      // Both color layers share one continuously variable weight.
      [slots[index], slots[index + letters.length]].forEach(slot => {
        slot.style.setProperty('--creative-weight', weight);
      });
    };
    const update = now => {
      frame = 0;
      if (!hasPosition || document.hidden) return;
      if (now - lastUpdate < 1000 / 30) {
        frame = requestAnimationFrame(update);
        return;
      }
      lastUpdate = now;
      // Read all geometry before writing; glyph slots reserve the Medium weight’s width.
      const bounds = element.getBoundingClientRect();
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) { reset(); return; }
      const boxes = letters.map(letter => letter.getBoundingClientRect());
      const hovered = boxes.findIndex(box => x >= box.left && x <= box.right);
      const position = hovered < 0 ? -100 : hovered +
        (x - (boxes[hovered].left + boxes[hovered].width / 2)) / boxes[hovered].width;
      active = true;
      element.style.setProperty('--sx', `${x - bounds.left}px`);
      element.style.setProperty('--sy', `${y - bounds.top}px`);
      letters.forEach((_, index) => {
        const distance = Math.abs(index - position);
        // Match BreathingText’s smooth weight falloff, centered on the pointer.
        const t = Math.max(0, 1 - distance / 3);
        const influence = t * t * (3 - 2 * t);
        setWeight(index, 200 + Math.round(influence * 300));
      });
    };
    const move = event => {
      if (event.pointerType === 'touch') return;
      hasPosition = true;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!active) return;
      active = false;
      letters.forEach((_, index) => setWeight(index, 200));
      element.style.setProperty('--sx', '-9999px');
      element.style.setProperty('--sy', '-9999px');
    };
    const refresh = () => {
      if (hasPosition && !frame) frame = requestAnimationFrame(update);
    };
    const leave = () => { hasPosition = false; reset(); };
    // Match the site's mouse-driven cursor, and support pen/pointer input too.
    // Capture sees input even when a foreground element stops bubbling.
    const options = { passive: true, capture: true };
    window.addEventListener('mousemove', move, options);
    window.addEventListener('pointermove', move, options);
    window.addEventListener('scroll', refresh, options);
    document.documentElement.addEventListener('mouseleave', leave);
    window.addEventListener('blur', leave);
    window.addEventListener('resize', refresh);
    document.addEventListener('visibilitychange', leave);
    return () => {
      reset();
      window.removeEventListener('mousemove', move, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('scroll', refresh, true);
      document.documentElement.removeEventListener('mouseleave', leave);
      window.removeEventListener('blur', leave);
      window.removeEventListener('resize', refresh);
      document.removeEventListener('visibilitychange', leave);
    };
  }, []);

  const layer = (base) => [...TEXT].map((letter, index) => (
    <span className="stay-creative-slot" key={index} data-bulge-letter={base ? '' : undefined}>
      <span className="stay-creative-measure">{letter}</span>
      <span className="stay-creative-glyph"
        >{letter}</span>
    </span>
  ));

  return (
    <section data-stay-creative="" className="relative w-full flex items-center justify-center overflow-visible">
      <h2 data-audio-layout="" ref={textRef} aria-label={TEXT}
        className="stay-creative-text"
        style={{ '--sx': '-9999px', '--sy': '-9999px' }}>
        <span aria-hidden="true" className="stay-creative-base">{layer(true)}</span>
        <span aria-hidden="true" className="stay-creative-reveal">{layer(false)}</span>
      </h2>
    </section>
  );
}
