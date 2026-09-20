// Shared clip appearance for the timeline backgrounds and floating edit clips.
export default function TimelineClip({ name, color = '#9b59b6', style, className = '' }) {
  return (
    <div data-timeline-clip="" className={`relative rounded-[2px] flex items-center overflow-hidden ${className}`}
      style={{ backgroundColor: `${color}33`, borderLeft: `2px solid ${color}`, borderRight: `1px solid ${color}66`, borderTop: `1px solid ${color}44`, borderBottom: `1px solid ${color}44`, ...style }}>
      <span className="font-clash text-[9px] text-white/80 px-2 truncate whitespace-nowrap relative z-10">{name}</span>
    </div>
  );
}
