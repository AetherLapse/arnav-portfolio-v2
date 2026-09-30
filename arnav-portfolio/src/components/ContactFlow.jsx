import { useEffect, useRef } from 'react';
import './ContactFlow.css';

const LANES = [
  { offset: 0, duration: 65, reverse: false },
  { offset: 3, duration: 78, reverse: true },
  { offset: 1, duration: 70, reverse: false },
  { offset: 5, duration: 88, reverse: true },
];

export default function ContactFlow({ posts = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    let visible = false;
    const sync = () => element.style.setProperty('--contact-film-play', visible && !document.hidden ? 'running' : 'paused');
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);

  return <div ref={ref} className="contact-flow" aria-hidden="true" data-audio-decoration="">
    <div className="contact-film-plane">
      {LANES.map((lane, index) => <div className="contact-film-lane" key={index}>
        <div className="contact-film-track" style={{ animationDuration: `${lane.duration}s`, animationDirection: lane.reverse ? 'reverse' : 'normal' }}>
          {[0, 1].map(copy => <div className="contact-film-repeat" key={copy}>
            {posts.map((_, item) => {
              const post = posts[(item + lane.offset) % posts.length];
              return <div className="contact-film-frame" key={post.id}>
                <img src={post.img} alt="" loading="lazy" decoding="async" draggable={false}
                  onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
                <span>{post.title}</span>
              </div>;
            })}
          </div>)}
        </div>
      </div>)}
    </div>
    <div className="contact-film-shade" />
  </div>;
}
