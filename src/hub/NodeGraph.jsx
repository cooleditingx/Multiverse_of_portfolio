import { useEffect, useRef } from 'react';
import { useWarp } from '../nav/WarpDrive';
import { useSize, usePrefersReducedMotion } from '../lib/hooks';
import { blip, click } from '../lib/sfx';

/**
 * Star chart: a slowly rotating orb (sphere) of white nodes joined by thin
 * lines — pure canvas 2D with a hand-rolled 3D projection, no deps. Four of
 * the nodes are labeled navigation points that route to the universe pages;
 * the rest are ambience. Monochrome white, centered, no container box.
 *
 * Interaction: drag anywhere on the orb to spin it (horizontal = yaw,
 * vertical = tilt) with a little inertia on release; the idle auto-rotation
 * keeps going underneath. A short click (< ~6px of movement) on a labeled
 * node navigates. Touch: horizontal drags rotate, vertical drags still
 * scroll the page (touch-action: pan-y).
 */
const PAGES = [
  { label: 'TECH PROJECTS', route: '/tech' },
  // { label: 'VIDEO EDITING', route: '/video' },
  { label: 'HOBBIES', route: '/hobbies' },
  { label: 'CURIOSITY PLANET', route: '/curiosity-planet' },
];

const N = 110;            // total nodes on the sphere
const LINK_DIST = 0.62;   // chord distance (× radius) under which nodes link
const HIT_RADIUS = 22;    // px hit-test radius for nav nodes
const AUTO_SPEED = 0.22;  // rad/s idle rotation
const DRAG_SENS = 0.005;  // rad per px dragged

/** Evenly distribute N points on a unit sphere (Fibonacci lattice). */
function spherePoints(n) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return pts;
}

export default function NodeGraph() {
  const warpTo = useWarp();
  const [wrapRef, { width, height }] = useSize();
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!width) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // css square size: fill whatever the wrap gives us (the caption below
    // the canvas takes ~48px), bounded by the width on narrow screens
    const S = Math.max(320, Math.min(width, height ? height - 48 : 640));
    const R = S * 0.46;                  // orb radius (px) — margin for labels
    const PERSP = R * 3.2;               // perspective distance
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    canvas.style.width = `${S}px`;
    canvas.style.height = `${S}px`;
    canvas.style.touchAction = 'pan-y';  // horizontal drag spins, page still scrolls
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = spherePoints(N);
    // four well-separated nav nodes (quarters of the lattice, mid-latitudes)
    const navIdx = [
      Math.floor(N * 0.16),
      Math.floor(N * 0.38),
      Math.floor(N * 0.62),
      // Math.floor(N * 0.84),
    ];

    // precompute links between nearby lattice points
    const links = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = base[i][0] - base[j][0];
        const dy = base[i][1] - base[j][1];
        const dz = base[i][2] - base[j][2];
        if (Math.hypot(dx, dy, dz) < LINK_DIST) links.push([i, j]);
      }
    }

    let raf = 0;
    let loopOn = false;
    let lastT = 0;
    let rotY = 0.6;
    let tiltX = 0.35;
    let velY = 0;         // inertia after a drag (rad/s)
    let dragging = false;
    let moved = 0;        // px travelled during the current press
    let lastPX = 0, lastPY = 0, lastMoveT = 0;
    let hovered = -1;     // index into navIdx
    const mouse = { x: -1e4, y: -1e4 };
    // per-frame hit areas for the nav nodes: dot centre + label box,
    // so clicks/taps land on either (and never depend on mouse hover)
    const hits = PAGES.map(() => ({ x: 0, y: 0, lx: 0, ly: 0, lw: 0 }));

    const cx = S / 2;
    const cy = S / 2;

    function hitTest(px, py) {
      for (let k = 0; k < hits.length; k++) {
        const h = hits[k];
        if (Math.hypot(px - h.x, py - h.y) < HIT_RADIUS) return k;
        if (px >= h.lx - 8 && px <= h.lx + h.lw + 8 && py >= h.ly - 14 && py <= h.ly + 14) return k;
      }
      return -1;
    }

    function projectAll() {
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      return base.map(([x0, y0, z0]) => {
        // rotate around Y, then tilt around X
        const x1 = x0 * cosY + z0 * sinY;
        const z1 = -x0 * sinY + z0 * cosY;
        const y2 = y0 * cosX - z1 * sinX;
        const z2 = y0 * sinX + z1 * cosX;
        const s = PERSP / (PERSP - z2 * R);
        return {
          x: cx + x1 * R * s,
          y: cy + y2 * R * s,
          depth: (z2 + 1) / 2, // 0 back … 1 front
          s,
        };
      });
    }

    function render() {
      const P = projectAll();
      ctx.clearRect(0, 0, S, S);

      // links
      ctx.lineWidth = 1;
      for (const [i, j] of links) {
        const a = P[i], b = P[j];
        const alpha = 0.05 + 0.16 * ((a.depth + b.depth) / 2);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // ambient nodes
      for (let i = 0; i < N; i++) {
        if (navIdx.includes(i)) continue;
        const p = P[i];
        ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.6 * p.depth})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1 + p.depth * 1.4) * p.s, 0, Math.PI * 2);
        ctx.fill();
      }

      // nav nodes + labels — geometry pass first so the hit areas
      // (dot + label box) are current before hover/click testing
      ctx.font = '11px "Space Mono", monospace';
      const geo = navIdx.map((idx, k) => {
        const p = P[idx];
        // label pushed outward from the orb center; if it would run past
        // the canvas edge, flip it to the node's inner side instead
        const dx = p.x - cx, dy = p.y - cy;
        const len = Math.hypot(dx, dy) || 1;
        let lx = p.x + (dx / len) * 18;
        const ly = Math.min(S - 10, Math.max(10, p.y + (dy / len) * 18));
        const tw = ctx.measureText(PAGES[k].label).width;
        let align;
        if (dx < 0) {
          if (lx - tw < 6) { align = 'left'; lx = p.x + 18; }
          else align = 'right';
        } else {
          if (lx + tw > S - 6) { align = 'right'; lx = p.x - 18; }
          else align = 'left';
        }
        const h = hits[k];
        h.x = p.x;
        h.y = p.y;
        h.lx = align === 'left' ? lx : lx - tw;
        h.ly = ly;
        h.lw = tw;
        return { p, lx, ly, align };
      });

      hovered = dragging ? -1 : hitTest(mouse.x, mouse.y);

      geo.forEach(({ p, lx, ly, align }, k) => {
        const isHover = hovered === k;
        const a = 0.55 + 0.45 * p.depth;
        const r = (isHover ? 6 : 4.5) * p.s;

        // glow + dot + ring
        ctx.shadowColor = 'rgba(255,255,255,0.9)';
        ctx.shadowBlur = isHover ? 18 : 10;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = `${isHover ? '700 ' : ''}11px "Space Mono", monospace`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255,255,255,${isHover ? 1 : 0.45 + 0.45 * p.depth})`;
        ctx.fillText(PAGES[k].label, lx, ly);
      });

      canvas.style.cursor =
        hovered >= 0 ? 'pointer' : dragging ? 'grabbing' : 'grab';
    }

    function frame(t) {
      const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0;
      lastT = t;

      if (!dragging) {
        if (!reduced) rotY += dt * AUTO_SPEED;
        rotY += velY * dt;
        velY *= Math.pow(0.12, dt); // inertia decay
        if (Math.abs(velY) < 0.02) velY = 0;
      }

      render();

      // reduced motion: only animate while a drag or its inertia is live
      if (!reduced || dragging || velY !== 0) {
        raf = requestAnimationFrame(frame);
      } else {
        loopOn = false;
        lastT = 0;
      }
    }

    function ensureLoop() {
      if (!loopOn) {
        loopOn = true;
        lastT = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    function onPointerDown(e) {
      dragging = true;
      moved = 0;
      lastPX = e.clientX;
      lastPY = e.clientY;
      lastMoveT = performance.now();
      velY = 0;
      canvas.setPointerCapture?.(e.pointerId);
      ensureLoop();
    }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;

      if (dragging) {
        const dx = e.clientX - lastPX;
        const dy = e.clientY - lastPY;
        moved += Math.abs(dx) + Math.abs(dy);
        rotY += dx * DRAG_SENS;
        tiltX = Math.min(1.2, Math.max(-1.2, tiltX + dy * DRAG_SENS * 0.8));
        const now = performance.now();
        const dtm = Math.max((now - lastMoveT) / 1000, 0.008);
        velY = Math.min(3, Math.max(-3, (dx * DRAG_SENS) / dtm));
        lastMoveT = now;
        lastPX = e.clientX;
        lastPY = e.clientY;
      } else if (reduced && !loopOn) {
        render(); // refresh hover highlight without an anim loop
      }
      if (!dragging && hovered >= 0 && onPointerMove.lastHover !== hovered) blip();
      onPointerMove.lastHover = hovered;
    }

    function onPointerUp(e) {
      dragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
    }

    function onClick(e) {
      if (moved > 6) return; // it was a drag, not a click
      // hit-test the click position directly (not the hover state), so
      // taps work on touch screens where no pointermove ever fires
      const rect = canvas.getBoundingClientRect();
      const k = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (k >= 0) {
        click();
        warpTo(PAGES[k].route);
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('click', onClick);

    if (reduced) render();
    else ensureLoop();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('click', onClick);
    };
  }, [width, height, reduced, warpTo]);

  return (
    <div ref={wrapRef} className="h-full flex flex-col items-center justify-center">
      <canvas ref={canvasRef} aria-hidden="true" />
      <p className="mt-6 font-mono text-[10px] tracking-widest text-[var(--ink-dim)]">
        DRAG TO SPIN · CLICK A NODE TO TRAVEL
      </p>
      {/* keyboard-accessible fallback for the canvas orb */}
      <nav aria-label="Universe quick links" className="sr-only">
        {PAGES.map((pg) => (
          <a key={pg.route} href={pg.route}>{pg.label}</a>
        ))}
      </nav>
    </div>
  );
}
