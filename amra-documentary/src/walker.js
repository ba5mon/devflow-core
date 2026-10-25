// Jointed paper silhouettes: every limb is its own cut sheet pinned at the joint, and only rotates (paper on a stick).
// Figures face +x at scale 1; flip with dir = -1. Coordinates in figure units (height 1), origin at the feet.
import * as THREE from 'three';
import { sheet } from './paper.js';
import { TAU } from './lib.js';

// smooth closed outline through points (Catmull-Rom → Bézier); a third value 1 = sharp corner
export function spline(x, s, pts, k = 1 / 6) {
  const n = pts.length, P = i => pts[(i + n) % n];
  x.beginPath(); x.moveTo(pts[0][0] * s, pts[0][1] * s);
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = p1[2] ? p1 : [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = p2[2] ? p2 : [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    x.bezierCurveTo(c1[0] * s, c1[1] * s, c2[0] * s, c2[1] * s, p2[0] * s, p2[1] * s);
  }
  x.closePath();
}
// a tapered limb from (x0,y0) to (x1,y1)
function limb(x, x0, y0, x1, y1, w0, w1) {
  const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
  x.beginPath();
  x.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); x.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  x.arc(x1, y1, w1 / 2, a + Math.PI / 2, a - Math.PI / 2, true);
  x.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  x.arc(x0, y0, w0 / 2, a - Math.PI / 2, a + Math.PI / 2, true);
  x.fill();
}

// body proportions (figure units)
const HIP = .5, KNEE = .27, ANKLE = .045, SH = .765, ELB = .6, WRIST = .45;

// hooded teen torso + head, anchored at the hip (0, HIP)
const HOODIE = [[.02, .985], [.07, .965], [.098, .925], [.104, .885, 1], [.085, .87], [.075, .84], [.07, .81], [.083, .78], [.088, .7], [.08, .6], [.072, .52], [.068, .47, 1],
  [-.07, .47, 1], [-.074, .53], [-.082, .63], [-.088, .72], [-.084, .79], [-.09, .86], [-.08, .93], [-.045, .975]];
const JACKET = [[.03, .975], [.07, .955], [.088, .92], [.092, .885, 1], [.072, .868], [.066, .84], [.058, .815], [.08, .785], [.09, .7], [.085, .6], [.08, .515], [.074, .47, 1],
  [-.07, .47, 1], [-.076, .54], [-.08, .64], [-.084, .73], [-.078, .8], [-.07, .84], [-.07, .9], [-.05, .955]];

export const BUILDS = {
  hood: { torso: HOODIE, legW: [.085, .062, .05], armW: [.06, .048] },
  jacket: { torso: JACKET, legW: [.08, .058, .048], armW: [.056, .044] },
};

// one jointed part: drawn in joint-local figure units (joint at 0,0), bbox [x0,y0,x1,y1]; the mesh origin is the joint
function part(U, col, s, bb, draw, o = {}) {
  const [x0, y0, x1, y1] = bb, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const m = sheet({ U, w: (x1 - x0) * s, h: (y1 - y0) * s, trans: o.trans ?? .06, ppm: o.ppm ?? 9000, shadow: o.shadow ?? true, recv: o.recv ?? true,
    finish: { rimPx: 2, underPx: 2 }, draw: (x) => { x.fillStyle = col; x.translate(-cx * s, -cy * s); draw(x, s); } });
  m.geometry.translate(cx * s, cy * s, 0); m.position.set(0, 0, o.z ?? 0);
  return m;
}
const grp = (x, y, z, parent) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

// Build one walker. Returns { g, pose(phase, o) }
export function walker(U, { s = .06, col = '#121a38', build = 'hood', dir = 1, z = 0, trans } = {}) {
  const B = BUILDS[build], [lw0, lw1, lw2] = B.legW, [aw0, aw1] = B.armW;
  const g = new THREE.Group(); g.position.z = z; g.scale.x = dir;
  const body = grp(0, 0, 0, g);
  const far = shade(col, -.3);
  const legs = [], arms = [];
  const TH = KNEE - HIP, SHN = ANKLE - KNEE, UA = ELB - SH, FA = WRIST - ELB;
  for (const [c, dz] of [[far, -.0009], [col, .0009]]) {
    const hip = grp(0, HIP * s, dz, body);
    hip.add(part(U, c, s, [-.07, TH - .05, .07, .05], (x, s) => limb(x, 0, .0, 0, TH * s, lw0 * s, lw1 * s), { trans }));
    const knee = grp(0, TH * s, .0001, hip);
    knee.add(part(U, c, s, [-.07, SHN - .05, .17, .05], (x, s) => {
      limb(x, 0, 0, 0, SHN * s, lw1 * s, lw2 * s);
      spline(x, s, [[-.03, SHN + .03], [.03, SHN + .028], [.1, SHN - .005], [.125, SHN - .03, 1], [-.035, SHN - .03, 1], [-.04, SHN]]); x.fill();
    }, { trans }));
    legs.push({ hip, knee });
    const sh = grp(0, SH * s, dz * 1.6, body);
    sh.add(part(U, c, s, [-.06, UA - .05, .06, .05], (x, s) => limb(x, 0, 0, 0, UA * s, aw0 * s, aw1 * s * 1.05), { trans }));
    const el = grp(0, UA * s, .0001, sh);
    el.add(part(U, c, s, [-.06, FA - .07, .06, .05], (x, s) => { limb(x, 0, 0, 0, FA * s, aw1 * s, aw1 * .85 * s); x.beginPath(); x.ellipse(0, (FA - .02) * s, .026 * s, .032 * s, 0, 0, TAU); x.fill(); }, { trans }));
    arms.push({ sh, el });
  }
  const torsoPivot = grp(0, HIP * s, 0, body);
  torsoPivot.add(part(U, col, s, [-.13, -.06, .13, 1 - HIP + .02], (x, s) => { spline(x, s, B.torso.map(([px, py, c]) => [px, py - HIP, c])); x.fill(); }, { trans }));

  return {
    g, s, legs, arms, torsoPivot, body,
    // phase in radians (one full stride cycle = TAU)
    pose(ph, o = {}) {
      const amp = o.amp ?? 1, lean = o.lean ?? .05;
      for (let i = 0; i < 2; i++) {
        const p = ph + i * Math.PI;
        legs[i].hip.rotation.z = .4 * amp * Math.sin(p);
        legs[i].knee.rotation.z = -(.06 + .85 * amp * Math.pow(Math.max(0, Math.cos(p + .35)), 2));
        arms[i].sh.rotation.z = -.3 * amp * Math.sin(p) + (o.armOff ?? 0) - .04;
        arms[i].el.rotation.z = .22 + .16 * amp * Math.max(0, -Math.sin(p)) + (o.elbow ?? 0);
      }
      torsoPivot.rotation.z = -lean - .015 * Math.sin(2 * ph);
      body.position.y = s * .012 * amp * (Math.cos(2 * ph) * .5 + .5);
    },
  };
}
// stride length per full cycle in metres for a figure of height s (no foot sliding: tie phase to distance)
export const STRIDE = s => 2 * 2 * (HIP - ANKLE) * Math.sin(.4) * s;

export function shade(hex, k) {
  const c = new THREE.Color(hex); const h = {}; c.getHSL(h); c.setHSL(h.h, h.s, Math.max(0, Math.min(1, h.l * (1 + k)))); return '#' + c.getHexString();
}

// A small moped with a rider: frame sheet + two wheel sheets that roll by distance / radius
export function moped(U, { s = .06, col = '#0f1530', dir = 1, z = 0 } = {}) {
  const g = new THREE.Group(); g.position.z = z; g.scale.x = dir;
  const R = .085;
  const wheel = (wx) => {
    const m = sheet({ U, w: R * 2.2 * s, h: R * 2.2 * s, z: .0008, trans: .05, ppm: 9000, finish: { rimPx: 2, underPx: 2 }, draw: (x) => {
      x.fillStyle = col; x.beginPath(); x.arc(0, 0, R * s, 0, TAU); x.fill();
      // cut spokes / hub ring so the roll reads
      x.globalCompositeOperation = 'destination-out';
      x.beginPath(); x.arc(0, 0, R * .62 * s, 0, TAU); x.arc(0, 0, R * .25 * s, 0, TAU, true); x.fill();
      x.globalCompositeOperation = 'source-over'; x.fillStyle = col;
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.save(); x.rotate(a); x.fillRect(-R * .06 * s, 0, R * .12 * s, R * .64 * s); x.restore(); }
    } });
    m.position.set(wx * s, R * s, .0008); g.add(m); return m;
  };
  const bodyM = sheet({ U, w: .9 * s, h: 1.1 * s, z: 0, trans: .05, ppm: 9000, finish: { rimPx: 2, underPx: 2 }, draw: (x) => {
    x.fillStyle = col; x.save(); x.translate(0, -.55 * s);
    // scooter body: rear cowl, floorboard, front shield, handlebar post
    spline(x, s, [[-.36, .1, 1], [-.36, .2], [-.3, .27], [-.12, .27], [-.04, .2], [.14, .17], [.2, .19], [.25, .33], [.27, .45], [.3, .47, 1], [.33, .45, 1], [.3, .3], [.26, .14], [.3, .1, 1]]); x.fill();
    // rider (hooded), seated, hands on the bar
    spline(x, s, [[-.2, .27, 1], [-.22, .4], [-.22, .55], [-.2, .68], [-.19, .74], [-.21, .8], [-.2, .87], [-.15, .92], [-.1, .925], [-.06, .9], [-.045, .86, 1], [-.06, .85], [-.07, .82], [-.085, .79], [-.07, .76], [-.05, .7],
      [.06, .55], [.25, .47], [.27, .44], [.24, .43], [.05, .5], [-.04, .56], [-.06, .45], [.02, .4], [.1, .32], [.12, .2], [.16, .19, 1], [.17, .17, 1], [.06, .17], [.03, .3], [-.06, .33], [-.12, .27, 1]]); x.fill();
    x.restore();
  } });
  bodyM.geometry.translate(0, .55 * s, 0); g.add(bodyM);
  const back = wheel(-.26), front = wheel(.28);
  return { g, s, roll(dist) { const a = -dist / (R * this.s); back.rotation.z = a; front.rotation.z = a; } };
}
