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

## Larger blurred cards and Stay Creative hover — September 11

- Enlarged `logo_reveal.mov`, `background.jpeg`, and `music_bed.wav` to 150% of their previous dimensions, with proportionate labels and waveforms. Retained the permanent 3 px blur and updated placement clearance for the larger cards. Narrow layouts still omit accents when no safe pocket exists.
- Replaced Stay Creative's TextRoll slide with stationary per-letter thickening. The hover center follows the mouse and tapers across three neighboring letters using the same smoothstep falloff as the ARNAV RAI BreathingText effect.
- Kept the Dragon font and white spotlight. Dragon is static (no variable weight axis), so this uses stroke width; the hero's Unbounded font uses true variable weight. Both text layers share the hover values and retain fixed glyph positions.
- Pointer updates are batched through one requestAnimationFrame, with cleanup/reset on exit, blur, resize, and visibility changes. Reduced motion removes the smoothing transition. The text has one accessible label.

## Hover repair and differential card depth — September 11

- Changed Stay Creative hover tracking to window pointer events with text-bound checks, removing the primary-device hover media gate. Overlay interception no longer prevents the circular white reveal or letter bulge. Increased peak stroke from 0.014em to 0.035em, retaining the hero-style neighbor falloff and stationary letter boxes.
- Enlarged the blurred cards from 1.5x to 1.9x their original size. They now occupy a separate motion layer at 85% page scroll speed, while regular cards retain 65%. Blurred cards use 1.6x the shared mouse offset; cards within each layer still move in unison.
- Placement clearance and anchor mapping now use each layer's actual speed and mouse range. Both layers retain reduced-motion handling and stable anchors.
- Build and targeted lint passed. Browser checks passed with a full-screen pointer-intercepting overlay: bulge and spotlight coordinates updated, glyph boxes remained stationary, and hover reset on exit. A 200px reverse scroll produced approximately -30px and -70px layer offsets respectively. Larger blurred cards retained their 3px blur. No page errors were recorded.

## Gravitica weights and smaller depth cards — September 11

- Preserved the supplied Gravitica family from generated `dist/assets/fonts/Gravitica` in `public/assets/fonts/Gravitica`, so builds retain it.
- Stay Creative now uses eight real Gravitica weights (200–900), with ExtraLight at rest and Black at the cursor, tapering through neighboring letters. Removed simulated stroke thickening. These are separate static fonts, so weight changes select actual faces rather than a variable-font axis.
- Invisible Black-weight glyphs reserve each letter's width so hover does not shift the line. Preserved the circular white spotlight, shared layer values, global pointer tracking, and reduced-motion behavior. Sized the wider font at 16vw to keep the line prominent and inside the viewport.
- Reduced blurred cards back to 1.5x (including labels/radii); retained their separate 85% scroll layer and 1.6x mouse depth.

## Stay Creative input-path regression — September 11

- Reproduced a mouse-only event failure: the custom cursor uses `mousemove`, while Stay Creative listened only to `pointermove`. The original browser check generated pointer events and missed this input path.
- Added capture-phase mouse and pointer tracking, sharing one scheduled animation frame. Scroll and resize recalculate the effect against the last mouse coordinates; leaving the document, window blur, and visibility changes clear it. Inactive resets avoid repeated style writes.
- The formerly failing mouse-only browser test now passes: real font weights rise from 200 to 900 with 700/400 neighbors, the circular reveal updates, and the fixed glyph slots do not move. Targeted lint and production build passed.

## Gravitica Compressed trial — September 11

- Switched Stay Creative from Gravitica to the supplied Gravitica Compressed family, including all eight active weight faces and font preloading. Preserved 16vw size, weight falloff, fixed letter slots, and the circular reveal.
- Copied the complete supplied family into `public/assets/fonts/Gravitica-compressed` before building so generated-output cleanup cannot delete the originals.

## Stay Creative weight cap — September 11

- Capped Gravitica Compressed hover at Bold (700), with ExtraLight (200) at rest. Neighbor weights taper within that range. Removed ExtraBold/Black face declarations and preloads; fixed letter slots now reserve Bold widths.

## Smooth static-weight blending — September 11

- Replaced discrete font-face switching with crossfades between adjacent Gravitica Compressed weights. Continuous pointer falloff controls each face's opacity; a 240ms eased transition smooths movement and return to rest.
- Retained actual 200–700 faces, fixed Bold-width slots, shared red/white layer values, and the circular reveal. Reduced motion disables the opacity transition.

## Direct weight updates restored — September 11

- Removed the crossfade and extra font-face layers at the user's request. Stay Creative now follows ARNAV RAI's direct per-letter updates: smoothstep neighbor falloff, 5-unit quantization, at most 30 updates per second, and skipped unchanged writes.
- Kept mouse-driven control, the 200–700 range, fixed slots, and circular reveal. Uses CSS font-weight to select Gravitica Compressed's static faces; unlike Unbounded, those files cannot interpolate a variable weight axis.

## Lighter Stay Creative hover

- Reduced the peak from Bold (700) to Medium (500), retaining ExtraLight (200) at rest and proportionately lighter neighbors. Measurement slots and preloaded faces now also stop at Medium.

## Editing-themed portfolio update — September 12

Implemented from smaller copy/HUD changes through backgrounds, decorations, the sine line, and services:

- Replaced the bottom playhead timecode with a clamped page-scroll percentage. The hero's top-right EN label is now a once-per-second India clock; the portfolio badge reads `PORTFOLIO # 2026`.
- Added an always-visible `Scroll down` cue to the pinned “MY TOOLS ARE DIGITAL…” section. Replaced `p / Statement 01` with `T / Title Sequence 01` and rewrote system/diagnostic/case/evidence/deployment copy into editing, production, project, and collaboration language. Category IDs remain unchanged; displayed category labels are readable editing terms.
- Extracted the contact background as `PremiereTimeline` and reused it in Career. Extracted `TimelineClip` so Career, Contact, floating clip decorations, and service previews share the same clip treatment. Playheads use transforms and pause outside view; reduced motion shows a static playhead.
- Widened deterministic decoration size variation. Replaced selected waveform decorations with timeline clips. The three blurred filenames now render overlapping, differently sized waveform pairs inside their existing clearance envelopes. Retained 3px blur, separate depth-layer motion, no tilt, stable anchors, and mobile hiding.
- Restored `CurvedThread`: a scroll-drawn red sine path ending above Channel Open, measured against its own scroll-content root. Geometry updates are resize-observed and frame-batched; removed the large SVG glow filter and provided a reduced-motion state.
- Added `What I can do for you` between About and Career: Video editing, Motion graphics, Color & sound, and Social content. Accessible accordion buttons reveal concrete deliverables and clip previews. The CTA opens the existing contact form through its existing transition. Reserved accordion space and a full section obstacle prevent decoration collisions as panels change.
- Excluded Stay Creative's layout-only heading box from decoration measurements while preserving its individual glyph obstacles, restoring room for the final-section clip.
- Browser checks passed at 1859px desktop and 390px mobile: HUD text/clock, 0% and 100% endpoints, visible clip types, size variation, blurred overlap, Career/Contact backgrounds, sine path, scroll cue, accordion state and stable section height, contact opening/closing, mobile width and card hiding. Desktop services, Career, and mobile services screenshots reviewed. No page errors were recorded; the external hero tube renderer was stubbed in this test. The final minor pair-size adjustment stays within the same tested overlap envelope.
- Production build and targeted lint passed; the preexisting large-chunk warning remains. No deployment or commit performed. The contact form retains its existing frontend-only behavior.

## Glass, layering, and interaction corrections — September 13

- Moved the hero clock below the navbar footprint on desktop and mobile.
- Shared the navbar's 28px frosted-glass treatment with About panels, Career cards, and the contact CTA, including reduced-transparency and unsupported-browser fallbacks.
- Moved the sine thread into background layers. Section-local SVG portals preserve its continuous geometry while allowing panels inside paint-contained sections to blur it; observer and animation-frame cleanup is retained.
- Removed paired waveform decorations. Individual blurred icons now prefer overlapping panel edges while avoiding text, controls, and other icons; pointer events pass through them. Preserved sizes, differential parallax, and stable placement anchors.
- Added 300ms height/opacity animation to service accordion opening and closing. Closed panels remain inaccessible to focus and assistive technology; reduced motion disables the transition.
- Stay Creative now uses 200ms endpoint weight keyframes, ExtraLight (200) to the previously requested lighter Medium cap (500). Removed intermediate face declarations; retained fixed glyph slots, mouse/pointer input, and the circular white reveal. Static font files still switch glyph shapes rather than continuously interpolating their outlines; no crossfade was added.
- Fixed an incomplete sine-component edit encountered when resuming the interrupted session. Targeted lint and production build passed. Desktop/mobile browser checks passed for clock clearance, glass styles, accordion intermediate/final heights, and text hover/reset; no page errors. Reviewed the About screenshot to confirm the sine is behind the panels and a single blurred icon crosses a panel edge. The external hero tube renderer was stubbed for this browser check. The existing large-bundle warning remains.

## Stay Creative animation diagnosis — September 13

- User reported the 200ms change was not visibly animated. A browser rendering check sampled the supplied ExtraLight/Medium files at 0, 25, 50, 75, 100, 150, and 200ms. Pixel hashes showed only two shapes: unchanged through 75ms, then a single switch by 100ms. Numeric CSS weight interpolates, but the static glyph outlines do not.
- The previous animation-duration check did not establish visual smoothing. No additional font substitution or stroke simulation applied yet; asked the user to choose a variable font for real interpolation or retain Gravitica with simulated stroke thickening. Circular reveal remains intact.

## Roboto Condensed variable-font trial — September 13

- Added Roboto Condensed's 100–900 variable range to the existing Google Fonts head stylesheet, preserving the existing families and preconnects. Stay Creative now uses Roboto Condensed.
- Replaced static-face keyframes with interruptible 200ms font-weight transitions on a single variable glyph. Resting weight remains 200, hover peaks at 500, and neighboring letters receive a smooth weight falloff. Fixed measurement slots, circular white reveal, and reduced-motion handling remain.
- Browser component checks confirmed the loaded face reports weight range 100–900, five sampled weights render five distinct pixel shapes, and a real hover passes through an intermediate weight (346.25). Hover reset and circular reveal passed; no text overflow at the checked 1306px viewport. Screenshot reviewed. Targeted lint and production build passed, with the existing bundle-size warning.

## Depth accent sizing — September 13

- Increased Stay Creative's circular reveal radius from 100px to 150px (1.5x).
- Increased blurred waveform decoration scale from 1.5x to 1.8x (20% larger) and permanent blur from 3px to 6px. Placement clearance uses the enlarged dimensions; regular icons and differential parallax remain unchanged.

## Toolkit glass correction — September 13

- Applied the shared navbar-like frosted glass to all eight Toolkit tiles. Added a section-local sine background and an opaque section base so the global path cannot draw sharply through the tiles. Preserved grid layout, icons, entrance animations, and video previews.

## Flat glass and Toolkit borders — September 13

- Removed shared glass gradients, shadows, saturation enhancement, and top-edge highlights, retaining flat tint and blur.
- Reduced content panel blur from 28px to 4px and tint opacity from 44% to 20% so the thin sine line remains visible as a softened line. Navbar retains its stronger blur.
- Restored Toolkit's subtle dashed neutral borders with a section-specific rule overriding the shared glass border.

## My Realm spiral gallery — September 13

- Added `/realm`, linked as My Realm in both the expanded navbar and the navigation menu, using the existing red checker transition and history router. Added route title and heading focus handling; existing routes retain their behavior.
- Added RealmPage with a bounded entrance loader that preloads project previews and continues when an image fails or after a 3.5-second deadline. After the entrance, the image tower rises into view.
- Built a leaning CSS 3D helix using the existing eight-project collection repeated across three turns of the gallery. Native scrolling moves frames vertically and around the axis together; Motion values and one spring drive transforms without per-frame React state or a continuous animation loop. Frames wrap outside the visible area. Rear-facing previews flip to remain readable.
- Selecting an image opens the existing project dialog. Added a keyboard-accessible Project index and Works return link; reduced-motion users see the index automatically. The existing project preview failure fallback is preserved; the current collection is still illustrative data, not newly supplied portfolio assets.
- Kept the existing black/red palette and type. Adjusted mobile navbar spacing to accommodate My Realm on one line; mobile gallery framing keeps images clear of the heading and controls.
- Targeted lint and production build passed (existing large-bundle warning remains). Browser checks passed for direct route/title, entrance completion, changing scroll transforms, pointer-selected frame/dialog, index/dialog, Works navigation and Back, mobile width/menu link, and reduced-motion loading. Desktop, scrolled, and mobile screenshots reviewed; no page errors recorded. No deployment performed; production hosting needs the same SPA fallback for `/realm` as `/works`.

## Realm edge motion blur — September 13

- Added smoothly graduated blur to frames toward the top and bottom of the spiral, leaving the central frames sharp. Edge blur rests at up to 3px and increases to at most 10px with scroll speed, easing back when movement stops.
- One shared velocity/spring drives the effect; filters stay on individual artwork surfaces to preserve the tower's 3D geometry. The reduced-motion project index remains unblurred.

## Main-page audio icon depth — September 13

- Added a third shared parallax plane to the main-page audio scatter. Distant icons (room_tone.wav, color_grade.cube, transition_07.wav) use 72% size, 42% opacity, 1.5px blur, 50%-page scroll speed, and 0.4x mouse response.
- Regular icons retain 65%-page scroll speed and standard mouse response. The existing large blurred foreground icons retain 1.8x scale and 6px blur, now moving at 94%-page speed with 2.2x mouse response and 70% opacity. Foreground draws last.
- Browser check at 1600px confirmed all three planes are populated (1 distant, 4 regular, 3 foreground), distinct scroll/mouse movement, and unchanged placement anchors. Distant placement permits at most one additional edge-clipped accent when inner margins are too tight. Targeted lint and build passed.
- Layout clearance uses each plane's actual size and movement bounds. Stable anchors, unified per-plane movement, reduced-motion handling, and mobile hiding remain. My Realm was not changed by this request.

## Mentor collage gallery — September 13

- Added MY MENTORS immediately after My Toolkit, using the existing section heading type and size. The section is protected from decorative audio-card overlap.
- Implemented the approved three-state collage in a fixed square outer frame: A tall at left by default; B spans the top on selection with A bottom-left and C unchanged; C becomes tall at right with B top-left and A bottom-left. Smaller frames remain square and tall frames are 1:2 portraits.
- Frames stay mounted and animate their bounds over 650ms with gentle easing. Hover, tap, focus, and arrow-key selection update the active caption. Reduced motion switches layouts immediately. Gallery dimensions remain fixed during interaction.
- Added three example photographs as requested, clearly marked in captions/alt text. No mentor identities or personal endorsements invented. Real photo paths, names, disciplines, reflections, and crop focal points belong in src/data/mentors.js. Image failure fallbacks are included.
- Targeted lint and production build passed, with the existing bundle-size warning. Browser checks passed for all three loaded images, three arrangements, intermediate animated bounds, fixed outer geometry, keyboard selection, and mobile selection/width. Desktop and mobile screenshots reviewed; no page errors.

## Mentor transition collision fix — September 13

- Reviewed recording.mp4. Simultaneous position/size interpolation let mentor frames cross during rearrangement.
- Replaced concurrent animation with a sequence: shrink the dominant photo into a square, slide B through the vacant top row if needed, then expand the selected photo. Each stage takes 280ms; complete transitions take 560–840ms.
- Validation: browser sampled 533 animation frames across all six transition directions and rapid repeated inputs; zero photo overlaps and the final requested layout was reached. No page errors. Targeted lint and production build passed.
- Rapid inputs queue the latest selection instead of interrupting a frame halfway through its path. Ignore hover-entry events caused by moving frame boundaries; actual mouse movement, clicks/taps, focus, and arrow keys still select photos. Reduced motion retains immediate stages. Unmount cleanup is handled by the scoped animation hook and a disposal guard.

## Subtle preloader atmosphere — September 17

- Added a restrained dark-red gradient with a faint warm highlight behind the preloader content. Positioned above the opaque curtain SVG so it is visible.
- A 12-second CSS transform drift animates the gradient without additional JavaScript loops or animated blur filters. The atmosphere fades during the existing curtain exit; reduced-motion users get a static gradient. Loading timing and progress logic remain unchanged.

## Hornet logo proportions — September 17

- Fixed all three hornet.png instances (navbar, open menu, footer). The 4096×2304 image was forced into square boxes. Each now uses its existing display height with automatic width, object-contain, and shrink protection, preserving the original 16:9 proportions. Added intrinsic width/height attributes.

## Digital tools audio accents — September 17

- Added three audio-wave cards inside the pinned “My Tools Are Digital” section, with distinct sizes, blur depths, scroll travel, and shared mouse parallax. The enlarged foreground card clips at the right edge while the central text stays clear.
- Reused the existing wave cards and pointer hook. Motion stops for reduced-motion preferences; accents hide on small or short screens.
- Targeted lint and production build passed. Desktop browser checks confirmed scroll and mouse movement; screenshot reviewed at 1600×900.

## Contact fluid background — September 17

- Replaced the initial thin-line canvas approximation with an original local WebGL shader: continuously drifting soft red bands and a glossy, deformable liquid wake with warm/magenta highlights around mouse movement, based on the recording.
- User explicitly declined a direct Unicorn Studio embed because of its watermark. The final implementation uses no embed, SDK, hosted scene, or scene assets.
- Removed the contact timeline/rays; suppressed the contact sine overlay and excluded the section from audio-card placement for a clean black background. Career keeps its timeline.
- Rendering capped at 750,000 pixels and 45 fps; pauses offscreen/in hidden tabs, stays static for reduced motion, and releases GPU resources on unmount. Contact controls remain interactive.
- Production build and targeted component lint passed. September 18 desktop browser review confirmed visibly changing idle frames and a glossy hover wake, with no page errors. This is an original visual recreation, not the source scene; no pixel-identical claim or hardware FPS benchmark is made.

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

- Mentor gallery is now implemented after My Toolkit with example photos. Arnav’s real shared photographs, mentor names, disciplines, and personal reflections remain to be supplied.
- Works currently reuses illustrative project data and images. Real project content and working destination links remain to be supplied; one existing image uses the unavailable-preview fallback.
- The contact form still has its preexisting frontend-only behavior and does not send inquiries.
- Production hosting must serve the SPA entry point for `/works`; no deployment was performed in this conversation.
- Application changes through the initial card placement were already present in commit `de58981` when this log was started. This log and the stronger parallax refinement are subsequent changes; no commit was created by this logging/refinement task.

All source paths above are relative to `arnav-portfolio/` unless otherwise stated.

## Timeline decorations across sections — September 18

- Replaced every floating audio-wave visual with the shared timeline-clip component, including Digital Tools. Removed waveform geometry.
- Allocated three deterministic decorations to each of 14 homepage sections (including hero, showreel, services, mentors, game, contact, and Stay Creative), with varied dimensions and distant/regular/blurred depth layers.
- Enlarged foreground clips overlap panel/photo edges, remain blurred, and cannot intercept input. Shared scroll/mouse motion, no tilt, hover lift on sharper clips, reduced-motion behavior, and existing small-screen hiding remain.
- Dense sections use clipped edge placements rather than dropping clips; foreground corner selection penalizes collisions with text and other decorations.
- Desktop browser inspection confirmed 42 floating clips, three per section, and no remaining wave kind. Layout quota/size checks passed at 768, 1024, 1440, and 1920px. Targeted lint and production build passed.

## Hero and Digital Tools refinement — September 18

- Excluded Hero from clip allocation and clipped the showreel decoration layer below the hero boundary so its parallax cannot intrude.
- Added Digital Tools to the local sine-line portals so its opaque section background no longer hides the line.
- Added a subtle, static red radial glow behind the pinned text, preserving clip depth and text contrast. Removed the Title Sequence 01 badge.
- Production build and targeted lint passed.

## Foreground clips over sine line — September 18

- Added a softly blurred, opaque dark backing behind enlarged foreground clips so the sine line is occluded instead of showing through their translucent fill. Explicitly ordered blurred clip planes above the other clip depths.

## Continuous sine line — September 18

- Extended local line rendering to Services, Worked With, Selected Edits, Posts, Mentors, the dinosaur section and its lazily mounted game surface. Preserved foreground clips above the line.
- Restored the contact line above its opaque fluid canvas and connected the endpoint to the actual Channel Open dot, removing the old 64px gap and centered-x assumption.
- Track section resizes, lazy game insertion, and the contact entrance transform; compensate for inset game-container coordinates to keep the path continuous.
- Targeted lint/build passed; browser review confirmed the missing section layers and visible Services path.

## Dinosaur line correction — September 18

- Removed the extra sine-line portal inside the game renderer and its lazy-mount observer. Only the outer page section renders the shared path; the opaque game card naturally hides it. Removed the game-specific stacking override.
- Targeted lint and production build passed.

## Stay Creative font — September 19

- Switched Stay Creative and its font preloading to Unbounded. Adjusted font size for its wider letterforms; retained the 200–500 variable-weight hover transition and 150px circular reveal. Targeted lint and build passed.
