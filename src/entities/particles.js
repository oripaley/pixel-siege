import { drawText } from '../ui.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Particles {
  constructor() {
    this.list = [];
    this.texts = [];
  }

  spawn(o) {
    const life = o.life ?? 0.5;
    this.list.push({ vx: 0, vy: 0, size: 1, gravity: 0, drag: 0, floor: null, color: '#fff', ...o, life, max: life });
  }

  burst(x, y, colors, n = 14, speed = 70, life = 0.55) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * rand(0.3, 1.2);
      this.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * rand(0.5, 1.3), size: Math.random() < 0.35 ? 2 : 1, color: pick(colors), drag: 3 });
    }
  }

  sparks(x, y, angle, colors = ['#fff3a0', '#ffd23f']) {
    for (let i = 0; i < 4; i++) {
      const a = angle + Math.PI + rand(-0.8, 0.8);
      const s = rand(30, 80);
      this.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.1, 0.25), color: pick(colors), drag: 4 });
    }
  }

  muzzle(x, y, a) {
    this.spawn({ x, y, life: 0.05, size: 4, color: '#fff3a0' });
    for (let i = 0; i < 3; i++) {
      const aa = a + rand(-0.4, 0.4);
      const s = rand(60, 120);
      this.spawn({ x, y, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, life: rand(0.05, 0.12), color: pick(['#ffd23f', '#f0862a']) });
    }
  }

  shell(x, y, facing) {
    this.spawn({ x, y, vx: -facing * rand(20, 45), vy: -rand(40, 70), gravity: 280, floor: y + 5, life: rand(0.6, 0.9), color: '#d9a521' });
  }

  dust(x, y) {
    this.spawn({ x: x + rand(-6, 6), y, vx: rand(-10, 10), vy: rand(-15, -5), life: rand(0.2, 0.4), size: 2, color: pick(['#55566b', '#9ea3b8']) });
  }

  text(x, y, str, color = '#f4f4f4') {
    this.texts.push({ x, y, str, color, life: 0.9 });
  }

  update(dt) {
    for (const p of this.list) {
      p.vy += p.gravity * dt;
      if (p.drag) {
        const f = Math.max(0, 1 - p.drag * dt);
        p.vx *= f;
        p.vy *= f;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.floor !== null && p.y > p.floor) {
        p.y = p.floor;
        p.vy *= -0.35;
        p.vx *= 0.5;
      }
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.y -= 18 * dt;
      t.life -= dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }
    for (const t of this.texts) {
      if (t.life < 0.3 && Math.floor(t.life * 20) % 2) continue;
      drawText(ctx, t.str, t.x, t.y, { align: 'center', color: t.color, shadow: '#140c1c' });
    }
  }
}
