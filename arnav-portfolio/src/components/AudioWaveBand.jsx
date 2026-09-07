import AudioWaveCard from '../AudioWaveCard';

// Stable, scattered positions. Each band reserves the full parallax envelope
// so decorations cannot cross into the neighboring content.
const GROUPS = {
  intro: [
    { name: 'sfx_whoosh.wav', variant: 'purple', type: 'whoosh', depth: 60, className: 'top-[80px] left-[9%]' },
    { name: 'titles.png', variant: 'orange', type: 'whoosh', depth: 70, textLeft: true, className: 'top-[112px] -right-[60px]' },
  ],
  collaborators: [
    { name: 'background.jpeg', variant: 'cyan', type: 'bass', depth: 70, className: 'top-[80px] -left-[64px]' },
    { name: 'reel_final_v3.mp4', variant: 'red', type: 'riser', depth: 60, className: 'top-[112px] right-[16%]' },
  ],
  posts: [
    { name: 'color_grade.cube', variant: 'green', type: 'whoosh', depth: 60, className: 'top-[112px] left-[12%]' },
    { name: 'music_bed.wav', variant: 'orange', type: 'bass', depth: 70, textLeft: true, className: 'top-[80px] right-[6%]' },
  ],
  playground: [
    { name: 'logo_reveal.mov', variant: 'cyan', type: 'riser', depth: 70, className: 'top-[80px] left-[18%]' },
    { name: 'showreel_comp.aep', variant: 'purple', type: 'bass', depth: 60, textLeft: true, className: 'top-[112px] -right-[70px]' },
  ],
};

export default function AudioWaveBand({ placement }) {
  return (
    <div data-file-band={placement} aria-hidden="true" className="relative hidden md:block h-72 w-full overflow-hidden pointer-events-none">
      {GROUPS[placement].map(card => (
        <AudioWaveCard key={card.name} {...card} className={`absolute ${card.className}`} />
      ))}
    </div>
  );
}
