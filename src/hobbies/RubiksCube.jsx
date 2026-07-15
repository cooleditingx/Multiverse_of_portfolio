import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { TrackballControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

extend({ RoundedBoxGeometry });
import { click, cubeTick, solveChime } from '../lib/sfx';
import { AXES, makeCubies, isSolved, scramble, snapDir, stickerColor } from './cubeLogic';
import { solveBeginner } from './beginnerSolve';

/**
 * A real, playable 3×3 Rubik's Cube. The logical model lives in cubeLogic.js;
 * this component handles rendering, animation, and drag interaction:
 * drag on a cubie face → the drag direction is compared against the
 * screen-projected motion of each candidate rotation axis, and the best
 * match turns that layer. Dragging the background tumbles the whole cube
 * freely (trackball-style, no pole limits — it can go fully upside down).
 */
const INNER = '#0e0c16';
const SPACING = 1.02;
const TURN_MS = 190;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const HINT_COLOR = '#f4c945';

/**
 * The tutor's pointer: a translucent slab marking the layer to turn plus a
 * slowly orbiting arc-arrow showing the direction. The whole group lives in
 * the layer's plane; its +z is aligned with (axis × dir), so the arc always
 * sweeps the way the layer should rotate.
 */
function HintArrow({ hint, moveRef, explodeRef }) {
  const group = useRef();
  const spin = useRef();
  const slabMat = useRef();
  const { quat, pos } = useMemo(() => {
    if (!hint) return {};
    const axisDir = AXES[hint.axis].clone().multiplyScalar(hint.dir);
    return {
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axisDir),
      pos: AXES[hint.axis].clone().multiplyScalar(hint.layer * SPACING),
    };
  }, [hint]);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.visible = !!hint && !moveRef.current && !explodeRef.current;
    if (!g.visible) return;
    if (spin.current) spin.current.rotation.z += delta * 0.7;
    if (slabMat.current) {
      slabMat.current.opacity = 0.1 + 0.06 * Math.sin(state.clock.elapsedTime * 3.2);
    }
  });
  if (!hint) return null;
  const arcEnd = Math.PI * 1.35;
  return (
    <group ref={group} position={pos} quaternion={quat}>
      {/* glowing slab hugging the layer to turn */}
      <mesh>
        <boxGeometry args={[3.34, 3.34, 1.04]} />
        <meshBasicMaterial
          ref={slabMat}
          color={HINT_COLOR}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
      {/* direction arc + arrowhead, drawn through everything so it can't hide */}
      <group ref={spin}>
        <mesh renderOrder={999}>
          <torusGeometry args={[2.32, 0.05, 8, 48, arcEnd]} />
          <meshBasicMaterial color={HINT_COLOR} transparent opacity={0.85} depthTest={false} />
        </mesh>
        <mesh
          position={[2.32 * Math.cos(arcEnd), 2.32 * Math.sin(arcEnd), 0]}
          rotation={[0, 0, arcEnd]}
          renderOrder={999}
        >
          <coneGeometry args={[0.17, 0.46, 12]} />
          <meshBasicMaterial color={HINT_COLOR} transparent opacity={0.9} depthTest={false} />
        </mesh>
      </group>
    </group>
  );
}

function CubeSim({ onSolved, solvedRef, hintOn, onMoveDone }) {
  const { camera, size, gl } = useThree();
  const cubies = useMemo(() => {
    const c = makeCubies();
    scramble(c);
    return c;
  }, []);
  const meshRefs = useRef([]);
  const controlsRef = useRef();
  const move = useRef(null); // { axis, layer, dir, t, members: [{i, startPos, startQuat}] }
  const drag = useRef(null); // { cubieIdx, startX, startY, normal }
  const explode = useRef(null); // { t }

  // guided hint: a beginner's-method plan (ruwix.com steps) is computed on
  // demand and then WALKED, not recomputed — every completed turn either
  // advances the plan (they did the hinted move) or invalidates it. A fresh
  // re-solve only ever happens from an off-plan state; re-solving right
  // after an on-plan move would suggest undoing mid-algorithm moves forever.
  const [hint, setHint] = useState(null);
  const plan = useRef(null);
  const trackPlan = (m) => {
    const next = plan.current?.[0];
    if (next && next.axis === m.axis && next.layer === m.layer && next.dir === m.dir) {
      plan.current.shift();
    } else {
      plan.current = null;
    }
  };
  useEffect(() => {
    if (!hintOn || explode.current) {
      setHint(null);
      return;
    }
    if (!plan.current?.length) {
      try {
        plan.current = solveBeginner(cubies);
      } catch (err) {
        console.warn('cube hint solver failed:', err);
        plan.current = null;
      }
    }
    const m = plan.current?.[0];
    setHint(m ? { axis: m.axis, layer: m.layer, dir: m.dir } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintOn]);

  const startMove = (axis, layer, dir) => {
    if (move.current || explode.current) return;
    const members = [];
    cubies.forEach((c, i) => {
      if (Math.round(c.pos.getComponent(axis)) === layer) {
        members.push({ i, startPos: c.pos.clone(), startQuat: c.quat.clone() });
      }
    });
    move.current = { axis, layer, dir, t: 0, members };
    cubeTick();
  };

  // pointer-driven layer turns
  useEffect(() => {
    const el = gl.domElement;

    const project = (v) => {
      const p = v.clone().project(camera);
      return [(p.x + 1) * 0.5 * size.width, (1 - p.y) * 0.5 * size.height];
    };

    function onMove(e) {
      const d = drag.current;
      if (!d || move.current) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.hypot(dx, dy) < 22) return;

      const cubie = cubies[d.cubieIdx];
      const pWorld = cubie.pos.clone().multiplyScalar(SPACING);
      const [sx, sy] = project(pWorld);
      let best = { score: 0, axis: 0, dir: 1 };
      for (let axis = 0; axis < 3; axis++) {
        if (Math.abs(AXES[axis].dot(d.normal)) > 0.5) continue; // must be ⊥ to touched face
        // motion of the grabbed point under +90° rotation about this axis
        const vel = AXES[axis].clone().cross(pWorld);
        if (vel.lengthSq() < 1e-6) continue;
        const [ex, ey] = project(pWorld.clone().addScaledVector(vel.normalize(), 0.6));
        const mx = ex - sx, my = ey - sy;
        const len = Math.hypot(mx, my) || 1;
        const score = (dx * mx + dy * my) / (Math.hypot(dx, dy) * len);
        if (Math.abs(score) > Math.abs(best.score)) best = { score, axis, dir: Math.sign(score) || 1 };
      }
      if (Math.abs(best.score) > 0.35) {
        const layer = Math.round(cubie.pos.getComponent(best.axis));
        startMove(best.axis, layer, best.dir);
      }
      drag.current = null;
      if (controlsRef.current) controlsRef.current.enabled = true;
    }

    function onUp() {
      drag.current = null;
      if (controlsRef.current) controlsRef.current.enabled = true;
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size, gl, cubies]);

  const onCubieDown = (i) => (e) => {
    if (move.current || explode.current) return;
    e.stopPropagation();
    const normal = e.face.normal
      .clone()
      .applyQuaternion(e.object.quaternion)
      .normalize();
    drag.current = { cubieIdx: i, startX: e.clientX, startY: e.clientY, normal: snapDir(normal) };
    if (controlsRef.current) controlsRef.current.enabled = false;
  };

  useFrame((_, delta) => {
    // sync static transforms
    cubies.forEach((c, i) => {
      const m = meshRefs.current[i];
      if (!m) return;
      if (!move.current || !move.current.members.some((mm) => mm.i === i)) {
        m.position.copy(c.pos).multiplyScalar(SPACING);
        m.quaternion.copy(c.quat);
      }
    });

    // animate active layer turn
    const mv = move.current;
    if (mv) {
      mv.t = Math.min(1, mv.t + (delta * 1000) / TURN_MS);
      const angle = easeInOut(mv.t) * mv.dir * (Math.PI / 2);
      const q = new THREE.Quaternion().setFromAxisAngle(AXES[mv.axis], angle);
      for (const mm of mv.members) {
        const m = meshRefs.current[mm.i];
        if (!m) continue;
        m.position.copy(mm.startPos).applyQuaternion(q).multiplyScalar(SPACING);
        m.quaternion.copy(mm.startQuat).premultiply(q);
      }
      if (mv.t >= 1) {
        const qExact = new THREE.Quaternion().setFromAxisAngle(AXES[mv.axis], (mv.dir * Math.PI) / 2);
        for (const mm of mv.members) {
          const c = cubies[mm.i];
          c.pos.copy(mm.startPos).applyQuaternion(qExact).round();
          c.quat.copy(mm.startQuat).premultiply(qExact).normalize();
        }
        trackPlan(mv);
        move.current = null;
        if (isSolved(cubies) && !explode.current) {
          solvedRef.current = true;
          solveChime();
          explode.current = { t: 0 };
        }
        setHint(null);
        onMoveDone?.(solvedRef.current);
      }
    }

    // solved → cubies scatter like atoms
    if (explode.current) {
      explode.current.t += delta * 0.9;
      const t = explode.current.t;
      cubies.forEach((c, i) => {
        const m = meshRefs.current[i];
        if (!m) return;
        const dir = c.pos.lengthSq() > 0 ? c.pos.clone().normalize() : new THREE.Vector3(0, 1, 0);
        m.position.copy(c.pos).multiplyScalar(SPACING).addScaledVector(dir, t * t * 6);
        m.rotation.x += delta * 2;
        const s = Math.max(0.001, 1 - t);
        m.scale.setScalar(s);
      });
      if (t >= 1) {
        explode.current = null;
        onSolved();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 6]} intensity={1.0} />
      <directionalLight position={[-5, -3, -6]} intensity={0.4} />
      {cubies.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => (meshRefs.current[i] = el)}
          onPointerDown={onCubieDown(i)}
        >
          {/* width, height, depth, corner segments, corner radius */}
          <roundedBoxGeometry args={[0.94, 0.94, 0.94, 4, 0.11]} />
          {['px', 'nx', 'py', 'ny', 'pz', 'nz'].map((face, fi) => {
            const dir = new THREE.Vector3(
              face === 'px' ? 1 : face === 'nx' ? -1 : 0,
              face === 'py' ? 1 : face === 'ny' ? -1 : 0,
              face === 'pz' ? 1 : face === 'nz' ? -1 : 0
            );
            const col = stickerColor(c, dir);
            return (
              <meshStandardMaterial
                key={face}
                attach={`material-${fi}`}
                color={col || INNER}
                emissive={col || '#000000'}
                emissiveIntensity={col ? 0.2 : 0}
                roughness={col ? 0.55 : 0.6}
                metalness={0.05}
              />
            );
          })}
        </mesh>
      ))}
      <HintArrow hint={hint} moveRef={move} explodeRef={explode} />
      {/* trackball (not orbit) so the cube can tumble past the poles —
          flip it fully upside down to put yellow on top, white on bottom */}
      <TrackballControls ref={controlsRef} noPan noZoom rotateSpeed={2.4} dynamicDampingFactor={0.12} />
    </>
  );
}

const HINT_IDLE_MS = 5000;

export default function RubiksCube({ onSolved }) {
  const solvedRef = useRef(false);
  // stuck-detector: 5s without completing a turn offers a hint button on the
  // right; clicking it highlights the one layer to turn (yellow arrow shows
  // the direction — beginner's method, one move at a time). The offer and
  // the highlight both clear as soon as a turn happens.
  const [offerHint, setOfferHint] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const idleTimer = useRef(0);
  const armIdle = () => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setOfferHint(true), HINT_IDLE_MS);
  };
  useEffect(() => {
    armIdle();
    return () => clearTimeout(idleTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleMoveDone = (solved) => {
    setHintOn(false);
    setOfferHint(false);
    clearTimeout(idleTimer.current);
    if (!solved) armIdle();
  };
  return (
    // transparent canvas, no overlays or filters of its own — the cube
    // floats directly on the page's CRT backdrop with no visible bounds
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [4.9, 4.3, 5.3], fov: 38 }} dpr={[1, 1.75]}>
        <CubeSim onSolved={onSolved} solvedRef={solvedRef} hintOn={hintOn} onMoveDone={handleMoveDone} />
      </Canvas>
      {offerHint && !hintOn && (
        <button
          type="button"
          className="label-stx absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform hover:scale-110"
          style={{ '--r': '2deg' }}
          aria-label="Show a hint for the next move"
          onClick={() => {
            click();
            setOfferHint(false);
            setHintOn(true);
          }}
        >
          HINT?
        </button>
      )}
    </div>
  );
}
