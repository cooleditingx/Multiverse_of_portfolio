import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../lib/hooks';

/**
 * THE page background: a single fixed (viewport-sticky) layer of slowly
 * moving white particles behind every hub section, each with a random
 * (small) size and its own slow drift direction, wrapping at the edges on
 * an endless loop. Content sits above it (the layer is z-0 and
 * pointer-events-none; the hub's <main> is relative z-10).
 */
const SIZE_MIN = 0.9;  // css px
const SIZE_MAX = 2.0;  // css px
const WHITE = '255,255,255';

function makeSprite(rgb) {
  const s = document.createElement('canvas');
  s.width = s.height = 32;
  const c = s.getContext('2d');
  const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgba(${rgb},1)`);
  g.addColorStop(0.3, `rgba(${rgb},0.55)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.fillRect(0, 0, 32, 32);
  return s;
}

export default function Starfield() {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let particles = [];
    const sprite = makeSprite(WHITE);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(0);
    }

    function seed() {
      const isSmall = window.innerWidth < 768;
      const density = isSmall ? 12 : 18; // particles per 10,000 px²
      const n = Math.floor((window.innerWidth * window.innerHeight) / 10000 * density);
      particles = [];
      for (let i = 0; i < n; i++) {
        const speed = 3 + Math.random() * 5;       // 3–8 px/s, slow
        const dir = Math.random() * Math.PI * 2;   // each its own direction
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: Math.cos(dir) * speed,
          vy: Math.sin(dir) * speed,
          tw: Math.random() * Math.PI * 2,
          size: SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN),
        });
      }
    }

    let lastT = 0;
    function draw(t) {
      const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0;
      lastT = t;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const M = 16; // wrap margin so particles never pop at the edges
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const d = p.size * 3; // sprite draw size incl. glow halo
        if (!reduced) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x > w + M) p.x = -M;
          if (p.x < -M) p.x = w + M;
          if (p.y > h + M) p.y = -M;
          if (p.y < -M) p.y = h + M;
        }
        const twinkle = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(p.tw + t * 0.001);
        ctx.globalAlpha = 0.55 * twinkle;
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    if (!reduced) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
