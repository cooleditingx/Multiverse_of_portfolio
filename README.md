# Multiverse of Portfolio

A scroll-based personal portfolio for **Dua Anas** — one dark, starlit hub and four themed "universes," because a person made of millions of atoms doesn't fit in a single-page template.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Map

| Route | Universe | Gate / signature moment |
|---|---|---|
| `/` | Hub (deep space) | boot loader → time-machine ignition → glitch title → particle-text "atoms" |
| `/tech` | Retro CRT terminal | power-button → tube power-on animation |
| `/video` | AV deck | spinning CD → insert-to-play; projects as cassette tapes with shared-element modals |
| `/hobbies` | Toy box | **playable 3×3 Rubik's Cube** — solve it (or skip it) to unlock; tabs, not routes, so reload always re-locks (that's the spec) |
| `/curiosity-planet` | Print magazine | orbiting covers → editorial reading view with drop caps |

A planet icon fixed to the left edge opens the slide-in navigation on every page (Esc / outside click closes it; includes the sound toggle).

## Architecture notes

- **Stack:** React 19 + Vite, react-router, framer-motion (shared-element modals, menu), @react-three/fiber + drei (coffee glass, Rubik's Cube), zustand, Tailwind v4 + hand-written CSS for the bespoke retro effects. GSAP and react-force-graph-2d from the original brief were dropped — IntersectionObserver + framer-motion `whileInView` covered the scroll reveals, and the star chart is a hand-rolled canvas orb (below).
- **Star chart orb** (`src/hub/NodeGraph.jsx`): a slowly rotating sphere of white nodes joined by thin lines — plain canvas 2D with a hand-rolled 3D projection (Fibonacci lattice + perspective), no box or border around it, centered. Four brighter ringed nodes carry labels and route to the universe pages (hover = glow + pointer + blip; labels flip to the node's inner side when the outer side would clip). **Drag to spin**: horizontal drag = yaw, vertical = tilt (clamped), with inertia on release; auto-rotation continues underneath; a <6px press still counts as a click. On touch, horizontal drags rotate while vertical drags keep scrolling the page (`touch-action: pan-y`). Reduced motion: no auto-spin, but drag-rotation and clicks still work. An sr-only link list mirrors it for keyboard/screen-reader users.
- **Background particles** (`src/hub/Starfield.jsx`): a single dedicated background layer — `position: fixed; inset: 0; z-index: 0; pointer-events: none` — so it stays put behind **every** hub section while the page scrolls. All particles are the same size (`PARTICLE_SIZE`), each drifting slowly in its own direction with edge wrap-around on an endless loop, plus twinkle. Rendered with pre-rendered gradient sprites on a 2D canvas. The hub's `<main>` is `relative z-10`, so all components stack above the background.
- **Particle text** (`src/hub/ParticleText.jsx`): raw WebGL (no deps), one-shot ~5s animation on a transparent canvas (the fixed background keeps drifting behind it). A dense cloud of up to ~20k additive-blended `gl.POINTS` slowly condenses into **solid white text** — the crossfade target is a textured quad of the same raster the particle targets were sampled from, so it's pixel-aligned by construction. When it finishes, the WebGL canvas is replaced by a static transparent PNG of the text: no text particles left, zero per-frame cost. Timeline constants (`T_TEXT_IN`, `T_PART_OUT`, `T_DONE`) sit at the top of the file. Used exactly three times (hero, about, contact). Real text is always in the DOM for screen readers; reduced-motion users and no-WebGL browsers get everything rendered statically.
- **Cube** (`src/hobbies/cubeLogic.js` + `RubiksCube.jsx`): pure logical model (27 cubies, quaternion turns, fully general solved-detection that survives middle-slice turns) separated from the r3f rendering/drag layer. `cubeLogic.js` is unit-testable with plain Node. The scramble is intentionally shallow (5 outer-layer moves) so visitors can actually solve it; a "skip the puzzle" link covers keyboard/motion-sensitive users.
- **Sound** (`src/lib/sfx.js`): **all cues are synthesized with the Web Audio API** — the brief's Sound Design Manifest calls for licensed audio files, which don't exist yet. Swap individual functions for Howler/file playback later without touching call sites. Nothing plays before a user gesture (EXPLORE is the unlock point); global mute lives in the side menu. Per-universe ambient loops are deliberately deferred until real audio exists.
- **Performance:** three.js, drei, and the force-graph are code-split and lazy-loaded; particle counts and parallax scale down on small screens; `prefers-reduced-motion` gets static fallbacks for the loader, glitch title, starfield, particle text, and warp.

## Placeholders still needing real content

Search the codebase for `PLACEHOLDER` — every spot is marked. Specifically:

- [ ] **Deployed domain** — replace `example.com` in `index.html` (canonical + og/twitter tags), `public/robots.txt`, and `public/sitemap.xml`
- [ ] **Buy Me a Coffee / Ko-fi link** — `BMC_URL` in `src/pages/Hub.jsx` (and decide: pull supporters from their API vs. curate the `SUPPORTERS` list manually)
- [ ] **Contact email / socials** — `CONTACT_EMAIL` + footer links in `src/pages/Hub.jsx`
- [ ] Tech experience, projects, skills — `src/pages/TechPage.jsx`
- [ ] Video experience + cassette projects (descriptions, tools, video embeds) — `src/pages/VideoPage.jsx`
- [ ] Books, card-making photos/process, fun facts — `src/pages/HobbiesPage.jsx`
- [ ] Article bodies — `src/pages/BlogPage.jsx`
- [ ] Licensed sound files to replace the synthesized cues — `src/lib/sfx.js`
