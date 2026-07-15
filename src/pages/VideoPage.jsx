import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { deckInsert, crtOn, click, blip, unlockAudio } from '../lib/sfx';
import { usePageTitle } from '../lib/hooks';

/* [PLACEHOLDER: real video-editing experience/project content, thumbnails, links] */
const EXPERIENCE = [
  { period: '2023 — NOW', role: 'Freelance Video Editor', detail: '[PLACEHOLDER: clients, style, reels]' },
  { period: '2022', role: 'Edited literally everything I could', detail: 'Family events, memes, gaming montages. [PLACEHOLDER]' },
];

const TAPES = [
  { id: 'tape-1', title: 'PROJECT REEL 01', sub: 'brand promo', desc: '[PLACEHOLDER: description, tools used, link to video]', tools: 'Premiere Pro · After Effects', length: '01:24' },
  { id: 'tape-2', title: 'PROJECT REEL 02', sub: 'event recap', desc: '[PLACEHOLDER: description, tools used, link to video]', tools: 'DaVinci Resolve', length: '02:10' },
  { id: 'tape-3', title: 'PROJECT REEL 03', sub: 'short-form edit', desc: '[PLACEHOLDER: description, tools used, link to video]', tools: 'CapCut · Premiere', length: '00:47' },
  { id: 'tape-4', title: 'PROJECT REEL 04', sub: 'music sync', desc: '[PLACEHOLDER: description, tools used, link to video]', tools: 'After Effects', length: '01:03' },
];

function Reels() {
  return (
    <div className="flex justify-between px-6 py-3" aria-hidden="true">
      <div className="reel w-12 h-12 spin-slow" />
      <div className="reel w-12 h-12 spin-slower" />
    </div>
  );
}

/* ---- wall-fitted components (recessed wells; only fronts visible) ---- */

function Screws() {
  return (
    <>
      <span className="screw top-2 left-2" aria-hidden="true" />
      <span className="screw top-2 right-2" aria-hidden="true" />
      <span className="screw bottom-2 left-2" aria-hidden="true" />
      <span className="screw bottom-2 right-2" aria-hidden="true" />
    </>
  );
}

function PanelLabel({ children }) {
  return (
    <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#7a4a1e] select-none">
      {children}
    </span>
  );
}

/* every control below is a toy: knobs turn, toggles flip, faders drag,
   buttons latch, screens switch off — with the site's UI sounds */

function Knob({ sizeClass = 'w-12 h-12', initial = 0, label }) {
  const [angle, setAngle] = useState(initial);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`r-knob cursor-pointer select-none ${sizeClass}`}
        style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.18s ease-out' }}
        onPointerDown={() => {
          click();
          setAngle((a) => a + 45);
        }}
      />
      {label && <PanelLabel>{label}</PanelLabel>}
    </div>
  );
}

function Oscilloscope({ label = 'SCOPE · CH1', className = '' }) {
  const [on, setOn] = useState(true);
  return (
    <div className={`panel-module p-3 md:p-4 flex flex-col gap-2 ${className}`}>
      <Screws />
      <div
        className="panel-screen flex-1 min-h-[80px] relative overflow-hidden cursor-pointer"
        onPointerDown={() => { crtOn(); setOn((o) => !o); }}
      >
        {on && (
          <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <path
              d="M0 26 C 8 6, 14 6, 20 22 S 32 36, 40 22 S 52 8, 60 20 S 74 32, 84 18 S 100 10, 120 26"
              fill="none"
              stroke="#2ee6a6"
              strokeWidth="1.8"
              strokeDasharray="160 60"
              className="scope-wave"
              style={{ filter: 'drop-shadow(0 0 3px rgba(46, 230, 166, 0.9))' }}
            />
          </svg>
        )}
      </div>
      <div className="text-center"><PanelLabel>{label}</PanelLabel></div>
    </div>
  );
}

function GaugeDial({ label = 'LEVEL', sizeClass = 'w-20 h-20', className = '' }) {
  const [deg, setDeg] = useState(45);
  return (
    <div
      className={`panel-module flex flex-col items-center justify-center gap-2 p-3 cursor-pointer ${className}`}
      onPointerDown={() => { blip(); setDeg(Math.round(Math.random() * 160 - 80)); }}
    >
      <div
        className={`relative rounded-full ${sizeClass}`}
        style={{
          background: 'radial-gradient(circle at 38% 30%, #fffaf0, #efe0c0 70%)',
          boxShadow: 'inset 0 3px 6px rgba(70,20,0,0.4), 0 2px 3px rgba(255,255,255,0.4)',
        }}
      >
        {[-60, -20, 20, 60].map((d) => (
          <div
            key={d}
            className="absolute left-1/2 top-1.5 w-[2px] h-2 -ml-px bg-[#7a4a1e] rounded origin-[center_36px]"
            style={{ transform: `rotate(${d}deg)` }}
          />
        ))}
        <div
          className="absolute left-1/2 top-1/2 w-[3px] h-7 -ml-[1.5px] -mt-7 origin-bottom bg-[#e5484d] rounded shadow"
          style={{ transform: `rotate(${deg}deg)`, transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
        <div className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-[#2b1d16]" />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 35% at 35% 22%, rgba(255,255,255,0.55), transparent 60%)' }}
        />
      </div>
      <PanelLabel>{label}</PanelLabel>
    </div>
  );
}

function VUMeter({ label = 'VU · AVE', className = '' }) {
  const [swaying, setSwaying] = useState(true);
  return (
    <div
      className={`panel-module flex flex-col items-center justify-center gap-2 p-3 cursor-pointer ${className}`}
      onPointerDown={() => { blip(); setSwaying((s) => !s); }}
    >
      <Screws />
      <div
        className="relative w-28 h-14 rounded-t-full overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 40% 20%, #fffaf0, #efe0c0 75%)',
          boxShadow: 'inset 0 2px 5px rgba(70,20,0,0.35)',
        }}
      >
        {[-45, 0, 45].map((d) => (
          <div
            key={d}
            className="absolute left-1/2 top-1 w-[2px] h-2 -ml-px bg-[#7a4a1e] origin-[center_52px]"
            style={{ transform: `rotate(${d}deg)` }}
          />
        ))}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[3px] h-11">
          <div className={`${swaying ? 'vu-needle' : ''} w-full h-full bg-[#e5484d] rounded`} style={swaying ? {} : { transform: 'rotate(-30deg)', transformOrigin: 'bottom center' }} />
        </div>
      </div>
      <PanelLabel>{label}</PanelLabel>
    </div>
  );
}

/* segmented LED meter bank: green → yellow → red, click to power off */
function EqBank({ className = '' }) {
  const [on, setOn] = useState(true);
  const cols = [4, 6, 3, 7, 5, 8, 4, 6, 5, 7, 3, 6];
  const segColor = (row) => (row > 5 ? '#ff4d4d' : row > 3 ? '#ffd23e' : '#3aff7c');
  return (
    <div className={`panel-module p-3 md:p-4 flex flex-col gap-2 ${className}`}>
      <Screws />
      <div
        className="panel-screen flex-1 min-h-[80px] px-4 py-3 flex items-end justify-center gap-2 cursor-pointer"
        onPointerDown={() => { crtOn(); setOn((o) => !o); }}
      >
        {cols.map((lit, i) => (
          <div
            key={i}
            className={on ? 'eq-bar flex flex-col-reverse gap-[3px]' : 'flex flex-col-reverse gap-[3px]'}
            style={{ animationDelay: `${i * 0.11}s` }}
          >
            {Array.from({ length: 8 }, (_, row) => (
              <span
                key={row}
                className="w-3.5 h-[6px] rounded-[1px]"
                style={{
                  background: on && row < lit ? segColor(row) : 'rgba(255,255,255,0.07)',
                  boxShadow: on && row < lit ? `0 0 5px ${segColor(row)}` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* amber phosphor terminal dashboard: sparkline, dot chart, progress bars */
function TerminalScreen({ className = '' }) {
  const [on, setOn] = useState(true);
  const A = '#ffab21';
  const bars = [
    { name: 'DOWNLOADING FILE 1', w: 43 },
    { name: 'DOWNLOADING FILE 2', w: 76 },
    { name: 'UPLOADING FILE 3', w: 12 },
  ];
  return (
    <div className={`panel-module p-3 md:p-4 flex flex-col ${className}`}>
      <Screws />
      <div
        className="panel-screen flex-1 min-h-[130px] relative overflow-hidden cursor-pointer p-3.5 flex flex-col gap-2.5 font-mono"
        onPointerDown={() => { crtOn(); setOn((o) => !o); }}
        style={{ color: A, textShadow: '0 0 5px rgba(255, 171, 33, 0.7)' }}
      >
        {on && (
          <>
            <div className="flex gap-3 flex-1 min-h-0">
              {/* pixel sparkline hill */}
              <div className="flex-1 relative border rounded-[2px] px-1 pt-2" style={{ borderColor: 'rgba(255,171,33,0.5)' }}>
                <span className="absolute -top-1.5 left-2 text-[8px] leading-none bg-[#131613] px-1">SPARKLINE</span>
                <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-full">
                  <path
                    d="M0 32 V30 H8 V24 H14 V17 H20 V10 H26 V5 H34 V3 H46 V5 H54 V10 H62 V17 H70 V24 H78 V29 H86 V31 H100 V32 Z"
                    fill={A}
                    opacity="0.92"
                    shapeRendering="crispEdges"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(255,171,33,0.8))' }}
                  />
                </svg>
              </div>
              {/* braille-mode line chart */}
              <div className="flex-1 relative border rounded-[2px] p-1.5 pt-2.5" style={{ borderColor: 'rgba(255,171,33,0.5)' }}>
                <span className="absolute -top-1.5 left-2 text-[8px] leading-none bg-[#131613] px-1">LINE CHART</span>
                <div className="grid grid-cols-12 gap-[3px] h-full content-end">
                  {[6, 4, 2, 4, 6, 4, 2, 4, 6, 3, 2, 5].map((lvl, i) => (
                    <div key={i} className="flex flex-col justify-end gap-[2px]">
                      {Array.from({ length: lvl }, (_, j) => (
                        <span
                          key={j}
                          className="w-[4px] h-[4px] rounded-[1px] mx-auto"
                          style={{ background: A, boxShadow: `0 0 3px ${A}` }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* download progress rows */}
            <div className="space-y-1.5">
              {bars.map((b, i) => (
                <div key={b.name} className="flex items-center gap-2 text-[9px] tracking-wider leading-none">
                  <span className="whitespace-nowrap">[{i + 1}] {b.name}</span>
                  <span className="flex-1 h-3.5 border rounded-[2px] overflow-hidden" style={{ borderColor: 'rgba(255,171,33,0.5)' }}>
                    <span
                      className="block h-full"
                      style={{ width: `${b.w}%`, background: A, boxShadow: '0 0 6px rgba(255,171,33,0.7)' }}
                    />
                  </span>
                  <span>{b.w}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KnobStrip({ className = '' }) {
  const labels = ['COLOR', 'TINT', 'SHARP', 'AUDIO', 'TRACK'];
  return (
    <div className={`panel-module flex items-center justify-around px-4 py-3 ${className}`}>
      <Screws />
      {labels.map((l, i) => (
        <Knob key={l} sizeClass="w-12 h-12" initial={i * 50 - 90} label={l} />
      ))}
    </div>
  );
}

function BigKnobs({ className = '' }) {
  return (
    <div className={`panel-module flex items-center justify-center gap-6 p-3 ${className}`}>
      <Knob sizeClass="w-20 h-20" initial={-35} label="VOLUME" />
      <Knob sizeClass="w-20 h-20" initial={60} label="TUNING" />
    </div>
  );
}

/* chunky candy push buttons that latch in/out */
function ButtonBank({ className = '' }) {
  const colors = ['#e5484d', '#10b3a3', '#ffd23e', '#f6e8cd', '#10b3a3', '#e5484d', '#f6e8cd', '#ffd23e'];
  const [pressed, setPressed] = useState(() => colors.map((_, i) => i % 3 === 0));
  return (
    <div className={`panel-module p-4 flex items-center justify-center overflow-hidden ${className}`}>
      <Screws />
      {/* sized to always fit inside the well, whatever the cell height */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-[8rem] max-h-full">
        {colors.map((c, i) => (
          <div
            key={i}
            className="w-full aspect-square max-h-14 rounded-md cursor-pointer select-none"
            onPointerDown={() => {
              click();
              setPressed((p) => p.map((v, j) => (j === i ? !v : v)));
            }}
            style={{
              background: `linear-gradient(175deg, ${c}, ${c}dd)`,
              boxShadow: pressed[i]
                ? 'inset 0 3px 6px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.3)'
                : '0 4px 0 rgba(70, 20, 0, 0.45), inset 0 2px 1px rgba(255,255,255,0.55), inset 0 -2px 3px rgba(0,0,0,0.25)',
              transform: pressed[i] ? 'translateY(3px)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ToggleBank({ className = '' }) {
  const [ups, setUps] = useState([true, false, true]);
  const labels = ['A/B', 'MODE', 'MUTE'];
  return (
    <div className={`panel-module flex items-center justify-center gap-5 p-4 ${className}`}>
      <Screws />
      {ups.map((up, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div
            className="t-base w-11 h-24 cursor-pointer"
            onPointerDown={() => {
              click();
              setUps((u) => u.map((v, j) => (j === i ? !v : v)));
            }}
          >
            <div
              className="t-lever !w-4"
              style={{ [up ? 'top' : 'bottom']: '5px', transition: 'top 0.12s, bottom 0.12s' }}
            />
          </div>
          <PanelLabel>{labels[i]}</PanelLabel>
        </div>
      ))}
    </div>
  );
}

/* draggable faders with ridged metal caps */
function Fader({ initial = 50 }) {
  const [p, setP] = useState(initial);
  const trackRef = useRef(null);
  const onDown = (e) => {
    blip();
    const move = (ev) => {
      const r = trackRef.current?.getBoundingClientRect();
      if (!r) return;
      setP(Math.min(94, Math.max(0, (1 - (ev.clientY - r.top) / r.height) * 100)));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    move(e);
  };
  return (
    <div ref={trackRef} className="fader-track relative w-3 h-36 cursor-grab touch-none" onPointerDown={onDown}>
      <div className="fader-cap absolute left-1/2 -translate-x-1/2 w-14 h-7" style={{ bottom: `${p}%` }} />
    </div>
  );
}

function FaderBank({ className = '' }) {
  return (
    <div className={`panel-module flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
      <Screws />
      <div className="flex items-center justify-center gap-10">
        <Fader initial={62} />
        <Fader initial={28} />
      </div>
      <PanelLabel>MASTER · AUX</PanelLabel>
    </div>
  );
}

function SquiggleScreen({ d, stroke = '#ff7ab0', label, className = '' }) {
  const [on, setOn] = useState(true);
  return (
    <div className={`panel-module p-3 md:p-4 flex flex-col gap-2 ${className}`}>
      <Screws />
      <div
        className="panel-screen flex-1 min-h-[52px] relative overflow-hidden cursor-pointer"
        onPointerDown={() => { crtOn(); setOn((o) => !o); }}
      >
        {on && (
          <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]">
            <path
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth="2.6"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 3px ${stroke})` }}
            />
          </svg>
        )}
      </div>
      {label && <div className="text-center"><PanelLabel>{label}</PanelLabel></div>}
    </div>
  );
}

/* the VHS cassette (front view): label strip + reel windows */
function VhsTape() {
  return (
    <>
      <div className="vhs-label absolute inset-x-3 top-2.5 h-12 rounded-sm px-3 flex flex-col justify-center">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#2b1d16] font-bold">
          MULTIVERSE MIX · E-180
        </span>
        <div className="flex gap-1 mt-1.5" aria-hidden="true">
          {['#e5484d', '#f07a38', '#ffd23e', '#10b3a3'].map((c) => (
            <span key={c} className="h-2 flex-1 rounded-full" style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-5 bottom-3.5 h-12 rounded-sm bg-black/40 flex items-center justify-between px-3">
        <span className="reel w-9 h-9 shrink-0" />
        <div className="flex-1 mx-2 h-3.5 rounded-sm bg-[#0b0806] shadow-inner" />
        <span className="reel w-9 h-9 shrink-0" />
      </div>
    </>
  );
}

/* big illuminated rocker like a bench power switch */
function Rocker({ className = '' }) {
  const [on, setOn] = useState(true);
  return (
    <div className={`panel-module flex flex-col items-center justify-center gap-2 p-3 ${className}`}>
      <Screws />
      <div
        className="cursor-pointer w-16 h-24 rounded-lg relative select-none"
        onPointerDown={() => { click(); setOn((o) => !o); }}
        style={{ background: 'linear-gradient(#2b241d, #171310)', boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.8)' }}
      >
        <div
          className="absolute inset-1 rounded-md grid place-items-center"
          style={{
            background: on ? 'linear-gradient(175deg, #ff6b60, #c22a20)' : 'linear-gradient(5deg, #a8221a, #7d150f)',
            boxShadow: on
              ? 'inset 0 6px 8px rgba(255,255,255,0.35), inset 0 -8px 10px rgba(0,0,0,0.45), 0 0 14px rgba(255,107,96,0.5)'
              : 'inset 0 -6px 8px rgba(255,255,255,0.15), inset 0 8px 10px rgba(0,0,0,0.5)',
            transform: on ? 'perspective(90px) rotateX(10deg)' : 'perspective(90px) rotateX(-10deg)',
            transition: 'all 0.12s',
          }}
        >
          <span className="font-mono text-[11px] font-bold text-white/90">{on ? 'ON' : 'OFF'}</span>
        </div>
      </div>
      <PanelLabel>MAIN POWER</PanelLabel>
    </div>
  );
}

/**
 * One wall, no empty cells: every module fitted flush and interactive.
 * The VCR sits center; the cassette floats in the foreground and, on
 * click, recedes toward the machine (shrinking, like the reference
 * video's push-in) until the mouth swallows it — no hands.
 */
function Gate({ onInsert, phase }) {
  const inserting = phase === 'inserting';
  const starting = phase === 'starting';
  return (
    <div className="control-wall relative min-h-screen overflow-hidden">
      <div className="md:h-screen p-4 md:p-5 grid grid-cols-2 md:grid-cols-12 md:grid-rows-6 gap-4">
        {/* row 1-2 */}
        <Oscilloscope className="col-span-2 md:col-start-1 md:col-span-3 md:row-start-1 md:row-span-2" />
        <GaugeDial label="CLOCK" sizeClass="w-16 h-16" className="hidden md:flex md:col-start-4 md:col-span-1 md:row-start-1" />
        <VUMeter className="hidden md:flex md:col-start-5 md:col-span-2 md:row-start-1" />
        <EqBank className="col-span-2 md:col-start-7 md:col-span-6 md:row-start-1" />
        <KnobStrip className="hidden md:flex md:col-start-4 md:col-span-7 md:row-start-2" />
        <SquiggleScreen
          d="M50 2 C 20 12, 80 22, 50 30 S 25 44, 50 48"
          stroke="#7cf5d4"
          label="SYNC"
          className="hidden md:flex md:col-start-11 md:col-span-2 md:row-start-2"
        />

        {/* row 3-4: big knobs · THE VCR · toggles */}
        <BigKnobs className="hidden md:flex md:col-start-1 md:col-span-2 md:row-start-3" />
        <div className="panel-module relative col-span-2 md:col-start-3 md:col-span-8 md:row-start-3 md:row-span-2 p-3 md:p-4 flex overflow-hidden">
          <Screws />
          <div className="vcr-body flex-1 relative px-5 md:px-8 py-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-widest text-[#c9bda8]">
                DUA VIDEO · HQ-2200 VHS
              </span>
              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="seven-seg text-sm px-3 py-1 rounded-sm min-w-[5.5rem] text-center">
                  {starting ? 'PLAY ▶' : inserting ? 'LOAD' : '--:--'}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    starting ? 'bg-green-500' : inserting ? 'bg-amber-400' : 'bg-[var(--vu-red)]'
                  }`}
                  style={{ boxShadow: '0 0 8px currentColor' }}
                />
              </div>
            </div>
            {/* the tape mouth (front-loading flap) */}
            <motion.div
              className="vcr-slot h-8 md:h-9 relative z-20 mt-3"
              animate={
                inserting
                  ? { boxShadow: 'inset 0 5px 12px rgba(0,0,0,0.95), 0 0 24px rgba(255,210,62,0.85)' }
                  : {}
              }
            >
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] tracking-widest text-[#8a7a5f]">
                VHS
              </span>
            </motion.div>
            {/* the stage: cassette floats in the foreground and recedes
                into the mouth on click */}
            <div className="relative flex-1 z-10">
              <div className="absolute inset-x-0 top-1 flex justify-center">
                <motion.button
                  onClick={onInsert}
                  disabled={phase !== 'gate'}
                  aria-label="Insert the VHS tape and enter the video editing universe"
                  animate={
                    inserting || starting
                      ? {
                          y: [0, -104, -114],
                          scaleX: [1.12, 0.78, 0.72],
                          scaleY: [1.12, 0.78, 0.06],
                          opacity: [1, 1, 0],
                        }
                      : { scale: 1.12 }
                  }
                  transition={
                    inserting || starting
                      ? { duration: 1.5, times: [0, 0.62, 1], ease: 'easeInOut' }
                      : { duration: 0.2 }
                  }
                  className="vhs-tape relative w-80 h-32 md:w-[26rem] md:h-36 shrink-0 cursor-pointer"
                >
                  <VhsTape />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        <ToggleBank className="hidden md:flex md:col-start-11 md:col-span-2 md:row-start-3 md:row-span-2" />
        <Rocker className="hidden md:flex md:col-start-1 md:col-span-2 md:row-start-4" />

        {/* row 5-6 */}
        <ButtonBank className="col-span-1 md:col-start-1 md:col-span-2 md:row-start-5 md:row-span-2" />
        <FaderBank className="col-span-1 md:col-start-3 md:col-span-2 md:row-start-5 md:row-span-2" />
        <TerminalScreen className="hidden md:flex md:col-start-5 md:col-span-4 md:row-start-5 md:row-span-2" />
        <SquiggleScreen
          d="M2 25 C 20 5, 30 45, 48 25 S 80 5, 98 25"
          stroke="#ff7ab0"
          label="CH-2"
          className="hidden md:flex md:col-start-9 md:col-span-2 md:row-start-5"
        />
        <GaugeDial label="TEMP" className="hidden md:flex md:col-start-9 md:col-span-2 md:row-start-6" />
        <VUMeter label="dB · PEAK" className="hidden md:flex md:col-start-11 md:col-span-2 md:row-start-5" />
        <SquiggleScreen
          d="M5 30 C 25 10, 45 40, 65 20 S 90 25, 95 20"
          stroke="#7cf5d4"
          label="CH-3"
          className="hidden md:flex md:col-start-11 md:col-span-2 md:row-start-6"
        />
      </div>
    </div>
  );
}

export default function VideoPage() {
  usePageTitle(
    'Video Editing — Multiverse of Portfolio',
    "Press play on Dua Anas's video editing universe — VHS-styled reels, edits and motion experiments, straight from the editing bay. Hit rewind and watch.",
    '/video'
  );
  // gate → inserting (disc slides in) → starting (deck powers up) → play
  const [phase, setPhase] = useState('gate');
  const [openTape, setOpenTape] = useState(null);

  const insert = () => {
    unlockAudio();
    deckInsert();
    setPhase('inserting');
    // matches the 1.5s tape push-in, then the deck spins up
    setTimeout(() => {
      setPhase('starting');
      crtOn();
    }, 1500);
    setTimeout(() => setPhase('play'), 3000);
  };

  useEffect(() => {
    if (!openTape) return;
    const onKey = (e) => e.key === 'Escape' && setOpenTape(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openTape]);

  if (phase !== 'play') {
    return (
      <div className="u-video vhs-grain">
        <Gate onInsert={insert} phase={phase} />
      </div>
    );
  }

  return (
    <div className="u-video vhs-grain">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-6 py-20 md:py-28"
      >
        <p className="font-mono text-[11px] text-[var(--tape-orange)] tracking-widest mb-2">
          ▶ PLAY · UNIVERSE 02/04
        </p>
        <h1 className="font-display font-bold text-3xl md:text-5xl mb-4">
          Video Editing<span className="text-[var(--tape-orange)]">.</span>
        </h1>
        <p className="text-[var(--tape-cream)]/70 max-w-xl">
          The atom with an eye for cuts. Rewind, watch, repeat — every project
          lives on its own tape.
        </p>

        <h2 className="font-mono text-sm tracking-[0.3em] text-[var(--tape-orange)] mt-16 mb-6">
          ● REC — EXPERIENCE
        </h2>
        <ul className="space-y-6">
          {EXPERIENCE.map((e, i) => (
            <li key={i} className="border-l-2 border-[var(--tape-orange)]/50 pl-5">
              <p className="font-mono text-xs text-[var(--tape-orange)]">{e.period}</p>
              <p className="font-display font-semibold text-lg">{e.role}</p>
              <p className="text-sm text-[var(--tape-cream)]/60 mt-1">{e.detail}</p>
            </li>
          ))}
        </ul>

        <h2 className="font-mono text-sm tracking-[0.3em] text-[var(--tape-orange)] mt-16 mb-6">
          ⏏ THE SHELF — PROJECTS
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {TAPES.map((tape) => (
            <motion.button
              key={tape.id}
              layoutId={tape.id}
              onClick={() => { click(); setOpenTape(tape); }}
              className="cassette text-left"
              aria-label={`Open project ${tape.title}`}
            >
              <div className="cassette-label mx-4 mt-4 rounded-sm px-3 py-2">
                <p className="font-mono text-xs font-bold">{tape.title}</p>
                <p className="font-mono text-[10px] opacity-70">{tape.sub} · {tape.length}</p>
              </div>
              <Reels />
            </motion.button>
          ))}
        </div>
        <p className="font-mono text-[11px] text-[var(--tape-cream)]/40 tracking-widest mt-20">
          ⏹ STOP — use the planet icon to jump universes
        </p>
      </motion.div>

      <AnimatePresence>
        {openTape && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 z-[110]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenTape(null)}
            />
            <div className="fixed inset-0 z-[120] grid place-items-center p-4 pointer-events-none">
              <motion.div
                layoutId={openTape.id}
                className="cassette pointer-events-auto w-[min(560px,94vw)] p-2"
                role="dialog"
                aria-modal="true"
                aria-label={`${openTape.title} details`}
              >
                <div className="cassette-label rounded-sm px-5 py-4 m-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm font-bold">{openTape.title}</p>
                      <p className="font-mono text-[11px] opacity-70">{openTape.sub} · {openTape.length}</p>
                    </div>
                    <button
                      onClick={() => setOpenTape(null)}
                      aria-label="Close and put the tape back"
                      className="text-xl leading-none opacity-60 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-2">
                  {/* [PLACEHOLDER: video/gif preview embed] */}
                  <div className="aspect-video rounded bg-black/60 grid place-items-center mb-4 border border-[var(--tape-cream)]/10">
                    <span className="font-mono text-xs text-[var(--tape-cream)]/40">
                      ▶ [PLACEHOLDER: video preview]
                    </span>
                  </div>
                  <p className="text-sm text-[var(--tape-cream)]/80 mb-3">{openTape.desc}</p>
                  <p className="font-mono text-[11px] text-[var(--tape-orange)] tracking-wider mb-4">
                    TOOLS: {openTape.tools}
                  </p>
                </div>
                <Reels />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
