// Style test: one shot (Scene 2 walk), rendered through the lightbox pipeline
import * as THREE from 'three';
import { Pipe } from './post.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ss, seg, clamp } from './lib.js';
import * as s02 from './shots/s02_rouen.js';

const Q = new URLSearchParams(location.search), SSAA = +(Q.get('ssaa') || 2);
const DUR = +(Q.get('dur') || 5);
window.DUR = DUR;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(SSAA); renderer.setSize(1920, 1080, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const pipe = new Pipe(renderer, 1920, 1080, SSAA);
const pmrem = new THREE.PMREMGenerator(renderer); const ENV = pmrem.fromScene(new RoomEnvironment(), .04).texture;
await document.fonts.load('600 40px "Cormorant Garamond"', 'Mohamed Amra born 1994, Rouen');
const shot = s02.build({ dur: DUR, env: ENV });
window.render = (t) => {
  shot.update(t);
  pipe.shot(shot.S.scene, shot.S.cam, shot.post(t), pipe.rtA);
  pipe.final({ ...shot.grade(t), mixB: 0, mode: 0, time: t, fade: ss(clamp(t / .6)) * ss(clamp((DUR - t) / .6)) });
};
window.READY = true;
