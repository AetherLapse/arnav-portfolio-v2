const VARIANTS = {
  purple: 'linear-gradient(90deg, rgba(82,17,118,0.9), rgba(154,42,179,0.78))',
  orange: 'linear-gradient(90deg, rgba(103,42,16,0.9), rgba(176,75,35,0.78))',
  green: 'linear-gradient(90deg, rgba(40,120,24,0.9), rgba(103,201,52,0.8))',
  cyan: 'linear-gradient(90deg, rgba(19,134,162,0.9), rgba(51,213,218,0.8))',
  red: 'linear-gradient(90deg, rgba(120,15,15,0.9), rgba(180,30,30,0.78))',
};

function fract(x) { return x - Math.floor(x); }
function noise(i) { return fract(Math.sin(i * 12.9898) * 43758.5453123); }

function getEnvelope(t, type) {
  switch (type) {
    case 'riser': return 0.08 + 0.78 * Math.pow(t, 1.9) + 0.22 * Math.exp(-Math.pow((t - 0.86) / 0.05, 2));
    case 'bass': return 0.22 + 0.65 * Math.exp(-t * 2.8);
    case 'whoosh': default: return 0.18 + 0.42 * Math.exp(-Math.pow((t - 0.5) / 0.35, 2));
  }
}

function DenseWaveform({ type = 'whoosh', bars = 220, height = 56, color = 'rgba(255,255,255,0.82)' }) {
  const barWidth = 1.35;
  const gap = 0.28;
  const width = bars * (barWidth + gap);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '58px', zIndex: 1, opacity: 0.95 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const t = i / (bars - 1);
        const env = getEnvelope(t, type);
        const n1 = noise(i);
        const n2 = noise(i * 1.7 + 11.3);
        const n3 = noise(i * 0.37 + 5.1);
        const texture = 0.55 + n1 * 0.22 + n2 * 0.15 + n3 * 0.08;
        const h = Math.max(2, env * texture * height);
        const x = i * (barWidth + gap);
        const y = height - h;
        return <rect key={i} x={x} y={y} width={barWidth} height={h} rx="0.6" fill={color} />;
      })}
    </svg>
  );
}

export default function AudioWaveCard({ name = "whoosh.wav", variant = "orange", type = "whoosh", thumbnail = false, className = "" }) {
  return (
    <div
      className={`pointer-events-none select-none hidden md:block ${className}`}
      style={{
        width: '240px',
        height: '68px',
        borderRadius: '14px',
        overflow: 'hidden',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.1)',
        background: VARIANTS[variant] || VARIANTS.orange,
      }}
    >
      <DenseWaveform type={type} />

      {thumbnail && (
        <div style={{
          position: 'absolute', left: '64px', top: '4px', width: '74px', height: '56px',
          border: '2px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.03)',
          zIndex: 3, overflow: 'hidden',
        }}>
          <svg viewBox="0 0 120 80" style={{ width: '100%', height: '100%' }}>
            <path d="M8 14 L48 5 M10 24 L72 8 M14 35 L88 14 M18 47 L97 25 M22 59 L103 39 M30 69 L109 52" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <span className="font-clash" style={{
        position: 'absolute', top: '8px', right: '10px', zIndex: 4,
        color: 'white', fontSize: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }}>{name}</span>
    </div>
  );
}
