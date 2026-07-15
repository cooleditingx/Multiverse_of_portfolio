import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PaperTexture } from '@paper-design/shaders-react';
import { click } from '../lib/sfx';
import { usePageTitle, useJsonLd } from '../lib/hooks';
import { SITE_URL } from '../lib/site';

/* [PLACEHOLDER: real article/post content] */
const ISSUES = [
  {
    id: 'issue-1',
    no: '01',
    title: 'Why Being "Late" Is a Myth',
    kicker: 'ON TIMELINES',
    blurb: 'A 22-year-old pre-fresher argues with the concept of schedules.',
    spineBg: '#d9a441',
    spineInk: '#221c15',
    h: 0.93,
    w: 0.9,
    tilt: -2.2,
    gap: 0,
    body: `[PLACEHOLDER: real article body]\n\nEveryone I know is somewhere I'm not. That used to feel like a verdict. Then I started thinking about it the way the universe does — where a few years is less than a rounding error, and "late" is just a word we invented to feel bad at brunch.\n\nThis is where the real essay goes. It should be personal, a little funny, and end with something that sounds wise but was written at 2am.`,
  },
  {
    id: 'issue-2',
    no: '02',
    title: 'Everything Is Made of Atoms, Including Excuses',
    kicker: 'ON CURIOSITY',
    blurb: 'A field guide to having too many interests at once.',
    spineBg: '#0d6e63',
    spineInk: '#f5efe2',
    h: 0.7,
    w: 0.68,
    tilt: 0.6,
    gap: 12,
    body: `[PLACEHOLDER: real article body]\n\nDraft thoughts about why picking "one thing" always felt like amputation, and how a multiverse portfolio became the honest answer.`,
  },
  {
    id: 'issue-3',
    no: '03',
    title: 'The Gap Year That Refused to End',
    kicker: 'ON WAITING',
    blurb: 'Saving up, showing up, and what happens in between.',
    spineBg: '#f5efe2',
    spineInk: '#221c15',
    h: 1,
    w: 1.1,
    tilt: 2.4,
    gap: 6,
    body: `[PLACEHOLDER: real article body]\n\nNotes on the unglamorous middle bit of every origin story — the part montages skip.`,
  },
  {
    id: 'issue-4',
    no: '04',
    title: 'Field Notes From the Editing Bay',
    kicker: 'ON MAKING',
    blurb: 'What cutting video taught me about cutting everything else.',
    spineBg: '#b0532f',
    spineInk: '#f5efe2',
    h: 0.78,
    w: 0.75,
    tilt: -1.4,
    gap: 30,
    body: `[PLACEHOLDER: real article body]\n\nEvery good edit is a small act of mercy toward the audience. So is every good sentence.`,
  },
  {
    id: 'issue-5',
    no: '05',
    title: 'Coffee Is a Unit of Time',
    kicker: 'ON FUEL',
    blurb: 'An investigation into productivity’s favorite bean.',
    spineBg: '#2c4a63',
    spineInk: '#f5efe2',
    h: 0.88,
    w: 1,
    tilt: 0,
    gap: 24,
    face: true, // shelved cover-out, like the ref's centerpiece book
    body: `[PLACEHOLDER: real article body]\n\nA day doesn't have hours, it has cups. Notes on measuring work in caffeine half-lives.`,
  },
  {
    id: 'issue-6',
    no: '06',
    title: 'Small Talk With the Night Sky',
    kicker: 'ON STARGAZING',
    blurb: 'Notes from a rooftop, one satellite at a time.',
    spineBg: '#8c3f4d',
    spineInk: '#f5efe2',
    h: 0.9,
    w: 0.55,
    tilt: -6.5, // the one dramatically leaning thin book from the ref
    gap: 10,
    body: `[PLACEHOLDER: real article body]\n\nWhat you actually think about while looking up, and why none of it fits in a caption.`,
  },
  {
    id: 'issue-7',
    no: '07',
    title: 'How to Collect Hobbies Without Drowning',
    kicker: 'ON PLENTY',
    blurb: 'A storage system for enthusiasms.',
    spineBg: '#556b4f',
    spineInk: '#f5efe2',
    h: 0.66,
    w: 1,
    tilt: -2.6,
    gap: 16,
    body: `[PLACEHOLDER: real article body]\n\nShelving strategies for interests that multiply faster than free time does.`,
  },
  {
    id: 'issue-8',
    no: '08',
    title: 'Letters to My Future Employers',
    kicker: 'ON BECOMING',
    blurb: 'Half cover letter, half confession.',
    spineBg: '#1f2933',
    spineInk: '#d9a441',
    h: 0.84,
    w: 0.8,
    tilt: 1.6,
    gap: 36,
    body: `[PLACEHOLDER: real article body]\n\nDear whoever is reading this: here is everything a resume format wouldn't let me say.`,
  },
];

/* JSON-LD: the shelf as a Blog, one BlogPosting per issue, built from ISSUES
   so it can never drift from what's on the shelf */
const BLOG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': `${SITE_URL}/curiosity-planet#blog`,
  url: `${SITE_URL}/curiosity-planet`,
  name: 'Curiosity Planet',
  description:
    "Dua Anas's magazine of essays on timelines, curiosity, coffee and making things.",
  author: { '@id': `${SITE_URL}/#person` },
  blogPost: ISSUES.map((issue) => ({
    '@type': 'BlogPosting',
    headline: issue.title,
    alternativeHeadline: issue.kicker,
    description: issue.blurb,
    url: `${SITE_URL}/curiosity-planet`,
    author: { '@id': `${SITE_URL}/#person` },
  })),
};

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const COPIES = REDUCED_MOTION ? 1 : 6; // duplicated copies make the loop seamless
const SPEED = 36; // idle marquee speed, px/s
const MAX_VEL = 6000; // manual fling speed cap, px/s
const FRICTION = 4.2; // glide decay rate, 1/s
const MIN_GLIDE = 30; // below this speed the glide hands off to the snap, px/s

const clampVel = (v) => Math.max(-MAX_VEL, Math.min(MAX_VEL, v));

export default function BlogPage() {
  usePageTitle(
    'Curiosity Planet — Multiverse of Portfolio',
    "Pull an issue off the shelf on Curiosity Planet — Dua Anas's magazine of essays on timelines, curiosity, coffee and making things. Start reading.",
    '/curiosity-planet'
  );
  useJsonLd(BLOG_JSON_LD);
  const [pulled, setPulled] = useState(null); // `${copy}:${issue.id}` of the book turned cover-out
  const [reading, setReading] = useState(null); // issue open in the article modal

  const trackRef = useRef(null);
  const offsetRef = useRef(0); // marquee translation, px
  const shiftRef = useRef(0); // extra shift so an opened cover stays on screen
  const shiftTargetRef = useRef(0);
  const periodRef = useRef(0); // width of one copy of the shelf
  const hoverRef = useRef(false);
  const pulledRef = useRef(null);
  const velRef = useRef(0); // manual scroll velocity, px/s
  const snapRef = useRef(false); // ease to the nearest book edge once the glide settles

  useEffect(() => {
    pulledRef.current = pulled;
  }, [pulled]);

  useEffect(() => {
    if (REDUCED_MOTION) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const track = trackRef.current;
      if (track) {
        // measure the loop period only while every book is shelved (open books widen the track)
        if (!pulledRef.current) periodRef.current = track.scrollWidth / COPIES;
        shiftRef.current += (shiftTargetRef.current - shiftRef.current) * Math.min(1, dt * 4.5);

        if (Math.abs(velRef.current) > MIN_GLIDE) {
          // manual glide: coast with friction
          offsetRef.current += velRef.current * dt;
          velRef.current *= Math.exp(-dt * FRICTION);
          wrapOffset();
        } else if (snapRef.current) {
          // glide settled: ease the nearest book edge flush with the screen edge
          velRef.current = 0;
          const unit = periodRef.current / ISSUES.length; // one book slot incl. gap
          if (unit > 0) {
            const target = Math.round(offsetRef.current / unit) * unit;
            offsetRef.current += (target - offsetRef.current) * Math.min(1, dt * 9);
            if (Math.abs(target - offsetRef.current) < 0.5) {
              offsetRef.current = target;
              snapRef.current = false;
            }
          } else {
            snapRef.current = false;
          }
        } else if (!pulledRef.current && !hoverRef.current && !dragRef.current.active) {
          offsetRef.current -= SPEED * dt;
          wrapOffset();
        }
        track.style.transform = `translate3d(${offsetRef.current + shiftRef.current}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const wrapOffset = () => {
    const period = periodRef.current;
    if (period > 0) {
      while (offsetRef.current <= -period) offsetRef.current += period;
      while (offsetRef.current > 0) offsetRef.current -= period;
    }
  };

  // fold the reveal shift into the loop offset so the marquee resumes seamlessly
  const shelveBook = () => {
    offsetRef.current += shiftRef.current;
    shiftRef.current = 0;
    shiftTargetRef.current = 0;
    wrapOffset();
    setPulled(null);
  };

  const dragRef = useRef({ active: false, lastX: 0, lastT: 0, moved: 0, vel: 0 });
  const suppressClickRef = useRef(false);

  // article modal focus management: the shelf behind goes inert, focus moves
  // to the close button, and Tab pages through the article before wrapping
  const scrollBoxRef = useRef(null); // the modal's scroll container
  const closeRef = useRef(null);
  const lastFocusRef = useRef(null); // the book that opened the article

  useEffect(() => {
    if (reading) {
      lastFocusRef.current = document.activeElement;
      closeRef.current?.focus();
    } else if (lastFocusRef.current) {
      lastFocusRef.current.focus?.();
      lastFocusRef.current = null;
    }
  }, [reading]);

  const onPointerDown = (e) => {
    if (REDUCED_MOTION) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // catch the shelf: stop any glide or pending snap
    velRef.current = 0;
    snapRef.current = false;
    dragRef.current = { active: true, lastX: e.clientX, lastT: performance.now(), moved: 0, vel: 0 };
  };
  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const now = performance.now();
    const dx = e.clientX - drag.lastX;
    const dtMs = Math.max(now - drag.lastT, 1);
    drag.lastX = e.clientX;
    drag.lastT = now;
    drag.moved += Math.abs(dx);
    if (drag.moved > 8) {
      // real drag: capture the pointer and suppress the click on release
      e.currentTarget.setPointerCapture?.(e.pointerId);
      suppressClickRef.current = true;
      if (pulledRef.current) shelveBook();
      offsetRef.current += dx;
      wrapOffset();
      drag.vel = 0.8 * drag.vel + 0.2 * ((dx / dtMs) * 1000); // smoothed flick velocity
    }
  };
  const onPointerUp = () => {
    const drag = dragRef.current;
    if (drag.active && drag.moved > 8) {
      velRef.current = clampVel(drag.vel); // release into a glide, then snap
      snapRef.current = true;
    }
    drag.active = false;
  };
  const onClickCapture = (e) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onWheel = (e) => {
    if (REDUCED_MOTION) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    if (pulledRef.current) shelveBook();
    velRef.current = clampVel(velRef.current - d * 12);
    snapRef.current = true;
  };

  const toggleBook = (e, key) => {
    click();
    if (pulled === key) {
      shelveBook();
      return;
    }
    // slide the shelf left if the opened cover would run off the right edge
    const book = e.currentTarget.parentElement;
    const spineRect = e.currentTarget.getBoundingClientRect();
    const coverRight = spineRect.right + book.offsetHeight * 0.74;
    const overshoot = coverRight - (document.documentElement.clientWidth - 24);
    shiftTargetRef.current = overshoot > 0 ? shiftRef.current - overshoot : shiftRef.current;
    setPulled(key);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (reading) setReading(null);
        else if (pulled) shelveBook();
        return;
      }
      // while an article is open, Tab never leaves the modal: it pages the
      // article a screen at a time, then lands on the close button, then wraps
      if (e.key === 'Tab' && reading) {
        e.preventDefault();
        const box = scrollBoxRef.current;
        const close = closeRef.current;
        if (!box) return;
        const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 8;
        if (e.shiftKey) {
          if (box.scrollTop > 8) box.scrollBy({ top: -box.clientHeight * 0.8, behavior: 'smooth' });
          else close?.focus();
        } else if (!atBottom) {
          box.scrollBy({ top: box.clientHeight * 0.8, behavior: 'smooth' });
        } else if (document.activeElement !== close) {
          close?.focus();
        } else {
          box.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="u-blog min-h-screen flex flex-col overflow-x-hidden">
      {/* paper-texture backdrop, inked in the page's teal so everything else reads as before */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <PaperTexture
          style={{ width: '100%', height: '100%' }}
          colorBack="#fff"
          colorFront="#b49c6d"
          contrast={0.3}
          roughness={0.59}
          fiber={0}
          fiberSize={0.2}
          crumples={0}
          crumpleSize={0}
          folds={0}
          foldCount={0}
          drops={0}
          seed={181}
          scale={2.64}
          fit="cover"
        />
      </div>
      {/* everything behind the article goes inert while one is open, so the
          shelved books can't be tabbed to or clicked through the overlay */}
      <div inert={!!reading} className="flex-1 flex flex-col">
      <h1 className="font-LinBiolinum_aUB.ttf font-black text-4xl md:text-6xl text-center px-6 pt-12 md:pt-16">
        Curiosity Planet
      </h1>

      <div className="flex-1 flex flex-col justify-center pb-10 md:pb-14">
        <div
          className="bookshelf-scroll"
          onPointerEnter={() => (hoverRef.current = true)}
          onPointerLeave={() => (hoverRef.current = false)}
          onFocus={() => (hoverRef.current = true)}
          onBlur={() => (hoverRef.current = false)}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
        >
          <div
            ref={trackRef}
            className={`bookshelf ${pulled ? 'bookshelf--has-open' : ''}`}
          >
            {Array.from({ length: COPIES }, (_, copy) => (
              <div className="bookshelf-copy" key={copy} aria-hidden={copy > 0}>
                {ISSUES.map((issue) => {
                  const key = `${copy}:${issue.id}`;
                  const isPulled = pulled === key;
                  return (
                    <div
                      key={key}
                      className={`book ${issue.face ? 'book--face' : ''} ${isPulled ? 'book--open' : ''}`}
                      style={{
                        '--tilt': `${issue.tilt}deg`,
                        '--gap': `${issue.gap}px`,
                        '--h': issue.h,
                        '--w': issue.w,
                        '--spine-bg': issue.spineBg,
                        '--spine-ink': issue.spineInk,
                      }}
                    >
                      {issue.face ? (
                        <button
                          className="book-front"
                          style={{ '--spine-bg': issue.spineBg, '--spine-ink': issue.spineInk }}
                          tabIndex={copy > 0 ? -1 : 0}
                          aria-label={`Read issue ${issue.no}: ${issue.title}`}
                          onClick={() => {
                            click();
                            setReading(issue);
                          }}
                        >
                          <span className="font-mono text-[9px] tracking-[0.25em] opacity-80">
                            CURIOSITY · Nº {issue.no}
                          </span>
                          <span className="book-front-frame">
                            <span className="font-mono text-[9px] tracking-[0.25em] opacity-70">
                              {issue.kicker}
                            </span>
                            <span className="font-serif font-bold text-xl md:text-2xl leading-snug">
                              {issue.title}
                            </span>
                          </span>
                          <span className="font-mono text-[9px] tracking-[0.2em] opacity-60">
                            CLICK TO READ →
                          </span>
                        </button>
                      ) : (
                      <><button
                        className="book-spine"
                        style={{ '--spine-bg': issue.spineBg, '--spine-ink': issue.spineInk }}
                        tabIndex={copy > 0 ? -1 : 0}
                        aria-expanded={isPulled}
                        aria-label={
                          isPulled
                            ? `Put back issue ${issue.no}: ${issue.title}`
                            : `Pull out issue ${issue.no}: ${issue.title}`
                        }
                        onClick={(e) => toggleBook(e, key)}
                      >
                        <span className="font-mono text-[9px] tracking-[0.2em]">Nº {issue.no}</span>
                        <span className="book-spine-title font-serif font-bold">{issue.title}</span>
                        <span className="book-spine-mark" />
                      </button>

                      <button
                        className="book-cover p-6 md:p-8 text-left flex flex-col"
                        tabIndex={isPulled && copy === 0 ? 0 : -1}
                        aria-hidden={!isPulled}
                        aria-label={`Read issue ${issue.no}: ${issue.title}`}
                        onClick={() => {
                          click();
                          setReading(issue);
                        }}
                      >
                        <div className="flex items-baseline justify-between border-b-2 border-current pb-2 mb-3">
                          <span className="font-serif font-black text-sm tracking-tight">CURIOSITY</span>
                          <span className="font-mono text-[10px]">Nº {issue.no}</span>
                        </div>
                        <span className="font-mono text-[10px] tracking-[0.25em] opacity-70 mb-2">
                          {issue.kicker}
                        </span>
                        <span className="font-serif font-bold text-2xl md:text-3xl leading-snug flex-1">
                          {issue.title}
                        </span>
                        <span className="text-sm opacity-70 mt-3">{issue.blurb}</span>
                        <span className="font-mono text-[10px] tracking-[0.2em] mt-4 opacity-60">
                          CLICK TO READ →
                        </span>
                      </button></>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="shelf-board" aria-hidden="true" />
      </div>
      </div>

      <AnimatePresence>
        {reading && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 z-[110]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReading(null)}
            />
            <div
              ref={scrollBoxRef}
              className="fixed inset-0 z-[120] overflow-y-auto p-4 md:p-10 pointer-events-none grid place-items-start justify-center"
            >
              <motion.article
                className="mag-article pointer-events-auto w-[min(720px,94vw)] rounded-sm p-8 md:p-12 my-6"
                initial={{ opacity: 0, y: 48, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 32, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                role="dialog"
                aria-modal="true"
                aria-label={reading.title}
              >
                <div className="flex items-baseline justify-between border-b-2 border-[#221c15] pb-3 mb-8">
                  <span className="font-serif font-black tracking-tight">CURIOSITY · Nº {reading.no}</span>
                  <button
                    ref={closeRef}
                    onClick={() => setReading(null)}
                    aria-label="Close article"
                    className="text-2xl leading-none opacity-50 hover:opacity-100 focus-visible:opacity-100"
                  >
                    ×
                  </button>
                </div>
                <p className="font-mono text-[11px] tracking-[0.3em] text-[var(--mag-gold)] mb-3">
                  {reading.kicker}
                </p>
                <h2 className="font-serif font-black text-3xl md:text-4xl leading-tight mb-8">
                  {reading.title}
                </h2>
                {reading.body.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className={`text-[15px] md:text-base leading-relaxed mb-5 ${i === 0 ? 'drop-cap' : ''}`}
                  >
                    {para}
                  </p>
                ))}
                <p className="font-serif italic text-sm opacity-60 mt-10">
                  — filed from the Curiosity Planet, printing costs paid in coffee
                </p>
              </motion.article>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
