import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Plus, Minus } from 'lucide-react';
import TimelineClip from './TimelineClip';
import './ServicesSection.css';

const SERVICES = [
  { title: 'Video editing', description: 'Turn your footage into a story worth watching. I build the structure, find the rhythm, and refine every cut around the message.', deliverables: ['Brand films', 'YouTube edits', 'Campaign videos'], clips: ['ASSEMBLY.mp4', 'STORY_CUT.mp4', 'FINAL_EDIT.mp4'], color: '#e74c3c' },
  { title: 'Motion graphics', description: 'Give your message movement with animated titles, logo reveals, and graphics that feel part of the film.', deliverables: ['Title sequences', 'Logo animation', 'Explainers'], clips: ['TYPE_ANIM.mogrt', 'LOGO_REVEAL.aep', 'MOTION_PASS.mov'], color: '#9b59b6' },
  { title: 'Color & sound', description: 'Bring the edit together with a consistent look, clean dialogue, and sound that makes each moment land.', deliverables: ['Color grading', 'Dialogue cleanup', 'Sound design'], clips: ['COLOR_PASS.mov', 'DIALOGUE.wav', 'FINAL_MIX.wav'], color: '#3498db' },
  { title: 'Social content', description: 'Shape the same story for different screens. From the opening hook to the captions, every version is built for where it will be watched.', deliverables: ['Reels & shorts', 'Captioned edits', 'Campaign cutdowns'], clips: ['HOOK_01.mp4', 'CAPTIONS.mogrt', 'VERTICAL_CUT.mp4'], color: '#2ecc71' },
];

export default function ServicesSection({ onContact }) {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  return (
    <section data-audio-obstacle="" id="section-services" className="services-section" aria-labelledby="services-heading">
      <div className="services-layout">
        <header className="services-intro">
          <p className="services-kicker font-clash">From raw footage to the final cut</p>
          <h2 id="services-heading" className="font-dragon">WHAT I CAN<br />DO FOR YOU<span>.</span></h2>
          <p className="services-description font-clash">An edit, a campaign, or a whole new look. Let’s make your next story feel like you.</p>
          <button type="button" className="services-contact font-clash" onClick={onContact}>Tell me about your project <ArrowUpRight size={18} aria-hidden="true" /></button>
        </header>
        <div className="services-list">
          {SERVICES.map((service, index) => (
            <article key={service.title} className="service-item" data-open={active === index}>
              <h3>
                <button type="button" id={`service-title-${index}`} aria-expanded={active === index} aria-controls={`service-panel-${index}`}
                  onClick={() => setActive(active === index ? null : index)} className="service-toggle font-clash">
                  <span>{service.title}</span>{active === index ? <Minus aria-hidden="true" size={20} /> : <Plus aria-hidden="true" size={20} />}
                </button>
              </h3>
              <motion.div id={`service-panel-${index}`} role="region" aria-labelledby={`service-title-${index}`}
                aria-hidden={active !== index} inert={active !== index} initial={false}
                animate={{ height: active === index ? 'auto' : 0, opacity: active === index ? 1 : 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }} className="service-panel-motion">
                <div className="service-panel">
                <p className="font-clash">{service.description}</p>
                <ul className="service-deliverables font-clash">{service.deliverables.map(item => <li key={item}>{item}</li>)}</ul>
                <div className="service-edit-preview" data-audio-decoration="" aria-hidden="true">
                  {service.clips.map((name, clip) => <TimelineClip key={name} name={name} color={service.color}
                    className="service-preview-clip" style={{ width: `${72 - clip * 13}%`, marginLeft: `${clip * 13}%` }} />)}
                </div>
                </div>
              </motion.div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
