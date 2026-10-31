import { core, W, H } from '../core.js';
import { Input } from '../input.js';
import { Player, MAX_HP } from '../entities/player.js';
import { Enemy } from '../entities/enemy.js';
import { Bullet } from '../entities/bullet.js';
import { Particles } from '../entities/particles.js';
import { Spawner } from '../spawner.js';
import { getLevel } from '../levels.js';
import { circleHit } from '../collision.js';
import { SPR, makeFloor, drawSprite } from '../sprites.js';
import { drawText, drawHearts, drawPanel, Button } from '../ui.js';
import { Sound } from '../audio.js';
import { LevelCompleteScene } from './levelComplete.js';
import { GameOverScene } from './gameOver.js';
import { MenuScene } from './menu.js';

const ARENA = { x0: 8, y0: 22, x1: W - 8, y1: H - 9 };
const HUD_H = 13;

export class GameScene {
  constructor(levelNum, run = { score: 0, hp: MAX_HP }) {
    this.levelNum = levelNum;
    this.level = getLevel(levelNum);
    this.score = run.score;
    this.player = new Player(W / 2, H / 2 + 6);
    this.player.hp = run.hp;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.pickups = [];
    this.particles = new Particles();
    this.floor = makeFloor(W, H); // per-level copy so we can paint splats on it
    this.floorCtx = this.floor.getContext('2d');
    this.stats = { kills: 0, shots: 0, hits: 0, time: 0, damageTaken: 0 };
    this.waveIndex = -1;
    this.spawner = null;
    this.state = 'intro';
    this.stateT = 2.2;
    this.banner = null;
    this.shakeT = 0;
    this.shakeMag = 0;
    this.hurtOverlay = 0;
    this.paused = false;
    this.t = 0;
    this.pauseButtons = [
      new Button('RESUME', W / 2 - 50, 76, 100, 15, () => (this.paused = false)),
      new Button(Sound.label, W / 2 - 50, 94, 100, 15, () => Sound.toggle()),
      new Button('QUIT TO MENU', W / 2 - 50, 112, 100, 15, () => core.go(new MenuScene())),
    ];
    this.showBanner(`LEVEL ${levelNum}`, this.level.name, 2.2);
  }

  // ------------------------------------------------------------ helpers used by entities
  shake(mag, dur) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeT = Math.max(this.shakeT, dur);
  }

  enemyShoot(x, y, angle, speed) {
    this.enemyBullets.push(new Bullet(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, { enemy: true, life: 6 }));
    Sound.play('enemyShoot');
  }

  spawnEnemy(type, x, y) {
    const lv = this.level;
    const mods = { hp: lv.hpScale * (type === 'boss' ? lv.bossHp : 1), speed: lv.speedScale };
    const e = new Enemy(type, x, y, mods);
    this.enemies.push(e);
    if (e.boss) {
      this.showBanner('WARNING!', 'BOSS APPROACHING', 2, '#ff4f4f');
      Sound.play('bossWarning');
      this.shake(3, 0.5);
    }
  }

  showBanner(title, sub = '', dur = 1.6, color = '#ffd23f') {
    this.banner = { title, sub, dur, t: dur, color };
  }

  get remaining() {
    return (this.spawner ? this.spawner.queue.length : 0) + this.enemies.length;
  }

  // ------------------------------------------------------------ flow
  startWave(i) {
    const n = this.level.waves.length;
    this.waveIndex = i;
    this.spawner = new Spawner(this.level.waves[i], this.level.interval, 1.6);
    this.state = 'fighting';
    const sub = i === 0 ? 'GET READY' : i === n - 1 ? 'FINAL WAVE' : 'WAVE CLEAR - GET READY';
    this.showBanner(`WAVE ${i + 1}/${n}`, sub, 1.6);
    Sound.play('wave');
  }

  levelCleared() {
    this.state = 'cleared';
    this.stateT = 2.2;
    this.player.inv = 99;
    for (const b of this.enemyBullets) this.particles.burst(b.x, b.y, ['#a65ee0', '#ff4f4f'], 4, 30, 0.3);
    this.enemyBullets = [];
    this.showBanner('LEVEL CLEAR!', 'NICE SHOOTING', 2.2);
    Sound.play('levelClear');
  }

  playerHurt() {
    const p = this.player;
    if (!p.hurt()) return;
    Sound.play(p.hp <= 0 ? 'playerDeath' : 'hurt');
    this.stats.damageTaken++;
    this.shake(4, 0.25);
    this.hurtOverlay = 0.25;
    this.particles.burst(p.x, p.y, ['#ff4f4f', '#a8232e', '#f4f4f4'], 10, 60, 0.4);
    if (p.hp <= 0) {
      p.dead = true;
      this.state = 'dying';
      this.stateT = 1.8;
      this.particles.burst(p.x, p.y, ['#73b84a', '#3e7d3a', '#f1c08f', '#ff4f4f', '#ffd23f'], 40, 110, 0.9);
      this.shake(6, 0.5);
      this.banner = null;
    }
  }

  killEnemy(e) {
    this.score += e.score;
    this.stats.kills++;
    const big = e.boss ? 3 : e.type === 'tank' ? 1.6 : 1;
    this.particles.burst(e.x, e.y, e.def.colors, Math.round(14 * big), 80 * Math.min(big, 2), 0.55 * big);
    this.particles.text(e.x, e.y - 8, `+${e.score}`, '#ffd23f');
    Sound.play(e.boss ? 'bossDeath' : e.type === 'tank' ? 'bigDeath' : 'death');
    this.shake(e.boss ? 6 : 1.5, e.boss ? 0.6 : 0.1);
    this.splat(e.x, e.y, e.def.colors[1], e.r);

    const roll = Math.random() * (e.type === 'tank' ? 0.5 : 1);
    if (e.boss) {
      this.dropPickup(e.x - 8, e.y, 'heart');
      this.dropPickup(e.x + 8, e.y, 'rapid');
    } else if (roll < 0.05) this.dropPickup(e.x, e.y, 'heart');
    else if (roll < 0.1) this.dropPickup(e.x, e.y, 'rapid');
  }

  dropPickup(x, y, type) {
    this.pickups.push({ x, y, type, life: 9, t: 0, r: 4 });
  }

  // Paint a permanent splat onto this level's floor.
  splat(x, y, color, r) {
    const g = this.floorCtx;
    g.globalAlpha = 0.45;
    g.fillStyle = color;
    for (let i = 0; i < 6 + r * 2; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * r * 1.4;
      const s = Math.random() < 0.3 ? 2 : 1;
      g.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.7 + 3), s, s);
    }
    g.globalAlpha = 1;
  }

  // ------------------------------------------------------------ update
  update(dt) {
    if (this.state !== 'dying' && (Input.wasPressed('Escape', 'KeyP') || (Input.focusLost && !this.paused))) {
      this.paused = !this.paused;
      Sound.play('click');
      return;
    }
    if (this.paused) {
      for (const b of this.pauseButtons) b.update();
      return;
    }

    this.t += dt;
    const p = this.player;
    if (!p.dead) p.update(dt, this, ARENA);
    if (this.state === 'fighting') this.stats.time += dt;

    switch (this.state) {
      case 'intro':
        if ((this.stateT -= dt) <= 0) this.startWave(0);
        break;
      case 'fighting':
        this.spawner.update(dt, this);
        if (this.spawner.done && this.enemies.length === 0) {
          if (this.waveIndex + 1 < this.level.waves.length) this.startWave(this.waveIndex + 1);
          else this.levelCleared();
        }
        break;
      case 'cleared':
        if ((this.stateT -= dt) <= 0) {
          core.go(new LevelCompleteScene(this.levelNum, { score: this.score, hp: p.hp }, this.stats));
        }
        break;
      case 'dying':
        if ((this.stateT -= dt) <= 0) core.go(new GameOverScene(this.levelNum, this.score));
        break;
    }

    for (const e of this.enemies) e.update(dt, this);
    this.separateEnemies();
    for (const b of this.bullets) b.update(dt);
    for (const b of this.enemyBullets) b.update(dt);
    this.collide();
    this.updatePickups(dt);

    this.enemies = this.enemies.filter((e) => !e.dead);
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead);
    this.particles.update(dt);

    if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
    this.shakeT -= dt;
    if (this.shakeT <= 0) this.shakeMag = 0;
    this.hurtOverlay -= dt;
  }

  separateEnemies() {
    const es = this.enemies;
    for (let i = 0; i < es.length; i++) {
      for (let j = i + 1; j < es.length; j++) {
        const a = es[i];
        const b = es[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 0.0001) continue;
        const d = Math.sqrt(d2);
        const push = (min - d) / 2;
        const nx = dx / d;
        const ny = dy / d;
        const wa = a.boss ? 0 : b.boss ? 2 : 1;
        const wb = b.boss ? 0 : a.boss ? 2 : 1;
        a.x -= nx * push * wa;
        a.y -= ny * push * wa;
        b.x += nx * push * wb;
        b.y += ny * push * wb;
      }
    }
  }

  collide() {
    const p = this.player;
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (e.dead || !circleHit(b, e)) continue;
        b.dead = true;
        this.stats.hits++;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        this.particles.sparks(b.x, b.y, Math.atan2(b.vy, b.vx));
        if (e.hit(b.damage, b.vx / sp, b.vy / sp)) this.killEnemy(e);
        else Sound.play('hit');
        break;
      }
    }
    if (p.dead) return;
    for (const e of this.enemies) {
      if (!e.dead && circleHit(e, p)) {
        this.playerHurt();
        if (!e.boss) {
          const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
          e.kx += ((e.x - p.x) / d) * 140;
          e.ky += ((e.y - p.y) / d) * 140;
        }
      }
    }
    for (const b of this.enemyBullets) {
      if (circleHit(b, p)) {
        b.dead = true;
        this.playerHurt();
      }
    }
  }

  updatePickups(dt) {
    const p = this.player;
    for (const k of this.pickups) {
      k.t += dt;
      k.life -= dt;
      if (p.dead || !circleHit(k, { x: p.x, y: p.y, r: p.r + 3 })) continue;
      k.life = 0;
      if (k.type === 'heart') {
        p.hp = Math.min(p.maxHp, p.hp + 1);
        this.particles.text(k.x, k.y - 6, '+1 HP', '#ff4f4f');
        Sound.play('pickup');
      } else {
        p.rapid = 6;
        this.particles.text(k.x, k.y - 6, 'RAPID FIRE!', '#ffd23f');
        Sound.play('powerup');
      }
      this.particles.burst(k.x, k.y, ['#f4f4f4', '#ffd23f'], 8, 40, 0.3);
    }
    this.pickups = this.pickups.filter((k) => k.life > 0);
  }

  // ------------------------------------------------------------ draw
  draw(ctx) {
    ctx.save();
    if (this.shakeMag > 0 && !this.paused) {
      ctx.translate(Math.round((Math.random() - 0.5) * this.shakeMag * 2), Math.round((Math.random() - 0.5) * this.shakeMag * 2));
    }
    ctx.drawImage(this.floor, 0, 0);

    for (const k of this.pickups) {
      if (k.life < 2.5 && Math.floor(k.life * 8) % 2) continue;
      const spr = k.type === 'heart' ? SPR.heart : SPR.bolt;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(Math.round(k.x - 3), Math.round(k.y + 5), 6, 1);
      drawSprite(ctx, spr, k.x, k.y + Math.sin(k.t * 5) * 1.5);
    }

    const actors = [...this.enemies, this.player].sort((a, b) => a.y - b.y);
    for (const a of actors) a.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    for (const b of this.enemyBullets) b.draw(ctx);
    this.particles.draw(ctx);
    ctx.restore();

    if (this.hurtOverlay > 0) {
      ctx.fillStyle = `rgba(255,40,60,${this.hurtOverlay})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.player.hp === 1 && !this.player.dead) this.drawLowHp(ctx);
    this.drawHud(ctx);
    this.drawBossBar(ctx);
    if (this.banner) this.drawBanner(ctx);
    if (this.paused) this.drawPause(ctx);
  }

  drawLowHp(ctx) {
    const a = 0.25 + Math.sin(this.t * 8) * 0.15;
    ctx.fillStyle = `rgba(255,40,60,${a})`;
    ctx.fillRect(0, 0, W, 2);
    ctx.fillRect(0, H - 2, W, 2);
    ctx.fillRect(0, 0, 2, H);
    ctx.fillRect(W - 2, 0, 2, H);
  }

  drawHud(ctx) {
    const p = this.player;
    ctx.fillStyle = 'rgba(11,8,20,0.8)';
    ctx.fillRect(0, 0, W, HUD_H);
    ctx.fillStyle = '#3b3355';
    ctx.fillRect(0, HUD_H, W, 1);
    drawHearts(ctx, 4, 4, Math.max(0, p.hp), p.maxHp);

    const n = this.level.waves.length;
    const wave = Math.max(1, this.waveIndex + 1);
    drawText(ctx, `LV ${this.levelNum}`, 70, 4, { color: '#ffd23f' });
    drawText(ctx, `WAVE ${wave}/${n}`, W / 2, 4, { align: 'center' });
    drawText(ctx, `FOES ${this.remaining}`, 222, 4, { align: 'right', color: '#ff4f4f' });
    drawText(ctx, String(this.score).padStart(7, '0'), W - 4, 4, { align: 'right' });

    if (p.rapid > 0) {
      ctx.drawImage(SPR.bolt.img, 4, 17);
      ctx.fillStyle = '#140c1c';
      ctx.fillRect(13, 20, 32, 4);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(14, 21, Math.ceil((30 * p.rapid) / 6), 2);
    }
  }

  drawBossBar(ctx) {
    const bosses = this.enemies.filter((e) => e.boss);
    if (!bosses.length) return;
    const hp = bosses.reduce((s, b) => s + Math.max(0, b.hp), 0);
    const max = bosses.reduce((s, b) => s + b.maxHp, 0);
    const bw = 160;
    const x = W / 2 - bw / 2;
    const y = H - 9;
    drawText(ctx, 'BOSS', x - 4, y, { align: 'right', color: '#ff4f4f', shadow: '#140c1c' });
    ctx.fillStyle = '#140c1c';
    ctx.fillRect(x - 1, y - 1, bw + 2, 7);
    ctx.fillStyle = '#3b1a26';
    ctx.fillRect(x, y, bw, 5);
    ctx.fillStyle = '#ff4f4f';
    ctx.fillRect(x, y, Math.ceil((bw * hp) / max), 5);
    ctx.fillStyle = '#ffa0a0';
    ctx.fillRect(x, y, Math.ceil((bw * hp) / max), 1);
  }

  drawBanner(ctx) {
    const b = this.banner;
    const age = b.dur - b.t;
    const slide = Math.min(1, age / 0.25);
    const y = 62;
    ctx.fillStyle = `rgba(11,8,20,${0.6 * Math.min(1, b.t / 0.3)})`;
    ctx.fillRect(0, y - 6, W, b.sub ? 38 : 30);
    const off = Math.round((1 - slide) * -W);
    if (b.t < 0.3 && Math.floor(b.t * 20) % 2) return;
    drawText(ctx, b.title, W / 2 + off, y, { scale: 3, color: b.color, align: 'center', shadow: '#140c1c' });
    if (b.sub) drawText(ctx, b.sub, W / 2 - off, y + 21, { align: 'center', color: '#9ea3b8' });
  }

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(11,8,20,0.7)';
    ctx.fillRect(0, 0, W, H);
    this.pauseButtons[1].label = Sound.label;
    drawPanel(ctx, W / 2 - 70, 40, 140, 96);
    drawText(ctx, 'PAUSED', W / 2, 52, { scale: 3, align: 'center', color: '#ffd23f', shadow: '#140c1c' });
    for (const b of this.pauseButtons) b.draw(ctx);
  }
}
