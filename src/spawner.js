// Feeds a wave's enemies into the arena from random screen edges.
import { W, H } from './core.js';

const rand = (a, b) => a + Math.random() * (b - a);

function edgePoint(side) {
  const m = 14;
  switch (side) {
    case 0: return { x: rand(12, W - 12), y: -m };
    case 1: return { x: W + m, y: rand(24, H - 12) };
    case 2: return { x: rand(12, W - 12), y: H + m };
    default: return { x: -m, y: rand(24, H - 12) };
  }
}

export class Spawner {
  constructor(wave, interval, delay = 1.6) {
    const queue = [];
    for (const [type, n] of Object.entries(wave)) for (let i = 0; i < n; i++) queue.push(type);
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    // Bosses lead the wave.
    queue.sort((a, b) => (b === 'boss') - (a === 'boss'));
    this.queue = queue;
    this.interval = interval;
    this.t = delay;
  }

  get done() {
    return this.queue.length === 0;
  }

  update(dt, scene) {
    if (this.done) return;
    this.t -= dt;
    if (this.t > 0) return;

    if (this.queue[0] === 'boss') {
      scene.spawnEnemy(this.queue.shift(), W / 2, -18);
      this.t = this.interval * 2.5;
      return;
    }

    // Pick an edge that isn't right next to the player.
    let side;
    let pt;
    for (let tries = 0; tries < 5; tries++) {
      side = Math.floor(Math.random() * 4);
      pt = edgePoint(side);
      if (Math.hypot(pt.x - scene.player.x, pt.y - scene.player.y) > 60) break;
    }
    // Sometimes enemies arrive in small groups.
    const group = Math.random() < 0.25 ? 2 + (Math.random() < 0.4 ? 1 : 0) : 1;
    for (let i = 0; i < group && this.queue.length && this.queue[0] !== 'boss'; i++) {
      const p = edgePoint(side);
      const near = i === 0 ? pt : { x: (pt.x + p.x) / 2 + rand(-10, 10), y: (pt.y + p.y) / 2 + rand(-10, 10) };
      scene.spawnEnemy(this.queue.shift(), near.x, near.y);
    }
    this.t = this.interval * rand(0.6, 1.4) * group;
  }
}
