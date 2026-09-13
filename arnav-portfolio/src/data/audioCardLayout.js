export const CARD_SCROLL_SPEED = 0.65;
export const BLURRED_SCROLL_SPEED = 0.94;
export const BLURRED_POINTER_MULTIPLIER = 2.2;
export const CARD_POINTER_X = 24;
export const CARD_POINTER_Y = 14;

export const CLIP_CARD_NAMES = new Set(['titles.png', 'film_grain.png', 'reel_final_v3.mp4', 'showreel_comp.aep', 'outro_final.mov']);

export const BLURRED_CARD_NAMES = new Set(['logo_reveal.mov', 'background.jpeg', 'music_bed.wav']);

export const DISTANT_CARD_NAMES = new Set(['room_tone.wav', 'color_grade.cube', 'transition_07.wav']);
export const CARD_DEPTHS = {
  distant: { scale: 0.72, scrollSpeed: 0.5, pointerScale: 0.4 },
  regular: { scale: 1, scrollSpeed: CARD_SCROLL_SPEED, pointerScale: 1 },
  blurred: { scale: 1.8, scrollSpeed: BLURRED_SCROLL_SPEED, pointerScale: BLURRED_POINTER_MULTIPLIER },
};

const CARDS = [
  ['titles.png', 'orange', 'whoosh', 'half-right'],
  ['sfx_whoosh.wav', 'purple', 'whoosh', 'near-left'],
  ['film_grain.png', 'cyan', 'bass', 'inside'],
  ['background.jpeg', 'cyan', 'bass', 'half-left'],
  ['reel_final_v3.mp4', 'red', 'riser', 'near-right'],
  ['room_tone.wav', 'green', 'bass', 'inside'],
  ['lower_third.mov', 'purple', 'whoosh', 'near-left'],
  ['color_grade.cube', 'green', 'whoosh', 'inside'],
  ['music_bed.wav', 'orange', 'bass', 'near-right'],
  ['showreel_comp.aep', 'purple', 'bass', 'half-right'],
  ['logo_reveal.mov', 'cyan', 'riser', 'inside'],
  ['transition_07.wav', 'red', 'whoosh', 'near-right'],
  ['light_leak.png', 'orange', 'riser', 'half-left'],
];

// Give the final sections their own individual accents before filling the
// rest of the page. These use the same shared layer, never separate groups.
const FOOTER_CARDS = [
  ['lets_talk.wav', 'purple', 'whoosh', 'half-left', 'contact'],
  ['outro_final.mov', 'cyan', 'riser', 'cropped-right', 'creative'],
];

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

// A single scatter over the existing page: no rows, bands, or added page height.
// Every candidate must clear content for its full parallax and hover travel.
export function createAudioCardLayout(width, height, obstacles, viewportHeight, regions = {}) {
  const placed = [];
  const surfaces = obstacles.filter(rect => rect.surface);
  for (const [index, [name, variant, type, edge, regionName]] of [...FOOTER_CARDS, ...CARDS].entries()) {
    const region = regions[regionName];
    if (regionName && !region) continue;
    const random = seededRandom(`individual-${name}`);
    const blurred = BLURRED_CARD_NAMES.has(name);
    const depth = blurred ? 'blurred' : DISTANT_CARD_NAMES.has(name) ? 'distant' : 'regular';
    const { scale, scrollSpeed, pointerScale } = CARD_DEPTHS[depth];
    const cardWidth = Math.round((125 + random() * 80) * scale);
    const cardHeight = Math.round((40 + random() * 28) * scale);
    const horizontalRoom = CARD_POINTER_X * pointerScale + 20;
    // Relative travel while the card is anywhere in the viewport, including
    // hover clearance. Outside that range the decoration is not visible.
    const verticalRoom = (1 - scrollSpeed) / scrollSpeed
      * (viewportHeight / 2 + cardHeight) + CARD_POINTER_Y * pointerScale / scrollSpeed + 18;
    const safe = candidate => candidate.envelope.top >= 0 && candidate.envelope.bottom <= height
      && !obstacles.some(rect => !(blurred && rect.surface) && overlaps(candidate.envelope, rect))
      && !placed.some(card => overlaps(candidate.envelope, card.envelope) || Math.abs(candidate.top - card.top) < 320);
    const make = (left, top) => ({
      name, variant, type, edge, blurred, depth, scrollSpeed, region: regionName, width: cardWidth, height: cardHeight, kind: CLIP_CARD_NAMES.has(name) ? 'clip' : 'wave',
      left, top, textLeft: edge === 'half-right' || edge === 'cropped-right',
      envelope: { left: left - horizontalRoom, right: left + cardWidth + horizontalRoom,
        top: top - verticalRoom, bottom: top + cardHeight + verticalRoom },
    });
    let best;
    let bestDistance = Infinity;
    const preferredTop = region ? region.top + region.height * 0.45
      : height * ((index - FOOTER_CARDS.length + 0.25 + random() * 0.5) / CARDS.length);
    for (let attempt = 0; attempt < 2200; attempt++) {
      let left;
      if (edge === 'half-left') left = -cardWidth / 2;
      else if (edge === 'half-right') left = width - cardWidth / 2;
      else if (edge === 'cropped-right') left = width - cardWidth * (0.1 + random() * 0.3);
      else if (edge === 'near-left') left = horizontalRoom + 8 + random() * 28;
      else if (edge === 'near-right') left = width - cardWidth - horizontalRoom - 8 - random() * 28;
      else left = horizontalRoom + 8 + random() * (width - cardWidth - (horizontalRoom + 8) * 2);
      // Reserve at most one edge-clipped distant accent when the larger
      // slow-scroll envelope cannot fit within the page's content margins.
      if (depth === 'distant' && attempt > 1600
        && !placed.some(card => card.depth === 'distant' && (card.left < 0 || card.left + card.width > width))) {
        left = random() > 0.5 ? -cardWidth * 0.55 : width - cardWidth * 0.45;
      }
      let top = region ? region.top + random() * Math.max(0, region.height - cardHeight)
        : verticalRoom + random() * Math.max(0, height - cardHeight - verticalRoom * 2);
      if (blurred && surfaces.length && attempt % 2 === 0) {
        const panel = surfaces[Math.floor(random() * surfaces.length)];
        left = (random() > 0.5 ? panel.right : panel.left) - cardWidth * 0.5;
        top = panel.top + random() * Math.max(0, panel.bottom - panel.top - cardHeight);
      }
      const candidate = make(Math.round(left), Math.round(top));
      const overlapsPanel = surfaces.some(panel => overlaps({ left, right: left + cardWidth, top, bottom: top + cardHeight }, panel));
      const distance = Math.abs(top - preferredTop) + (blurred && !overlapsPanel ? height : 0)
        + (edge === 'cropped-right' ? Math.max(0, cardWidth * 0.4 - (width - left)) * 0.5 : 0);
      if (distance < bestDistance && safe(candidate)) { best = candidate; bestDistance = distance; }
    }
    // If a narrow viewport has no clear pocket, omit the decoration instead
    // of covering real content or creating a spacer just to accommodate it.
    if (best) placed.push(best);
  }
  return placed;
}
