import { Children, isValidElement } from 'react';
import { motion } from 'framer-motion';
import { useInViewOnce, usePrefersReducedMotion } from '../lib/hooks';

/**
 * Paragraph reveal: each word slides up out of its own overflow mask with a
 * small stagger when the paragraph scrolls into view (once). Accepts plain
 * strings and simple styled inline spans as children (e.g. the gold
 * "Dream Ladder" highlight); punctuation glued to a styled span (no space
 * between) stays attached to the same word so it animates as one unit.
 * Reduced motion renders a plain static paragraph.
 */

/** Flatten children into words; a word is a list of { text, className }. */
function splitRich(children) {
  const words = [];
  let open = false; // last word can still accept a no-space continuation
  const push = (chunk, className) => {
    if (!chunk) return;
    const startsWs = /^\s/.test(chunk);
    const parts = chunk.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      open = false; // whitespace-only chunk ends the current word
      return;
    }
    parts.forEach((text, i) => {
      if (i === 0 && !startsWs && open && words.length) {
        words[words.length - 1].push({ text, className });
      } else {
        words.push([{ text, className }]);
      }
    });
    open = !/\s$/.test(chunk);
  };
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      push(String(child), undefined);
    } else if (isValidElement(child)) {
      push(String(child.props.children), child.props.className);
    }
  });
  return words;
}

const wordVariants = {
  hidden: { y: '120%' },
  visible: {
    y: '0%',
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

// start: external gate — the reveal waits for it (and for the paragraph to
// scroll into view) before running, e.g. until a header animation finishes
export default function SlideUpText({ className = '', children, start = true }) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInViewOnce(0.4);
  if (reduced) return <p className={className}>{children}</p>;

  const words = splitRich(children);
  return (
    <motion.p
      ref={ref}
      className={className}
      initial="hidden"
      animate={start && inView ? 'visible' : 'hidden'}
      transition={{ staggerChildren: 0.018, delayChildren: 0.05 }}
    >
      {words.map((parts, i) => (
        // the mask: descender padding folded back with the negative margin
        // so clipping never shaves a g/y while the word is in flight
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]"
        >
          <motion.span className="inline-block will-change-transform" variants={wordVariants}>
            {parts.map((p, j) =>
              p.className ? (
                <span key={j} className={p.className}>{p.text}</span>
              ) : (
                p.text
              )
            )}
          </motion.span>
        </span>
      )).flatMap((el, i) => (i ? [' ', el] : [el]))}
    </motion.p>
  );
}
