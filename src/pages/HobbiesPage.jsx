import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { blip, click, unlockAudio } from '../lib/sfx';
import { usePrefersReducedMotion, usePageTitle, useJsonLd } from '../lib/hooks';
import { SITE_URL } from '../lib/site';

/* JSON-LD: the scrapbook is a page about its owner */
const HOBBIES_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: `${SITE_URL}/hobbies`,
  name: 'Hobbies — Multiverse of Portfolio',
  description:
    "Dua Anas's scrapbook of hobbies — current obsessions, papercraft, fun facts and aspirations.",
  about: { '@id': `${SITE_URL}/#person` },
};

const RubiksCube = lazy(() => import('../hobbies/RubiksCube'));

// phones: the pinned instax deck can't work — stacked cards are ~5 screens
// tall inside one overflow-hidden viewport — so the scrapbook lays out in
// normal flow there (same as the reduced-motion path)
const MOBILE =
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 767px)').matches;

/* [PLACEHOLDER: real obsession photos/content, 3D card-making photos/process, project logs] */
const OBSESSIONS = [
  { title: 'Obsession #1', note: '[PLACEHOLDER: what it is + why it ate my brain]', hue: 'linear-gradient(135deg, #e8dcc0, #cdbb92)', r: -2 },
  { title: 'Obsession #2', note: '[PLACEHOLDER: short caption]', hue: 'linear-gradient(135deg, #f9c8d8, #e79ab5)', r: 1.5 },
  { title: 'Obsession #3', note: '[PLACEHOLDER: short caption]', hue: 'linear-gradient(135deg, #c7e3f7, #93bfe3)', r: -1 },
  { title: 'Obsession #4', note: '[PLACEHOLDER: short caption]', hue: 'linear-gradient(135deg, #d4ecd0, #a3cf9e)', r: 2 },
  { title: 'Obsession #5', note: '[PLACEHOLDER: short caption]', hue: 'linear-gradient(135deg, #f6e3b8, #e6c26f)', r: -1.5 },
];
const CARDS = [
  { title: 'Pop-up card #1', note: '[PLACEHOLDER: photo + process notes]' },
  { title: 'Layered card #2', note: '[PLACEHOLDER: photo + process notes]' },
  { title: 'Mechanism experiment #3', note: '[PLACEHOLDER: photo + process notes]' },
];
const FUN_FACTS = [
  { text: 'You have enough atoms in your body to build roughly 7,000 of every other person you know. (Please don\'t.)', color: 'linear-gradient(180deg, #ffec9e, #f8dd74)', r: -1.5 },
  { text: '[PLACEHOLDER: fun fact about me #2]', color: 'linear-gradient(180deg, #ffd3e0, #f9b8cd)', r: 2 },
  { text: '[PLACEHOLDER: fun fact about me #3]', color: 'linear-gradient(180deg, #cfe8ff, #b3d7f7)', r: -1 },
];
const ASPIRATIONS = [
  { text: '[PLACEHOLDER: aspiration #1 — the big one]', color: 'linear-gradient(180deg, #d8f3cf, #b9e3a8)', r: 1.5 },
  { text: '[PLACEHOLDER: aspiration #2]', color: 'linear-gradient(180deg, #ffe3c4, #ffcf9a)', r: -2 },
  { text: '[PLACEHOLDER: aspiration #3]', color: 'linear-gradient(180deg, #ffec9e, #f8dd74)', r: 1 },
];

/* ---------- cut-out & sticker bits ---------- */

/* pointer-drag for the mat stickers: writes --dx/--dy straight onto the
   element (no re-render per move); a <6px press-and-release counts as a tap */
function useDragSticker(onTap) {
  const pos = useRef({ x: 0, y: 0 });
  const start = useRef(null);
  const [dragging, setDragging] = useState(false);
  const handlers = {
    onPointerDown: (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { px: e.clientX, py: e.clientY, ox: pos.current.x, oy: pos.current.y, moved: false };
      setDragging(true);
      blip();
    },
    onPointerMove: (e) => {
      const s = start.current;
      if (!s) return;
      if (!s.moved && Math.hypot(e.clientX - s.px, e.clientY - s.py) > 6) s.moved = true;
      pos.current = { x: s.ox + e.clientX - s.px, y: s.oy + e.clientY - s.py };
      e.currentTarget.style.setProperty('--dx', `${pos.current.x}px`);
      e.currentTarget.style.setProperty('--dy', `${pos.current.y}px`);
    },
    onPointerUp: () => {
      const wasTap = start.current && !start.current.moved;
      start.current = null;
      setDragging(false);
      click();
      if (wasTap) onTap?.();
    },
    onPointerCancel: () => {
      start.current = null;
      setDragging(false);
    },
  };
  return { handlers, dragging };
}

/* a draggable cutout pinned to the mat — photo (src) or arbitrary children */
function Sticker({ src, x, y, w, r = 0, className = '', children }) {
  const { handlers, dragging } = useDragSticker();
  const cls = `stkr ${dragging ? 'stkr-drag' : ''} ${className}`;
  const style = { left: x, top: y, width: w, '--r': `${r}deg` };
  if (src) {
    return (
      <img src={src} alt="" aria-hidden="true" draggable={false} className={cls} style={style} {...handlers} />
    );
  }
  return (
    <div className={cls} style={style} {...handlers} aria-hidden="true">
      {children}
    </div>
  );
}

/* ransom-note headline from the baked letter scraps in /public/ransom
   (supports A–Z, space and "!"); each letter is its own peelable sticker */
const RANSOM_TILT = [-7, 5, -3, 8, -5, 4, -8, 6];
const RANSOM_SCALE = [1, 0.9, 1.08, 0.95];
function RansomCh({ src, tilt, height }) {
  // const { handlers, dragging } = useDragSticker();
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`ransom-ch`}
      style={{ '--rr': `${tilt}deg`, '--rh': height , cursor: "inherit"}}
      // {...handlers}
    />
  );
}
function Ransom({ text, size = '3.4rem', className = '' }) {
  return (
    <span className={`ransom ${className}`} role="img" aria-label={text}>
      {[...text.toUpperCase()].map((ch, i) => {
        if (ch === ' ') return <span key={i} style={{ width: '0.45em' }} aria-hidden="true" />;
        const src = ch === '!' ? `/ransom/excl-${(i % 3) + 1}.webp` : `/ransom/${ch}-${(i % 3) + 1}.webp`;
        return (
          <RansomCh
            key={i}
            src={src}
            tilt={RANSOM_TILT[i % RANSOM_TILT.length]}
            height={`calc(${size} * ${RANSOM_SCALE[i % RANSOM_SCALE.length]})`}
          />
        );
      })}
    </span>
  );
}

/* kawaii outlined star, straight off the cutting-mat inspiration */
function Star({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <path
        d="M32 4l7.6 17.2L58 23.4 44 36l4.2 19L32 44.6 15.8 55 20 36 6 23.4l18.4-2.2z"
        fill="#f4c945"
        stroke="#2e2a23"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="26.5" cy="28" r="1.8" fill="#2e2a23" />
      <circle cx="37.5" cy="28" r="1.8" fill="#2e2a23" />
      <path d="M27 34.5q5 4.5 10 0" stroke="#2e2a23" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Heart({ className, style }) {
  return (
    <svg viewBox="0 0 64 56" className={className} style={style} aria-hidden="true">
      <path
        d="M32 50C18 38 6 29 6 17.5 6 9.5 12.5 4 19.5 4 24.6 4 29.3 7 32 11.6 34.7 7 39.4 4 44.5 4 51.5 4 58 9.5 58 17.5 58 29 46 38 32 50z"
        fill="#f27fae"
        stroke="#2e2a23"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Bolt({ className, style }) {
  return (
    <svg viewBox="0 0 40 64" className={className} style={style} aria-hidden="true">
      <path
        d="M26 3L6 36h11l-4 25 21-36H22l4-22z"
        fill="#6db3f2"
        stroke="#2e2a23"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* threaded letter beads (Cheeky Bones bead font) spilled on the mat around
   the opening screen — her name's letters plus the heart and star charms */
const OBSESSION_BEADS = [
  { src: '/beads/HEART.webp', x: '10%',  y: '7%',  w: 'clamp(26px, 3vw, 52px)',   r: -14 },
  { src: '/beads/D.webp',     x: '92%',  y: '32%', w: 'clamp(26px, 3vw, 52px)',   r: 12 },
  { src: '/beads/S.webp',     x: '6.5%', y: '38%', w: 'clamp(26px, 3vw, 52px)',   r: 20 },
  { src: '/beads/A.webp',     x: '4%',   y: '47%', w: 'clamp(28px, 3.2vw, 56px)', r: -10 },
  { src: '/beads/U.webp',     x: '9%',   y: '55%', w: 'clamp(26px, 3vw, 52px)',   r: 28 },
  { src: '/beads/N.webp',     x: '94%',  y: '58%', w: 'clamp(26px, 3vw, 52px)',   r: -22 },
  { src: '/beads/STAR.webp',  x: '87%',  y: '82%', w: 'clamp(30px, 3.4vw, 60px)', r: 10 },
];

/* the opening screen's mat clutter, laid out to match the collage reference:
   torn kraft corner + top-secret folder are the user's cutout images (baked
   to webp in public/stickers; the torn strip is pre-rotated 180° so it reads
   as a top-left corner piece); the rest are the same peelable stickers the
   cube gate uses, plus the letter beads */
function ObsessionDecor() {
  return (
    <div className="absolute inset-0 z-0" aria-hidden="true">
      <img
        src="/stickers/torn-paper.webp"
        alt=""
        width={418}
        height={193}
        decoding="async"
        draggable={false}
        className="absolute top-0 left-0 h-auto w-[clamp(190px,26vw,440px)]"
        style={{ filter: 'drop-shadow(5px 7px 10px rgba(8, 38, 24, 0.35))' }}
      />
      <img
        src="/stickers/topsecret-folder.webp"
        alt=""
        width={298}
        height={401}
        decoding="async"
        draggable={false}
        className="absolute h-auto"
        style={{
          right: 'max(-6vw, -85px)',
          bottom: 'max(-9vw, -130px)',
          width: 'clamp(220px, 23vw, 330px)',
          transform: 'rotate(-45deg)',
          filter: 'drop-shadow(-12px 14px 24px rgba(8, 38, 24, 0.4))',
        }}
      />
      {/* the note sits in the keyed-out notch the reference's note left in the kraft */}
      <Sticker src="/stickers/quote-note.webp" x="3.5%" y="clamp(88px, 8.2vw, 152px)" w="clamp(90px, 10vw, 190px)" r={-8} />
      <Sticker src="/stickers/pin.webp" x="87%" y="5%" w="clamp(36px, 4.5vw, 100px)" r={16} />
      <Sticker src="/stickers/burst.webp" x="80%" y="23%" w="clamp(50px, 6vw, 140px)" r={12} />
      <Sticker src="/stickers/sparkles.webp" x="2.5%" y="72%" w="clamp(55px, 7vw, 150px)" r={-6} />
      {OBSESSION_BEADS.map((b, i) => (
        <Sticker key={i} {...b} />
      ))}
    </div>
  );
}

/* confetti scattered around the 3D pop-up, tuned by eye against the
   reference: small triangles + dots that fly out from the crease on open */
const POP_CONFETTI = [
  { type: 'tri', color: 'var(--pc-coral)', x: -98, y: -46, r: -22, d: 0.44 },
  { type: 'tri', color: 'var(--pc-teal)', x: 96, y: -58, r: 16, d: 0.5 },
  { type: 'dot', color: 'var(--pc-pink)', x: -112, y: 22, r: 0, size: 20, d: 0.56 },
  { type: 'dot', color: 'var(--pc-teal)', x: 106, y: 30, r: 0, size: 16, d: 0.62 },
  { type: 'tri', color: 'var(--pc-pink)', x: -64, y: -78, r: 42, d: 0.68 },
  { type: 'tri', color: 'var(--craft-yellow)', x: 66, y: -86, r: -34, d: 0.74 },
  { type: 'dot', color: 'var(--craft-yellow)', x: -6, y: -100, r: 0, size: 14, d: 0.8 },
];

/* the pop-up "thank you" card: tap the cover to swing it open on its top
   hinge — a layered 3D papercraft "THANK YOU" rises out of the crease
   with confetti fanning out behind it */
function PopCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => { click(); setOpen((o) => !o); }}
        className={`popcard block w-full ${open ? 'is-open' : ''}`}
        style={{ maxWidth: 'clamp(18rem, 34vw, 27rem)' }}
        aria-pressed={open}
        aria-label={open ? 'Close the pop-up card' : 'Open the pop-up card'}
      >
        <span className="popcard-base block aspect-[6/5]">
          <span className="popcard-stage">
            <span className="popcard-3d">
              {POP_CONFETTI.map((c, i) => (
                <span
                  key={i}
                  className={`ty-confetti ${c.type === 'tri' ? 'ty-tri' : 'ty-dot'}`}
                  style={{
                    '--cx': `${c.x}px`,
                    '--cy': `${c.y}px`,
                    '--cr': `${c.r}deg`,
                    '--cd': `${c.d}s`,
                    '--tc': c.color,
                    ...(c.type === 'dot' ? { width: c.size, height: c.size } : {}),
                  }}
                />
              ))}
              <span className="ty-line">THANK</span>
              <span className="ty-line">YOU</span>
            </span>
          </span>
          <span className="popcard-flap">
            <span className="popcard-flap-face">
              <span className="ty-cover">THANK YOU</span>
              <Star className="w-10" />
              <span className="popcard-hint font-hand text-xl">tap to open!</span>
            </span>
          </span>
        </span>
      </button>
      <p className="font-hand text-lg text-[var(--craft-cream)] mt-3 rotate-[-1deg]">
        ↑ a real pop-up. zero paper cuts (lies)
      </p>
    </div>
  );
}

/* one instax-mini print: small square photo window up top, the rest is caption */
function InstaxCard({ title, note, hue, r = 0, y = 0, onFocus }) {
  return (
    <motion.div
      className="instax w-44 shrink-0 flex flex-col"
      style={{ y, rotate: r }}
      tabIndex={0}
      onFocus={onFocus}
    >
      <div className="instax-photo" style={{ background: hue }}>
        <span className="font-serif italic text-xs text-black/40 text-center px-2">[PLACEHOLDER: photo]</span>
      </div>
      <div className="flex-1 pt-3">
        <p className="font-hand font-bold text-xl leading-none">{title}</p>
        <p className="text-xs opacity-75 mt-1.5 leading-snug">{note}</p>
      </div>
    </motion.div>
  );
}

/* maps its slice of the deck's scroll progress to a swipe-up entrance */
function DeckCard({ item, i, n, progress, onFocus }) {
  const y = useTransform(progress, [i / n, (i + 0.85) / n], ['90vh', '0vh']);
  return <InstaxCard {...item} y={y} onFocus={onFocus} />;
}

/* the pinned opening screen: HOBBIES header, cut line, chapter title and the
   first instax are all on screen from the start and hold still; scrolling
   only swipes the remaining cards up into the row, one by one */
function ObsessionDeck() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef(null);
  const stickyRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const n = OBSESSIONS.length;

  // keyboard focus on a card scrolls the page to the point in the pinned
  // deck where that card has fully swiped in (one card per tab stop); the
  // browser can't do this itself — the cards live inside a sticky screen
  const focusCard = (i) => {
    const sticky = stickyRef.current;
    if (sticky) {
      // undo any scroll the browser forced on the overflow-hidden screen
      sticky.scrollTop = 0;
      sticky.scrollLeft = 0;
    }
    const wrap = ref.current;
    if (!wrap) return;
    const deckTop = wrap.getBoundingClientRect().top + window.scrollY;
    // card i is fully in at progress (i - 1 + 0.85) / (n - 1) of a
    // (n - 1) * 60vh scroll range — i.e. (i - 0.15) * 60vh past the top
    const target = i === 0 ? deckTop : deckTop + (i - 0.15) * 0.6 * window.innerHeight;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };
  const heading = (
    <>
      <div className="relative mx-auto w-max max-w-full z-10">
        <span className="tape tape-gingham -top-3 left-4 -rotate-12 z-10" style={{ '--gc': '#d94f3d' }} />
        <span className="tape tape-gingham -bottom-3 right-4 rotate-12 z-10" style={{ '--gc': '#b06ccc' }} />
        <header className="grid-sheet px-10 md:px-16 py-6 md:py-8 text-center" style={{ '--r': '-0.5deg' }}>
          <h1 className="sr-only">Hobbies</h1>
          <Ransom text="HOBBIES" size="clamp(2rem, 5vw, 4rem)" className="justify-center" />
        </header>
      </div>
      {/* the pinned screen is full-bleed; the divider + chapter label keep
          the page column's width so they land where they used to */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
        <div className="cut-line !my-8 md:!my-10" />
        <Chapter no="01" title="current obsessions" />
      </div>
    </>
  );
  if (reduced || MOBILE) {
    return (
      <div ref={ref} className="relative">
        <ObsessionDecor />
        {heading}
        <div className="relative z-10 flex flex-wrap justify-center gap-5">
          {OBSESSIONS.map((o) => <InstaxCard key={o.title} {...o} />)}
        </div>
      </div>
    );
  }
  return (
    <div ref={ref} style={{ height: `${(n - 1) * 60 + 100}vh` }}>
      {/* deck-bleed: the pinned screen spans the full viewport so the mat
          clutter reaches the real screen edges; content still centers */}
      <div ref={stickyRef} className="deck-bleed sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        <ObsessionDecor />
        {heading}
        <div className="relative z-10 flex flex-wrap justify-center gap-5">
          {OBSESSIONS.map((o, i) =>
            i === 0 ? (
              <InstaxCard key={o.title} {...o} onFocus={() => focusCard(0)} />
            ) : (
              <DeckCard
                key={o.title}
                item={o}
                i={i - 1}
                n={n - 1}
                progress={scrollYProgress}
                onFocus={() => focusCard(i)}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* the box itself, drawn as one SVG for a photographic top-down look:
   fold-out flaps with corrugated cut edges, four perspective inner walls,
   a vignetted floor with the top wall's cast shadow, and kraft-paper grain */
function BoxArt() {
  return (
    <svg viewBox="0 0 800 620" className="absolute inset-0 w-full h-full block" aria-hidden="true">
      <defs>
        <linearGradient id="bxFlapT" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#b08549" /><stop offset="1" stopColor="#cda269" />
        </linearGradient>
        <linearGradient id="bxFlapB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b08549" /><stop offset="1" stopColor="#d2a76c" />
        </linearGradient>
        <linearGradient id="bxFlapL" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#ad8247" /><stop offset="1" stopColor="#c99e63" />
        </linearGradient>
        <linearGradient id="bxFlapR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ad8247" /><stop offset="1" stopColor="#cfa46a" />
        </linearGradient>
        <linearGradient id="bxTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b4e28" /><stop offset="1" stopColor="#8a6537" />
        </linearGradient>
        <linearGradient id="bxLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8d6636" /><stop offset="1" stopColor="#9e7743" />
        </linearGradient>
        <linearGradient id="bxRight" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#b0854e" /><stop offset="1" stopColor="#a17a45" />
        </linearGradient>
        <linearGradient id="bxBottom" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#c19457" /><stop offset="1" stopColor="#aa8049" />
        </linearGradient>
        <radialGradient id="bxFloor" cx="0.5" cy="0.42" r="0.8">
          <stop offset="0" stopColor="#bd9259" /><stop offset="0.75" stopColor="#ab8149" /><stop offset="1" stopColor="#97703d" />
        </radialGradient>
        <linearGradient id="bxShad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2408" stopOpacity="0.34" /><stop offset="1" stopColor="#3a2408" stopOpacity="0" />
        </linearGradient>
        {/* kraft-paper speckle */}
        <filter id="bxN">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.21  0 0 0 0 0.08  0 0 0 0.5 0" />
        </filter>
      </defs>

      {/* fold-out flaps */}
      <polygon points="68,62 732,62 722,16 78,12" fill="url(#bxFlapT)" stroke="#8a6537" strokeWidth="1.5" />
      <polygon points="68,558 732,558 724,606 76,610" fill="url(#bxFlapB)" stroke="#8a6537" strokeWidth="1.5" />
      <polygon points="62,68 62,552 18,542 14,78" fill="url(#bxFlapL)" stroke="#8a6537" strokeWidth="1.5" />
      <polygon points="738,68 738,552 782,546 786,74" fill="url(#bxFlapR)" stroke="#8a6537" strokeWidth="1.5" />
      {/* corrugation showing along the cut edges of the flaps */}
      <line x1="82" y1="15" x2="718" y2="19" stroke="#6f5129" strokeWidth="5" strokeDasharray="7 6" opacity="0.45" />
      <line x1="80" y1="607" x2="720" y2="603" stroke="#6f5129" strokeWidth="5" strokeDasharray="7 6" opacity="0.45" />
      <line x1="17" y1="82" x2="21" y2="538" stroke="#6f5129" strokeWidth="5" strokeDasharray="7 6" opacity="0.45" />
      <line x1="783" y1="78" x2="779" y2="542" stroke="#6f5129" strokeWidth="5" strokeDasharray="7 6" opacity="0.45" />

      {/* interior walls, floor and lighting */}
      <polygon points="60,60 740,60 680,115 120,115" fill="url(#bxTop)" />
      <polygon points="60,60 120,115 120,505 60,560" fill="url(#bxLeft)" />
      <polygon points="740,60 680,115 680,505 740,560" fill="url(#bxRight)" />
      <polygon points="60,560 120,505 680,505 740,560" fill="url(#bxBottom)" />
      <rect x="120" y="115" width="560" height="390" fill="url(#bxFloor)" />
      <rect x="120" y="115" width="560" height="70" fill="url(#bxShad)" />
      {/* corner seams */}
      <line x1="60" y1="60" x2="120" y2="115" stroke="#4d3313" strokeWidth="2" opacity="0.5" />
      <line x1="740" y1="60" x2="680" y2="115" stroke="#4d3313" strokeWidth="2" opacity="0.5" />
      <line x1="60" y1="560" x2="120" y2="505" stroke="#4d3313" strokeWidth="2" opacity="0.5" />
      <line x1="740" y1="560" x2="680" y2="505" stroke="#4d3313" strokeWidth="2" opacity="0.5" />
      {/* mouth rim */}
      <rect x="60" y="60" width="680" height="500" fill="none" stroke="#5f4420" strokeWidth="3" opacity="0.55" />
      {/* kraft grain over everything */}
      <rect x="10" y="8" width="780" height="604" filter="url(#bxN)" opacity="0.35" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}

/* top-down open cardboard box (table-of-contents style): the realistic SVG
   box above, with one piece of ephemera per hobby scattered on its floor */
function HobbyBox() {
  return (
    <div className="hobby-box relative mx-auto w-full max-w-3xl my-12" style={{ aspectRatio: '800 / 620' }}>
      <BoxArt />

      {/* manila envelope — tinkering */}
      <div className="box-env absolute" style={{ left: '17%', top: '27%', width: '20%', height: '40%', transform: 'rotate(-5deg)' }}>
        <span className="box-item-label absolute left-1/2 top-[56%] w-max -translate-x-1/2 -rotate-2 font-hand font-bold uppercase tracking-wide text-[#7c1d10] text-lg md:text-2xl">tinkering</span>
      </div>

      {/* torn lined note — card making */}
      <div className="box-note absolute grid place-items-center" style={{ left: '39%', top: '20%', width: '19%', height: '19%', transform: 'rotate(2deg)' }}>
        <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-1 !w-14" />
        <span className="box-item-label font-hand font-bold uppercase tracking-wide text-[#d9a410] text-base md:text-xl text-center leading-tight">card making</span>
      </div>

      {/* red envelope with a letter tucked in — cubing */}
      <div className="box-env2 absolute" style={{ left: '61%', top: '22%', width: '18%', height: '14%', transform: 'rotate(6deg)' }}>
        <div className="box-letter absolute grid place-items-center" style={{ left: '8%', width: '84%', top: '-42%', height: '95%', transform: 'rotate(-2deg)' }}>
          <span className="box-item-label font-hand font-bold uppercase tracking-wide text-[#a63028] text-sm md:text-lg">cubing</span>
        </div>
        <div className="box-env2-front" />
      </div>

      {/* blue folder — reading */}
      <div className="box-folder absolute grid place-items-center" style={{ left: '59%', top: '41%', width: '24%', height: '34%', transform: 'rotate(8deg)' }}>
        <span className="box-item-label font-hand font-bold uppercase tracking-wide text-[#2b56a3] text-xl md:text-3xl -rotate-3 text-center leading-tight">reading</span>
      </div>

      {/* cassette tape — video editing */}
      <div className="box-cassette absolute" style={{ left: '40%', top: '44%', width: '17%', height: '13%', transform: 'rotate(-7deg)' }}>
        <span className="box-item-label absolute top-[17%] w-full text-center font-hand font-bold uppercase tracking-wide text-[#403c2a] text-xs md:text-sm leading-none">video editing</span>
      </div>

      {/* polaroid print — photography */}
      <div className="box-photo absolute" style={{ left: '41%', top: '60%', width: '14%', height: '19%', transform: 'rotate(4deg)' }}>
        <span className="box-item-label absolute bottom-[4%] w-full text-center font-hand font-bold uppercase tracking-wide text-[#2e2a23] text-xs md:text-sm leading-none">photography</span>
      </div>

      {/* floppy disk — coding */}
      <div className="box-floppy absolute" style={{ left: '19%', top: '69%', width: '13%', height: '13%', transform: 'rotate(7deg)' }}>
        <span className="box-item-label absolute bottom-[14%] w-full text-center font-hand font-bold uppercase tracking-wide text-[#24397a] text-xs md:text-sm leading-none z-10">coding</span>
      </div>

      {/* green tape strip — fun facts */}
      <div className="box-tape2 absolute grid place-items-center" style={{ left: '58%', top: '75%', width: '17%', height: '6.5%', transform: 'rotate(-3deg)' }}>
        <span className="box-item-label font-hand font-bold uppercase tracking-wide text-[#1e4f14] text-sm md:text-lg">fun facts</span>
      </div>

      {/* box clutter */}
      <Star className="absolute w-8 md:w-11" style={{ left: '52%', top: '31%', transform: 'rotate(10deg)' }} />
      <img
        src="/stickers/burst.webp"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute w-[11%]"
        style={{ left: '33%', top: '73%', transform: 'rotate(14deg)' }}
      />
    </div>
  );
}

/* label sticker + handwritten chapter heading */
function Chapter({ no, title }) {
  return (
    <header className="flex items-center flex-wrap gap-4 mb-9">
      <span className="label-stx" style={{ '--r': '-2deg' }}>CHAPTER {no}</span>
      <h2 className="font-hand font-bold text-3xl md:text-4xl text-[var(--craft-cream)]">{title}</h2>
    </header>
  );
}

/* ---------- chapter 03: the corkboard ---------- */

/* red round pushpin, stuck through whatever it sits on */
function Pushpin({ className = '' }) {
  return <span className={`pushpin ${className}`} aria-hidden="true" />;
}

/* chunky oval badge header, pinned to the cork (per the Behance ref) */
function BoardBadge({ children, bg, ink, ring, r = -2 }) {
  return (
    <span className="board-badge relative" style={{ '--bb-bg': bg, '--bb-ink': ink, '--bb-ring': ring, '--r': `${r}deg` }}>
      <Pushpin className="-top-2 left-1/2 -translate-x-1/2" />
      {children}
    </span>
  );
}

/* a sticky note held up by a pushpin instead of glue; the pin sits fully
   inside the note — the note's clip-path would slice anything above its edge */
function PinNote({ text, color, r }) {
  return (
    <div className="sticky-note p-5 pt-7 max-w-xs" style={{ '--r': `${r}deg`, '--sn': color }}>
      <Pushpin className="top-1.5 left-1/2 -translate-x-1/2" />
      <p className="font-hand text-lg leading-snug">{text}</p>
    </div>
  );
}

/* the corkboard itself: wooden frame, cork surface, everything pinned on */
function CorkBoard() {
  return (
    <div className="corkboard-frame" style={{ '--r': '-0.3deg' }}>
      <div className="corkboard p-6 md:p-10">
        {/* pinned intro: a photo of me + a couple of loose lines */}
        <div className="flex flex-col sm:flex-row gap-8 md:gap-12 items-start mb-10 md:mb-12">
          <div className="polaroid w-44 shrink-0" style={{ '--r': '-4deg' }}>
            <Pushpin className="-top-2 left-1/2 -translate-x-1/2" />
            <div className="aspect-square grid place-items-center" style={{ background: 'linear-gradient(135deg, #e8dcc0, #cdbb92)' }}>
              <span className="font-serif italic text-xs text-black/40 text-center px-2">[PLACEHOLDER: photo of me]</span>
            </div>
            <p className="font-hand text-center text-lg mt-1.5">certified board owner</p>
          </div>
          <div className="scrap-cut p-5 md:mt-6 max-w-md" style={{ '--r': '1deg' }}>
            <p className="font-hand text-xl leading-snug">
              [PLACEHOLDER: 2–3 handwritten lines about me — the stuff that
              doesn't fit a CV: what I'm like to work with, what I never shut
              up about, what I'd do with a free afternoon]
            </p>
          </div>
        </div>

        {/* two pinned columns under their badge headers */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-12">
          <div className="flex flex-col items-start gap-7">
            <BoardBadge bg="var(--craft-yellow)" ink="#1e4f14" ring="#2c7343" r={-2}>FUN FACTS</BoardBadge>
            {FUN_FACTS.map((f) => <PinNote key={f.text} {...f} />)}
          </div>
          <div className="flex flex-col items-start gap-7 md:items-end">
            <BoardBadge bg="var(--craft-red)" ink="#ffe9b0" ring="#f4c945" r={2}>ASPIRATIONS</BoardBadge>
            {ASPIRATIONS.map((a) => <PinNote key={a.text} {...a} />)}
          </div>
        </div>

        {/* board clutter */}
        <Star className="absolute w-9 md:w-12 right-[4%] top-[3%]" style={{ transform: 'rotate(12deg)' }} />
        <Heart className="absolute w-9 md:w-11 left-[2.5%] bottom-[4%]" style={{ transform: 'rotate(-10deg)' }} />
        <Bolt className="absolute w-6 md:w-7 right-[7%] bottom-[26%]" style={{ transform: 'rotate(14deg)' }} />
      </div>
    </div>
  );
}

/* kraft-paper page footer: torn top edge, sign-off stamp, links, colophon */
function CraftFooter() {
  return (
    <footer className="craft-footer">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 md:pt-20">
        <div className="flex items-center gap-8 flex-wrap">
          <span className="stamp" style={{ '--r': '-6deg' }}>TO BE CONTINUED</span>
          <p className="font-hand text-xl rotate-[-1deg]">
            — filed under "personality". me, probably gluing something right now ✂
          </p>
        </div>
        <div className="mt-10 flex items-end justify-between gap-6 flex-wrap">
          <nav aria-label="Social links" className="flex gap-4 flex-wrap">
            <a href="https://github.com/cooleditingx" target="_blank" rel="noreferrer" className="label-stx" style={{ '--r': '-1.5deg' }}>GitHub</a>
            <a href="https://www.linkedin.com/in/dua-anas/" target="_blank" rel="noreferrer" className="label-stx" style={{ '--r': '1deg' }}>LinkedIn</a>
            <a href="mailto:duaanas0309@gmail.com" className="label-stx" style={{ '--r': '-1deg' }}>Email</a>
          </nav>
          <p className="font-mono text-xs tracking-wider opacity-75">
            © {new Date().getFullYear()} · cut, glued &amp; taped by hand
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------- the cube gate: the cutting-mat collage ---------- */

/* the user's own cutouts (assets/stickers → background-removed PNGs in
   public/stickers) — scattered to match the desk-clutter reference collage */
const GATE_STICKERS = [
  { src: '/stickers/quote-note.webp', x: '4%',    y: '23.5%', w: 'clamp(95px, 11vw, 260px)',  r: -6 },
  { src: '/stickers/pin.webp',        x: '7.5%',  y: '6%',    w: 'clamp(36px, 4.5vw, 110px)', r: -12 },
  { src: '/stickers/sparkles.webp',   x: '22%',   y: '26%',   w: 'clamp(45px, 5.5vw, 130px)', r: 0 },
  { src: '/stickers/headphones.webp', x: '15.5%', y: '57%',   w: 'clamp(95px, 12vw, 280px)',  r: -4 },
  { src: '/stickers/star-note.webp',  x: '73%',   y: '9%',    w: 'clamp(120px, 18vw, 400px)', r: 4 },
  { src: '/stickers/burst.webp',      x: '61%',   y: '23.5%', w: 'clamp(70px, 9vw, 220px)',   r: 20 },
  { src: '/stickers/sparkles.webp',   x: '75.5%', y: '55%',   w: 'clamp(60px, 7.5vw, 180px)', r: 10 },
  { src: '/stickers/pin.webp',        x: '87%',   y: '75%',   w: 'clamp(44px, 5.5vw, 130px)', r: 25 },
];

/* the mat's printed edge: cm numbers down the left / along the bottom,
   plus the model number in the corner */
function MatEdges() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
      <span
        className="mat-num !text-[clamp(11px,1.5vw,20px)] tracking-[0.18em]"
        style={{ top: 10, right: 14 }}
      >
        CUTTING MAT 3022
      </span>
      {Array.from({ length: 29 }, (_, i) => (
        <span key={`b${i}`} className="mat-num" style={{ left: i * 72 + 30, bottom: 6 }}>{i}</span>
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <span key={`l${i}`} className="mat-num" style={{ left: 8, top: i * 72 + 58 }}>{i}</span>
      ))}
    </div>
  );
}

/* clear acrylic ruler (per reference pic): transparent body — the mat shows
   through — with a bright edge, a glass sheen, and printed dark markings */
function ClearRuler() {
  const ticks = [];
  for (let i = 0; i <= 74; i++) {
    const x = 12 + i * 8.4;
    const major = i % 10 === 0;
    const mid = i % 5 === 0;
    ticks.push(
      <line key={`t${i}`} x1={x} y1={3} x2={x} y2={major ? 25 : mid ? 18 : 11} stroke="#132b1e" strokeOpacity="0.8" strokeWidth={major ? 1.5 : 0.9} />,
      <line key={`u${i}`} x1={x + 4.2} y1={73} x2={x + 4.2} y2={major ? 52 : mid ? 58 : 64} stroke="#132b1e" strokeOpacity="0.8" strokeWidth={major ? 1.5 : 0.9} />
    );
    if (major && i > 0) {
      ticks.push(
        <text key={`n${i}`} x={x} y={41} textAnchor="middle" fontSize="15" fontFamily="ui-monospace, monospace" fill="#132b1e" fillOpacity="0.85">
          {i / 10}
        </text>
      );
    }
  }
  return (
    <Sticker x="-4%" y="60%" w="min(34vw, 520px)" r={38} className="origin-left">
      <svg viewBox="0 0 660 76" className="w-full block">
        <defs>
          <linearGradient id="rulGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
            <stop offset="0.28" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="0.72" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="658" height="74" rx="7" fill="url(#rulGlass)" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
        {/* inner bevel line, like the milled edge of an acrylic ruler */}
        <rect x="5" y="5" width="650" height="66" rx="5" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
        {ticks}
        <circle cx="637" cy="38" r="6.5" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
      </svg>
    </Sticker>
  );
}

/* the pink-chalk escape hatch: tap to skip the puzzle */
function GiveUp({ onSkip, reduced }) {
  return (
    <button
      type="button"
      className="relative z-10 mt-3 mb-1 cursor-pointer transition-transform hover:scale-105"
      style={{ filter: 'drop-shadow(3px 6px 7px rgba(5, 28, 17, 0.5))' }}
      aria-label={reduced ? 'Skip the puzzle (motion-free entrance)' : 'Give up and skip the puzzle'}
      title="tap to skip"
      onClick={() => { click(); onSkip(); }}
    >
      <img
        src="/stickers/giveup.webp"
        alt="Give Up! Skip"
        draggable={false}
        className="block w-[clamp(190px,28vw,420px)]"
      />
    </button>
  );
}

function Gate({ onUnlock }) {
  const reduced = usePrefersReducedMotion();
  return (
    <div
      className="mat-gate h-screen flex flex-col items-center px-6 pt-6 pb-4 relative overflow-hidden"
      onPointerDownCapture={unlockAudio}
    >
      <MatEdges />
      {GATE_STICKERS.map((s, i) => (
        <Sticker key={i} {...s} />
      ))}
      <ClearRuler />

      <div className="relative z-10 mt-3">
        <Ransom text="SOLVE ME!" size="clamp(2.2rem, 11vw, 7.5rem)" />
      </div>

      <div className="flex-1 min-h-0 w-full touch-none">
        <Suspense
          fallback={
            <div className="h-full grid place-items-center font-hand text-xl text-[var(--craft-cream)]">
              gluing the cube together…
            </div>
          }
        >
          <RubiksCube onSolved={onUnlock} />
        </Suspense>
      </div>

      <GiveUp onSkip={onUnlock} reduced={reduced} />
    </div>
  );
}

/* ---------- the scrapbook: one page, one story ---------- */
export default function HobbiesPage() {
  usePageTitle(
    'Hobbies — Multiverse of Portfolio',
    "Solve the cube gate and flip through Dua Anas's scrapbook of hobbies — current obsessions, papercraft, fun facts and aspirations, glued by hand.",
    '/hobbies'
  );
  useJsonLd(HOBBIES_JSON_LD);
  // Session-only: a page reload always re-locks the gate — that's the spec,
  // not an oversight. Phones skip the cube gate entirely (fiddly under a
  // thumb, and it pulls the whole three.js chunk) and land on the scrapbook.
  const [unlocked, setUnlocked] = useState(MOBILE);
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef(null);

  // parallax: publish scrollY as --sy on the wrapper; .plx elements each
  // drift by their own --pf factor
  useEffect(() => {
    if (!unlocked || reduced) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        wrapRef.current?.style.setProperty('--sy', String(window.scrollY));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [unlocked, reduced]);

  if (!unlocked) {
    return (
      <div className="u-hobbies">
        <Gate onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }

  return (
    <div className="u-hobbies">
      <motion.div
        ref={wrapRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto px-6 pb-16 md:pb-24 relative"
      >
        {/* opening screen: header + chapter 01's pinned instax deck */}
        <section aria-label="Current obsessions">
          <ObsessionDeck />
        </section>

        <div className="cut-line" />

        {/* chapter 02: the hobby box — an open cardboard box of hobbies
            (tabbable, so keyboard users land here after the instax deck) */}
        <section aria-label="The hobby box" tabIndex={0}>
          <Chapter no="02" title="what's in the box" />
          <HobbyBox />
        </section>

        <div className="cut-line" />

        {/* chapter 03: the corkboard — more about me, pinned up */}
        <section aria-label="Fun facts and aspirations" tabIndex={0}>
          <Chapter no="03" title="pinned to the board" />
          <CorkBoard />
        </section>
      </motion.div>

      <CraftFooter />
    </div>
  );
}
