import * as THREE from 'three';
import { AXES, FACE_COLORS, applyMoveInstant, isSolved, snapDir, stickerColor } from './cubeLogic.js';

/**
 * Layer-by-layer solver for the hint system, following the classic
 * beginner's method as taught at
 * https://ruwix.com/the-rubiks-cube/how-to-solve-the-rubiks-cube-beginners-method/
 * — same seven steps, same algorithms:
 *
 *   1. white cross        (intuitive)
 *   2. white corners      R' D' R D
 *   3. second layer       U R U' R' U' F' U F  /  U' L' U L U F U' F'
 *   4. yellow cross       F R U R' U' F'
 *   5. yellow edges       R U R' U R U2 R' U
 *   6. yellow corners     U R U' L' U R' U' L
 *   7. orient corners     R' D' R D
 *
 * solveBeginner(cubies) works on a clone of the logical state from
 * cubeLogic.js and returns the full move list, one quarter turn per entry:
 * { axis, layer, dir, token, faceColor, stage }. `token` is the algorithm
 * letter the move came from ("R'", "U2", …) in the frame the algorithm was
 * applied in; axis/layer/dir are world coordinates ready for
 * applyMoveInstant / highlighting. The solver never turns middle slices, and
 * it derives its face frame from the current center positions, so it copes
 * with any state the player can reach (including rotated centers).
 */

export const STAGES = {
  cross: {
    n: 1,
    title: 'white cross',
    tip: 'Make a white “+” on the white face. Each edge’s side color must match the center next to it.',
    alg: null,
  },
  corners: {
    n: 2,
    title: 'white corners',
    tip: 'Bring a white corner under its slot, then repeat the algorithm until it clicks in white-side-up.',
    alg: "R' D' R D",
  },
  second: {
    n: 3,
    title: 'second layer',
    tip: 'Match a top edge to its side center, then send it down-left or down-right into the middle row.',
    alg: "U R U' R' U' F' U F",
  },
  ycross: {
    n: 4,
    title: 'yellow cross',
    tip: 'Grow the yellow “+”: dot → L-shape → line → cross, one algorithm at a time.',
    alg: "F R U R' U' F'",
  },
  yedges: {
    n: 5,
    title: 'yellow edges',
    tip: 'Swap the yellow edges around until every one lines up with its side center.',
    alg: "R U R' U R U2 R' U",
  },
  ycorners: {
    n: 6,
    title: 'position yellow corners',
    tip: 'Cycle the last corners until each sits between its three matching centers (twisted is fine).',
    alg: "U R U' L' U R' U' L",
  },
  orient: {
    n: 7,
    title: 'orient yellow corners',
    tip: 'Repeat the algorithm until the corner shows yellow on top, then bring the next one in with U. It looks broken halfway — trust it!',
    alg: "R' D' R D",
  },
};

const COLOR_NAMES = {
  [FACE_COLORS.px]: 'red',
  [FACE_COLORS.nx]: 'orange',
  [FACE_COLORS.py]: 'white',
  [FACE_COLORS.ny]: 'yellow',
  [FACE_COLORS.pz]: 'green',
  [FACE_COLORS.nz]: 'blue',
};
export function colorName(hex) {
  return COLOR_NAMES[hex] || 'highlighted';
}

const SIDES = ['F', 'R', 'B', 'L'];

const key = (v) => `${Math.round(v.x)},${Math.round(v.y)},${Math.round(v.z)}`;
const eq = (a, b) => key(a) === key(b);
const add = (...vs) => {
  const out = new THREE.Vector3();
  for (const v of vs) out.add(v);
  return out;
};

function cloneCubies(cubies) {
  return cubies.map((c) => ({ p0: c.p0.clone(), pos: c.pos.clone(), quat: c.quat.clone() }));
}

/* right-handed face frame from an up vector and a front vector */
function makeFrame(u, f) {
  const U = u.clone().round();
  const F = f.clone().round();
  const R = new THREE.Vector3().crossVectors(U, F).round();
  return { U, D: U.clone().negate(), F, B: F.clone().negate(), R, L: R.clone().negate() };
}

/* the world dirs a cubie at pos shows stickers toward (1 per nonzero comp) */
function stickerDirs(pos) {
  const dirs = [];
  for (let i = 0; i < 3; i++) {
    const s = Math.round(pos.getComponent(i));
    if (s !== 0) dirs.push(new THREE.Vector3().setComponent(i, s));
  }
  return dirs;
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

class Solver {
  constructor(cubies) {
    this.st = cloneCubies(cubies);
    this.moves = [];
    // orient by centers: white up / green front for steps 1–2 (per ruwix),
    // then the cube is "flipped" — yellow up, green still front — for 3–7
    const up = this.centerDirOf(FACE_COLORS.py);
    const front = this.centerDirOf(FACE_COLORS.pz);
    this.f1 = makeFrame(up, front);
    this.f2 = makeFrame(up.clone().negate(), front);
  }

  /* ---------- state queries ---------- */

  cubieAt(pos) {
    const k = key(pos);
    return this.st.find((c) => key(c.pos) === k);
  }

  colorAt(pos, dir) {
    const c = this.cubieAt(pos);
    const local = dir.clone().applyQuaternion(c.quat.clone().invert());
    return stickerColor(c, snapDir(local));
  }

  centerDirOf(color) {
    for (const c of this.st) {
      if (Math.abs(c.p0.x) + Math.abs(c.p0.y) + Math.abs(c.p0.z) !== 1) continue;
      if (this.colorAt(c.pos, c.pos) === color) return c.pos.clone();
    }
    throw new Error('center not found');
  }

  centerColor(dir) {
    return this.colorAt(dir, dir);
  }

  /* find the edge / corner piece carrying exactly these sticker colors */
  findPiece(colors) {
    for (const c of this.st) {
      const m = Math.abs(c.p0.x) + Math.abs(c.p0.y) + Math.abs(c.p0.z);
      if (m !== colors.length) continue;
      const dirs = stickerDirs(c.pos);
      const cols = dirs.map((d) => this.colorAt(c.pos, d));
      if (sameSet(cols, colors)) return { pos: c.pos.clone(), dirs, cols };
    }
    throw new Error('piece not found: ' + colors.join());
  }

  sideOf(frame, v) {
    for (const s of SIDES) if (eq(frame[s], v)) return s;
    throw new Error('not a side vector');
  }

  /* ---------- move plumbing ---------- */

  quatFor(frame, token) {
    const n = frame[token[0]];
    const axis = [Math.abs(n.x), Math.abs(n.y), Math.abs(n.z)].indexOf(1);
    const s = Math.round(n.getComponent(axis));
    const dir = token.includes("'") ? s : -s; // clockwise = −90° about the outward normal
    return { axis, layer: s, dir };
  }

  turn(frame, token, stage) {
    const { axis, layer, dir } = this.quatFor(frame, token);
    const times = token.includes('2') ? 2 : 1;
    const faceColor = this.centerColor(frame[token[0]]);
    for (let k = 0; k < times; k++) {
      applyMoveInstant(this.st, axis, layer, dir);
      // second half of a double turn reads as a plain quarter turn
      const label = times === 2 && k === 1 ? token[0] : token;
      this.moves.push({ axis, layer, dir, token: label, faceColor, stage });
    }
  }

  run(frame, seq, stage) {
    for (const t of seq.split(' ')) this.turn(frame, t, stage);
  }

  /* the token (face / face' ) that rotates `from` (a position in that face's
     layer) onto `to`; throws if neither quarter turn does */
  chooseTurn(frame, face, from, to) {
    for (const t of [face, face + "'"]) {
      const { axis, dir } = this.quatFor(frame, t);
      const q = new THREE.Quaternion().setFromAxisAngle(AXES[axis], (dir * Math.PI) / 2);
      if (eq(from.clone().applyQuaternion(q).round(), to)) return t;
    }
    throw new Error('no quarter turn maps position');
  }

  /* rotate the U or D layer until `from` lands on `to` (0–3 quarter turns) */
  spinLayerTo(frame, face, from, to, stage) {
    const { axis, dir } = this.quatFor(frame, face);
    const q = new THREE.Quaternion().setFromAxisAngle(AXES[axis], (dir * Math.PI) / 2);
    const v = from.clone();
    for (let k = 0; k < 4; k++) {
      if (eq(v, to)) {
        this.spinLayer(frame, face, k, stage);
        return;
      }
      v.applyQuaternion(q).round();
    }
    throw new Error('spin target unreachable');
  }

  spinLayer(frame, face, k, stage) {
    k = ((k % 4) + 4) % 4;
    if (k === 0) return;
    this.turn(frame, k === 1 ? face : k === 2 ? face + '2' : face + "'", stage);
  }

  /* frame whose F/R pair equals the two given side symbols of `frame` */
  slotFrame(frame, [a, b]) {
    const fa = makeFrame(frame.U, frame[a]);
    if (eq(fa.R, frame[b])) return fa;
    return makeFrame(frame.U, frame[b]);
  }

  /* ---------- step 1: white cross ---------- */

  cross() {
    const f = this.f1;
    const white = this.centerColor(f.U);
    for (const side of SIDES) {
      const target = this.centerColor(f[side]);
      for (let guard = 0; ; guard++) {
        if (guard > 10) throw new Error('cross stuck');
        const e = this.findPiece([white, target]);
        const wd = e.dirs[e.cols.indexOf(white)];
        if (eq(e.pos, add(f.U, f[side])) && eq(wd, f.U)) break; // solved
        const uc = Math.round(e.pos.dot(f.U));
        if (uc === 1) {
          // top layer, wrong slot or flipped: drop it to the bottom
          const s = this.sideOf(f, add(e.pos, f.D));
          this.turn(f, s + '2', 'cross');
        } else if (uc === 0) {
          // middle layer: if the non-white face is the target side, lift it
          // straight in; otherwise dump it to the bottom (protecting the top)
          const A = this.sideOf(f, wd);
          const B = this.sideOf(f, add(e.pos, f[A].clone().negate()));
          if (B === side) {
            this.turn(f, this.chooseTurn(f, side, e.pos, add(f.U, f[side])), 'cross');
          } else {
            const t = this.chooseTurn(f, A, e.pos, add(f[A], f.D));
            this.turn(f, t, 'cross');
            this.turn(f, 'D', 'cross');
            this.turn(f, t.includes("'") ? A : A + "'", 'cross');
          }
        } else if (eq(wd, f.D)) {
          // bottom, white facing down: slide under the target, double turn up
          this.spinLayerTo(f, 'D', e.pos, add(f.D, f[side]), 'cross');
          this.turn(f, side + '2', 'cross');
        } else {
          // bottom, white facing sideways: park it next to the target column,
          // feed it into the middle, lift it in, restore the helper face
          const nbr = SIDES.find((x) => f[x].dot(f[side]) === 0);
          this.spinLayerTo(f, 'D', e.pos, add(f.D, f[nbr]), 'cross');
          const t1 = this.chooseTurn(f, nbr, add(f.D, f[nbr]), add(f[nbr], f[side]));
          this.turn(f, t1, 'cross');
          this.turn(f, this.chooseTurn(f, side, add(f[nbr], f[side]), add(f.U, f[side])), 'cross');
          this.turn(f, t1.includes("'") ? nbr : nbr + "'", 'cross');
        }
      }
    }
  }

  /* ---------- step 2: white corners (R' D' R D) ---------- */

  whiteCorners() {
    const f = this.f1;
    const white = this.centerColor(f.U);
    for (const slot of [['F', 'R'], ['R', 'B'], ['B', 'L'], ['L', 'F']]) {
      const cols = [white, this.centerColor(f[slot[0]]), this.centerColor(f[slot[1]])];
      const home = add(f.U, f[slot[0]], f[slot[1]]);
      for (let guard = 0; ; guard++) {
        if (guard > 20) throw new Error('white corners stuck');
        const c = this.findPiece(cols);
        const wd = c.dirs[c.cols.indexOf(white)];
        if (eq(c.pos, home) && eq(wd, f.U)) break;
        if (Math.round(c.pos.dot(f.U)) === 1) {
          // sitting in the top layer (wrong slot or twisted): pop it out
          const sides = SIDES.filter((s) => f[s].dot(c.pos) > 0);
          this.run(this.slotFrame(f, sides), "R' D' R", 'corners');
        } else {
          // ruwix: hold it under its slot, repeat R' D' R D until it clicks
          this.spinLayerTo(f, 'D', c.pos, add(f.D, f[slot[0]], f[slot[1]]), 'corners');
          this.run(this.slotFrame(f, slot), "R' D' R D", 'corners');
        }
      }
    }
  }

  /* ---------- step 3: second layer ---------- */

  secondLayer() {
    const f = this.f2; // yellow now up
    const colToSide = {};
    for (const s of SIDES) colToSide[this.centerColor(f[s])] = s;
    for (const [a, b] of [['F', 'R'], ['R', 'B'], ['B', 'L'], ['L', 'F']]) {
      const ca = this.centerColor(f[a]);
      const cb = this.centerColor(f[b]);
      for (let guard = 0; ; guard++) {
        if (guard > 12) throw new Error('second layer stuck');
        const e = this.findPiece([ca, cb]);
        const da = e.dirs[e.cols.indexOf(ca)];
        if (eq(e.pos, add(f[a], f[b])) && eq(da, f[a])) break; // solved
        if (Math.round(e.pos.dot(f.U)) === 1) {
          // in the top layer: line its side sticker up over the matching
          // center, then insert right or left (ruwix step 3 algorithms)
          const si = e.dirs.findIndex((d) => Math.round(d.dot(f.U)) === 0);
          const front = colToSide[e.cols[si]];
          const dest = colToSide[e.cols[1 - si]];
          this.spinLayerTo(f, 'U', e.pos, add(f.U, f[front]), 'second');
          const lf = makeFrame(f.U, f[front]);
          if (eq(lf.R, f[dest])) this.run(lf, "U R U' R' U' F' U F", 'second');
          else this.run(lf, "U' L' U L U F U' F'", 'second');
        } else {
          // stuck in the middle (wrong slot or flipped): pop it up top
          const sides = SIDES.filter((s) => f[s].dot(e.pos) > 0);
          this.run(this.slotFrame(f, sides), "U R U' R' U' F' U F", 'second');
        }
      }
    }
  }

  /* ---------- step 4: yellow cross (F R U R' U' F') ---------- */

  yellowCross() {
    const f = this.f2;
    const yellow = this.centerColor(f.U);
    for (let guard = 0; ; guard++) {
      if (guard > 6) throw new Error('yellow cross stuck');
      const up = SIDES.filter((s) => this.colorAt(add(f.U, f[s]), f.U) === yellow);
      if (up.length === 4) return;
      let lf = f;
      if (up.length === 2) {
        const opposite = f[up[0]].dot(f[up[1]]) < 0;
        for (const g of SIDES) {
          const cand = makeFrame(f.U, f[g]);
          // ruwix: hold the L-shape back-left, the line horizontal
          const ok = opposite
            ? sameSet(up.map((s) => key(f[s])), [key(cand.L), key(cand.R)])
            : sameSet(up.map((s) => key(f[s])), [key(cand.B), key(cand.L)]);
          if (ok) {
            lf = cand;
            break;
          }
        }
      }
      this.run(lf, "F R U R' U' F'", 'ycross');
    }
  }

  /* ---------- step 5: yellow edges (R U R' U R U2 R' U) ---------- */

  yellowEdges() {
    const f = this.f2;
    for (let guard = 0; ; guard++) {
      if (guard > 10) throw new Error('yellow edges stuck');
      // spin the top layer to line up as many edges as possible
      let best = { k: 0, n: -1 };
      const { axis, dir } = this.quatFor(f, 'U');
      const q = new THREE.Quaternion().setFromAxisAngle(AXES[axis], (dir * Math.PI) / 2);
      for (let k = 0; k < 4; k++) {
        let n = 0;
        for (const s of SIDES) {
          // after k clockwise turns, the sticker now facing f[s] faces rot^k(f[s])
          const to = f[s].clone();
          for (let i = 0; i < k; i++) to.applyQuaternion(q).round();
          if (this.colorAt(add(f.U, f[s]), f[s]) === this.centerColor(to)) n++;
        }
        if (n > best.n) best = { k, n };
      }
      this.spinLayer(f, 'U', best.k, 'yedges');
      if (best.n === 4) return;
      // pick the hold whose swap makes the most progress (ruwix: solved
      // edges to the back and right), then apply the swap algorithm
      let lf = f;
      let bestScore = -1;
      for (const g of SIDES) {
        const cand = makeFrame(f.U, f[g]);
        const probe = new Solver(this.st);
        probe.f2 = f;
        probe.run(cand, "R U R' U R U2 R' U", 'x');
        let score = 0;
        for (let k = 0; k < 4; k++) {
          let n = 0;
          for (const s of SIDES) {
            const to = f[s].clone();
            for (let i = 0; i < k; i++) to.applyQuaternion(q).round();
            if (probe.colorAt(add(f.U, f[s]), f[s]) === probe.centerColor(to)) n++;
          }
          score = Math.max(score, n);
        }
        if (score > bestScore) {
          bestScore = score;
          lf = cand;
        }
      }
      this.run(lf, "R U R' U R U2 R' U", 'yedges');
    }
  }

  /* ---------- step 6: position yellow corners (U R U' L' U R' U' L) ---------- */

  placedCorners(frame) {
    const yellow = this.centerColor(frame.U);
    const out = [];
    for (const pair of [['F', 'R'], ['R', 'B'], ['B', 'L'], ['L', 'F']]) {
      const pos = add(frame.U, frame[pair[0]], frame[pair[1]]);
      const want = [yellow, this.centerColor(frame[pair[0]]), this.centerColor(frame[pair[1]])];
      const have = stickerDirs(pos).map((d) => this.colorAt(pos, d));
      if (sameSet(have, want)) out.push(pair);
    }
    return out;
  }

  yellowCornersPosition() {
    const f = this.f2;
    for (let guard = 0; ; guard++) {
      if (guard > 10) throw new Error('yellow corner position stuck');
      if (this.placedCorners(f).length === 4) return;
      // hold so a solved corner (if any) stays fixed at front-right; pick
      // the hold that places the most corners after one application
      let lf = makeFrame(f.U, f.F);
      let bestScore = -1;
      for (const g of SIDES) {
        const cand = makeFrame(f.U, f[g]);
        const probe = new Solver(this.st);
        probe.run(cand, "U R U' L' U R' U' L", 'x');
        const score = probe.placedCorners(f).length;
        if (score > bestScore) {
          bestScore = score;
          lf = cand;
        }
      }
      this.run(lf, "U R U' L' U R' U' L", 'ycorners');
    }
  }

  /* ---------- step 7: orient yellow corners (R' D' R D) ---------- */

  yellowCornersOrient() {
    const f = this.f2;
    const yellow = this.centerColor(f.U);
    const ufr = add(f.U, f.F, f.R);
    for (let guard = 0; guard < 8; guard++) {
      const bad = [];
      for (const pair of [['F', 'R'], ['R', 'B'], ['B', 'L'], ['L', 'F']]) {
        const pos = add(f.U, f[pair[0]], f[pair[1]]);
        if (this.colorAt(pos, f.U) !== yellow) bad.push(pos);
      }
      if (!bad.length) break;
      // bring an unsolved corner to front-right-top with U turns only —
      // never rotate the whole cube mid-step (ruwix's big warning)
      const { axis, dir } = this.quatFor(f, 'U');
      const q = new THREE.Quaternion().setFromAxisAngle(AXES[axis], (dir * Math.PI) / 2);
      let bestK = 4;
      for (const p of bad) {
        const v = p.clone();
        for (let k = 0; k < 4; k++) {
          if (eq(v, ufr)) {
            bestK = Math.min(bestK, k);
            break;
          }
          v.applyQuaternion(q).round();
        }
      }
      this.spinLayer(f, 'U', bestK, 'orient');
      // R' D' R D twice returns the corner to its spot, one twist further;
      // repeat until it shows yellow (the lower layers look wrecked
      // in between — they restore themselves, as ruwix promises)
      for (let h = 0; h < 3 && this.colorAt(ufr, f.U) !== yellow; h++) {
        this.run(f, "R' D' R D", 'orient');
        this.run(f, "R' D' R D", 'orient');
      }
    }
    // final touch: line the finished top layer up with the centers
    const matchedAfter = (k) => {
      const { axis, dir } = this.quatFor(f, 'U');
      const q = new THREE.Quaternion().setFromAxisAngle(AXES[axis], (dir * Math.PI) / 2);
      let n = 0;
      for (const s of SIDES) {
        const to = f[s].clone();
        for (let i = 0; i < k; i++) to.applyQuaternion(q).round();
        if (this.colorAt(add(f.U, f[s]), f[s]) === this.centerColor(to)) n++;
      }
      return n;
    };
    for (let k = 0; k < 4; k++) {
      if (matchedAfter(k) === 4) {
        this.spinLayer(f, 'U', k, 'orient');
        return;
      }
    }
  }

  solve() {
    this.cross();
    this.whiteCorners();
    this.secondLayer();
    this.yellowCross();
    this.yellowEdges();
    this.yellowCornersPosition();
    this.yellowCornersOrient();
    if (!isSolved(this.st)) throw new Error('beginner solve failed');
    return this.mergeMoves();
  }

  /* cancel/fold consecutive turns of the same layer within a stage */
  mergeMoves() {
    const out = [];
    for (const m of this.moves) {
      const last = out[out.length - 1];
      if (last && last.stage === m.stage && last.axis === m.axis && last.layer === m.layer) {
        if (last.dir + m.dir === 0) {
          out.pop();
          continue;
        }
      }
      out.push(m);
    }
    return out;
  }
}

export function solveBeginner(cubies) {
  return new Solver(cubies).solve();
}
