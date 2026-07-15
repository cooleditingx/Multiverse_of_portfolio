import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../lib/hooks';

/**
 * Footer galaxy: a near-edge-on spiral disc of glowing particles, slowly
 * spinning (differential rotation — inner stars faster), with a soft core
 * and a few cross-flare sparkles. The whole thing tilts toward the cursor
 * like the reference: an orbit wrapper gets
 * `translate(..) perspective(900px) rotateX/rotateY`, the canvas a smaller
 * counter-tilt + scale, both eased every frame. Canvas 2D, no deps.
 * Reduced motion: one static render, no spin, no tilt.
 */

const N_STARS = 1600;
// screen squash of the disc is sin(TILT): 0 = pure edge-on line,
// PI/2 = face-on circle — keep it flat like the reference
const TILT = 0.34;
const COLORS = ['#dfe9ff', '#dfe9ff', '#bcd6ff', '#8b5cf6', '#4ce0d2'];

export default function GalaxyCanvas({ className = '' }) {
  const wrapRef = useRef(null);
  const orbitRef = useRef(null);
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    const orbit = orbitRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0;
    let H = 0;
    const resize = () => {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // two loose spiral arms blended into a filled disc, denser at the core
    const stars = [];
    for (let i = 0; i < N_STARS; i++) {
      const r = Math.pow(Math.random(), 0.72);
      const big = Math.random() < 0.05;
      let ang;
      if (i % 4 === 3) {
        ang = Math.random() * Math.PI * 2; // uniform disc fill
      } else {
        const arm = i % 2;
        const spread = (Math.random() - 0.5) * (0.85 - r * 0.4);
        ang = arm * Math.PI + r * 4.4 + spread * 3.2;
      }
      stars.push({
        r,
        ang,
        y: (Math.random() - 0.5) * 0.09 * (1 - r * 0.5),
        s: big ? 1.7 + Math.random() * 1.7 : 0.4 + Math.random() * 1.05,
        big,
        tw: Math.random() * Math.PI * 2,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      });
    }

    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);
    let raf = 0;
    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;

    const onMove = (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduced) window.addEventListener('pointermove', onMove);

    const draw = (time) => {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H * 0.44; // sit in the footer's empty middle
      // flat disc: vertical extent is only ~sin(TILT)·R, so R can run wide
      const R = Math.min(W * 0.36, H * 1.05);

      ctx.globalCompositeOperation = 'lighter';

      // core glow, squashed by the same tilt as the disc
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, Math.max(sinT, 0.22) + 0.08);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.4);
      g.addColorStop(0, 'rgba(223, 233, 255, 0.5)');
      g.addColorStop(0.35, 'rgba(139, 92, 246, 0.16)');
      g.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      for (const s of stars) {
        const a = s.ang + time * 0.05 * (1.7 - s.r); // differential rotation
        const x = Math.cos(a) * s.r;
        const z = Math.sin(a) * s.r;
        const y2 = s.y * cosT - z * sinT;
        const z2 = s.y * sinT + z * cosT;
        const p = 1 / (1 + z2 * 0.35); // mild depth perspective
        const px = cx + x * R * p;
        const py = cy + y2 * R * p;
        const twinkle = 0.55 + 0.45 * Math.sin(time * (0.8 + s.r * 2.2) + s.tw);
        const alpha = twinkle * (0.3 + 0.7 * Math.min(p, 1.2));
        const sz = s.s * p;

        // soft halo + hot core ('lighter' stacks them into a glow)
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(px, py, sz * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fill();

        if (s.big) {
          // 4-point flare on the bright ones
          ctx.globalAlpha = alpha * 0.5;
          ctx.strokeStyle = s.c;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(px - sz * 5, py);
          ctx.lineTo(px + sz * 5, py);
          ctx.moveTo(px, py - sz * 4);
          ctx.lineTo(px, py + sz * 4);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    const frame = (now) => {
      draw(now / 1000);
      // eased mouse tilt, applied like the reference DOM: orbit carries the
      // big perspective tilt + drift, the canvas a smaller one + scale
      rx += (-my * 7 - rx) * 0.06;
      ry += (mx * 7 - ry) * 0.06;
      orbit.style.transform =
        `translate(${(-ry * 1.4).toFixed(2)}px, ${(rx * 1.4).toFixed(2)}px) ` +
        `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      canvas.style.transform =
        `perspective(800px) rotateX(${(rx * 0.5).toFixed(2)}deg) ` +
        `rotateY(${(ry * 0.5).toFixed(2)}deg) scale(1.04)`;
      raf = requestAnimationFrame(frame);
    };

    if (reduced) {
      draw(0); // static galaxy
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <div ref={orbitRef} className="w-full h-full" style={{ willChange: 'transform' }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
    </div>
  );
}
