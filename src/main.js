import { core, W, H } from './core.js';
import { Input } from './input.js';
import { Save } from './save.js';
import { Sound } from './audio.js';
import { SPR, drawSprite } from './sprites.js';
import { MenuScene } from './scenes/menu.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Scale the 320x180 canvas up by an integer factor for crisp pixels.
function resize() {
  const fit = Math.min(innerWidth / W, innerHeight / H);
  const s = fit >= 1 ? Math.floor(fit) : fit;
  canvas.style.width = `${W * s}px`;
  canvas.style.height = `${H * s}px`;
}
addEventListener('resize', resize);
resize();

Input.init(canvas, W, H);
Save.load();
Sound.setMuted(Save.data.muted);
// Browsers only allow audio after a user gesture.
addEventListener('pointerdown', () => Sound.init());
addEventListener('keydown', () => Sound.init());
core.go(new MenuScene());

// Fixed-timestep loop: logic at 60 Hz, render every animation frame.
const STEP = 1 / 60;
let acc = 0;
let last = performance.now();

function frame(now) {
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    if (Input.wasPressed('KeyM')) Sound.toggle();
    core.scene.update(STEP);
    Input.endStep();
    core.time += STEP;
    acc -= STEP;
  }
  ctx.imageSmoothingEnabled = false;
  core.scene.draw(ctx);
  drawSprite(ctx, SPR.crosshair, Input.mouse.x, Input.mouse.y);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
