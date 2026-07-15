import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../lib/hooks';
import { glitchStatic } from '../lib/sfx';
import CrtShell from './CrtShell';

const WORD = 'PORTFOLIO';

/* Loki-opening-style identity shifting: each letter hard-cuts between
   unrelated typefaces. Web fonts already loaded by index.html, padded
   out with classic system faces. */
const FACES = [
  { ff: '"Space Grotesk", sans-serif', fw: 700 },
  { ff: '"Playfair Display", Georgia, serif', fw: 900 },
  { ff: '"Playfair Display", Georgia, serif', fw: 500, italic: true },
  { ff: '"Space Mono", monospace', fw: 700 },
  { ff: '"Inter", sans-serif', fw: 400 },
  { ff: 'Georgia, serif', fw: 400, italic: true },
  { ff: '"Courier New", Courier, monospace', fw: 700 },
  { ff: 'Impact, "Arial Black", sans-serif', fw: 400 },
  { ff: '"Times New Roman", Times, serif', fw: 700 },
  { ff: '"Brush Script MT", "Snell Roundhand", cursive', fw: 400 },
  { ff: 'Futura, "Century Gothic", "Trebuchet MS", sans-serif', fw: 500 },
];

function randGlyphStyle(prevFace = -1) {
  let face = Math.floor(Math.random() * FACES.length);
  if (face === prevFace) face = (face + 1) % FACES.length;
  return {
    face,
    lower: Math.random() < 0.3,
    dy: Math.random() * 0.14 - 0.07, // em, baseline wobble
    scale: 0.9 + Math.random() * 0.22,
  };
}

/**
 * Loki-style title card on the same CRT monitor as the boot screen:
 * each letter of PORTFOLIO keeps morphing through mismatched typefaces,
 * cases and baselines until the user explores. Reduced motion renders
 * a static title.
 */
export default function TitleCard({ onExplore, ignited }) {
  const reduced = usePrefersReducedMotion();
  const [glyphs, setGlyphs] = useState(() => WORD.split('').map(() => randGlyphStyle()));

  useEffect(() => {
    if (reduced) return;
    glitchStatic();
    const cancels = WORD.split('').map((_, i) => {
      let t = 0;
      const swap = () => {
        setGlyphs((g) => {
          const next = [...g];
          next[i] = randGlyphStyle(g[i].face);
          return next;
        });
        t = setTimeout(swap, 300 + Math.random() * 1300);
      };
      t = setTimeout(swap, 200 + Math.random() * 900);
      return () => clearTimeout(t);
    });
    return () => cancels.forEach((fn) => fn());
  }, [reduced]);

  return (
    <div className="fixed inset-0 z-[190] bg-[#010103] overflow-hidden">
      <CrtShell contentClassName="flex flex-col items-center justify-center gap-14 px-6">
        <h1
          className={`crt-phosphor crt-flicker text-center leading-none tracking-[-0.02em] text-[var(--ink)] text-[clamp(2.6rem,11vw,7.5rem)] ${
            ignited ? 'chroma-pulse' : ''
          }`}
          aria-label={WORD}
        >
          {WORD.split('').map((ch, i) => {
            const g = glyphs[i];
            const face = FACES[g.face];
            return (
              <span
                key={i}
                aria-hidden="true"
                className="inline-block"
                style={
                  reduced
                    ? { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }
                    : {
                        fontFamily: face.ff,
                        fontWeight: face.fw,
                        fontStyle: face.italic ? 'italic' : 'normal',
                        transform: `translateY(${g.dy}em) scale(${g.scale})`,
                      }
                }
              >
                {g.lower && !reduced ? ch.toLowerCase() : ch}
              </span>
            );
          })}
        </h1>

        <button className="btn-explore text-sm md:text-base relative z-10" onClick={onExplore}>
          EXPLORE
        </button>
      </CrtShell>
    </div>
  );
}
