import { memo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import './SocialGridsSection.css';

const GRIDS = [
  { id: 'kansa', title: 'Kansa Thali Set', description: 'Kansa tableware social media grid with a layered phone preview.', backX: '-7%', frontX: '18%', backScale: .9, frontScale: 1.05, tone: '142, 101, 15' },
  { id: 'napkin', title: 'Napkin Rings', description: 'Napkin ring collection social media grid with a layered phone preview.', backX: '8%', frontX: '-6%', backScale: .9, frontScale: 1.08, tone: '18, 109, 115' },
  { id: 'firstplay', title: 'Firstplay', description: 'Firstplay workshop social media grid with a layered phone preview.', backX: '-15%', frontX: '38%', backScale: 1.05, frontScale: 1.08, tone: '29, 65, 116' },
];

const GridComposition = memo(function GridComposition({ grid }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // The phone passes in front of the artwork; neither layer floats on its own.
  const backY = useTransform(scrollYProgress, [0, 1], ['-2%', '2%']);
  const frontY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%']);
  const frontScale = useTransform(scrollYProgress, [0, 1], [1.015, 1.045]);
  const image = (layer) => (
    <img src={`/assets/photos/bg-fs/${grid.id}-${layer}-1200.webp`}
      srcSet={`/assets/photos/bg-fs/${grid.id}-${layer}-1200.webp 1200w, /assets/photos/bg-fs/${grid.id}-${layer}-2400.webp 2400w`}
      sizes="(max-width: 767px) 100vw, (max-width: 1600px) 94vw, 1440px"
      width="2400" height="1350" alt="" loading="lazy" decoding="async" draggable={false}
      onError={() => setFailed(true)} />
  );

  return <figure ref={ref} className="social-grid-scene" data-grid-composition={grid.id}
    data-audio-obstacle="" role="img" aria-label={grid.description}
    style={{ '--grid-tone': grid.tone, '--back-x': grid.backX, '--front-x': grid.frontX,
      '--back-scale': grid.backScale, '--front-scale': grid.frontScale }}>
    <div className="social-grid-atmosphere" aria-hidden="true" />
    {!failed ? <>
      <motion.div className="social-grid-plane social-grid-back" aria-hidden="true" style={{ y: reduce ? 0 : backY }}>
        {image('back')}
      </motion.div>
      <motion.div className="social-grid-plane social-grid-front" aria-hidden="true"
        style={{ y: reduce ? 0 : frontY, scale: reduce ? 1 : frontScale }}>
        {image('front')}
      </motion.div>
    </> : <figcaption className="social-grid-fallback font-clash">{grid.title}<span>Preview unavailable</span></figcaption>}
  </figure>;
});

export default function SocialGridsSection() {
  return <section id="section-social-grids" className="social-grids-section" aria-labelledby="social-grids-heading">
    <div className="social-grids-header">
      <h2 id="social-grids-heading" className="font-dirtyline text-[clamp(40px,8vw,80px)] leading-none m-0">Social media grids</h2>
    </div>
    <div className="social-grids-gallery">
      {GRIDS.map(grid => <GridComposition key={grid.id} grid={grid} />)}
    </div>
  </section>;
}
