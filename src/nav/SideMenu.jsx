import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import { useWarp } from './WarpDrive';
import { click, unlockAudio } from '../lib/sfx';
import RollLink from '../lib/RollLink';

const LINKS = [
  { to: '/', label: 'Hub' },
  { to: '/tech', label: 'Tech Projects' },
  { to: '/hobbies', label: 'Hobbies' },
  { to: '/curiosity-planet', label: 'Curiosity Planet' },
];

const PANEL_IN = 0.8; // panel slide duration, matched to the reference video

export default function SideMenu() {
  const menuOpen = useStore((s) => s.menuOpen);
  const setMenuOpen = useStore((s) => s.setMenuOpen);
  const muted = useStore((s) => s.muted);
  const toggleMute = useStore((s) => s.toggleMute);
  const warpTo = useWarp();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, setMenuOpen]);

  return (
    <>
      <button
        aria-label="Open navigation menu"
        onClick={() => { unlockAudio(); click(); setMenuOpen(true); }}
        className="fixed z-[90] w-10 h-12 grid place-items-center tars-btn right-4 top-4 md:right-auto md:left-4 md:top-1/2 md:-translate-y-1/2"
      >
        {/* TARS in its leaning side pose; straightens up on hover */}
        <span className="tars-bot" aria-hidden="true">
          <span className="tars-seg" />
          <span className="tars-seg" />
          <span className="tars-seg" />
          <span className="tars-seg" />
        </span>
        {/* hover speech bubble — "MENU" with morse-style dot/dash strokes */}
        <span className="tars-bubble" aria-hidden="true">
          <svg viewBox="0 0 78 20" width="78" height="20">
            <text x="39" y="15.5" textAnchor="middle" className="tars-bubble-text">
              MENU
            </text>
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/60 z-[95]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          />
          <motion.nav
            key="panel"
            ref={panelRef}
            aria-label="Site navigation"
            className="fixed left-0 top-0 bottom-0 w-[92vw] md:w-[50vw] md:min-w-[340px] z-[100] bg-[#131313] border border-[#282b4a] flex flex-col overflow-hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: PANEL_IN, ease: [0.76, 0, 0.24, 1] }}
          >
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="absolute top-5 right-7 z-30 font-mono text-xs tracking-widest text-[#ece9e2]/70 hover:text-[#ece9e2] transition-colors"
            >
              CLOSE
            </button>

            <ul className="flex-1 flex flex-col justify-center items-start gap-[4vh] px-[2vw]">
              {LINKS.map(({ to, label }, i) => (
                <motion.li
                  key={to}
                  initial={{ y: '2em', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: PANEL_IN * 0.55 + i * 0.06,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <RollLink
                    href={to}
                    onClick={(e) => {
                      e.preventDefault(); // warp handles the route change
                      click();
                      setMenuOpen(false);
                      warpTo(to);
                    }}
                    className="menu-mega-link"
                  >
                    {label}
                  </RollLink>
                </motion.li>
              ))}
            </ul>

            <button
              onClick={() => { unlockAudio(); toggleMute(); }}
              aria-pressed={muted}
              className="absolute bottom-4 right-7 z-30 font-mono text-[10px] tracking-widest text-[#ece9e2]/50 hover:text-[#ece9e2] transition-colors"
            >
              {muted ? 'SOUND: OFF' : 'SOUND: ON'}
            </button>
          </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
  // { to: '/video', label: 'Video Editing' },
