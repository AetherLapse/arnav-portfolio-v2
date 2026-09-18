import { memo } from 'react';
import TimelineClip from './components/TimelineClip';
import './AudioWaveCard.css';

const COLORS = { purple: '#9b59b6', orange: '#e67e22', green: '#2ecc71', cyan: '#3498db', red: '#e74c3c' };

// Retain the existing motion/layout API; every decorative asset is now a clip.
const AudioWaveCard = memo(function AudioWaveCard({ name = 'EDIT_SEQUENCE.mp4', variant = 'orange', className = '', width = 240, height = 48, left, top, edge, region, depth = 'regular' }) {
  const blurred = depth === 'blurred';
  return <div data-file-card={name} data-card-depth={depth} data-depth-blurred={blurred ? '' : undefined}
    data-overlap-accent={blurred ? '' : undefined} data-card-kind="clip" data-edge={edge} data-card-region={region}
    aria-hidden="true" className={`pointer-events-none select-none hidden md:block ${className}`} style={{ width, height, left, top }}>
    <TimelineClip name={name} color={COLORS[variant]} className="audio-wave-surface w-full h-full"
      style={{ pointerEvents: blurred ? 'none' : 'auto' }} />
  </div>;
});
export default AudioWaveCard;
