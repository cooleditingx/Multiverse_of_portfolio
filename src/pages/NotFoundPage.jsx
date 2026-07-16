import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useWarp } from '../nav/WarpDrive';
import { usePrefersReducedMotion, usePageTitle } from '../lib/hooks';
import { click, glitchStatic } from '../lib/sfx';

/*
 * 404 — a glitch in the matrix. The route the visitor typed points at a
 * coordinate the simulation never rendered, so the page plays it as a
 * containment breach: digital rain leaking through the void, a terminal
 * that notices an unauthorized observer, and periodic reality tears.
 */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\|=+*#$%&@';
const randGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/* digital rain, recolored to the multiverse palette (violet, cyan, a rare
   phosphor-green column as the matrix nod) */
function MatrixRain({ reduced }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const FONT = 16;
    const COLORS = [
      'rgba(139, 92, 246, 0.85)',
      'rgba(139, 92, 246, 0.85)',
      'rgba(139, 92, 246, 0.85)',
      'rgba(76, 224, 210, 0.8)',
      'rgba(57, 255, 136, 0.7)',
    ];
    let W = 0;
    let H = 0;
    let drops = [];
    let colors = [];
    let raf = 0;
    let last = 0;

    const setup = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT}px "Space Mono", monospace`;
      const cols = Math.ceil(W / FONT);
      drops = Array.from({ length: cols }, () => Math.random() * (H / FONT));
      colors = Array.from({ length: cols }, () => COLORS[(Math.random() * COLORS.length) | 0]);
      ctx.fillStyle = '#08070f';
      ctx.fillRect(0, 0, W, H);
    };
    setup();

    if (reduced) {
      // a single still frame of sparse glyphs — no motion
      for (let i = 0; i < drops.length; i += 2) {
        ctx.fillStyle = colors[i];
        for (let n = 0; n < 4; n++) {
          ctx.fillText(randGlyph(), i * FONT, Math.random() * H);
        }
      }
      return;
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 55) return; // rain reads better at ~18fps
      last = now;
      ctx.fillStyle = 'rgba(8, 7, 15, 0.14)';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * FONT;
        ctx.fillStyle = Math.random() < 0.06 ? '#e8e6f0' : colors[i];
        ctx.fillText(randGlyph(), i * FONT, y);
        drops[i] = y > H && Math.random() > 0.975 ? 0 : drops[i] + 1;
      }
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => setup();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [reduced]);

  return <canvas ref={ref} className="nf-rain" aria-hidden="true" />;
}

/* headline resolves out of static, one character at a time */
function useScramble(text, reduced, delay = 400) {
  const [out, setOut] = useState(() => (reduced ? text : ''));
  useEffect(() => {
    if (reduced) {
      setOut(text);
      return;
    }
    let solved = 0;
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      if (tick * 40 < delay) return;
      if (tick % 2 === 0) solved++;
      setOut(
        text
          .split('')
          .map((ch, i) => (ch === ' ' ? ' ' : i < solved ? ch : randGlyph()))
          .join('')
      );
      if (solved >= text.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [text, reduced, delay]);
  return out;
}

export default function NotFoundPage() {
  usePageTitle(
    'Reality Not Found — Multiverse of Portfolio',
    'This page drifted off the star map. Jump back to the Multiverse of Portfolio hub and pick a universe — tech, hobbies or Curiosity Planet.'
  );
  const { pathname } = useLocation();
  const warpTo = useWarp();
  const reduced = usePrefersReducedMotion();
  const headline = useScramble('REALITY NOT FOUND', reduced);

  const lines = useMemo(
    () => [
      `> traceroute ${pathname}`,
      '> hop 1: known universe ............ ok',
      '> hop 2: ??????????? ............... signal lost',
      `> ERR_REALITY_NOT_FOUND — "${pathname}" was never rendered`,
      '> anomaly: unauthorized observer in an unfinished sector',
      '> the architect has been notified. act natural.',
    ],
    [pathname]
  );
  const [shown, setShown] = useState(() => (reduced ? lines.length : 0));
  useEffect(() => {
    if (reduced) {
      setShown(lines.length);
      return;
    }
    const id = setInterval(
      () => setShown((n) => (n >= lines.length ? (clearInterval(id), n) : n + 1)),
      520
    );
    return () => clearInterval(id);
  }, [lines, reduced]);

  // reality integrity decays to a floor, then twitches
  const [integrity, setIntegrity] = useState(98);
  useEffect(() => {
    const id = setInterval(() => {
      setIntegrity((v) =>
        v > 13
          ? Math.max(13, v - ((Math.random() * 7) | 0))
          : Math.min(17, 13 + ((Math.random() * 4) | 0))
      );
    }, 420);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = '404 — REALITY_NOT_FOUND';
    return () => {
      document.title = prev;
    };
  }, []);

  // red pill: one violent tear, then the simulation slams the door
  const [hard, setHard] = useState(false);
  const [sealed, setSealed] = useState(false);
  const goDeeper = () => {
    if (sealed) return;
    glitchStatic();
    setHard(true);
    setTimeout(() => setHard(false), 950);
    setTimeout(() => setSealed(true), 450);
  };
  const goHome = () => {
    click();
    warpTo('/');
  };

  return (
    <section
      className={`u-hub nf-wrap scanlines vignette ${hard ? 'nf-jolt-hard' : 'nf-jolt'}`}
    >
      <MatrixRain reduced={reduced} />
      <div className="nf-tear" aria-hidden="true" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        {/* status readout */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 font-mono text-[11px] tracking-[0.25em] uppercase text-[var(--ink-dim)]">
          <span>
            sector: <span className="text-[var(--cyan)]">{pathname}</span>
          </span>
          <span>signal: lost</span>
          <span>
            integrity:{' '}
            <span className={integrity < 20 ? 'text-[#ff3b6b]' : 'text-[var(--gold)]'}>
              {integrity}%
            </span>
          </span>
        </div>

        <h1 className="glitch-wrap font-mono font-bold leading-none crt-phosphor text-[clamp(6rem,24vw,15rem)]">
          <span>404</span>
          <span className="glitch-layer glitch-red" aria-hidden="true">404</span>
          <span className="glitch-layer glitch-cyan" aria-hidden="true">404</span>
          <span className="glitch-layer glitch-slice" aria-hidden="true">404</span>
        </h1>

        <p className="font-mono text-lg md:text-2xl tracking-[0.3em] text-[var(--ink)]" aria-label="reality not found">
          {headline || ' '}
        </p>

        <div className="nf-term w-full max-w-xl px-5 py-4 text-left" role="log">
          {lines.slice(0, shown).map((line, i) => (
            <p key={i} className="term-line text-xs md:text-sm leading-6 text-[var(--ink-dim)]">
              {line}
            </p>
          ))}
          {sealed && (
            <p className="term-line text-xs md:text-sm leading-6 text-[#ff3b6b]">
              {'> ACCESS DENIED — the rabbit hole is sealed for maintenance.'}
            </p>
          )}
          <p className="term-line text-xs md:text-sm leading-6 text-[var(--cyan)]">
            {'> '}
            <span className="block-cursor" />
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button type="button" className="btn-explore text-sm" onClick={goHome}>
            RETURN TO KNOWN UNIVERSE
          </button>
          <button
            type="button"
            className="btn-explore text-sm"
            style={{ '--terminal-cyan': '#ff3b6b' }}
            onClick={goDeeper}
            disabled={sealed}
          >
            {sealed ? 'SECTOR SEALED' : 'GO DEEPER'}
          </button>
        </div>

        <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--ink-dim)] opacity-60">
          you were not supposed to find this place.
        </p>
      </div>
    </section>
  );
}
