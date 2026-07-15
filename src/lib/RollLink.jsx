/**
 * Rolling-letter link: on hover each letter slides up and its clone rises
 * from below, staggered left-to-right (see .roll-link styles in index.css).
 * Shared by the Hub footer and the side menu.
 */
export default function RollLink({ href, onClick, className = '', children }) {
  const text = String(children);
  return (
    <a href={href} onClick={onClick} className={`roll-link ${className}`}>
      <span className="roll-inner" aria-hidden="true">
        {text.split('').map((ch, i) => (
          <span key={i} className="roll-ch" style={{ transitionDelay: `${i * 20}ms` }}>
            <span>{ch === ' ' ? ' ' : ch}</span>
            <span>{ch === ' ' ? ' ' : ch}</span>
          </span>
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </a>
  );
}
