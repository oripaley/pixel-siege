import { Input } from '../input.js';
import { SPR, drawSprite, drawShadow } from '../sprites.js';
import { clamp } from '../collision.js';
import { Bullet } from './bullet.js';
import { Sound } from '../audio.js';

const SPEED = 82;
const BULLET_SPEED = 260;
const FIRE_RATE = 0.17; // seconds between shots
const RAPID_FIRE_RATE = 0.07;
export const MAX_HP = 5;

export class Player {
  constructor(x, y) {
    Object.assign(this, {
      x, y, r: 5, hp: MAX_HP, maxHp: MAX_HP,
      inv: 0, hurtFlash: 0, fireCd: 0, rapid: 0,
      aim: 0, facing: 1, walkT: 0, moving: false, recoil: 0, dead: false,
    });
  }

  get handX() {
    return this.x + this.facing * 3;
  }
  get handY() {
    return this.y + 3;
  }

  update(dt, scene, bounds) {
    let dx = 0;
    let dy = 0;
    if (Input.isDown('ArrowLeft', 'KeyA')) dx -= 1;
    if (Input.isDown('ArrowRight', 'KeyD')) dx += 1;
    if (Input.isDown('ArrowUp', 'KeyW')) dy -= 1;
    if (Input.isDown('ArrowDown', 'KeyS')) dy += 1;
    if (dx && dy) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    this.moving = !!(dx || dy);
    this.x = clamp(this.x + dx * SPEED * dt, bounds.x0, bounds.x1);
    this.y = clamp(this.y + dy * SPEED * dt, bounds.y0, bounds.y1);
    this.walkT = this.moving ? this.walkT + dt : 0;

    const m = Input.mouse;
    this.facing = m.x < this.x ? -1 : 1;
    this.aim = Math.atan2(m.y - this.handY, m.x - this.handX);

    this.fireCd -= dt;
    this.inv -= dt;
    this.hurtFlash -= dt;
    this.rapid -= dt;
    this.recoil = Math.max(0, this.recoil - dt * 20);

    if (m.down && this.fireCd <= 0) this.shoot(scene);
  }

  shoot(scene) {
    const rapid = this.rapid > 0;
    this.fireCd = rapid ? RAPID_FIRE_RATE : FIRE_RATE;
    const a = this.aim + (Math.random() - 0.5) * (rapid ? 0.14 : 0.06);
    const mx = this.handX + Math.cos(this.aim) * 10;
    const my = this.handY + Math.sin(this.aim) * 10;
    scene.bullets.push(new Bullet(mx, my, Math.cos(a) * BULLET_SPEED, Math.sin(a) * BULLET_SPEED));
    scene.stats.shots++;
    scene.particles.muzzle(mx, my, this.aim);
    scene.particles.shell(this.handX, this.handY, this.facing);
    scene.shake(0.8, 0.05);
    Sound.play('shoot');
    this.recoil = 2;
  }

  // Returns true if damage was actually taken.
  hurt() {
    if (this.inv > 0 || this.dead) return false;
    this.hp--;
    this.inv = 1.0;
    this.hurtFlash = 0.1;
    return true;
  }

  draw(ctx) {
    if (this.dead) return;
    if (this.inv > 0 && this.hurtFlash <= 0 && Math.floor(this.inv * 15) % 2 === 0) return;
    let frame = SPR.player.idle;
    let bob = 0;
    if (this.moving) {
      const i = Math.floor(this.walkT * 10) % 4;
      frame = SPR.player.walk[i];
      bob = i % 2 ? -1 : 0;
    }
    drawShadow(ctx, this.x, this.y + 8, 10);
    const behind = Math.sin(this.aim) < -0.35; // aiming up: gun behind the body
    if (behind) this.drawGun(ctx, bob);
    drawSprite(ctx, frame, this.x, this.y + bob, { flip: this.facing < 0, flash: this.hurtFlash > 0 });
    if (!behind) this.drawGun(ctx, bob);
  }

  drawGun(ctx, bob) {
    ctx.save();
    ctx.translate(Math.round(this.handX), Math.round(this.handY + bob));
    ctx.rotate(this.aim);
    if (Math.cos(this.aim) < 0) ctx.scale(1, -1);
    ctx.drawImage(SPR.gun.img, -2 - Math.round(this.recoil), -2);
    ctx.restore();
  }
}
