import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../lib/hooks';
import CrtShell from './CrtShell';

const BOOT_LINES = [
  'INITIALIZING MULTIVERSE OS v2.2 ...',
  'CALIBRATING TIMELINE BRANCHES ...',
  'SPINNING UP UNIVERSE SHARDS [tech, video, hobbies, print] ...',
  'RECONSTRUCTING OWNER FROM ~7,000,000,000,000,000,000,000,000,000 ATOMS ...',
  'WARMING TIME-MACHINE COILS ...',
];

const FLAT = BOOT_LINES.join('\n');
const TOTAL_CHARS = FLAT.length;
const BAR_CELLS = 14;

/**
 * CRT boot loader. Boot text is typed character-by-character onto the
 * fisheye-curved "monitor"; progress is tied to typing plus real
 * readiness (document fonts) — it holds at 92% until fonts resolve,
 * then completes. Reduced motion skips the typing and distortion churn.
 */
export default function LoadingScreen({ onDone }) {
  const [typed, setTyped] = useState(0);
  const [progress, setProgress] = useState(0);
  const reduced = usePrefersReducedMotion();
  const typedRef = useRef(0);
  const doneRef = useRef(false);

  // typewriter
  useEffect(() => {
    if (reduced) {
      typedRef.current = TOTAL_CHARS;
      setTyped(TOTAL_CHARS);
      return;
    }
    let timer = 0;
    let cancelled = false;
    const type = () => {
      if (cancelled) return;
      const i = typedRef.current + 1;
      typedRef.current = i;
      setTyped(i);
      if (i >= TOTAL_CHARS) return;
      // breathe at line breaks, jitter per keystroke like a real teletype
      const delay = FLAT[i - 1] === '\n' ? 150 : 4 + Math.random() * 14;
      timer = setTimeout(type, delay);
    };
    timer = setTimeout(type, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reduced]);

  // progress: 90% follows typing, last 10% waits on real font readiness
  useEffect(() => {
    let fontsReady = false;
    document.fonts?.ready.then(() => { fontsReady = true; });
    let holdTimer = 0;
    const id = setInterval(() => {
      const ratio = typedRef.current / TOTAL_CHARS;
      let target = ratio * 0.9 + (fontsReady ? 0.1 : 0);
      if (!fontsReady) target = Math.min(target, 0.92);
      setProgress((p) => {
        const next = Math.min(target, p + 0.05);
        if (next >= 0.999 && !doneRef.current) {
          doneRef.current = true;
          clearInterval(id);
          holdTimer = setTimeout(onDone, 450);
        }
        return next;
      });
    }, 60);
    return () => {
      clearInterval(id);
      clearTimeout(holdTimer);
    };
  }, [onDone]);

  const shownLines = FLAT.slice(0, typed).split('\n');
  const typingDone = typed >= TOTAL_CHARS;
  const filled = Math.round(progress * BAR_CELLS);
  const bar = '■'.repeat(filled) + '□'.repeat(BAR_CELLS - filled);

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#010103] overflow-hidden"
      role="status"
      aria-label={`Loading, ${Math.round(progress * 100)} percent`}
    >
      <CrtShell powerOn contentClassName="flex items-center justify-center">
        <div className="w-[min(640px,82vw)] font-mono text-sm md:text-base text-[var(--cyan)] crt-flicker relative">
          {BOOT_LINES.map((_, i) => (
            <p key={i} className="term-line term-jitter crt-phosphor mb-2 opacity-90 min-h-[1.5em]">
              {shownLines[i] !== undefined && (
                <>
                  <span className="text-[var(--violet)]">&gt;</span> {shownLines[i]}
                  {!typingDone && i === shownLines.length - 1 && (
                    <span className="block-cursor ml-1" />
                  )}
                </>
              )}
            </p>
          ))}
          <p className="term-line crt-phosphor mt-6 text-[var(--ink)]">
            LOADING ATOMS [{bar}] {String(Math.round(progress * 100)).padStart(2, '0')}%
            {typingDone && <span className="block-cursor ml-2 text-[var(--cyan)]" />}
          </p>
        </div>
      </CrtShell>
    </div>
  );
}
