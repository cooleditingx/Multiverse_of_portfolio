import { motion } from 'framer-motion';
import { useWarp } from '../nav/WarpDrive';
import { click } from '../lib/sfx';

/**
 * Mobile universe picker: the orb's drag-to-spin + tiny labels don't work
 * on touch, so phones get three big tappable cards instead — one per
 * universe, each wearing its destination's colors.
 */
const UNIVERSES = [
  {
    label: 'TECH PROJECTS',
    kicker: 'UNIVERSE 01 · CRT TERMINAL',
    route: '/tech',
    accent: 'var(--crt-green)',
    tint: 'rgba(57, 255, 136, 0.06)',
  },
  {
    label: 'HOBBIES',
    kicker: 'UNIVERSE 02 · PAPER SCRAPBOOK',
    route: '/hobbies',
    accent: 'var(--craft-yellow, #f4c945)',
    tint: 'rgba(244, 201, 69, 0.07)',
  },
  {
    label: 'CURIOSITY PLANET',
    kicker: 'UNIVERSE 03 · THE BOOKSHELF',
    route: '/curiosity-planet',
    accent: 'var(--mag-gold)',
    tint: 'rgba(217, 164, 65, 0.07)',
  },
];

export default function UniverseCards() {
  const warpTo = useWarp();
  return (
    <div className="flex flex-col gap-4 w-full pt-8 pb-4">
      {UNIVERSES.map((u, i) => (
        <motion.button
          key={u.route}
          type="button"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            click();
            warpTo(u.route);
          }}
          className="w-full min-h-[88px] text-left px-5 py-4 flex items-center justify-between gap-4 border rounded-lg"
          style={{
            borderColor: `color-mix(in srgb, ${u.accent} 45%, transparent)`,
            background: u.tint,
          }}
        >
          <span className="flex flex-col gap-1.5">
            <span
              className="font-mono text-[10px] tracking-[0.3em]"
              style={{ color: u.accent }}
            >
              {u.kicker}
            </span>
            <span className="font-display text-2xl leading-none text-[var(--ink)]">
              {u.label}
            </span>
          </span>
          <span aria-hidden="true" className="text-xl shrink-0" style={{ color: u.accent }}>
            →
          </span>
        </motion.button>
      ))}
    </div>
  );
}
