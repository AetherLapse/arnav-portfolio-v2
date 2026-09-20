export const CARD_SCROLL_SPEED = 0.65;
export const BLURRED_SCROLL_SPEED = 0.94;
export const BLURRED_POINTER_MULTIPLIER = 2.2;
export const CARD_POINTER_X = 24;
export const CARD_POINTER_Y = 14;

export const CARD_DEPTHS = {
  distant: { scale: 0.72, scrollSpeed: 0.5, pointerScale: 0.4 },
  regular: { scale: 1, scrollSpeed: CARD_SCROLL_SPEED, pointerScale: 1 },
  blurred: { scale: 1.8, scrollSpeed: BLURRED_SCROLL_SPEED, pointerScale: BLURRED_POINTER_MULTIPLIER },
};

function seededRandom(seed) {
  let state = [...seed].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619), 2166136261);
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// Stable per-section accents. Foreground clips may cross panel borders, but text
// and interactive controls remain protected. No scroll-time randomization.
export function createAudioCardLayout(width, height, obstacles, viewportHeight, regions = {}) {
  const cards = [];
  const colors = ['purple', 'cyan', 'green', 'orange', 'red'];
  for (const [regionName, region] of Object.entries(regions)) {
    const random = seededRandom(`timeline-${regionName}`);
    const surfaces = obstacles.filter(o => o.surface && o.top < region.top + region.height && o.bottom > region.top);
    for (const [index, depth] of ['distant', 'regular', 'blurred'].entries()) {
      const foreground = depth === 'blurred';
      const cardWidth = Math.round((foreground ? 290 : index ? 165 : 112) + random() * (foreground ? 70 : 45));
      const cardHeight = Math.round((foreground ? 65 : index ? 38 : 28) + random() * 12);
      const { scrollSpeed, pointerScale } = CARD_DEPTHS[depth];
      const horizontalRoom = CARD_POINTER_X * pointerScale + 10;
      const verticalRoom = (1 - scrollSpeed) / scrollSpeed * (viewportHeight / 2 + cardHeight)
        + CARD_POINTER_Y * pointerScale / scrollSpeed + 10;
      const preferred = region.top + region.height * ([.16, .43, .74][index] + (random() - .5) * .13);
      let best, bestScore = Infinity;
      for (let attempt = 0; attempt < 700; attempt++) {
        let left = 12 + random() * Math.max(0, width - cardWidth - 24);
        let top = region.top + 25 + random() * Math.max(0, region.height - cardHeight - 50);
        if (foreground && surfaces.length && attempt < 450) {
          const panel = surfaces[Math.floor(random() * surfaces.length)];
          left = (random() > .5 ? panel.right : panel.left) - cardWidth * (.3 + random() * .4);
          top = Math.max(region.top + 20, Math.min(panel.top + random() * (panel.bottom - panel.top), region.top + region.height - cardHeight - 20));
        } else if (attempt > 350) {
          left = random() > .5 ? width - cardWidth * .45 : -cardWidth * .55;
        }
        const rect = { left, right: left + cardWidth, top, bottom: top + cardHeight };
        const envelope = { left: left - horizontalRoom, right: rect.right + horizontalRoom, top: top - verticalRoom, bottom: rect.bottom + verticalRoom };
        if (obstacles.some(o => !(foreground && o.surface) && overlaps(envelope, o))) continue;
        if (cards.some(c => overlaps(envelope, c.envelope))) continue;
        const onSurface = surfaces.some(o => overlaps(rect, o));
        const score = Math.abs(top - preferred) + (foreground && !onSurface ? region.height * 3 : 0)
          + (left < 0 || rect.right > width ? 90 : 0);
        if (score < bestScore) { best = { left, top, envelope, onSurface }; bestScore = score; }
      }
      // Try clipped edges in dense sections. The final pass removes smaller
      // accents if these fallback positions conflict with larger clips.
      if (foreground && surfaces.length && !best?.onSurface) best = undefined;
      if (!best) {
        let left = index === 1 ? width - cardWidth * .32 : -cardWidth * (foreground ? .72 : .68);
        let top = Math.min(region.top + region.height - cardHeight - 12, preferred);
        if (foreground && surfaces.length) {
          let cornerScore = Infinity;
          for (const panel of surfaces.filter(p => p.right - p.left > 150 && p.bottom - p.top > 80)) {
            for (const x of [panel.left - cardWidth * .78, panel.right - cardWidth * .22]) {
              for (const y of [panel.top - cardHeight * .6, panel.bottom - cardHeight * .4]) {
                if (y < region.top || y + cardHeight > region.top + region.height) continue;
                const rect = { left: x, right: x + cardWidth, top: y, bottom: y + cardHeight };
                const collisions = obstacles.filter(o => !o.surface && overlaps(rect, o)).length;
                const cardCollisions = cards.filter(c => overlaps(rect, c.envelope)).length;
                const score = collisions * 100000 + cardCollisions * 10000 + Math.abs(y - preferred);
                if (score < cornerScore) { cornerScore = score; left = x; top = y; }
              }
            }
          }
        }
        best = { left, top, envelope: { left: left - horizontalRoom, right: left + cardWidth + horizontalRoom,
          top: top - verticalRoom, bottom: top + cardHeight + verticalRoom } };
      }
      const prefix = regionName.replace('section-', '').replace(/-/g, '_').toUpperCase();
      cards.push({ ...best, name: `${prefix}_${['SELECTS.mp4','MOTION.aep','MASTER.mov'][index]}`, region: regionName,
        depth, blurred: foreground, scrollSpeed, kind: 'clip', variant: colors[Math.floor(random() * colors.length)],
        width: cardWidth, height: cardHeight, edge: best.left < 0 || best.left + cardWidth > width ? 'clipped' : 'inside' });
    }
  }
  // Resolve collisions once, not on scroll, so clips never pop in and out.
  // Envelopes include each depth plane's scroll and pointer travel.
  const kept = [];
  for (const card of [...cards].sort((a, b) => b.width * b.height - a.width * a.height)) {
    if (!kept.some(other => overlaps(card.envelope, other.envelope))) kept.push(card);
  }
  return cards.filter(card => kept.includes(card));
}
