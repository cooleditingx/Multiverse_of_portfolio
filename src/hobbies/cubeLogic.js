import * as THREE from 'three';

/**
 * Pure logical model for the 3×3 cube: 27 cubies, each with an original
 * position `p0` (which fixes its sticker colors), a current grid position
 * `pos`, and a quaternion `quat`. Kept free of React/r3f so it can be
 * unit-tested standalone.
 */
/* brightened 80s-cube palette: red, orange, ivory,
   yellow, green, blue */
export const FACE_COLORS = {
  px: '#c93a52', nx: '#e07f28',
  py: '#f2ead2', ny: '#e5c53c',
  pz: '#2c9a5f', nz: '#3f7ec4',
};

export const AXES = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 1),
];

export const SCRAMBLE_MOVES = 5;

export function snapDir(v) {
  const a = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];
  const i = a.indexOf(Math.max(...a));
  const out = new THREE.Vector3();
  out.setComponent(i, Math.sign(v.getComponent(i)));
  return out;
}

export function stickerColor(cubie, localDir) {
  // which local face is this, and does the cubie have a sticker there?
  const i = [Math.abs(localDir.x), Math.abs(localDir.y), Math.abs(localDir.z)].indexOf(1);
  const sign = Math.sign(localDir.getComponent(i));
  if (Math.round(cubie.p0.getComponent(i)) !== sign) return null; // interior face
  const key = (sign > 0 ? 'p' : 'n') + 'xyz'[i];
  return FACE_COLORS[key];
}

export function makeCubies() {
  const cubies = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++)
        cubies.push({
          p0: new THREE.Vector3(x, y, z),
          pos: new THREE.Vector3(x, y, z),
          quat: new THREE.Quaternion(),
        });
  return cubies;
}

/**
 * Fully general solved check (survives middle-slice turns): for each of the
 * 6 world faces, every visible sticker must resolve to the same color.
 */
export function isSolved(cubies) {
  const inv = new THREE.Quaternion();
  const local = new THREE.Vector3();
  for (let axis = 0; axis < 3; axis++) {
    for (const sign of [-1, 1]) {
      const d = new THREE.Vector3().setComponent(axis, sign);
      let color = null;
      for (const c of cubies) {
        if (Math.round(c.pos.getComponent(axis)) !== sign) continue;
        inv.copy(c.quat).invert();
        local.copy(d).applyQuaternion(inv);
        const col = stickerColor(c, snapDir(local));
        if (!col) return false;
        if (color === null) color = col;
        else if (col !== color) return false;
      }
    }
  }
  return true;
}

/** Instantly apply a 90° layer turn to the logical state. */
export function applyMoveInstant(cubies, axis, layer, dir) {
  const q = new THREE.Quaternion().setFromAxisAngle(AXES[axis], (dir * Math.PI) / 2);
  for (const c of cubies) {
    if (Math.round(c.pos.getComponent(axis)) !== layer) continue;
    c.pos.applyQuaternion(q).round();
    c.quat.premultiply(q);
  }
}

/**
 * Shallow scramble (outer layers only) so real visitors can actually solve
 * it — raise SCRAMBLE_MOVES for masochists.
 */
export function scramble(cubies) {
  let last = null;
  for (let i = 0; i < SCRAMBLE_MOVES; i++) {
    let axis, layer, dir;
    do {
      axis = Math.floor(Math.random() * 3);
      layer = Math.random() < 0.5 ? -1 : 1;
      dir = Math.random() < 0.5 ? -1 : 1;
    } while (last && last[0] === axis && last[1] === layer);
    applyMoveInstant(cubies, axis, layer, dir);
    last = [axis, layer, dir];
  }
  if (isSolved(cubies)) scramble(cubies); // astronomically unlikely, but free
}
