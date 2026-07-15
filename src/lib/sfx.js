/*
 * Sound effects for the site. Most cues are synthesized with the Web Audio
 * API; `whoosh` plays a real recorded audio file (assets/portal_whoosh.mp3)
 * via an <audio> element instead. To swap in more real files later, replace
 * the individual functions with audio-element playback while keeping the
 * same exported names.
 *
 * All playback respects the global mute flag and browser autoplay rules:
 * the AudioContext is only created/resumed inside user-gesture handlers
 * (the EXPLORE button is the natural unlock point).
 */
import { useStore } from '../store';
import portalWhooshUrl from '../../assets/portal_whoosh.mp3';

let ctx = null;

function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function muted() {
  return useStore.getState().muted;
}

/** Call from any trusted user gesture to unlock audio. */
export function unlockAudio() {
  ac();
}

function env(c, gain, t0, attack, decay, peak = 1) {
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function noiseBuffer(c, seconds = 1) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function tone(c, { type = 'sine', freq = 440, to = null, dur = 0.2, vol = 0.2, when = 0 }) {
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  env(c, g, t0, 0.01, dur, vol);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.1);
}

function burst(c, { dur = 0.15, vol = 0.15, when = 0, filterFreq = 2000, type = 'lowpass' }) {
  const t0 = c.currentTime + when;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur + 0.1);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  const g = c.createGain();
  env(c, g, t0, 0.005, dur, vol);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.2);
}

/* ---------- cues ---------- */

/** Tiny UI blip — node graph hover. */
export function blip() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  tone(c, { type: 'sine', freq: 1100, to: 1500, dur: 0.06, vol: 0.06 });
}

/** Soft click — buttons, cassette pick-up. */
export function click() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  burst(c, { dur: 0.04, vol: 0.12, filterFreq: 3200 });
  tone(c, { type: 'triangle', freq: 320, to: 180, dur: 0.05, vol: 0.08 });
}

let portalWhooshEl = null;

/** Portal whoosh — Explore click / page warp. Real recorded audio file. */
export function whoosh() {
  if (muted()) return;
  if (typeof window === 'undefined') return;
  if (!portalWhooshEl) {
    portalWhooshEl = new Audio(portalWhooshUrl);
    portalWhooshEl.preload = 'auto';
    portalWhooshEl.volume = 0.5;
  }
  portalWhooshEl.currentTime = 0;
  portalWhooshEl.play().catch(() => {});
}

/** The original synthesized whoosh — bandpass-filtered noise sweep. */
export function synthWhoosh() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  const t0 = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 1);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(200, t0);
  f.frequency.exponentialRampToValueAtTime(3200, t0 + 0.5);
  f.frequency.exponentialRampToValueAtTime(300, t0 + 0.9);
  f.Q.value = 1.2;
  const g = c.createGain();
  env(c, g, t0, 0.08, 0.85, 0.25);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + 1);
}

/** Time-machine ignition: motor spool-up → wobble → stutter → crackle. */
export function ignition() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  const t0 = c.currentTime;

  // motor spool-up with pitch wobble
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(42, t0);
  osc.frequency.exponentialRampToValueAtTime(190, t0 + 1.1);
  const lfo = c.createOscillator();
  lfo.frequency.setValueAtTime(6, t0);
  lfo.frequency.linearRampToValueAtTime(13, t0 + 1.2);
  const lfoGain = c.createGain();
  lfoGain.gain.value = 22;
  lfo.connect(lfoGain).connect(osc.frequency);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.25);
  g.gain.setValueAtTime(0.22, t0 + 1.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.45);
  osc.connect(f).connect(g).connect(c.destination);
  osc.start(t0); osc.stop(t0 + 1.5);
  lfo.start(t0); lfo.stop(t0 + 1.5);

  // stuttering mechanical catches
  [1.15, 1.3].forEach((w) => {
    tone(c, { type: 'square', freq: 130, to: 90, dur: 0.09, vol: 0.1, when: w });
    burst(c, { dur: 0.06, vol: 0.08, when: w, filterFreq: 1400 });
  });

  // final electrical crackle
  burst(c, { dur: 0.25, vol: 0.2, when: 1.45, filterFreq: 5200, type: 'highpass' });
}

/** Static stutter for the glitch title scramble-in. */
export function glitchStatic() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  [0, 0.12, 0.3].forEach((w) =>
    burst(c, { dur: 0.05, vol: 0.07, when: w, filterFreq: 4000, type: 'highpass' })
  );
}

/** CRT tube power-on: thunk + rising hum. */
export function crtOn() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  tone(c, { type: 'sine', freq: 70, to: 40, dur: 0.18, vol: 0.4 });
  tone(c, { type: 'sine', freq: 4000, to: 15000, dur: 0.5, vol: 0.04, when: 0.1 });
  tone(c, { type: 'sawtooth', freq: 50, to: 60, dur: 1.2, vol: 0.05, when: 0.15 });
}

/** Mechanical slide + deck whir for the CD insert. */
export function deckInsert() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  burst(c, { dur: 0.3, vol: 0.12, filterFreq: 900 });
  tone(c, { type: 'triangle', freq: 55, to: 160, dur: 0.9, vol: 0.12, when: 0.3 });
  burst(c, { dur: 0.5, vol: 0.05, when: 0.4, filterFreq: 2600 });
  tone(c, { type: 'sine', freq: 880, dur: 0.1, vol: 0.07, when: 1.15 });
}

/** Soft mechanical tick per cube layer turn. */
export function cubeTick() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  burst(c, { dur: 0.03, vol: 0.1, filterFreq: 2400 });
  tone(c, { type: 'triangle', freq: 500, to: 300, dur: 0.04, vol: 0.05 });
}

/** Small triumphant chime for solving the cube. */
export function solveChime() {
  if (muted()) return;
  const c = ac(); if (!c) return;
  [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.38]].forEach(([f, w]) =>
    tone(c, { type: 'sine', freq: f, dur: 0.5, vol: 0.12, when: w })
  );
}
