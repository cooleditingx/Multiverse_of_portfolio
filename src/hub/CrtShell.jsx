import { useEffect, useId, useState } from 'react';
import { usePrefersReducedMotion, useSize } from '../lib/hooks';

/**
 * Barrel-distortion displacement map for feDisplacementMap:
 * R encodes x-offset, G encodes y-offset, both scaled by r² so the
 * centre stays put and edges bow inward like curved CRT glass.
 * Built at exact viewport size so feImage never has to rescale it.
 */
function buildBarrelMap(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1) - 0.5;
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1) - 0.5;
      const r2 = (u * u + v * v) * 2; // 0 at centre → 1 at corners
      const i = (y * w + x) * 4;
      d[i] = 128 + u * r2 * 254;
      d[i + 1] = 128 + v * r2 * 254;
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/** Fisheye filter sized to the tube element. Safari ignores url() filters on HTML and falls back to a flat screen. */
function useBarrelFilter() {
  const [ref, size] = useSize();
  const [map, setMap] = useState(null);
  const w = Math.round(size.width);
  const h = Math.round(size.height);
  useEffect(() => {
    if (!w || !h) return;
    // small delay coalesces the ResizeObserver bursts during window resize
    const timer = setTimeout(() => setMap({ w, h, url: buildBarrelMap(w, h) }), 60);
    return () => clearTimeout(timer);
  }, [w, h]);
  return [ref, map];
}

/**
 * Full-viewport CRT monitor shell: a dark brushed-metal case with a
 * recessed opening holding the fisheye-warped tube layer (children
 * render on it, along with scanlines and an RGB grille), topped by
 * un-warped glass layers — retrace roll bar, glare, corner falloff.
 * `powerOn` plays the tube power-on flash once on mount.
 */
export default function CrtShell({ children, powerOn = false, contentClassName = '' }) {
  const [tubeRef, map] = useBarrelFilter();
  const reduced = usePrefersReducedMotion();
  const filterId = `crt-barrel-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className="crt-case absolute inset-0">
      <div className="crt-recess">
        <div
          ref={tubeRef}
          className={`absolute inset-[1.1vmin] rounded-[6.7vmin] overflow-hidden ${powerOn ? 'crt-turning-on' : ''}`}
        >
          {map && (
            <svg width="0" height="0" aria-hidden="true" className="absolute">
              <filter
                id={filterId}
                filterUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={map.w}
                height={map.h}
                colorInterpolationFilters="sRGB"
              >
                <feImage
                  href={map.url}
                  x="0"
                  y="0"
                  width={map.w}
                  height={map.h}
                  preserveAspectRatio="none"
                  result="map"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="map"
                  scale={Math.round(Math.min(map.w, map.h) * 0.11)}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </svg>
          )}

          {/* everything inside this layer is warped by the fisheye filter;
              its own rounding is what reads as the screen corner after the
              warp pulls the corners in past the wrapper's clip */}
          <div
            className={`absolute inset-0 rounded-[8vmin] overflow-hidden crt-tube scanlines ${contentClassName}`}
            style={{ filter: map && !reduced ? `url(#${filterId})` : 'none' }}
          >
            <div className="crt-grille absolute inset-0 pointer-events-none" />
            {children}
          </div>

          {/* glass-surface layers stay crisp above the warped tube,
              clipped to (roughly) the barrel silhouette so nothing
              spills past the curved screen edge into the bezel */}
          <div className="crt-glass-clip">
            <div className="crt-rollbar-track absolute inset-0">
              <div className="crt-rollbar" />
            </div>
            <div className="crt-glass absolute inset-0" />
          </div>
        </div>
      </div>

      {/* case furniture on the bottom bezel strip */}
      <div className="crt-case-label" aria-hidden="true">
        MULTIVERSE&ensp;·&ensp;MV-2200
      </div>
      <div className="crt-case-controls" aria-hidden="true">
        <span className="crt-knob" />
        <span className="crt-knob" />
        <span className="crt-led power-led" />
      </div>
    </div>
  );
}
