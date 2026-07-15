import { useEffect, useRef, useState } from 'react';
import { useInViewOnce, usePrefersReducedMotion } from '../lib/hooks';

/**
 * The site's signature device (used exactly three times on the hub: hero,
 * about, contact): a cloud of "atoms" slowly condenses into solid text.
 *
 * One-shot ~5s timeline:
 *   1. a dense field of glowing particles hangs scattered across the block
 *   2. each particle slowly drifts/swirls to its sampled glyph position
 *   3. as they lock in, a crisp white text raster fades IN while the
 *      particles shrink and fade OUT — they "become" the text
 *   4. when the crossfade ends the WebGL canvas is torn down completely and
 *      replaced by a plain image of the text: solid white, zero particles,
 *      zero per-frame cost
 *
 * The canvas is transparent, so the page-wide fixed particle background
 * (Starfield) keeps drifting behind and around the block the whole time —
 * ambient motion is Starfield's job, not this component's.
 *
 * Raw WebGL, no deps. The tween runs in the vertex shader; the solid text is
 * the same offscreen raster the particle targets were sampled from, drawn as
 * a textured quad — so the crossfade is pixel-aligned by construction.
 *
 * Reduced motion / no WebGL: the real copy (always in the DOM for screen
 * readers) is simply shown statically.
 */

// ---- timeline (seconds) ----
const SPEED = 1.25;            // playback rate; 1 = the original ~5s condense
const T_TEXT_IN = [3.4, 4.6];  // solid text fades in
const T_PART_OUT = [3.6, 4.9]; // particles fade out
const T_DONE = 5.0;            // swap to static image, free the GL context

const PARTICLE_VERT = `
attribute vec3 aStart;   // scattered start (css px, css px, depth 0..1)
attribute vec2 aTarget;  // glyph point (css px)
attribute vec4 aRand;    // delay, durFactor, phase(0..6.28), mix(0..1)

uniform float uTime;
uniform float uFade;     // 1 → 0 while particles dissolve into the text
uniform vec2  uRes;
uniform float uDpr;
uniform vec3  uColBase;
uniform vec3  uColA;
uniform vec3  uColB;

varying vec3  vColor;
varying float vAlpha;

float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  float delay = 0.2 + aRand.x * 1.0;
  float dur   = 1.7 + aRand.y * 1.3;
  float t     = clamp((uTime - delay) / dur, 0.0, 1.0);
  float e     = easeInOutCubic(t);

  // swirl the scattered start around the block center, decaying as it lands
  vec2 c  = uRes * 0.5;
  vec2 sp = aStart.xy - c;
  float ang = (aRand.w - 0.5) * 1.8 * (1.0 - e);
  float s = sin(ang), co = cos(ang);
  vec2 start = c + mat2(co, -s, s, co) * sp;

  vec2 pos = mix(start, aTarget, e);

  // gentle life while airborne; locks solid as the text takes over
  pos += vec2(
    sin(aTarget.y * 0.045 + uTime * 0.8 + aRand.z),
    cos(aTarget.x * 0.050 + uTime * 0.7 + aRand.z * 1.7)
  ) * 1.4 * (1.0 - e * 0.5) * uFade;

  // depth: far particles start smaller/dimmer, arrive at full presence
  float depth = mix(1.0 - aStart.z * 0.8, 1.0, e);

  // shrink into the glyph as the crossfade dissolves them
  gl_PointSize = (2.0 + aRand.w * 2.6) * depth * uDpr * (0.45 + 0.55 * uFade);

  float twinkle = 0.85 + 0.15 * sin(uTime * (1.3 + aRand.y * 1.5) + aRand.z * 4.0);
  vAlpha = (0.35 + 0.65 * e) * depth * twinkle * uFade;

  vColor = aRand.w < 0.80 ? uColBase : (aRand.w < 0.93 ? uColA : uColB);

  vec2 clip = (pos / uRes * 2.0 - 1.0) * vec2(1.0, -1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

const PARTICLE_FRAG = `
precision mediump float;
varying vec3  vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  float glow = smoothstep(0.5, 0.08, r);
  float core = smoothstep(0.22, 0.0, r);
  vec3 col = vColor * glow + vec3(1.0) * core * 0.4;
  float a = vAlpha * glow;
  gl_FragColor = vec4(col * a, a);
}
`;

const QUAD_VERT = `
attribute vec2 aPos;   // css px
uniform vec2 uRes;
varying vec2 vUv;
void main() {
  vUv = aPos / uRes;
  vec2 clip = (aPos / uRes * 2.0 - 1.0) * vec2(1.0, -1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

const QUAD_FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform float uTextAlpha;
varying vec2 vUv;
void main() {
  // premultiplied texture carries the ink color (white by default)
  gl_FragColor = texture2D(uTex, vUv) * uTextAlpha;
}
`;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
  }
  return sh;
}

function makeProgram(gl, vert, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || 'link failed');
  }
  return p;
}

/**
 * Rasterize the wrapped copy in solid white at device resolution.
 * Returns particle targets (css px), block height, and the raster canvas —
 * used both as the crossfade texture and the final static image.
 */
function rasterizeText(text, W, size, dpr, inkColor = '#ffffff') {
  const isSmall = W < 640;
  const fontPx = size === 'lg'
    ? Math.max(25, Math.min(40, W / 22))
    : Math.max(19, Math.min(30, W / 30));
  const lineHeight = fontPx * 1.55;
  const font = `600 ${fontPx}px "Space Grotesk", sans-serif`;
  const maxWidth = Math.min(W - 24, 900);

  const raster = document.createElement('canvas');
  const ctx = raster.getContext('2d', { willReadFrequently: true });
  ctx.font = font;
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const H = Math.ceil(lines.length * lineHeight + fontPx);
  raster.width = W * dpr;
  raster.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = font;
  ctx.fillStyle = inkColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) =>
    ctx.fillText(l, W / 2, fontPx * 0.6 + i * lineHeight + lineHeight / 2, maxWidth)
  );

  // sample particle targets from the raster's alpha (in css px)
  const img = ctx.getImageData(0, 0, raster.width, raster.height).data;
  const targets = [];
  const step = Math.round(2 * dpr);
  for (let y = 0; y < raster.height; y += step) {
    for (let x = 0; x < raster.width; x += step) {
      if (img[(y * raster.width + x) * 4 + 3] > 128) {
        targets.push([x / dpr, y / dpr]);
      }
    }
  }
  const MAX = isSmall ? 9000 : 20000;
  while (targets.length > MAX) {
    targets.splice(Math.floor(Math.random() * targets.length), 1);
  }
  return { targets, H, raster };
}

/**
 * Rasterize a multi-line block (each line with its own font/size/indent)
 * in solid white. The block is centered horizontally as one unit; lines
 * are left-aligned inside it. Same return shape as rasterizeText.
 *
 * A line is normally one run of text/font, but can instead carry `runs`:
 * [{ text, fontFamily, weight, italic }, …] drawn back-to-back at the
 * line's shared sizePx — e.g. a name where one word is styled differently.
 */
function fontOf(spec) {
  return `${spec.italic ? 'italic ' : ''}${spec.weight || 400} ${spec.sizePx}px ${spec.fontFamily}`;
}
function measureRuns(ctx, runs) {
  return runs.map((r) => {
    ctx.font = fontOf(r);
    return { ...r, m: ctx.measureText(r.text) };
  });
}
// ink width of the whole run sequence: left bump of the first run's glyphs
// + full advance of the interior + right bump of the last run's glyphs
function inkWidthOfRuns(mRuns) {
  const totalAdvance = mRuns.reduce((s, r) => s + r.m.width, 0);
  const left = mRuns[0].m.actualBoundingBoxLeft ?? 0;
  const lastM = mRuns[mRuns.length - 1].m;
  const right = lastM.actualBoundingBoxRight ?? lastM.width;
  return left + (totalAdvance - lastM.width) + right;
}

function rasterizeLines(lines, W, dpr, align = 'center', inkColor = '#ffffff') {
  const raster = document.createElement('canvas');
  const ctx = raster.getContext('2d', { willReadFrequently: true });

  let maxW = 0;
  let blockH = 0;
  const measured = lines.map((raw) => {
    let l = raw;
    let runs = l.runs
      ? l.runs.map((r) => ({ ...r, sizePx: l.sizePx }))
      : [{ text: l.text, fontFamily: l.fontFamily, weight: l.weight, italic: l.italic, sizePx: l.sizePx }];
    let mRuns = measureRuns(ctx, runs);
    let inkW = inkWidthOfRuns(mRuns);
    // fit: rescale sizePx so the line spans the wrap width
    // (true = full width, a number = that fraction of it)
    if (l.fit) {
      const frac = typeof l.fit === 'number' ? l.fit : 1;
      if (inkW > 0) {
        const scale = (W * frac - (l.indentPx || 0)) / inkW;
        l = { ...l, sizePx: l.sizePx * scale };
        runs = runs.map((r) => ({ ...r, sizePx: r.sizePx * scale }));
        mRuns = measureRuns(ctx, runs);
        inkW = inkWidthOfRuns(mRuns);
      }
    }
    const w = inkW + (l.indentPx || 0);
    if (w > maxW) maxW = w;
    const boxH = l.sizePx * (l.lineHeight ?? 1.05);
    blockH += boxH;
    return { ...l, runs, boxH, bearing: mRuns[0].m.actualBoundingBoxLeft ?? 0 };
  });

  const H = Math.ceil(blockH + 8);
  raster.width = W * dpr;
  raster.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = inkColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const left = align === 'left' ? 0 : Math.max(0, (W - maxW) / 2);
  let top = 0;
  for (const l of measured) {
    // + bearing puts the ink's left edge (not the glyph origin) on the line
    let x = left + (l.indentPx || 0) + l.bearing;
    const y = top + l.sizePx * 0.82;
    for (const r of l.runs) {
      ctx.font = fontOf(r);
      ctx.fillText(r.text, x, y);
      x += ctx.measureText(r.text).width;
    }
    top += l.boxH;
  }

  // sample particle targets from the raster's alpha (in css px)
  const img = ctx.getImageData(0, 0, raster.width, raster.height).data;
  const targets = [];
  const step = Math.round(2 * dpr);
  for (let y = 0; y < raster.height; y += step) {
    for (let x = 0; x < raster.width; x += step) {
      if (img[(y * raster.width + x) * 4 + 3] > 128) {
        targets.push([x / dpr, y / dpr]);
      }
    }
  }
  const MAX = W < 640 ? 9000 : 20000;
  while (targets.length > MAX) {
    targets.splice(Math.floor(Math.random() * targets.length), 1);
  }
  return { targets, H, raster };
}

export default function ParticleText({
  text,
  size = 'lg', // lg | md
  className = '',
  color = '#e8e6f0',
  accent = '#8b5cf6',
  accent2 = '#4ce0d2',
  // color the final text raster is drawn in (dark for light sections)
  inkColor = '#ffffff',
  // multi-line mode: array (or fn of (wrapWidth, viewportWidth)) of
  // { text, fontFamily, weight, sizePx, indentPx, lineHeight, fit, italic }
  // fit: true rescales sizePx so the line spans the full wrap width;
  // a number (e.g. 0.5) fits the line to that fraction of the width
  // a line can use `runs: [{ text, fontFamily, weight, italic }, …]`
  // instead of a flat `text`, to style part of the line differently
  // (sizePx/indentPx/lineHeight/fit still live on the line, not the run)
  lines = null,
  // lines-mode block placement inside the wrap: 'center' | 'left'
  align = 'center',
  // exact JSX to show instead of the canvas when motion is off / no WebGL
  staticRender = null,
  // called once when the text is fully condensed (immediately when the
  // static fallback is shown instead)
  onDone = null,
  // fraction of the timeline at which onDone fires (1 = fully condensed,
  // 0.5 = halfway) — lets follow-up animations overlap the tail end
  doneAt = 1,
}) {
  const [wrapRef, inView] = useInViewOnce(0.3);
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [fallback, setFallback] = useState(false);
  const [doneSrc, setDoneSrc] = useState(null); // final solid-text image
  const startedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const doneFiredRef = useRef(false);
  const fireDone = () => {
    if (doneFiredRef.current) return;
    doneFiredRef.current = true;
    onDoneRef.current?.();
  };

  useEffect(() => {
    if (!inView || reduced || startedRef.current) return;
    startedRef.current = true;

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = wrap.clientWidth;
    const spec = typeof lines === 'function' ? lines(W, window.innerWidth) : lines;

    let disposed = false;
    let teardown = null;

    const setup = () => {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    });
    if (!gl) {
      setFallback(true);
      return null;
    }

    const { targets, H, raster } = spec
      ? rasterizeLines(spec, W, dpr, align, inkColor)
      : rasterizeText(text, W, size, dpr, inkColor);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = `${H}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);

    let partProg, quadProg;
    try {
      partProg = makeProgram(gl, PARTICLE_VERT, PARTICLE_FRAG);
      quadProg = makeProgram(gl, QUAD_VERT, QUAD_FRAG);
    } catch (err) {
      console.error('ParticleText shader error:', err);
      setFallback(true);
      return null;
    }

    // ---- particle buffer
    const count = targets.length;
    const FLOATS = 9; // aStart(3) + aTarget(2) + aRand(4)
    const data = new Float32Array(count * FLOATS);
    for (let i = 0; i < count; i++) {
      const o = i * FLOATS;
      data[o + 0] = Math.random() * W;
      data[o + 1] = Math.random() * H * 1.6 - H * 0.3;
      data[o + 2] = Math.random();
      data[o + 3] = targets[i][0];
      data[o + 4] = targets[i][1];
      data[o + 5] = Math.random();
      data[o + 6] = Math.random();
      data[o + 7] = Math.random() * Math.PI * 2;
      data[o + 8] = Math.random();
    }
    const partBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // ---- block quad + text texture
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0, W, 0, 0, H,
      W, 0, W, H, 0, H,
    ]), gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // ---- locations
    const pu = (n) => gl.getUniformLocation(partProg, n);
    gl.useProgram(partProg);
    gl.uniform2f(pu('uRes'), W, H);
    gl.uniform1f(pu('uDpr'), dpr);
    gl.uniform3fv(pu('uColBase'), hexToRgb(color));
    gl.uniform3fv(pu('uColA'), hexToRgb(accent));
    gl.uniform3fv(pu('uColB'), hexToRgb(accent2));
    const uPTime = pu('uTime');
    const uPFade = pu('uFade');
    const locStart = gl.getAttribLocation(partProg, 'aStart');
    const locTarget = gl.getAttribLocation(partProg, 'aTarget');
    const locRand = gl.getAttribLocation(partProg, 'aRand');

    gl.useProgram(quadProg);
    gl.uniform2f(gl.getUniformLocation(quadProg, 'uRes'), W, H);
    gl.uniform1i(gl.getUniformLocation(quadProg, 'uTex'), 0);
    const uTextAlpha = gl.getUniformLocation(quadProg, 'uTextAlpha');
    const locQuadPos = gl.getAttribLocation(quadProg, 'aPos');

    gl.enable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);

    // ---- one-shot animation loop; time only advances while visible
    let raf = 0;
    let running = false;
    let elapsed = 0;
    let last = 0;
    let finished = false;
    let cleanupTimer = 0;
    let cleaned = false;

    const cleanupGL = () => {
      if (cleaned) return;
      cleaned = true;
      gl.deleteBuffer(partBuf);
      gl.deleteBuffer(quadBuf);
      gl.deleteTexture(tex);
      gl.deleteProgram(partProg);
      gl.deleteProgram(quadProg);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };

    const frame = (now) => {
      if (!running) return;
      elapsed += Math.min((now - last) / 1000, 0.05) * SPEED;
      last = now;

      const textAlpha = smoothstep(T_TEXT_IN[0], T_TEXT_IN[1], elapsed);
      const fade = 1 - smoothstep(T_PART_OUT[0], T_PART_OUT[1], elapsed);

      if (elapsed >= T_DONE * doneAt) fireDone(); // no-op after the first call

      gl.clear(gl.COLOR_BUFFER_BIT);

      // solid text (premultiplied over)
      if (textAlpha > 0) {
        gl.useProgram(quadProg);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(locQuadPos);
        gl.vertexAttribPointer(locQuadPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(uTextAlpha, textAlpha);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(locQuadPos);
      }

      // particles (additive glow) on top
      if (fade > 0) {
        gl.useProgram(partProg);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
        const stride = FLOATS * 4;
        gl.enableVertexAttribArray(locStart);
        gl.vertexAttribPointer(locStart, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(locTarget);
        gl.vertexAttribPointer(locTarget, 2, gl.FLOAT, false, stride, 3 * 4);
        gl.enableVertexAttribArray(locRand);
        gl.vertexAttribPointer(locRand, 4, gl.FLOAT, false, stride, 5 * 4);
        gl.uniform1f(uPTime, elapsed);
        gl.uniform1f(uPFade, fade);
        gl.drawArrays(gl.POINTS, 0, count);
      }

      if (elapsed >= T_DONE) {
        // animation over: swap in a plain image of the text and free the GPU
        finished = true;
        running = false;
        visObs.disconnect();
        setDoneSrc(raster.toDataURL('image/png'));
        fireDone();
        // defer the GL teardown until React has swapped the canvas for the
        // image — losing the context first paints the canvas as a white
        // band for a frame (the "white line" flash)
        cleanupTimer = setTimeout(cleanupGL, 150);
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const visObs = new IntersectionObserver(([entry]) => {
      if (finished) return;
      if (entry.isIntersecting && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }, { threshold: 0.05 });
    visObs.observe(wrap);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      visObs.disconnect();
      clearTimeout(cleanupTimer);
      cleanupGL(); // idempotent — safe whether or not the timer already ran
    };
    }; // end setup

    const boot = () => {
      if (!disposed) teardown = setup();
    };
    if (spec) {
      // custom fonts must be resolved before rasterizing, or the canvas
      // samples fallback glyphs
      const runSpecs = spec.flatMap((l) =>
        (l.runs || [l]).map((r) => ({ weight: r.weight, italic: r.italic, sizePx: l.sizePx, fontFamily: r.fontFamily }))
      );
      Promise.all(
        runSpecs.map((r) =>
          document.fonts.load(`${r.italic ? 'italic ' : ''}${r.weight || 400} ${r.sizePx}px ${r.fontFamily}`).catch(() => {})
        )
      ).then(boot);
    } else {
      boot();
    }

    return () => {
      disposed = true;
      teardown?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced, text, size, color, accent, accent2, inkColor, wrapRef]);

  const showStatic = reduced || fallback;
  // static path never animates — report "done" right away
  useEffect(() => {
    if (showStatic) fireDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStatic]);

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      {/* Real text: always present for a11y/SEO; visible when motion is off */}
      {lines && staticRender ? (
        <div className={showStatic ? '' : 'sr-only'}>{staticRender}</div>
      ) : (
      <p
        className={`font-display font-semibold text-center mx-auto max-w-[900px] ${
          size === 'lg' ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'
        } ${showStatic ? '' : 'sr-only'}`}
        style={{ color: inkColor }}
      >
        {text}
      </p>
      )}
      {!showStatic && (doneSrc
        ? <img src={doneSrc} alt="" aria-hidden="true" className="w-full block" />
        : <canvas ref={canvasRef} className="w-full block" aria-hidden="true" />
      )}
    </div>
  );
}
