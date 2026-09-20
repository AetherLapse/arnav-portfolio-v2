import { useEffect, useRef, useState } from 'react';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import { MENTORS } from '../data/mentors';
import './MentorSection.css';
import MentorStory from './MentorStory';

// A leads at left; B spans the top; C leads at right.
// Keep each photo mounted so the frames travel continuously between layouts.
const ARRANGEMENTS = [
  [{ left: '0%', top: '0%', width: '50%', height: '100%' }, { left: '50%', top: '0%', width: '50%', height: '50%' }, { left: '50%', top: '50%', width: '50%', height: '50%' }],
  [{ left: '0%', top: '50%', width: '50%', height: '50%' }, { left: '0%', top: '0%', width: '100%', height: '50%' }, { left: '50%', top: '50%', width: '50%', height: '50%' }],
  [{ left: '0%', top: '50%', width: '50%', height: '50%' }, { left: '0%', top: '0%', width: '50%', height: '50%' }, { left: '50%', top: '0%', width: '50%', height: '100%' }],
];

function MentorPhoto({ mentor, index }) {
  const [failed, setFailed] = useState(false);
  return mentor.image && !failed ? <img src={mentor.image} alt={mentor.example ? `Example photograph for mentor ${index + 1}` : `Arnav with ${mentor.name || 'his mentor'}`} loading="lazy" decoding="async" style={{ objectPosition: mentor.focalPoint }} onError={() => setFailed(true)} />
    : <span className="mentor-photo-placeholder"><ImageIcon size={24} strokeWidth={1} aria-hidden="true" /><span>{failed ? 'Photograph unavailable' : `A moment with mentor ${String(index + 1).padStart(2, '0')}`}</span><small>{failed ? 'Please try again later' : 'Photograph coming soon'}</small></span>;
}

export default function MentorSection() {
  const [active, setActive] = useState(0);
  const [story, setStory] = useState(null);
  const reducedMotion = useReducedMotion();
  const [scope, animate] = useAnimate();
  const completed = useRef(0);
  const requested = useRef(0);
  const running = useRef(false);
  const disposed = useRef(false);
  useEffect(() => {
    disposed.current = false;
    return () => { disposed.current = true; };
  }, []);

  const select = async index => {
    requested.current = index;
    setActive(index);
    if (running.current) return;
    running.current = true;
    const move = async (frame, bounds) => {
      if (disposed.current || !scope.current) return;
      await animate(scope.current.querySelectorAll('.mentor-frame')[frame], bounds, {
        duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1],
      });
    };
    try {
      while (!disposed.current && completed.current !== requested.current) {
        const from = completed.current;
        const target = requested.current;
        // First release the dominant rectangle into its own square. No other
        // frame moves until the space has actually become available.
        let topLeft = from === 2;
        if (from === 0) await move(0, ARRANGEMENTS[1][0]);
        if (from === 1) {
          topLeft = target !== 0;
          await move(1, topLeft ? ARRANGEMENTS[2][1] : ARRANGEMENTS[0][1]);
        }
        if (from === 2) await move(2, ARRANGEMENTS[0][2]);
        if (disposed.current) break;
        // The top row is now clear for B to slide without crossing A or C.
        if (target === 0 && topLeft) await move(1, ARRANGEMENTS[0][1]);
        if (target === 2 && !topLeft) await move(1, ARRANGEMENTS[2][1]);
        if (disposed.current) break;
        await move(target, ARRANGEMENTS[target][target]);
        completed.current = target;
      }
    } finally {
      running.current = false;
    }
  };
  const mentor = MENTORS[active];
  const selectWithKeyboard = (event, index) => {
    const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const next = (index + direction + MENTORS.length) % MENTORS.length;
    select(next);
    event.currentTarget.parentElement.querySelectorAll('button')[next]?.focus({ preventScroll: true });
  };
  return <section id="section-mentors" className="mentor-section" data-audio-obstacle="" aria-labelledby="mentors-heading">
    <div className="mentor-container">
      <header className="mentor-header">
        <h2 id="mentors-heading" className="font-dragon text-[clamp(40px,8vw,80px)] leading-none text-[var(--black)] block m-0"><span className="block font-dragon text-[clamp(40px,8vw,80px)]">MY MENTORS</span></h2>
      </header>
      <div className="mentor-gallery">
        <div ref={scope} className="mentor-collage" role="group" aria-label="Moments with Arnav's mentors. Hover or focus to expand a photograph. Click or tap to read the mentor story." data-active-mentor={active}>
          {MENTORS.map((item, index) => <button key={item.id} type="button" className="mentor-frame" style={ARRANGEMENTS[0][index]}
            aria-label={`Read the story with ${item.name || `mentor ${index + 1}`}`} aria-haspopup="dialog" aria-describedby="mentor-caption"
            onPointerEnter={event => { if (event.pointerType === 'mouse' && !running.current) select(index); }}
            onPointerMove={event => { if (event.pointerType === 'mouse' && (event.movementX || event.movementY)) select(index); }}
            onFocus={() => select(index)} onClick={() => { select(index); setStory(index); }} onKeyDown={event => selectWithKeyboard(event, index)}>
            <span className="mentor-photo"><MentorPhoto mentor={item} index={index} /><span className="mentor-story-cue" aria-hidden="true">Read our story ↗</span></span>
          </button>)}
        </div>
        <div id="mentor-caption" className="mentor-caption" aria-live="polite" aria-atomic="true">
          <motion.div key={mentor.id} initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <div className="mentor-name"><h3>{mentor.name || `Mentor ${String(active + 1).padStart(2, '0')}`}</h3>{(mentor.discipline || mentor.example) && <span>{mentor.discipline || 'Example photograph'}</span>}</div>
            <p>{mentor.reflection || 'The people and moments behind the creative journey.'}</p>
          </motion.div>
          <span className="mentor-count" aria-hidden="true">{String(active + 1).padStart(2, '0')} / 03</span>
        </div>
      </div>
    </div>
    {story !== null && <MentorStory mentor={MENTORS[story]} index={story} onClose={() => setStory(null)}><MentorPhoto mentor={MENTORS[story]} index={story} /></MentorStory>}
  </section>;
}
