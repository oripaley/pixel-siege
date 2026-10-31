import { W, H } from '../core.js';
import { SPR, drawSprite, drawShadow } from '../sprites.js';
import { clamp } from '../collision.js';

export const TYPES = {
  grunt:   { hp: 3,  speed: 30, r: 5,  score: 100,  kb: 70, fps: 5,  colors: ['#73b84a', '#3e7d3a', '#f4f4f4'] },
  runner:  { hp: 1,  speed: 64, r: 4,  score: 150,  kb: 90, fps: 12, colors: ['#ff4f4f', '#a8232e', '#ffd23f'] },
  tank:    { hp: 14, speed: 17, r: 7,  score: 400,  kb: 18, fps: 3,  colors: ['#a65ee0', '#5d2e8a', '#ffd23f'] },
  shooter: { hp: 4,  speed: 34, r: 5,  score: 250,  kb: 60, fps: 10, colors: ['#4f6bd1', '#7fc8f8', '#ff4f4f'] },
  boss:    { hp: 90, speed: 24, r: 11, score: 5000, kb: 0,  fps: 3,  colors: ['#ff4f4f', '#a8232e', '#ffd23f', '#f4f4f4'] },
};

const TOP = 14; // below the HUD strip

export class Enemy {
  constructor(type, x, y, mods = {}) {
    const def = TYPES[type];
    Object.assign(this, {
      type, def, x, y, r: def.r,
      score: def.score,
      boss: type === 'boss',
      t: Math.random() * 10,
      flash: 0, kx: 0, ky: 0, facing: 1,
      entered: false, dead: false,
      fireT: 1.2 + Math.random() * 1.5,
      state: 'walk', stateT: 2.5, attack: 0, cx: 0, cy: 0, ringShots: 0,
    });
    this.maxHp = this.hp = Math.ceil(def.hp * (mods.hp ?? 1));
    this.speed = def.speed * (mods.speed ?? 1) * (0.9 + Math.random() * 0.2);
  }

  update(dt, scene) {
    const p = scene.player;
    this.t += dt;
    this.flash -= dt;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d;
    const ny = dy / d;
    let vx = 0;
    let vy = 0;

    switch (this.type) {
      case 'grunt':
      case 'tank':
        vx = nx * this.speed;
        vy = ny * this.speed;
        break;
      case 'runner': {
        const wob = Math.sin(this.t * 7) * 0.7; // zig-zag
        vx = (nx - ny * wob) * this.speed;
        vy = (ny + nx * wob) * this.speed;
        break;
      }
      case 'shooter': {
        if (!this.entered) {
          vx = nx * this.speed;
          vy = ny * this.speed;
          break;
        }
        const k = d > 95 ? 1 : d < 60 ? -1 : 0; // keep a medium distance
        const side = Math.sin(this.t * 0.8) > 0 ? 0.7 : -0.7; // strafe
        vx = (nx * k - ny * side) * this.speed;
        vy = (ny * k + nx * side) * this.speed;
        this.fireT -= dt;
        if (this.fireT <= 0 && !p.dead) {
          this.fireT = 2 + Math.random();
          scene.enemyShoot(this.x, this.y, Math.atan2(dy, dx), 75);
        }
        break;
      }
      case 'boss':
        [vx, vy] = this.updateBoss(dt, scene, nx, ny);
        break;
    }

    if (p.dead) {
      vx *= 0.2;
      vy *= 0.2;
    }
    this.x += (vx + this.kx) * dt;
    this.y += (vy + this.ky) * dt;
    const damp = Math.max(0, 1 - 8 * dt);
    this.kx *= damp;
    this.ky *= damp;
    if (Math.abs(dx) > 1) this.facing = dx < 0 ? -1 : 1;

    // Once inside the arena, stay inside it.
    const m = this.r;
    if (!this.entered && this.x > m && this.x < W - m && this.y > TOP + m && this.y < H - m) this.entered = true;
    if (this.entered) {
      this.x = clamp(this.x, m, W - m);
      this.y = clamp(this.y, TOP + m, H - m);
    }
  }

  updateBoss(dt, scene, nx, ny) {
    this.stateT -= dt;
    const enraged = this.hp < this.maxHp / 2;
    switch (this.state) {
      case 'walk':
        if (enraged) {
          this.fireT -= dt;
          if (this.fireT <= 0) {
            this.fireT = 1.3;
            const a = Math.atan2(ny, nx);
            for (let k = -1; k <= 1; k++) scene.enemyShoot(this.x, this.y, a + k * 0.25, 85);
          }
        }
        if (this.stateT <= 0 && this.entered) {
          this.state = this.attack++ % 2 === 0 ? 'windup' : 'ring';
          this.stateT = this.state === 'windup' ? 0.7 : 1.4;
          this.ringShots = 0;
        }
        return [nx * this.speed, ny * this.speed];
      case 'windup':
        if (this.stateT <= 0) {
          this.state = 'charge';
          this.stateT = 0.75;
          this.cx = nx;
          this.cy = ny;
          scene.shake(2, 0.2);
        }
        return [0, 0];
      case 'charge':
        scene.particles.dust(this.x, this.y + 10);
        if (this.stateT <= 0) {
          this.state = 'walk';
          this.stateT = 2.2 + Math.random();
        }
        return [this.cx * 155, this.cy * 155];
      case 'ring':
        if (this.ringShots < 3 && this.stateT <= 1.3 - this.ringShots * 0.4) {
          const n = 14;
          const off = this.ringShots * 0.12;
          for (let i = 0; i < n; i++) scene.enemyShoot(this.x, this.y, off + (i / n) * Math.PI * 2, 70);
          this.ringShots++;
        }
        if (this.stateT <= 0) {
          this.state = 'walk';
          this.stateT = 2.5;
        }
        return [0, 0];
    }
    return [0, 0];
  }

  // Returns true when this hit killed the enemy.
  hit(dmg, dirx, diry) {
    this.hp -= dmg;
    this.flash = 0.07;
    this.kx += dirx * this.def.kb;
    this.ky += diry * this.def.kb;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      return true;
    }
    return false;
  }

  draw(ctx) {
    const frames = SPR[this.type];
    const s = frames[Math.floor(this.t * this.def.fps) % frames.length];
    const floating = this.type === 'shooter';
    const y = floating ? this.y + Math.sin(this.t * 4) * 1.5 : this.y;
    let x = this.x;
    const windup = this.boss && this.state === 'windup';
    if (windup) x += Math.random() < 0.5 ? -1 : 1;
    drawShadow(ctx, this.x, this.y + s.h / 2 + (floating ? 3 : 0), Math.max(6, s.w * 0.7));
    const flash = this.flash > 0 || (windup && Math.floor(this.t * 20) % 2 === 0);
    drawSprite(ctx, s, x, y, { flip: this.facing < 0, flash });
    if (this.type === 'tank' && this.hp < this.maxHp) {
      const bw = 14;
      const bx = Math.round(this.x - bw / 2);
      const by = Math.round(this.y - s.h / 2 - 4);
      ctx.fillStyle = '#140c1c';
      ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
      ctx.fillStyle = '#ff4f4f';
      ctx.fillRect(bx, by, Math.ceil((bw * this.hp) / this.maxHp), 2);
    }
  }
}
