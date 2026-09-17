import { useRef } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import AudioWaveCard from '../AudioWaveCard';
import { useSharedCardPointer } from '../hooks/useSharedCardPointer';
import { CARD_DEPTHS } from '../data/audioCardLayout';
import './QuoteAudioAccents.css';

const ACCENTS = [
  { depth: 'distant', name: 'room_tone.wav', variant: 'green', width: 120, height: 40, className: 'quote-audio-distant', travel: 40 },
  { depth: 'regular', name: 'sfx_whoosh.wav', variant: 'purple', width: 175, height: 54, className: 'quote-audio-regular', travel: 80 },
  { depth: 'blurred', name: 'music_bed.wav', variant: 'orange', width: 290, height: 90, className: 'quote-audio-foreground', travel: 160 },
];

function AccentPlane({ accent, progress, pointer, reducedMotion }) {
  const multiplier = CARD_DEPTHS[accent.depth].pointerScale;
  const x = useTransform(pointer.x, value => value * multiplier);
  const y = useTransform(() => (0.5 - progress.get()) * accent.travel + pointer.y.get() * multiplier);
  return <motion.div className={`quote-audio-accent ${accent.className}`}
    style={{ x: reducedMotion ? 0 : x, y: reducedMotion ? 0 : y }}>
    <AudioWaveCard {...accent} className="relative" type="whoosh" textLeft={accent.depth === 'blurred'} />
  </motion.div>;
}

export default function QuoteAudioAccents({ progress }) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const pointer = useSharedCardPointer(ref, !reducedMotion);
  return <div ref={ref} className="quote-audio-accents" data-audio-decoration="" aria-hidden="true">
    {ACCENTS.map(accent => <AccentPlane key={accent.depth} accent={accent} progress={progress} pointer={pointer} reducedMotion={reducedMotion} />)}
  </div>;
}
