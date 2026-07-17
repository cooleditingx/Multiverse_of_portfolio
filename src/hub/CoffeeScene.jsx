import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../lib/hooks';

/**
 * The coffee.glb model (public/coffee.glb) floating in zero gravity inside
 * whatever container mounts it (the canvas fills its nearest positioned
 * parent): a slow turntable spin with a lazy tilt, bobbing gently in place.
 * Loose translucent ice cubes orbit and tumble around the cup.
 */

const MODEL_URL = '/coffee.glb';
// self-hosted Draco decoder (public/draco/, copied from three's
// examples/jsm/libs/draco/gltf) — drei's default is a gstatic.com CDN URL,
// which the site's CSP blocks
const DRACO_PATH = '/draco/';
const MODEL_SIZE = 1.45; // world units, longest side after normalization

// orbiting ice: orbit radii (rx/rz), height, speeds, phase, cube size
const ICE_CUBES = [
  { rx: 1.15, rz: 0.6, y: 0.5, speed: 0.16, bob: 0.4, spin: 0.5, phase: 0.0, s: 0.14 },
  { rx: 1.45, rz: 0.8, y: -0.2, speed: 0.12, bob: 0.33, spin: 0.7, phase: 1.4, s: 0.11 },
  { rx: 1.0, rz: 0.5, y: -0.55, speed: 0.2, bob: 0.5, spin: 0.4, phase: 2.6, s: 0.09 },
  { rx: 1.6, rz: 0.9, y: 0.15, speed: 0.1, bob: 0.28, spin: 0.6, phase: 3.7, s: 0.15 },
  { rx: 1.25, rz: 0.7, y: 0.8, speed: 0.14, bob: 0.45, spin: 0.55, phase: 4.9, s: 0.1 },
  { rx: 0.9, rz: 0.45, y: -0.85, speed: 0.18, bob: 0.36, spin: 0.65, phase: 5.8, s: 0.08 },
];

/** coffee.glb, centered on its bounding box and scaled to MODEL_SIZE. */
function CoffeeModel() {
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return {
      scale: MODEL_SIZE / Math.max(size.x, size.y, size.z),
      offset: center.negate(),
    };
  }, [scene]);
  return (
    <group scale={scale}>
      <primitive object={scene} position={offset} />
    </group>
  );
}

function FloatingCoffee({ reduced }) {
  const drift = useRef(); // gentle zero-g bob around the center
  const model = useRef(); // turntable spin + lazy tilt
  const ice = useRef();   // loose cubes orbiting the cup

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    if (drift.current) {
      drift.current.position.x = Math.sin(t * 0.12) * 0.2;
      drift.current.position.y = Math.sin(t * 0.09 + 1.7) * 0.28;
    }
    if (model.current) {
      // spin around the vertical axis with an oscillating tilt: the cup's
      // silhouette stays readable, so its apparent size never jumps the way
      // the old end-over-end tumble (side view → top-down blob) did
      model.current.rotation.y = 0.6 + t * 0.45;
      model.current.rotation.x = 0.35 + Math.sin(t * 0.18) * 0.22;
      model.current.rotation.z = Math.sin(t * 0.15) * 0.1;
    }
    if (ice.current) {
      ice.current.children.forEach((cube, i) => {
        const c = ICE_CUBES[i];
        cube.position.x = Math.cos(t * c.speed + c.phase) * c.rx;
        cube.position.z = Math.sin(t * c.speed + c.phase) * c.rz;
        cube.position.y = c.y + Math.sin(t * c.bob + c.phase) * 0.25;
        cube.rotation.x = t * c.spin;
        cube.rotation.y = t * c.spin * 0.7;
      });
    }
  });

  return (
    <group ref={drift}>
      {/* initial pose doubles as the reduced-motion still */}
      <group ref={model} rotation={[0.35, 0.6, 0]}>
        <CoffeeModel />
      </group>
      <group ref={ice}>
        {/* clear glassy ice: colorless, rounded edges, crisp highlights */}
        {ICE_CUBES.map((c, i) => (
          <RoundedBox
            key={i}
            args={[c.s, c.s, c.s]}
            radius={c.s * 0.18}
            smoothness={3}
            position={[Math.cos(c.phase) * c.rx, c.y, Math.sin(c.phase) * c.rz]}
          >
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.22}
              roughness={0.03}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.05}
              side={2}
            />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}

export default function CoffeeScene() {
  const reduced = usePrefersReducedMotion();
  return (
    // fills its positioned parent (the about section's coffee column),
    // purely decorative, never blocking clicks
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas camera={{ position: [0, 0.2, 5.4], fov: 40 }} dpr={[1, 1.75]}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color="#f4c86b" />
        <directionalLight position={[-3, 1, 4]} intensity={0.4} color="#ffffff" />
        <pointLight position={[-4, -2, 2]} intensity={0.5} color="#8b5cf6" />
        <Suspense fallback={null}>
          <FloatingCoffee reduced={reduced} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL, DRACO_PATH);
