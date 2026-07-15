# Customization Guide — Multiverse of Portfolio

This is your map of the whole site: **every component, effect, and style — where it lives, what each property does, and how to remove it.**

> **Golden rules**
> 1. Line numbers drift as you edit, so this guide gives you **search strings** instead. Press `Cmd+Shift+F` in VS Code (search across all files) and paste the search string.
> 2. Almost every value is safe to experiment with. Change one number, save, look at the browser (the dev server auto-reloads), and undo with `Cmd+Z` if you hate it.
> 3. Anything written like `--violet` is a **design token** — change it once in `src/index.css` and it changes everywhere.
> 4. "To remove" instructions never break the site unless marked ⚠️.

---

## Table of contents

1. [Project map — which file does what](#1-project-map)
2. [Global colors & fonts (design tokens)](#2-global-colors--fonts)
3. [Shared CRT effects + per-universe cursors](#3-shared-crt-effects--per-universe-cursors)
4. [Hub intro sequence: boot screen → title card → warp](#4-hub-intro-sequence)
5. [The CRT monitor shell (the "monitor box")](#5-the-crt-monitor-shell)
6. [Hub page sections](#6-hub-page-sections)
7. [Footer galaxy](#7-footer-galaxy)
8. [Starfield background](#8-starfield-background)
9. [Particle text ("atoms condense into words")](#9-particle-text)
10. [SlideUpText & RollLink (small text animations)](#10-slideuptext--rolllink)
11. [Side menu (TARS button + giant links)](#11-side-menu)
12. [Warp page transitions (hyperspace jump)](#12-warp-page-transitions)
13. [Tech page (green terminal)](#13-tech-page)
14. [Video page (parked — currently disabled)](#14-video-page)
15. [Hobbies page (craft desk / scrapbook)](#15-hobbies-page)
16. [Blog page (Curiosity Planet bookshelf)](#16-blog-page)
17. [Sound effects](#17-sound-effects)
18. [Quick removal cheat-sheet](#18-quick-removal-cheat-sheet)

---

## 1. Project map

| File | What it controls |
|---|---|
| `index.html` | Page title, meta description, **which Google Fonts load** |
| `src/index.css` | **All colors, fonts, and CSS effects** for the entire site (~1,760 lines, organized in labeled sections) |
| `src/App.jsx` | The routes (which URL shows which page), the "opening portal" loader, and the `WarpProvider` wrapper |
| `src/store.js` | Tiny global state: `explored` (has the intro been passed), `menuOpen`, `muted` |
| `src/pages/Hub.jsx` | The home page: intro phases + all hub sections (hero, about + café, universe picker, contact + curtain footer) |
| `src/pages/TechPage.jsx` | Tech universe (terminal). All project/skill text lives at the top of the file |
| `src/pages/VideoPage.jsx` | Video universe (cassette deck). **Currently parked** — the file is kept but not routed (see §14) |
| `src/pages/HobbiesPage.jsx` | Hobbies universe: cutting-mat gate (cube) + the scrapbook chapters. All content arrays at the top |
| `src/pages/BlogPage.jsx` | Curiosity Planet (infinite bookshelf + articles). `ISSUES` array at the top |
| `src/hub/CrtShell.jsx` | The full-screen CRT monitor (case, screen, fisheye warp) |
| `src/hub/LoadingScreen.jsx` | Boot text + loading bar shown on the monitor |
| `src/hub/TitleCard.jsx` | The morphing "PORTFOLIO" title + EXPLORE button |
| `src/hub/Starfield.jsx` | Drifting white dots behind the hub |
| `src/hub/ParticleText.jsx` | The particles-become-text effect (all big hub headers) |
| `src/hub/SlideUpText.jsx` | Word-by-word slide-up paragraph reveal (about + contact paragraphs) |
| `src/hub/GalaxyCanvas.jsx` | The spinning spiral galaxy in the footer (tilts toward the cursor) |
| `src/hub/CoffeeScene.jsx` | The 3D floating iced coffee + orbiting ice cubes |
| `src/hub/NodeGraph.jsx` | The "star chart" universe picker |
| `src/nav/SideMenu.jsx` | TARS robot button + the full-height giant-link menu panel |
| `src/nav/WarpDrive.jsx` | Hyperspace star-streak transition between pages (`useWarp`) |
| `src/lib/RollLink.jsx` | Rolling-letter hover links (footer socials + menu) |
| `src/hobbies/RubiksCube.jsx` | The playable 3D cube (rendering + drag) |
| `src/hobbies/cubeLogic.js` | Cube rules: sticker colors, scramble difficulty |
| `src/lib/sfx.js` | Every sound effect (all synthesized in code) |
| `src/lib/hooks.js` | Small helpers (reduced-motion, in-view-once, element size) — you'll rarely touch this |
| `public/` | `coffee.glb` (the 3D cup), `cursors/` (custom cursor PNGs), `ransom/` (ransom-note letter PNGs), `stickers/` (hobbies gate stickers) |
| `assets/` | Local font files + paper/wood/fabric textures |

Anything marked `[PLACEHOLDER: …]` in the page files is **content you still owe the site** — just replace the text between the quotes. Currently: the contact-form backend (it composes a `mailto:` draft for now), blog article bodies, most hobbies content, and the tech skills list.

---

## 2. Global colors & fonts

**Where:** top of `src/index.css` — search for `:root {`

| Token | Currently | Used for |
|---|---|---|
| `--space-bg` / `--space-bg-2` | `#08070f` / `#0d0b1a` | Base page background / slightly lighter panels |
| `--violet` | `#8b5cf6` | Accent: menu hover bar, links hover, `::selection`, warp/galaxy star tint |
| `--cyan` | `#4ce0d2` | Accent: boot text, focus outlines, TARS status light, contact TRANSMIT button |
| `--gold` | `#f4c86b` | The "Me" squiggle, the gold "." in the footer name |
| `--ink` / `--ink-dim` | `#e8e6f0` / `#9d99b3` | Main / secondary text |
| `--paper` / `--ink-dark` | `#eceaf2` / `#16131f` | Inverted "paper" panel styles |
| `--crt-green` / `--crt-green-dim` / `--crt-bg` | `#39ff88` … | Tech page terminal + the hero's role line |
| `--tape-*`, `--vu-red` | browns/orange/cream | Video page (parked) — `--tape-bg` also colors blog body text |
| `--mag-gold` / `--mag-paper` / `--tilt` | `#d9a441` / `#f5efe2` / `-2.2deg` | Blog accents |

The hobbies page has its **own token block** — search `.u-hobbies {` — with `--mat-1`/`--mat-2` (cutting-mat greens) and `--craft-ink/-paper/-cream/-yellow/-red/-blue` (paper-craft palette).

### Fonts

**Google fonts** load in `index.html` (the single `fonts.googleapis.com` link): Space Grotesk, Space Mono, Inter, Playfair Display, Caveat, Unbounded. **Local fonts** live in `assets/` and are registered with the `@font-face` blocks at the very top of `src/index.css`. Classes are assigned right below — search `.font-display`.

| CSS class | Font | Where it shows |
|---|---|---|
| `.font-display` / `.font-aroma` | **Aroma Vintage** (local: `assets/aroma_vintage/`), falls back to Space Grotesk | Headers, hero "Hi I Am", the gold "Me" |
| `.font-biolinum` | **Linux Biolinum** (local, 400 + 700) | Hero name, all big section headers (via ParticleText), footer "Anas." |
| *(page-wide)* | **Linux Biolinum Hobby** (`LinBiolinum_aWB.ttf`) | The whole blog page — set on `.u-blog`, not a utility class |
| `.font-mono` | Space Mono | Terminal/boot text, form labels, buttons, tags |
| `.font-serif` | Playfair Display | Blog drop caps |
| `.font-hand` | **Caveat** (Google) | All handwritten notes on the hobbies page |
| `.font-bebas` | **Bebas Neue** (local: `assets/bebas_neue/`) | Hobbies display type |
| `.font-morse` | **Bootcamp Morsecode** (local) | Hobbies decorative type |
| (default body) | Inter | Paragraphs |

- **To add another local font:** drop the file in `assets/`, copy one of the `@font-face` blocks and point its `url(/assets/…)` at the file, then reference the family name in a class.
- Unbounded is still in the `index.html` Google-Fonts link but unused — safe to delete from the URL for a lighter page.
- Quirk: the blog's `<h1>` has the class `font-LinBiolinum_aUB.ttf`, which isn't a real class — the page's font actually comes from `.u-blog`. Harmless; delete the class if it bothers you.
- The morphing PORTFOLIO title has its own font list (see §4). The hub's particle headers name their fonts explicitly in `Hub.jsx` (see §9).

---

## 3. Shared CRT effects + per-universe cursors

**Where:** `src/index.css`, section `/* ---------- scanline / CRT overlays`

Reusable classes. Deleting a class from a JSX file removes the effect from that one place; deleting the CSS block removes it everywhere.

| Class | What it looks like | Knobs |
|---|---|---|
| `.scanlines` | Thin dark horizontal lines | `rgba(0,0,0,0.22)` = line darkness; `2px / 3px / 4px` = line spacing |
| `.vignette` | Darkened corners | `0.55` = corner darkness, `55%` = where darkening starts |
| `.crt-flicker` | Screen brightness stutters every few seconds | `4s` = how often; the `0.82` / `0.93` opacities = dip strength |
| `.block-cursor` | Blinking ▉ terminal cursor | `1s` = blink speed |
| `.crt-phosphor` | Soft teal glow + tiny red/cyan fringe on text | `text-shadow` blur radii = glow size; `1.5px` offsets = fringe amount |
| `.glitch-red` / `.glitch-cyan` / `.glitch-slice` | RGB-split jitter on titles | `3.1s` / `4.7s` = how often; `translate(±3px)` = jump distance |
| `.term-jitter` | Text vibrates slightly | `0.18s` = speed, `0.4px` = amplitude |

Every one of these has a `prefers-reduced-motion` block just below it — if you delete an effect, delete its reduced-motion line too.

### Per-universe cursors

Search `per-universe cursors` in `index.css`. Each world hands you its own tool (baked PNGs in `public/cursors/`, with `@2x` versions for retina):

| Page class | Cursor |
|---|---|
| `.u-hub` | black hole |
| `.u-tech` | sci-fi pointer |
| `.u-hobbies` | crayon |
| `.u-blog` | ink pen |

The two numbers after the `url(…)` (e.g. `16 16`) are the **hotspot** — where the click lands inside the image. To swap a cursor, replace the PNG (keep it ≤32×32 for Windows). **To remove all custom cursors:** delete the whole block.

---

## 4. Hub intro sequence

**Flow controller:** `src/pages/Hub.jsx` — the phases run `loading → ignite → title → explored`.

| Thing | Where | What to change |
|---|---|---|
| Boot messages | `src/hub/LoadingScreen.jsx` → `BOOT_LINES` array | Edit/add/remove lines of the fake boot log |
| Typing speed | same file, search `4 + Math.random() * 14` | Bigger numbers = slower typing. The `150` is the pause at each line break |
| Loading bar length | `BAR_CELLS = 14` | Number of ■ cells |
| Hold-at-92% | The bar deliberately waits for fonts to finish loading — the `0.92` in the progress effect |
| Chroma pulse on title reveal | `src/index.css` → `@keyframes chroma-pulse` | `1.2s` = duration. The matching wait is in `Hub.jsx`, search `setPhase('title'), 1200` — **keep these two numbers equal** |
| Morphing PORTFOLIO letters | `src/hub/TitleCard.jsx` → `FACES` array = the fonts it cycles through; `300 + Math.random() * 1300` = how often each letter swaps (bigger = calmer) | To make the title static, delete the whole `useEffect` with `swap` in it |
| EXPLORE button style | `src/index.css` → `/* ---------- explore button` | `--terminal-cyan: #a8dbe4` = its color; `::before`/`::after` = the `[ ]` brackets; `phosphor-breathe 2.4s` = glow pulse; `:hover` = the inverted highlight bar. (The same `btn-explore` class styles the hub's BUY ME COFFEE button) |
| Warp-out (screen zooms/blurs away after EXPLORE) | `src/index.css` → `.warp-out` + `@keyframes warp` | `0.85s` = duration, `scale(3.2)` + `blur(30px)` = how violent. Matching wait: `Hub.jsx`, search `850` |
| Skip the intro entirely | `src/pages/Hub.jsx`, search `useState(explored ? 'explored' : 'loading')` → change `'loading'` to `'explored'` ⚠️ (also silences the intro sounds since nothing triggers them) |

---

## 5. The CRT monitor shell

The full-screen monitor that frames the boot screen and title card.
**Structure:** `src/hub/CrtShell.jsx` · **Looks:** `src/index.css`, section `/* ---------- CRT monitor shell`

### The case (dark gunmetal body)
Search `src/index.css` for `.crt-case`.

| Property | What it changes |
|---|---|
| Final `linear-gradient(160deg, #2c2c32 … #09090b)` | The metal's base shades, top-left → bottom-right |
| The two `radial-gradient(34% 54% at 0%/100% …)` lines | Blue phosphor light "leaking" onto the case. `0.16` = leak strength |
| `.crt-case::before` box-shadows | Inner shading that makes the case look 3D |
| `.crt-case::after` | **The metal texture**: first `url(…)` = brushed streaks, second = fine grain. `opacity: 0.16` = strength. Delete this whole block for smooth plastic |

### The screen opening
Search for `.crt-recess`.

| Property | What it changes |
|---|---|
| `inset: 4.5vmin 4.5vmin 9vmin 4.5vmin` | Bezel thickness: top, right, bottom, left |
| `border-radius: 7.8vmin` | Outer corner roundness. **Formula:** the screen layers inside must be `outer − padding` — the tube wrapper in `CrtShell.jsx` is inset `1.1vmin` so its radius is `6.7vmin`, and the warped content inside uses `rounded-[8vmin]`. Shift them together |
| The `rgba(84,150,255…)` shadows | The blue glow around the screen |

### Screen-surface effects

| Effect | Where | To remove |
|---|---|---|
| **Fisheye curve** | `CrtShell.jsx` — `buildBarrelMap` + the SVG `<filter>`. Strength: search `* 0.11` (smaller = flatter) | Delete the `style={{ filter: … }}` on the `crt-tube` div |
| RGB stripe grille | `.crt-grille` in CSS | Remove `<div className="crt-grille …">` from `CrtShell.jsx` |
| Rolling retrace band | `.crt-rollbar`, speed = `crt-roll 5.5s` | Delete the `crt-rollbar-track` div |
| Glass glare + corner falloff | `.crt-glass` | Delete the `crt-glass` div |
| Power-on flash | `.crt-turning-on` / `@keyframes crt-on` | Remove the `powerOn` prop where `<CrtShell powerOn …>` is used |
| Case label "MULTIVERSE · MV-2200" | Bottom of `CrtShell.jsx` | Edit the text, or delete the `crt-case-label` div |
| Knobs + green LED | `crt-case-controls` div; colors in `.crt-knob` / `.crt-led` | Delete the div |

---

## 6. Hub page sections

All in `src/pages/Hub.jsx`, in page order. Each `<section>` is independent — **delete a whole `<section>…</section>` block to remove it.** Once explored, the hub turns on **section snap-scrolling** (`html.snap-sections` in `index.css`; the `snap-start` classes on each section are the snap points — remove them to scroll freely).

### Hero (full viewport)
- The green role line pinned top-left — search `Front End Developer` (color = `--crt-green`).
- The giant type condenses from particles: a `<ParticleText lines={…}>` with two lines — `'Hi I Am'` (Aroma Vintage, `fit: 0.5` = fills half the width) over `'Dua Anas'` (Linux Biolinum bold, `fit: true` = fills the full width). The `staticRender` right below it is the motion-free version — **keep it in sync** if you change text/fonts.

### About + Zero-G Café (merged section)
- `ABOUT` header is a ParticleText with `onDone={() => setAboutHeaderDone(true)}` — the paragraphs and button **wait for the header to condense** before animating in. The little gold handwritten "Me" is the `motion.span` right below it (`-rotate-6` = its tilt).
- Bio paragraphs are `<SlideUpText>` blocks (see §10) — plain text, edit freely.
- `BUY ME COFFEE;)` button: `BMC_URL` constant at the top of the file, styled by `btn-explore`.
- The floating iced coffee is `src/hub/CoffeeScene.jsx`: loads **`public/coffee.glb`** (swap the file to change the model; 14.5 MB — worth compressing someday). Knobs: `MODEL_SIZE = 1.45` = cup size; `t * 0.45` = turntable spin speed; the `Math.sin(t * 0.18) * 0.22` / `t * 0.15` pair = its lazy tilt wobble; the `t * 0.12` / `t * 0.09` pair = the zero-g drift around the column; `ICE_CUBES` = the six clear glass cubes (per-cube orbit radius `rx/rz`, height `y`, `speed`, size `s`).
- *The Dream Ladder was removed from this section — its `.ladder-rail`/`.ladder-rung` CSS still sits in `index.css` (search `dream ladder`) and is safe to delete.*

### Pick a Universe
- `PICK A UNIVERSE` ParticleText header + `src/hub/NodeGraph.jsx` (the constellation orb). The clickable destinations are its `PAGES` array — the video entry is commented out there, matching the parked page. Clicking a node navigates via the warp transition (§12).

### Get in Touch + curtain footer (`ContactFooter`)
This is a **two-screen reveal**: the contact panel is opaque (`bg-[var(--space-bg)]`, rounded bottom corners `rounded-b-[3rem]`) and acts as a **curtain** — scrolling on lifts it off the pinned full-screen footer underneath (`sticky bottom-0 h-screen`).

| Thing | Where |
|---|---|
| `GET IN TOUCH` header | ParticleText at the top of `ContactFooter`; gates the form + pitch via `headerDone` |
| The form | Currently composes a **mailto draft** in the visitor's mail client — `[PLACEHOLDER: wire to a real form backend]`. Recipient = `CONTACT_EMAIL` at the top of the file |
| Field / button styles | Inline Tailwind on the inputs (violet borders, cyan focus) and the TRANSMIT button |
| Pitch paragraphs | Three `<SlideUpText>` blocks — plain text |
| Footer socials | The `<RollLink>` list (GitHub / LinkedIn / Youtube / Email) — rolling-letter hover (§10) |
| Credit line | Search `Designed & built by` — year updates itself |
| The giant rising name | The two `<RiseWord>` at the bottom: `"Dua"` (Space Grotesk bold) + `"Anas."` (Biolinum italic). Letters rise with the scroll — `from` = when in the reveal each word starts (0–1), `step` = per-letter stagger. The `.` is gold via `accent={ch === '.'}`. Size: the `text-[clamp(4rem,16vw,15rem)]` |
| Reveal timing | The `useScroll` at the top of `ContactFooter` maps scroll → `reveal` progress (0 = curtain down, 1 = footer fully shown) |

---

## 7. Footer galaxy

**Where:** `src/hub/GalaxyCanvas.jsx` — the near-edge-on spiral galaxy behind the footer; it slowly spins and **tilts toward the cursor**. Canvas 2D, no dependencies.

| Knob | Search for | Effect |
|---|---|---|
| Star count | `N_STARS = 1600` | Fewer = faster on weak devices |
| Disc flatness | `TILT = 0.34` | 0 = pure edge-on line, `Math.PI/2` = face-on circle |
| Star colors | `COLORS = [` | Mostly ice-blue + violet/cyan flecks |
| Spin speed | `time * 0.05` (in the `useFrame`-style draw loop) | Inner stars rotate faster (`1.7 - s.r` = differential rotation) |
| Bright flare stars | `Math.random() < 0.05` | Fraction that get the 4-point cross flare |
| Core glow | the `createRadialGradient` stops | Colors + strength of the galactic core |
| Mouse-tilt strength | `-my * 7` / `mx * 7` | Max tilt in degrees; the `0.06` = how quickly it eases after the cursor |
| Vertical position | `cy = H * 0.44` | Where the disc sits in the footer |

Reduced motion renders one static galaxy (no spin, no tilt). **To remove:** delete `<GalaxyCanvas className="absolute inset-0" />` in `Hub.jsx`.

---

## 8. Starfield background

**Where:** `src/hub/Starfield.jsx` (used only on the hub, behind everything)

| Knob | Search for | Effect |
|---|---|---|
| Star size | `SIZE_MIN` / `SIZE_MAX` (top of file) | In pixels |
| How many stars | `density = isSmall ? 12 : 18` | Stars per 10,000 px² (phone / desktop) |
| Drift speed | `3 + Math.random() * 5` | px per second |
| Twinkle | `0.55 + 0.45 * Math.sin` | The `0.45` = twinkle depth (0 = steady) |
| Overall brightness | `ctx.globalAlpha = 0.55` | 0–1 |
| Star color | `WHITE = '255,255,255'` | Any `r,g,b` |

**To remove:** delete `<Starfield />` from `src/pages/Hub.jsx`.

---

## 9. Particle text

**Where:** `src/hub/ParticleText.jsx` — used for every big hub header (hero, ABOUT, PICK A UNIVERSE, GET IN TOUCH).

It has **two modes**:
- **Single-text mode** (`text` + `size` props) — rasterizes one paragraph in Space Grotesk.
- **Multi-line mode** (`lines` + `staticRender` props) — what the hub uses. `lines` is a function returning per-line specs (`text`, `fontFamily`, `weight`, `sizePx`, `indentPx`, `lineHeight`, `fit`). Fonts are explicitly loaded (`document.fonts.load`) before sampling so particles never form fallback glyph shapes. `staticRender` is the exact JSX shown to reduced-motion / no-WebGL visitors.

| Knob | Search for | Effect |
|---|---|---|
| **`fit`** | in the line spec | `true` rescales `sizePx` so the line spans the full wrapper width; a number (e.g. `0.5`) fits that fraction of the width. This is how every header hugs its container edge-to-edge |
| **`onDone` / `doneAt`** | component props | `onDone` fires when the timeline hits the `doneAt` fraction (e.g. `0.5` = half-condensed) — the hub uses it to hold back paragraphs/buttons until a header lands |
| Timeline | `T_TEXT_IN` / `T_PART_OUT` / `T_DONE` (top of file) | When the solid text fades in, particles fade out, and the GL context is freed (seconds). Lower everything for a snappier effect |
| Particle colors | props: `color`, `accent`, `accent2` | Base white-ish + violet + cyan flecks |
| Particle count | `MAX` (in both `rasterizeText` and `rasterizeLines`) | 9,000 phone / 20,000 desktop |
| Particle size | `gl_PointSize = (2.0 + aRand.w * 2.6)` in the shader | Bigger = fatter dots |
| Font (single-text mode) | in `rasterizeText`: `"Space Grotesk"` | ⚠️ separate from `.font-display` |

⚠️ **Don't re-order the teardown**: the WebGL context is destroyed on a short delay (`setTimeout(cleanupGL, 150)`) — killing it before React swaps in the final image paints a white band for one frame (that bug was fixed once already).

**To remove the animation but keep the text:** replace the `<ParticleText …>` with the contents of its `staticRender`. Reduced-motion visitors already get exactly that.

---

## 10. SlideUpText & RollLink

Two small shared text animations.

### SlideUpText — `src/hub/SlideUpText.jsx`
Paragraph reveal: each **word** slides up out of its own overflow mask when the paragraph scrolls into view (once). Used for the about bio and the contact pitch.

- `start` prop = an external gate — the hub passes `headerDone` so paragraphs wait for their section header.
- Stagger between words: `staggerChildren: 0.018`; per-word speed: `duration: 0.45`.
- Styled inline spans survive the split (that's how a highlighted phrase can ride along inside a sentence).
- The `pb-[0.12em] -mb-[0.12em]` on the mask stops descenders (g, y) being shaved mid-flight — keep it.
- Reduced motion renders a plain `<p>`. **To remove:** swap `<SlideUpText …>` for `<p className="…">`.

### RollLink — `src/lib/RollLink.jsx`
Rolling-letter hover link: each letter slides up and its clone rises from below, staggered left-to-right. Used by the footer socials and the side menu.

- Per-letter stagger: `i * 20` (ms) in the JSX.
- Slide look/speed: `.roll-ch` in `index.css` (the `transform: translateY(-100%)` + its transition).
- **To remove:** replace `<RollLink href=…>` with a plain `<a>`.

---

## 11. Side menu

**Where:** `src/nav/SideMenu.jsx` · shown on every page after the intro (rule: `showNav` in `src/App.jsx`).

### The TARS button
The little Interstellar-robot in its leaning "side pose" (four brushed-metal slabs) that **straightens up to attention on hover**, fixed at the left edge.

- Look: `index.css`, section `/* ---------- side menu */` near the bottom — `.tars-bot` / `.tars-seg`. The four `nth-child` transforms = the lean pose; `tars-blink 2.4s` = the cyan status light; `tars-glow 3.2s` = the cyan↔violet aura.
- Position: the `className` on the `<button>` in `SideMenu.jsx`: `left-4 top-1/2`.

### The panel (adcker-style giant links)
A half-screen dark panel (`w-[50vw]`, `bg-[#131313]`) slides in from the left with a dimmed backdrop. Escape or clicking the backdrop closes it.

| Thing | Where |
|---|---|
| Menu entries | `LINKS` array at the top (the video entry is commented out at the bottom of the file) |
| Slide-in speed | `PANEL_IN = 0.8` (also drives the link stagger: `PANEL_IN * 0.55 + i * 0.06`) |
| Giant link style | `index.css` → `.menu-mega-link`: Space Grotesk 700 uppercase, `clamp(2.4rem, 4.8vw, 8.5rem)` = size, `#ece9e2` = the cream color |
| Hover bar | `.menu-mega-link::before` — the violet/blue translucent gradient that fades in behind the hovered link, full panel width |
| Letter roll on hover | Each link is a `RollLink` (§10) |
| Navigation | Links call `warpTo(to)` (§12) instead of a normal route change |
| Sound toggle | Bottom-right of the panel — flips the global `muted` flag in `store.js` |

---

## 12. Warp page transitions

**Where:** `src/nav/WarpDrive.jsx`. `WarpProvider` wraps the app in `App.jsx`; any component calls `const warpTo = useWarp()` and then `warpTo('/tech')`. Used by the side menu and the node graph.

The effect: a full-screen canvas of stars accelerates into radial light-streaks (hyperspace jump), **the route swaps behind the flash at peak speed**, then the tunnel decelerates and fades out. Input is blocked while in flight; reduced motion navigates instantly.

| Knob | Search for | Effect |
|---|---|---|
| Acceleration time | `T_IN = 0.85` | Seconds to reach full speed (the route changes at the end of this) |
| Deceleration time | `T_OUT = 0.75` | Seconds to slow + reveal the new page |
| Fade edges | `FADE_IN = 0.18` / `FADE_OUT = 0.45` | Overlay fade in/out |
| Star count | `N_STARS = 1100` | |
| Star colors | `COLORS = [` | Mostly ink-white + violet/cyan |
| Streak length | `0.02 + speed * 0.22` | How long the light-trails stretch at full speed |

**To remove the effect but keep navigation:** in `warpTo`, make the reduced-motion branch unconditional (always `navigate(to)` + `return`).

---

## 13. Tech page

**Where:** `src/pages/TechPage.jsx` · styles in `index.css` under `TECH UNIVERSE`.

- **Content:** `EXPERIENCE`, `PROJECTS`, `SKILLS` arrays at the top of the file — pure text, edit freely.
- **Colors:** everything derives from `--crt-green` / `--crt-green-dim` / `--crt-bg` tokens.
- **Effects:** `.crt-bezel` (plastic frame), `.crt-screen` (dark green tube), `.crt-turning-on` (power-on animation, shared with the hub monitor), `.term-window` (project cards + their hover glow — the `rgba(57,255,136,…)` shadows), `.text-glow` (green text glow).
- The page has a power-button **Gate** before content: the `Gate` function at the top. To skip it, find its `useState(false)` and start it `true`.

---

## 14. Video page

**Currently parked.** `src/pages/VideoPage.jsx` and all its styles (`VIDEO UNIVERSE` in `index.css`, the `--tape-*` tokens) are kept, but the page is unreachable: its import + `<Route>` are commented out in `App.jsx`, its menu entry is commented at the bottom of `SideMenu.jsx`, and its node is commented in `NodeGraph.jsx`'s `PAGES`.

**To re-enable:** uncomment those four spots (search `VideoPage` in `App.jsx`, `/video` in `SideMenu.jsx` and `NodeGraph.jsx`).

What's in it, for when it returns: `TIMELINE` and `TAPES` content arrays at the top; the bright-orange **control-center Gate** (interactive knobs/faders/toggles/oscilloscope modules, placed on an explicit 12×6 grid); the charcoal **VCR** whose cassette pushes into the mouth to unlock the page (timings: the `1500` / `3000` ms in `insert()` must roughly match the 1.5s tape animation); deck/cassette/disc styles + `.vhs-grain` film grain in `index.css`.

---

## 15. Hobbies page

**Where:** `src/pages/HobbiesPage.jsx` (gate + scrapbook), `src/hobbies/RubiksCube.jsx` (3D), `src/hobbies/cubeLogic.js` (rules), styles under the `craft-desk theme` comment in `index.css`.

### The craft-desk theme
Everything sits on a green **self-healing cutting mat**; content is torn paper, washi tape, stickers, sticky notes, instax photos.

- Palette: the token block on `.u-hobbies` (`--mat-1`/`--mat-2` mat greens, `--craft-*` paper colors).
- The mat itself: `.u-hobbies::after` — the fine/bold grids + diagonal cutting guides (the `10px` / `50px` repeats = grid spacing). It's `position: fixed` so it never scrolls.
- Worn-mat grain: `.u-hobbies::before` (`opacity: 0.07` = strength).
- Reusable bits: `.tape` (washi strips), `.torn-sheet` (ripped-paper title plaques), `.craft-footer`.

### The gate ("SOLVE ME!")
The `Gate` function in `HobbiesPage.jsx`:

- **Ransom-note header** — the `Ransom` component assembles letters from `public/ransom/` PNGs (each letter has 1–3 variants); `RANSOM_TILT` / `RANSOM_SCALE` = the messy tilts/sizes.
- **Peelable stickers** — `GATE_STICKERS` array (images from `public/stickers/`); every sticker is draggable via `useDragSticker` (the `> 6` px threshold separates a drag from a tap).
- **Give Up! skip** — the `GiveUp` button (image: `public/stickers/giveup.png`) unlocks without solving.
- **The cube** fills the rest. The gate **re-locks on every page reload by design** (see the comment in `HobbiesPage`). To never lock: change its `useState(false)` to `useState(true)`.

### The cube

| Knob | File + search | Effect |
|---|---|---|
| Sticker colors | `cubeLogic.js` → `FACE_COLORS` | `px/nx` = right/left, `py/ny` = top/bottom, `pz/nz` = front/back |
| Difficulty | `cubeLogic.js` → `SCRAMBLE_MOVES = 5` | 5 is beginner-friendly; 20 is a real scramble |
| Cube size on screen | `RubiksCube.jsx` → `camera={{ position: [4.9, 4.3, 5.3]` | Bigger numbers = camera further away = smaller cube |
| Corner roundness | `roundedBoxGeometry args={[0.94, 0.94, 0.94, 4, 0.11]}` | Last number = corner radius |
| Gap between cubies | `SPACING = 1.02` | 1.0 = touching, 1.1 = exploded-diagram look |
| Twist speed | `TURN_MS = 190` | Milliseconds per quarter-turn |
| Sticker glow | `emissiveIntensity={col ? 0.14 : 0}` | 0 = matte, 0.5+ = neon |
| Plastic body color | `INNER = '#0e0c16'` | The black between stickers |
| Solved celebration | the `explode` block in `useFrame` — cubies scatter and shrink, then `onSolved()` unlocks | To unlock without the explosion, replace the block's contents with just `onSolved()` ⚠️ test after |
| Drag sensitivity | `Math.hypot(dx, dy) < 22` (px before a drag counts) and `Math.abs(best.score) > 0.35` (how decisive the direction must be) |

### The scrapbook (unlocked content)
One page, three chapters — content arrays at the top of `HobbiesPage.jsx`, all `[PLACEHOLDER]`:

| Chapter | Component | Content array |
|---|---|---|
| 01 — current obsessions | `ObsessionDeck` (scroll-driven instax card deck) | `OBSESSIONS` (per card: `title`, `note`, `hue` gradient, `r` tilt) |
| 02 — what's in the box | `HobbyBox` (open cardboard box) + `PopCard` (an actual pop-up card; its confetti = `POP_CONFETTI`) | `CARDS` |
| 03 — pinned to the board | `CorkBoard` (sticky notes + pushpins; badges = `BoardBadge`) | `FUN_FACTS`, `ASPIRATIONS` |

Scroll **parallax**: the wrapper publishes `--sy` (scrollY) and every `.plx` element drifts by its own `--pf` factor — delete the `plx` class from an element to pin it. Chapter headers are the `Chapter` function (handwritten `font-hand`).

---

## 16. Blog page

**Where:** `src/pages/BlogPage.jsx` · styles under `BLOG UNIVERSE` in `index.css`.

### Content
The `ISSUES` array at the top — one entry per magazine issue: `no`, `title`, `kicker`, `blurb`, `body` (plain text, `\n\n` between paragraphs), plus its look on the shelf: `spineBg`/`spineInk` (spine colors), `h`/`w` (height/width as a fraction of the shelf), `tilt` (lean), `gap` (extra shelf space after it), and `face: true` for issues displayed cover-out.

### The bookshelf (Artspace-style spine → cover slider)
An **infinite marquee** of book spines that idles sideways, can be flung, and pulls a book out when clicked (spine rotates to cover, then opens the article).

| Knob | Search for | Effect |
|---|---|---|
| Idle drift speed | `SPEED = 36` | px/s (pauses on hover) |
| Fling cap | `MAX_VEL = 6000` | Max manual throw speed |
| Glide friction | `FRICTION = 4.2` | Higher = stops sooner |
| Loop copies | `COPIES = 6` | Duplicated shelf copies that make the loop seamless (1 under reduced motion, which also stops the idle drift) |
| Book size | `.bookshelf` in CSS → `--book-h` / `--spine-w` | The `clamp()`s |
| Open animation feel | `--book-ease` | The cubic-bezier for the spine→cover rotation |

### The rest
- **Paper background:** the `<PaperTexture …>` component at the top of the page render — a shader from the `@paper-design/shaders-react` package; its props (`contrast`, `roughness`, `scale`, `seed`, …) are the knobs. Delete the wrapping div for a flat background.
- **Page font:** the whole page is set in Linux Biolinum Hobby via `.u-blog` (§2).
- **The open article:** `.mag-article` (the paper sheet) + `.drop-cap::first-letter` (the big first letter).

---

## 17. Sound effects

**Where:** `src/lib/sfx.js` — every sound is **synthesized in code** (no audio files yet; the comments in the file explain how to swap in real files later).

| Function | Sound | Triggered by |
|---|---|---|
| `unlockAudio()` | *(not a sound)* | Browsers only allow audio after a user gesture — this is called on the first click (menu button, gates, EXPLORE) to unlock the rest |
| `click()` | Soft UI click | Menu links, tabs, skip buttons |
| `blip()` | Tiny blip | Small UI touches (sticker grabs) |
| `whoosh()` | Portal whoosh | Warp transitions, EXPLORE, contact TRANSMIT |
| `ignition()` | Motor spool-up | EXPLORE click |
| `glitchStatic()` | Static crackle | Title card appearing |
| `crtOn()` | CRT power thunk | Tech page power button |
| `deckInsert()` | Cassette clunk | Video page gate (parked with the page) |
| `cubeTick()` | Cube twist tick | Every layer turn |
| `solveChime()` | Victory chime | Cube solved |

- Each function is a self-contained recipe — inside, `freq` = pitch, `dur` = length, `vol` = loudness.
- **Mute everything:** the menu's SOUND toggle already does this (the `muted` flag in `store.js`).
- **Remove one sound:** search for its call (e.g. `cubeTick()`) and delete that call.
- **Remove all sound:** make `muted: true` the default in `src/store.js`.

---

## 18. Quick removal cheat-sheet

| I want to remove… | Do this |
|---|---|
| The whole boot + title intro | `Hub.jsx`: initialize phase to `'explored'` (§4) |
| The monitor's metal texture | Delete the `.crt-case::after` block in `index.css` |
| The fisheye screen curve | Delete `style={{ filter: … }}` in `CrtShell.jsx` (§5) |
| Scanlines / flicker anywhere | Remove the `scanlines` / `crt-flicker` class from that element |
| Morphing title letters | Delete the swap `useEffect` in `TitleCard.jsx` |
| Section snap-scrolling on the hub | Delete the `snap-start` classes in `Hub.jsx` (or the `html.snap-sections` rule) |
| Starfield | Delete `<Starfield />` in `Hub.jsx` |
| The footer galaxy | Delete `<GalaxyCanvas … />` in `Hub.jsx` |
| Particle-text animation | Swap `<ParticleText>` for its `staticRender` contents (§9) |
| Word-by-word paragraph reveals | Swap `<SlideUpText>` for a plain `<p>` (§10) |
| Rolling-letter link hover | Swap `<RollLink>` for a plain `<a>` (§10) |
| Warp page transitions | Make `warpTo` always `navigate(to)` (§12) |
| Custom cursors | Delete the `per-universe cursors` block in `index.css` (§3) |
| The cube gate on hobbies | `HobbiesPage.jsx`: `useState(false)` → `useState(true)` |
| The cutting-mat grid | Delete the `.u-hobbies::after` block |
| Hobbies scroll parallax | Remove the `plx` class from the drifting elements |
| Blog paper texture | Delete the `<PaperTexture …>` wrapper div in `BlogPage.jsx` |
| Bookshelf idle drift | Set `SPEED = 0` in `BlogPage.jsx` |
| All sounds | Default `muted: true` in `store.js` |
| A whole page | Delete its `<Route …>` in `App.jsx`, its `LINKS` entry in `SideMenu.jsx`, and its `PAGES` entry in `NodeGraph.jsx` (that's exactly how the video page is parked — §14) |

---

*Updated July 13, 2026 against the current code. If a search string stops matching, the code moved — search for the nearest unique word instead.*
