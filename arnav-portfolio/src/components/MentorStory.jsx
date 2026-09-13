import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './MentorStory.css';

export default function MentorStory({ mentor, index, onClose, children }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  const name = mentor.name || `Mentor ${String(index + 1).padStart(2, '0')}`;
  return createPortal(<dialog ref={dialogRef} className="mentor-story" aria-labelledby="mentor-story-title"
    onCancel={event => { event.preventDefault(); closeRef.current(); }}
    onClick={event => { if (event.target === event.currentTarget) closeRef.current(); }}>
    <article className="mentor-story-panel">
      <button type="button" className="mentor-story-close" aria-label="Close mentor story" onClick={onClose}><X size={21} aria-hidden="true" /></button>
      <div className="mentor-story-photo">{children}{mentor.example && <span className="mentor-story-example">Example photograph</span>}</div>
      <div className="mentor-story-content">
        <header>
          <p className="mentor-story-eyebrow">WITH {name}</p>
          <h2 id="mentor-story-title" className="font-dragon">A SHARED<br />JOURNEY<span>.</span></h2>
          <p className="mentor-story-discipline">{mentor.discipline || 'Mentorship & creative growth'}</p>
          {mentor.reflection && <blockquote>{mentor.reflection}</blockquote>}
          {mentor.bio && <p className="mentor-story-bio">{mentor.bio}</p>}
          {mentor.example && <p className="mentor-story-note">The photographs and personal stories will be added soon.</p>}
        </header>
        <ol className="mentor-journey">
          {(mentor.journey || []).map((chapter, chapterIndex) => <li key={chapter.title}>
            <span className="mentor-chapter-number" aria-hidden="true">{String(chapterIndex + 1).padStart(2, '0')}</span>
            <div>{chapter.date && <time>{chapter.date}</time>}<h3>{chapter.title}</h3><p>{chapter.body || 'This part of the story is coming soon.'}</p></div>
          </li>)}
        </ol>
      </div>
    </article>
  </dialog>, document.body);
}
