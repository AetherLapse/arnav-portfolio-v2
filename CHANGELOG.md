# Portfolio change log

Recorded September 9, 2026. Covers the work in this conversation, including the September 7 changes and the subsequent parallax refinement. Earlier agents' work is preserved in `.remember/` and is not attributed to this session.

## Preloader performance

- Extracted the preloader and multilingual greetings from `App.jsx` into `src/Preloader.jsx`.
- Replaced frame-by-frame root React state updates with Motion values and direct integer percentage updates.
- Moved the progress marker using transforms and made percentage digits tabular.
- Preserved the 7.5-second loading sequence, 400 ms completion hold, greeting changes, and curtain exit.
- Replaced the animated large shadow with a static glow whose opacity animates.
- Added animation/timer cleanup and reliable removal of the loading scroll lock.
- Delayed the hero's 3D background until the preloader exit finishes.
- The user confirmed the preloader was much smoother. Local measurements improved substantially; these were environment-specific observations, not general hardware benchmarks.

## Hero performance

- Extracted and memoized the hero so unrelated application updates do not rerender it.
- Localized rotating-title and cursor-hover state.
- Added `useHeroActivity` to pause hero work when offscreen, covered by the showreel, or in a hidden tab.
- Added `usePointerSpotlight` to batch pointer updates for the hero and footer.
- Limited breathing-text weight updates to 30 fps, quantized weights, and skipped unchanged letters.
- Batched dot-grid drawing and disabled pointer interaction on coarse-pointer devices.
- Paused hero CSS animations when inactive and removed continuously interpolated portrait shadows.
- Limited the tubes renderer to a maximum pixel ratio of 1 and a 1.5-million-pixel budget; suspended geometry and bloom rendering while inactive and disposed resources on unmount.
- Limited the LightRays pointer listener to its visible state.
- In the local desktop check, the tubes canvas changed from 2732×1536 to 1366×768, reducing rendered pixels by 75%. Software GPU limitations prevented a reliable hardware FPS comparison.

## Works subpage and navigation

- Added `/works`, using the existing black/red visual language.
- Added category filters, an eight-project responsive grid, project counts, image fallbacks, an empty state, project previews, and contact/back-to-portfolio actions.
- Moved existing project data into `src/data/projects.js` for sharing between the homepage and Works.
- Added `PageLink` for real links with normal modifier-click behavior.
- Added a small History API navigation hook, including Back/Forward, home section links, page titles, focus management, and scroll positioning.
- Added Works to the full navbar, collapsed menu, and homepage footer. Home logos also use the shared transition.
- Kept the preloader in the shared shell so it does not repeat during internal navigation. Home graphics unmount on Works.
- Preserved the red brick/check shutter and changed its sequencing to wait for actual Web Animations completion before changing content. Removed fixed navigation/contact transition timers.
- Made inactive navbar layers inert so invisible controls cannot receive keyboard focus.
- Improved the shared project dialog with a visible close button, accessible labels, initial focus, focus trapping, and focus restoration.
- Replaced dead project links with a “Full project coming soon.” message where the shared data contains `#`.
- Documented the production SPA fallback requirement for direct `/works` visits in `arnav-portfolio/README.md`.

## Navbar glass effect

- Added one shared `.nav-glass` surface for the full bar, collapsed bar, and open menu.
- Increased blur to 28 px with 160% saturation.
- Set the black background opacity to 44%, 50%, and 64% respectively, allowing the background to show through.
- Added a subtle reflective gradient, brighter upper edge, inset highlights, and a soft outer shadow.
- Brightened muted navbar text for readability.
- Added solid-background fallbacks for unsupported backdrop filtering and reduced-transparency preferences.

## Audio-wave cards: initial parallax and placement

- Confirmed the floating filename decorations are `AudioWaveCard`, not the hero's software icons.
- Added spring-smoothed, transform-only scroll parallax, measured against stationary anchors to avoid animation feedback.
- Memoized the component and respected reduced-motion preferences.
- Replaced five decorations positioned as percentages of the entire page with eight cards in `AudioWaveBand`.
- Placed the cards in four reserved gaps: before About, before Worked With, before Posts Showcase, and after My Toolkit/before the game.
- Reserved 288 px per gap on desktop/tablet to keep the complete animation travel clear of neighboring content. These gaps and cards are hidden below 768 px.
- Kept exactly three cards partly clipped at the viewport edges; the other five are fully visible.
- Positions are deliberately scattered but deterministic, so rerenders do not reshuffle them.

| Gap | Card | Placement |
| --- | --- | --- |
| Before About | `sfx_whoosh.wav` | Fully visible, left |
| Before About | `titles.png` | Partly clipped, right |
| Before Worked With | `background.jpeg` | Partly clipped, left |
| Before Worked With | `reel_final_v3.mp4` | Fully visible, right |
| Before Posts Showcase | `color_grade.cube` | Fully visible, left |
| Before Posts Showcase | `music_bed.wav` | Fully visible, right |
| After My Toolkit | `logo_reveal.mov` | Fully visible, left |
| After My Toolkit | `showreel_comp.aep` | Partly clipped, right |

## Stronger parallax refinement — September 9

- Concentrated the scroll animation between the 65% and 35% viewport lines instead of spreading it over a full viewport pass. At a 900 px viewport height, this makes relative movement about 2.9 times stronger while retaining the same bounded vertical travel.
- Added cursor-driven depth: cards move opposite the mouse by up to 24–28 px horizontally and 6–7 px vertically, depending on their depth.
- Combined scroll and pointer movement through Motion values and damped springs, without per-frame React renders.
- Added `useCardPointer`, with one pointer listener per visible card pair. It disables pointer tracking offscreen, in hidden tabs, on touch/mobile layouts, and for reduced motion; it resets on window blur or pointer exit.
- Preserved the eight-card count, three clipped edges, and reserved spacing.

## Scattered supporting cards and hover — September 9

This supersedes the eight-card placement described above.

- Increased the collection to 13 cards, distributed in uneven groups of 3, 4, 2, and 4.
- Added `film_grain.png`, `room_tone.wav`, `lower_third.mov`, `transition_07.wav`, and `light_leak.png`.
- Added seeded placement in `src/data/audioCardLayout.js`: positions remain stable on rerenders, while viewport resizing recomputes a safe arrangement.
- Mixed card widths, heights, slight rotations, and parallax depths. Rejected positions that overlap another card's full movement bounds or line up at nearly the same height.
- Four cards are approximately half-clipped at the sides; the others sit near edges or at irregular interior positions.
- Replaced equal-height paired gaps with responsive decorative regions that can grow when narrower layouts need more room. The cards remain clear of neighboring section content and stay hidden below 768 px.
- Added `src/AudioWaveCard.css`: cards are subdued at rest; hover straightens them, lifts them 6 px, scales them to 105%, and brightens their surface and border.
- Enabled pointer events on the decorative surfaces for hover without making them fake buttons or adding tab stops. Reduced motion disables hover movement.
- Validation: production build and targeted lint passed. Geometry checks passed across 73 widths from 768 to 1920 px for deterministic placement, movement bounds, staggered heights, and non-overlap. Browser checks passed at 768, 1024, 1366, and 1920 px with 13 cards and four clipped edges; hover, reduced-motion hover, and mobile hiding also passed with no page errors.

## Individual placement, no groups or tilt — September 9

This supersedes both earlier band/group layouts after the user pointed out that they still read as rows.

- Removed `AudioWaveBand` and all four spacer regions from the page. Decorations no longer add page height.
- Added `AudioWaveScatter`, a single overlay over the existing scroll content. It measures actual text, panels, images, and controls and places individual cards only in clear margins or existing empty spaces.
- Kept seeded variation and enforced at least 320 px between card anchor heights across the entire page, preventing horizontal rows.
- Removed all rotation from resting and hover styles. Retained horizontal cards, hover lift/scale/brightening, and scroll/cursor parallax.
- Recheck placements when content sizes, images, fonts, or viewport dimensions change; keep previous positions when still safe.
- Preserve up to 13 cards on wide screens, including half-clipped edge cards. Omit individual decorations when a narrower viewport has no safe location rather than covering content or adding space. The browser check retained 13 at 1859 px, 8 at 1366 px, and 6 at 768 px after scrolling through the content. Mobile decorations remain hidden.
- Browser checks passed for removal of groups, horizontal surfaces, separated heights, hover, and mobile hiding; no page errors were recorded.

## Larger footer text and stable card positions — September 9

- Increased both the red and spotlight layers of `#stAycReative` from `26vw` to `30vw` (about 15% larger).
- Fixed the reported card teleporting: lazy section rendering and image loads were triggering obstacle remeasurement, which could reject an existing position and randomly relocate it.
- Removed section/root ResizeObservers and image-load listeners from scatter placement. Card anchors are now fixed through scrolling and loading; only a genuine viewport-size change triggers a new placement pass, debounced by 150 ms.
- Wait for fonts, then temporarily lay out skipped sections and neutralize transforms synchronously while collecting obstacle bounds. Restore normal rendering before yielding.
- Store measured section content heights as their intrinsic block-size fallback, preventing the old generic 900 px estimate from shifting the page as sections enter view. Restore original values on mobile/unmount.
- Exclude the entire moving Posts Showcase carousel from card placement so measuring its resting layout cannot put decorations in its animated path.
- Browser regression check: all 13 card anchors remained identical across 36 scroll samples down and back up, and after simulated image loading and an unchanged resize event. Mobile/desktop resizing passed. Both text layers use the larger size; the 1859 px check measured 557.7 px text and no horizontal page overflow. No page errors were recorded.

## Uniform scroll parallax — September 9

- Replaced every card's individual scroll mapping, spring, random depth, and cursor offset with one shared layer transform.
- All cards now move at 85% of page scroll speed: a 200 px page scroll moves the cards 170 px. Motion follows scrolling directly, with no spring settling after scrolling stops.
- Removed the unused `useCardPointer` hook. Hover lift/scale/brightening remains independent of scroll movement.
- Remapped fixed card positions into the shared layer's coordinate system so cards still pass through their selected clear spaces; updated collision clearance for the full visible parallax travel.
- Reduced motion uses ordinary page scrolling. Stable placement, no tilt, and no groups remain intact.
- Validation: build and targeted lint passed. In the browser, all 13 cards moved exactly 170 px for a 200 px scroll, with no movement after scrolling stopped or on pointer movement. Anchors remained stable and reduced-motion scrolling passed; no page errors were recorded.

## Stronger uniform parallax — September 9

- Changed the shared card scroll speed from 85% to 65% of page speed. The counter-scroll multiplier rises from 0.15 to 0.35, giving about 2.3 times the relative depth effect.
- Collision clearance and the shared position mapping use the same constant and adjust automatically. Hover, reduced motion, and fixed anchors remain unchanged.
- Build and browser checks passed: a 200 px scroll moved every rendered card 130 px, with no idle settling or cursor drift. The larger travel bounds left room for 11 cards in the tested wide viewport; unsafe placements were omitted. Reduced motion passed with no page errors.

## Shared opposite mouse movement — September 9

- Added `useSharedCardPointer`: one mouse offset applied to the entire card layer. Every card moves together opposite the cursor, up to 24 px horizontally and 14 px vertically.
- Smooth only the shared mouse offset; scroll movement remains direct at 65% page speed. No individual card animation or tilt was added.
- Track the pointer only while the layer is visible on a fine-pointer desktop. Reset on pointer exit, window blur, hidden tabs, and disabled media preferences; respect reduced motion.
- Expanded placement clearance to cover the combined scroll, mouse, and hover travel.
- Build, targeted lint, and browser checks passed. Every rendered card moved equally opposite the pointer (about 42 px left and 22 px up in the tested sweep), reset together, and retained 130 px travel per 200 px scroll. Reduced motion passed. The combined clearance allowed eight cards in this test viewport; no page errors were recorded.

## Permanently blurred cards — September 9

- Added a constant 3 px blur to `logo_reveal.mov`, `background.jpeg`, and `music_bed.wav`, as selected by the user. The blur remains during hover and applies to the complete card surface, including its filename and waveform.

## Cards in the final sections — September 9

- Added `lets_talk.wav` beside Get in Touch and `outro_final.mov` at the right edge of `#stAycReative`. These individual accents use the existing shared scroll and mouse motion, hover behavior, and collision clearance.
- Measure the two section regions explicitly and prioritize their cards before scattering the remaining filenames. The creative card adjusts its edge clipping to fit narrower desktop margins.
- Exclude decorative timeline/light-ray backgrounds and layout-only wrappers from obstacle checks while preserving exclusions for actual text, controls, and panels. No spacer sections or tilt were added.
- Production build and targeted lint passed. Browser checks confirmed both cards are visible at 1859 px and 1366 px widths with no page errors; wide-layout screenshots were reviewed. The browser test stubbed the external hero tube renderer. Existing large-bundle warning remains.

## Dinosaur game fixes and optimization — September 9

- Fixed the partial ground: the original two 600 px tiles left uncovered space on the 1200 px canvas while scrolling. Draw enough tiles to cover the current canvas width at every offset, with fractional movement and rounded drawing coordinates.
- Pause the frame loop offscreen, in hidden tabs, and on window blur; resume with a fresh clock so the game does not jump ahead. Reuse one animation callback, cap updates near 60 fps, clamp long frame deltas, and make acceleration time-based.
- Use removable listener references, a single resize timeout, and complete cleanup for observers, animation frames, intro styles, touch controllers, and audio contexts. Decode sprites before initialization and handle StrictMode/unmount safely.
- Fixed click-to-jump and mouse release handling, removed automatic focus stealing on load, preserved play during resizing, and guarded collision checks when no obstacle exists.
- Browser regression checks passed: pixel coverage across 12 width/offset combinations (1200/900/375 px), click/Space input, advancing score, offscreen freeze/resume, blur/focus, collision/Enter restart, resizing, and StrictMode unmount/remount. No page errors. Checks used an isolated real-component Vite entry, removed afterward; no full-page performance score is claimed.

## Validation and known limits

- Production builds passed after the implemented feature changes; the existing large JavaScript chunk warning remains.
- Targeted lint passed for the new and edited standalone components/hooks. `App.jsx` retains preexisting whole-file lint violations.
- Earlier browser checks passed for preloader completion, hero lifecycle, Works filters/dialogs, actual shutter coverage, Back/Forward, contact popup transitions, mobile navigation, and navbar states.
- Initial audio-card checks confirmed scroll movement, reduced-motion behavior, and mobile hiding.
- The September 9 refinement passed its production build, targeted lint, and browser checks. A 200 px scroll produced approximately 82.8 px of relative card movement; moving the pointer across the desktop viewport produced approximately 47.8 px of horizontal travel. At widths 768, 1024, 1366, and 1920, all eight cards retained their safe movement bounds, exactly three remained edge-clipped, and no card pairs overlapped. Reduced motion kept both axes static; the browser reported no page errors.
- Placement checks passed at widths 768, 1024, 1366, and 1920: eight cards, exactly three clipped, no card-to-card overlap, and full vertical travel inside the reserved gaps. The cards added no horizontal overflow. An existing 8 px overflow was observed at 768 px independently of the cards.
- Lighthouse attempts did not produce a usable score: the development audit failed with NO_FCP and the production browser tab crashed. No Lighthouse score is claimed.
- The browser scripts and screenshots used for the earlier checks were temporary `/tmp` artifacts, not committed test coverage, and may not persist between environments.

## Deferred work and handoff

- Mentor is explicitly deferred by the user. When resumed, the requested location is after My Toolkit; the content and whether it profiles a mentor or offers mentorship still need deciding.
- Works currently reuses illustrative project data and images. Real project content and working destination links remain to be supplied; one existing image uses the unavailable-preview fallback.
- The contact form still has its preexisting frontend-only behavior and does not send inquiries.
- Production hosting must serve the SPA entry point for `/works`; no deployment was performed in this conversation.
- Application changes through the initial card placement were already present in commit `de58981` when this log was started. This log and the stronger parallax refinement are subsequent changes; no commit was created by this logging/refinement task.

All source paths above are relative to `arnav-portfolio/` unless otherwise stated.
