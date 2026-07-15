import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { whoosh } from '../lib/sfx';
import { usePrefersReducedMotion } from '../lib/hooks';

/**
 * Hyperdrive page transitions. `useWarp()` returns `warpTo(route)`: a
 * full-screen canvas of stars accelerates into radial light-streaks
 * (hyperspace jump), the route swaps behind the flash at peak speed, then
 * the tunnel decelerates and fades to reveal the new page. The overlay
 * blocks input while in flight; reduced motion navigates instantly.
 *
 * Star trick: points live in a unit cube with depth z; each frame z shrinks
 * and the point is projected twice (current z and a trailing z) — the line
 * between the projections is the streak, so tails stretch naturally with
 * speed and perspective.
 */

const T_IN = 0.85;   // accelerate (s) — navigate fires at the end of this
const T_OUT = 0.75;  // decelerate + fade
const FADE_IN = 0.18;
const FADE_OUT = 0.45;
const N_STARS = 1100;
const COLORS = ['#e8e6f0', '#e8e6f0', '#e8e6f0', '#8b5cf6', '#4ce0d2'];

const WarpContext = createContext(() => {});
export const useWarp = () => useContext(WarpContext);

const easeInCubic = (t) => t * t * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function WarpProvider({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduced = usePrefersReducedMotion();
  const [route, setRoute] = useState(null); // non-null → overlay mounted
  const canvasRef = useRef(null);
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const warpTo = useCallback(
    (to) => {
      if (to === pathRef.current) return;
      if (reduced) {
        navigate(to);
        return;
      }
      setRoute((r) => r ?? to); // ignore clicks while already in flight
    },
    [navigate, reduced]
  );

  useEffect(() => {
    if (!route) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    whoosh();

    canvas.style.opacity = '0'; // set imperatively — a React re-render on
    // route change must not reset it mid-flight (so no style prop below)
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = W / 2;
    const cy = H / 2;
    const scale = Math.max(W, H) * 0.5;

    const stars = Array.from({ length: N_STARS }, () => ({
      x: (Math.random() * 2 - 1) * 1.2,
      y: (Math.random() * 2 - 1) * 1.2,
      z: 0.08 + Math.random() * 0.92,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    }));

    let raf = 0;
    let start = 0;
    let navigated = false;

    const frame = (now) => {
      if (!start) start = now;
      const t = (now - start) / 1000;

      // speed curve: ramp up, jump, ramp down
      let speed;
      if (t < T_IN) {
        speed = easeInCubic(t / T_IN);
      } else {
        if (!navigated) {
          navigated = true;
          navigate(route);
        }
        speed = 1 - easeOutCubic(Math.min((t - T_IN) / T_OUT, 1));
      }

      // overlay opacity: quick fade in, hold, fade out at the tail
      let alpha = Math.min(t / FADE_IN, 1);
      const tEnd = T_IN + T_OUT;
      if (t > tEnd - FADE_OUT) alpha = Math.max((tEnd - t) / FADE_OUT, 0);
      canvas.style.opacity = alpha;

      ctx.fillStyle = '#010103';
      ctx.fillRect(0, 0, W, H);
      ctx.lineCap = 'round';

      const dz = speed * 0.9 * (1 / 60);
      const tail = 0.02 + speed * 0.22; // streak length in depth units
      for (const s of stars) {
        s.z -= dz * s.z * 3.5 + dz * 0.15;
        if (s.z <= 0.02) {
          s.x = (Math.random() * 2 - 1) * 1.2;
          s.y = (Math.random() * 2 - 1) * 1.2;
          s.z = 1;
        }
        const z2 = Math.min(s.z + tail * s.z, 1.4);
        const px = cx + (s.x / s.z) * scale;
        const py = cy + (s.y / s.z) * scale;
        const qx = cx + (s.x / z2) * scale;
        const qy = cy + (s.y / z2) * scale;
        const near = 1 - s.z / 1.4;
        ctx.strokeStyle = s.c;
        ctx.globalAlpha = 0.25 + 0.75 * near;
        ctx.lineWidth = 0.4 + near * 2.2;
        ctx.beginPath();
        ctx.moveTo(qx, qy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (t < tEnd) {
        raf = requestAnimationFrame(frame);
      } else {
        setRoute(null);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  return (
    <WarpContext.Provider value={warpTo}>
      {children}
      {route && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="fixed inset-0 z-[250] w-full h-full"
        />
      )}
    </WarpContext.Provider>
  );
}
