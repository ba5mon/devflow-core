// Scene 2 · Rouen: the old city's spires give way to the tower blocks of an estate; teenagers walk between them, a scooter passes.
import { sheet, skyPanel } from '../paper.js';
import { stage, aim } from '../stage.js';
import { walker, moped, STRIDE } from '../walker.js';
import { seg, ss, eio, lerp, mulberry, TAU } from '../lib.js';

const BW = .558, BH = .328;
const full = (U, z, trans, draw, o = {}) => sheet({ U, w: BW, h: BH, z, trans, draw, ...o });

function poly(x, P) { x.beginPath(); x.moveTo(P[0][0], P[0][1]); for (const p of P.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); }

// Rouen skyline: the cathedral (lantern tower + iron needle, two west towers), Saint-Ouen, roofs
function skyline(x, col) {
  x.fillStyle = col;
  const base = -.02;
  x.fillRect(-.28, -.165, .56, base + .165);
  // roofs along the river
  const R = mulberry(4);
  for (let px = -.28; px < .3; px += .018 + R() * .014) { const h = .012 + R() * .02, w = .02 + R() * .016; poly(x, [[px, base], [px, base + h], [px + w * .5, base + h + .01 + R() * .006], [px + w, base + h], [px + w, base]]); }
  // cathedral at x ≈ -.17
  const cx = -.17;
  x.fillRect(cx - .05, base, .1, .03);                              // nave
  for (const [tx, w, h] of [[cx - .056, .018, .062], [cx - .03, .016, .05]]) {   // west towers
    x.fillRect(tx - w / 2, base, w, h); poly(x, [[tx - w / 2, base + h], [tx, base + h + .012], [tx + w / 2, base + h]]);
    for (let k = -1; k <= 1; k += 2) x.fillRect(tx + k * w * .45 - .0012, base + h, .0024, .008);
  }
  x.fillRect(cx + .005 - .011, base, .022, .068);                    // lantern tower
  poly(x, [[cx + .005 - .009, base + .068], [cx + .005, base + .2], [cx + .005 + .009, base + .068]]);   // the needle
  for (let k = 0; k < 6; k++) { const y = base + .075 + k * .02, w = .009 * (1 - k / 7); x.fillRect(cx + .005 - w - .002, y, .002, .006); x.fillRect(cx + .005 + w, y, .002, .006); }
  // Saint-Ouen at x ≈ -.06
  x.fillRect(-.075, base, .07, .022); x.fillRect(-.05, base, .02, .075); poly(x, [[-.052, base + .075], [-.04, base + .095], [-.028, base + .075]]);
  // a few more spires
  for (const [sx, h] of [[-.235, .05], [-.11, .045], [.02, .04]]) { x.fillRect(sx - .004, base, .008, h); poly(x, [[sx - .005, base + h], [sx, base + h + .025], [sx + .005, base + h]]); }
}

// estate tower blocks with windows; glow = true paints only the lit windows (emissive map)
function blocks(x, col, glow) {
  const R = mulberry(9), base = -.06;
  const B = [[.0, .07, .16], [.085, .05, .12], [.15, .075, .19], [.245, .06, .14], [-.07, .045, .09]];
  for (const [bx, w, h] of B) {
    if (!glow) { x.fillStyle = col; x.fillRect(bx - w / 2, base, w, h - base * 0 + .0); x.fillRect(bx - w / 2 - .002, base + h, w + .004, .003); }
    const rows = Math.floor(h / .0105), cols = Math.max(3, Math.floor(w / .0095));
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols; c++) {
      const wx = bx - w / 2 + (c + .5) * (w / cols) - .0022, wy = base + .012 + r * .0105;
      const lit = R() < .22, a = .5 + R() * .5;
      if (glow) { if (lit) { x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(wx, wy, .0044, .005); } }
      else { x.fillStyle = lit ? '#e8d6b2' : '#28365c'; x.fillRect(wx, wy, .0044, .005); x.fillStyle = col; }
    }
  }
}

export function build(E) {
  const LP = [.06, .07, -.13];
  const S = stage({ light: LP, lightR: .2, lightCol: '#f1e3c8', key: 1.1, amb: .34, ambCol: '#7f90bc', keyCol: '#d6def8' });
  const { U } = S;
  S.add(skyPanel({ w: .56, h: .33, z: -.14, stops: [[0, '#0a1124'], [.55, '#1c2a4c'], [1, '#43557c']], stars: 0, gain: 1.0 }));
  S.add(full(U, -.118, .62, x => skyline(x, '#7b8db6')));
  S.add(full(U, -.098, .42, x => {   // old-town roofs, nearer, lower
    x.fillStyle = '#56699a'; const R = mulberry(12), base = -.055; x.fillRect(-.28, -.165, .56, base + .165);
    for (let px = -.28; px < .06; px += .022 + R() * .02) { const h = .02 + R() * .025, w = .026 + R() * .02; poly(x, [[px, base], [px, base + h], [px + w * .5, base + h + .016], [px + w, base + h], [px + w, base]]); if (R() < .5) x.fillRect(px + w * .7, base + h, .004, .014); }
  }));
  S.add(full(U, -.078, .28, x => blocks(x, '#34456f', false), { glowDraw: g => blocks(g, null, true), glow: 1.6, glowCol: '#ffc27a' }));
  // ground the back pair walks on
  S.add(full(U, -.058, .14, x => { x.fillStyle = '#1e2a4d'; x.fillRect(-.28, -.165, .56, .165 - .088); }));
  // pavement for the main group, with a lamp post
  S.add(full(U, -.04, .08, x => {
    x.fillStyle = '#222e58'; x.fillRect(-.28, -.165, .56, .165 - .102);
    x.fillRect(.115, -.105, .0028, .09); x.fillRect(.104, -.017, .016, .0028);
  }, { glowDraw: g => { g.fillStyle = '#fff'; g.fillRect(.104, -.0205, .012, .0035); }, glow: 2.2, glowCol: '#ffd9a0' }));
  // foreground: a low wall and a hedge
  S.add(full(U, -.014, .04, x => {
    x.fillStyle = '#090d1f'; x.fillRect(-.28, -.165, .56, .165 - .128);
    const R = mulberry(31); x.beginPath(); x.moveTo(-.28, -.128);
    for (let px = -.28; px < -.06; px += .006) x.lineTo(px, -.122 + R() * .008);
    x.lineTo(-.06, -.128); x.closePath(); x.fill();
  }));

  // walkers. Group of three heading right on the pavement; two further back heading left.
  const GY = -.102, BY = -.088;
  const group = [
    { w: walker(U, { s: .08, col: '#0a0f24', build: 'hood', z: -.031 }), x0: -.17, ph0: 0, sp: .033, lean: .06 },
    { w: walker(U, { s: .075, col: '#0c1229', build: 'jacket', z: -.033 }), x0: -.205, ph0: 1.9, sp: .033, lean: .04 },
    { w: walker(U, { s: .084, col: '#090d21', build: 'hood', z: -.029 }), x0: -.245, ph0: 3.6, sp: .033, lean: .07 },
    { w: walker(U, { s: .046, col: '#2a3966', build: 'jacket', dir: -1, z: -.052, trans: .12 }), x0: .17, ph0: .7, sp: -.022, lean: .03, y: BY },
    { w: walker(U, { s: .044, col: '#2c3c6a', build: 'hood', dir: -1, z: -.0525, trans: .12 }), x0: .195, ph0: 2.4, sp: -.022, lean: .05, y: BY },
  ];
  for (const G of group) S.add(G.w.g);
  const mp = moped(U, { s: .085, col: '#0b1128', z: -.022 });
  S.add(mp.g);

  // the caption strip (paper), grown from its left edge
  const sw = .2, sh = .021;
  const strip = sheet({ U, w: sw, h: sh, z: -.02, trans: .35, shadow: false, recv: false, ppm: 12000, finish: { rim: .2 }, draw: x => {
    x.fillStyle = '#d9dbe2'; x.fillRect(-sw / 2, -sh / 2, sw, sh);
    x.save(); x.translate(-sw / 2 + .006, -.0004); x.scale(.001, -.001);
    x.font = '600 11.6px "Cormorant Garamond"'; x.textBaseline = 'middle'; x.fillStyle = '#111827';
    x.fillText('Mohamed Amra  ·  born 1994, Rouen', 0, 0); x.restore();
  } });
  strip.geometry.translate(sw / 2, 0, 0); strip.position.set(-.14, .07, -.02);
  const smap = strip.material.map; smap.wrapS = 1001;   // ClampToEdge
  S.add(strip);

  return {
    S,
    update(t) {
      for (const G of group) {
        const x = G.x0 + G.sp * t, ph = G.ph0 + TAU * Math.abs(G.sp * t) / STRIDE(G.w.s);
        G.w.g.position.x = x; G.w.g.position.y = G.y ?? GY; G.w.pose(ph, { lean: G.lean });
      }
      const mx = lerp(-.42, .36, seg(t, .6, 4.6)); mp.g.position.set(mx, GY, -.022); mp.roll((mx + .42));
      mp.g.position.y = GY + .0005 * Math.sin(t * 23);
      const k = ss(seg(t, 1.1, 1.9));
      strip.scale.x = Math.max(.0001, k); smap.repeat.x = Math.max(.0001, k); strip.visible = k > 0;
      const cx = lerp(-.04, .04, eio(t / E.dur)); aim(S.cam, [cx, -.004, .44, cx * .95, -.01, -.07], t, { hand: .0005 });
    },
    post() { return { focus: S.cam.position.z + .031, aper: 16, maxCoc: 12, bloom: { strength: .32, radius: .6, threshold: 1.1 } }; },
    grade() { return { expo: 1.0, vig: .45, sat: .82, contrast: .12, lift: [0, .006, .022], gain: [.96, .99, 1.04] }; },
  };
}
