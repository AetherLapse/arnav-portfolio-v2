import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import TimelineClip from './TimelineClip';

export default function PremiereTimeline() {
  const rootRef = useRef(null);
  const visible = useInView(rootRef);
  const reducedMotion = useReducedMotion();
  const tracks = [
    { label: 'V4', color: '#9b59b6', clips: [{ start: 5, width: 15, name: 'GLITCH.mogrt' }, { start: 48, width: 20, name: 'TRANS_03' }, { start: 75, width: 18, name: 'TITLE.mogrt' }] },
    { label: 'V3', color: '#e74c3c', clips: [{ start: 0, width: 30, name: 'HERO_COMP.mp4' }, { start: 35, width: 25, name: 'REEL_CUT_02' }, { start: 65, width: 30, name: 'OUTRO.mogrt' }] },
    { label: 'V2', color: '#FF0000', clips: [{ start: 2, width: 42, name: 'SHOWREEL_v3.mp4' }, { start: 50, width: 45, name: 'CONTACT_ANIM.aep' }] },
    { label: 'V1', color: '#2ecc71', clips: [{ start: 0, width: 95, name: 'BASE_EDIT_FINAL.mp4' }] },
    { label: 'A1', color: '#3498db', clips: [{ start: 0, width: 55, name: 'VO_MASTER.wav' }, { start: 60, width: 35, name: 'VO_OUTRO.wav' }] },
    { label: 'A2', color: '#e67e22', clips: [{ start: 2, width: 92, name: 'SCORE_ATMOSPHERIC.mp3' }] },
    { label: 'A3', color: '#1abc9c', clips: [{ start: 10, width: 20, name: 'SFX_WHOOSH.wav' }, { start: 40, width: 12, name: 'SFX_HIT.wav' }, { start: 62, width: 15, name: 'SFX_RISE.wav' }, { start: 82, width: 10, name: 'SFX_END.wav' }] },
  ];

  const timeMarkers = ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25', '00:30', '00:35', '00:40', '00:45', '00:50', '00:55', '01:00'];

  return (
    <div
      ref={rootRef}
      data-premiere-timeline=""
      data-audio-decoration=""
      className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden opacity-[0.12]"
      style={{ transform: 'rotate(-8deg) scale(1.4)', transformOrigin: 'center center' }}
    >
      <div className="w-full h-full flex flex-col justify-center px-4">
        {/* Timeline ruler */}
        <div className="flex items-end mb-1 ml-[40px]">
          {timeMarkers.map((t, i) => (
            <div key={i} className="flex-1 flex flex-col items-start">
              <span className="font-clash text-[8px] text-white mb-1">{t}</span>
              <div className="w-[1px] h-2 bg-white/40" />
            </div>
          ))}
        </div>
        <div className="h-[1px] bg-white/30 ml-[40px] mb-2" />

        {/* Playhead */}
        <div className="relative ml-[40px] mb-1">
          <motion.div
            className="absolute top-0 z-20 w-full"
            animate={{ x: visible && !reducedMotion ? ['0%', '95%'] : '33%' }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          >
            <div className="flex flex-col items-center w-3">
              <div className="w-2.5 h-2.5 bg-[var(--red)] rotate-45 -mb-0.5" />
              <div className="w-[2px] h-[260px] bg-[var(--red)]" />
            </div>
          </motion.div>
        </div>

        {/* Tracks */}
        <div className="flex flex-col gap-[2px]">
          {tracks.map((track, ti) => (
            <div key={ti} className="flex items-stretch">
              <div className="w-[40px] flex-shrink-0 flex items-center justify-center border-r border-white/20">
                <span className="font-clash text-[9px] tracking-wider text-white/70">{track.label}</span>
              </div>
              <div className="flex-1 relative h-8 border-b border-white/5">
                {track.clips.map((clip, ci) => (
                  <motion.div
                    key={ci}
                    className="absolute top-[2px] bottom-[2px] rounded-[2px] flex items-center overflow-hidden"
                    style={{
                      left: `${clip.start}%`,
                      width: `${clip.width}%`,
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, delay: ti * 0.08 + ci * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <TimelineClip name={clip.name} color={track.color} keyframes={ci === 0} className="w-full h-full" />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Second pass of tracks (to fill the diagonal space) */}
        <div className="mt-6 flex flex-col gap-[2px]">
          {tracks.slice(0, 4).map((track, ti) => (
            <div key={ti} className="flex items-stretch">
              <div className="w-[40px] flex-shrink-0 flex items-center justify-center border-r border-white/20">
                <span className="font-clash text-[9px] tracking-wider text-white/70">{track.label}</span>
              </div>
              <div className="flex-1 relative h-8 border-b border-white/5">
                {track.clips.map((clip, ci) => (
                  <TimelineClip key={ci} name={clip.name} color={track.color} keyframes={false}
                    className="absolute top-[2px] bottom-[2px]"
                    style={{ left: `${clip.start + 10}%`, width: `${clip.width * 0.8}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


