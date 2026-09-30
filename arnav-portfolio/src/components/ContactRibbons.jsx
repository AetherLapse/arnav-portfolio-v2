import { useEffect, useRef } from 'react';
import { Film, AudioLines, Sparkles } from 'lucide-react';
import './ContactRibbons.css';

const RIBBONS = [
  { label: 'STORIES WORTH WATCHING', detail: 'VIDEO EDITING', Icon: Film },
  { label: 'MADE TO MOVE', detail: 'MOTION DESIGN', Icon: Sparkles },
  { label: 'LET’S CREATE SOMETHING', detail: 'PICTURE & SOUND', Icon: AudioLines },
];

export default function ContactRibbons() {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      element.style.setProperty('--ribbon-play', entry.isIntersecting ? 'running' : 'paused');
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="contact-ribbons" aria-hidden="true" data-audio-decoration="">
    {RIBBONS.map(({ label, detail, Icon }, index) => <div key={label} className={`contact-ribbon contact-ribbon-${index}`}>
      <div className="contact-ribbon-track">
        {[0, 1].map(copy => <div className="contact-ribbon-repeat" key={copy}>
          {[0, 1, 2].map(item => <span className="contact-ribbon-item" key={item}>
            <Icon size={20} strokeWidth={1.5} /><span>{label}</span><span className="contact-ribbon-detail">{detail}</span><span>✦</span>
          </span>)}
        </div>)}
      </div>
    </div>)}
  </div>;
}
