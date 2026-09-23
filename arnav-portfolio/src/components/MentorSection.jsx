import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { MENTORS } from '../data/mentors';
import './MentorSection.css';
import MentorStory from './MentorStory';

function MentorPhoto({ mentor, index }) {
  const [failed, setFailed] = useState(false);
  return mentor.image && !failed ? <img src={mentor.image} alt={mentor.example ? `Example photograph for mentor ${index + 1}` : `Arnav with ${mentor.name || 'his mentor'}`} loading="lazy" decoding="async" style={{ objectPosition: mentor.focalPoint }} onError={() => setFailed(true)} />
    : <span className="mentor-photo-placeholder"><ImageIcon size={24} strokeWidth={1} aria-hidden="true" /><span>{failed ? 'Photograph unavailable' : `A moment with mentor ${String(index + 1).padStart(2, '0')}`}</span><small>{failed ? 'Please try again later' : 'Photograph coming soon'}</small></span>;
}

export default function MentorSection() {
  const [story, setStory] = useState(null);
  return <section id="section-mentors" className="mentor-section" data-audio-obstacle="" aria-labelledby="mentors-heading">
    <div className="mentor-container">
      <header className="mentor-header">
        <h2 id="mentors-heading" className="font-dirtyline text-[clamp(40px,8vw,80px)] leading-none text-[var(--black)] m-0">MY MENTORS</h2>
        <p>The people behind the perspective.</p>
      </header>
      <div className="mentor-gallery">
        {MENTORS.map((mentor, index) => <figure className="mentor-portrait" key={mentor.id}>
          <button type="button" className="mentor-frame" aria-label={`Read the story with ${mentor.name || `mentor ${index + 1}`}`} aria-haspopup="dialog" onClick={() => setStory(index)}>
            <span className="mentor-photo"><MentorPhoto mentor={mentor} index={index} /></span>
            <span className="mentor-story-cue" aria-hidden="true">Explore the story <span>↗</span></span>
          </button>
          <figcaption className="mentor-caption">
            <span className="mentor-count">0{index + 1}</span>
            <div><h3>{mentor.name || 'A shared journey'}</h3><p>{mentor.reflection || 'Mentorship, moments, and a new perspective.'}</p></div>
          </figcaption>
        </figure>)}
      </div>
    </div>
    {story !== null && <MentorStory mentor={MENTORS[story]} index={story} onClose={() => setStory(null)}><MentorPhoto mentor={MENTORS[story]} index={story} /></MentorStory>}
  </section>;
}
