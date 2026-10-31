import { W, H } from '../core.js';

export class Bullet {
  constructor(x, y, vx, vy, o = {}) {
    Object.assign(this, { x, y, vx, vy, r: o.r ?? 2, damage: o.damage ?? 1, enemy: !!o.enemy, life: o.life ?? 2, t: 0, dead: false });
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.t += dt;
    this.life -= dt;
    if (this.life <= 0 || this.x < -12 || this.x > W + 12 || this.y < -12 || this.y > H + 12) this.dead = true;
  }
  draw(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    if (this.enemy) {
      ctx.fillStyle = Math.floor(this.t * 12) % 2 ? '#ff4f4f' : '#a65ee0';
      ctx.fillRect(x - 2, y - 1, 4, 2);
      ctx.fillRect(x - 1, y - 2, 2, 4);
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(x - 1, y - 1, 1, 1);
      return;
    }
    // player tracer: bright head with a fading tail
    ctx.fillStyle = '#f0862a';
    ctx.fillRect(Math.round(this.x - this.vx * 0.022) - 1, Math.round(this.y - this.vy * 0.022) - 1, 1, 1);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(Math.round(this.x - this.vx * 0.011) - 1, Math.round(this.y - this.vy * 0.011) - 1, 2, 2);
    ctx.fillStyle = '#fff3a0';
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}
