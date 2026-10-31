import { core, W, H } from '../core.js';
import { Input } from '../input.js';
import { Save } from '../save.js';
import { Sound } from '../audio.js';
import { SPR, drawSprite, getFloor } from '../sprites.js';
import { drawText, drawPanel, Button } from '../ui.js';
import { Player } from '../entities/player.js';
import { CAMPAIGN_LENGTH, LEVELS } from '../levels.js';
import { GameScene } from './game.js';

const ROSTER = [
  ['grunt', 'GRUNT', 'WALKS AT YOU'],
  ['runner', 'RUNNER', 'FAST, ZIG-ZAGS'],
  ['tank', 'TANK', 'SLOW, TOUGH'],
  ['shooter', 'SHOOTER', 'FIRES BACK'],
  ['boss', 'BOSS', 'EVERY 5 LEVELS'],
];

export class MenuScene {
  constructor(view = 'main') {
    this.view = view;
    this.t = 0;
    this.player = new Player(30, 59); // drawn at 2x scale
    const bw = 100;
    const bx = W / 2 - bw / 2;
    const back = () => new Button('BACK', bx, 154, bw, 15, () => (this.view = 'main'));

    const levelButtons = [];
    for (let i = 0; i < CAMPAIGN_LENGTH; i++) {
      const n = i + 1;
      const col = i % 5;
      const row = Math.floor(i / 5);
      levelButtons.push(new Button(String(n), 78 + col * 34, 50 + row * 26, 28, 20, () => this.start(n), { enabled: n <= Save.data.maxLevel }));
    }
    levelButtons.push(
      new Button('ENDLESS MODE', bx, 110, bw, 15, () => this.start(CAMPAIGN_LENGTH + 1), {
        enabled: Save.data.maxLevel > CAMPAIGN_LENGTH,
      }),
    );

    this.buttons = {
      main: [
        new Button('START GAME', bx, 82, bw, 15, () => this.start(1)),
        new Button('LEVEL SELECT', bx, 102, bw, 15, () => (this.view = 'levels')),
        new Button('HOW TO PLAY', bx, 122, bw, 15, () => (this.view = 'help')),
        (this.soundButton = new Button(Sound.label, W - 58, 4, 54, 11, () => Sound.toggle())),
      ],
      levels: [...levelButtons, back()],
      help: [back()],
    };
  }

  start(level) {
    core.go(new GameScene(level));
  }

  update(dt) {
    this.t += dt;
    for (const b of this.buttons[this.view]) b.update();
    this.soundButton.label = Sound.label;
    if (this.view === 'main' && Input.wasPressed('Enter', 'Space')) this.start(1);
    if (this.view !== 'main' && Input.wasPressed('Escape')) this.view = 'main';

    // The title-screen soldier tracks the cursor (screen coords = 2x his coords).
    const p = this.player;
    const m = Input.mouse;
    p.facing = m.x < p.x * 2 ? -1 : 1;
    p.aim = Math.atan2(m.y - p.handY * 2, m.x - p.handX * 2);
  }

  draw(ctx) {
    const off = Math.floor((this.t * 8) % 16);
    ctx.drawImage(getFloor(W, H), -off, -off);
    ctx.fillStyle = 'rgba(11,8,20,0.5)';
    ctx.fillRect(0, 0, W, H);

    if (this.view === 'main') this.drawMain(ctx);
    else if (this.view === 'levels') this.drawLevels(ctx);
    else this.drawHelp(ctx);
    for (const b of this.buttons[this.view]) b.draw(ctx);
  }

  drawMain(ctx) {
    const bob = Math.round(Math.sin(this.t * 2) * 2);
    drawText(ctx, 'PIXEL SIEGE', W / 2, 18 + bob, { scale: 4, align: 'center', color: '#ffd23f', outline: '#140c1c', shadow: '#a8232e' });
    drawText(ctx, 'HOLD THE ARENA. SURVIVE THE WAVES.', W / 2, 50, { align: 'center', color: '#9ea3b8' });

    // Hero on the left, aiming at the cursor.
    ctx.save();
    ctx.scale(2, 2);
    this.player.draw(ctx);
    ctx.restore();

    // A few enemies lurking on the right.
    const f = (fps) => Math.floor(this.t * fps) % 2;
    drawSprite(ctx, SPR.tank[f(3)], 274, 104, { scale: 2, flip: true });
    drawSprite(ctx, SPR.grunt[f(5)], 238, 118, { scale: 2, flip: true });
    drawSprite(ctx, SPR.runner[f(10)], 266, 146, { scale: 2, flip: true });

    drawText(ctx, 'ARROWS MOVE - MOUSE AIM - CLICK SHOOT', W / 2, 146, { align: 'center', color: '#9ea3b8' });
    const best = Save.data.best;
    const lv = Math.min(Save.data.maxLevel, CAMPAIGN_LENGTH);
    drawText(ctx, `BEST ${best}   UNLOCKED ${lv}/${CAMPAIGN_LENGTH}`, W / 2, 166, { align: 'center', color: '#5a4f80' });
  }

  drawLevels(ctx) {
    drawText(ctx, 'LEVEL SELECT', W / 2, 18, { scale: 3, align: 'center', color: '#ffd23f', shadow: '#140c1c' });
    const hovered = this.buttons.levels.find((b) => b.hover && /^\d+$/.test(b.label));
    const text = hovered ? `LEVEL ${hovered.label} - ${LEVELS[+hovered.label - 1].name}` : 'BEAT A LEVEL TO UNLOCK THE NEXT';
    drawText(ctx, text, W / 2, 134, { align: 'center', color: '#9ea3b8' });
  }

  drawHelp(ctx) {
    drawText(ctx, 'HOW TO PLAY', W / 2, 10, { scale: 3, align: 'center', color: '#ffd23f', shadow: '#140c1c' });
    drawPanel(ctx, 20, 32, W - 40, 116);
    const lines = [
      ['ARROWS / WASD', 'MOVE'],
      ['MOUSE', 'AIM'],
      ['CLICK / HOLD', 'SHOOT'],
      ['ESC / P', 'PAUSE'],
      ['M', 'SOUND ON/OFF'],
    ];
    lines.forEach(([k, v], i) => {
      drawText(ctx, k, 150, 38 + i * 8, { align: 'right', color: '#ffd23f' });
      drawText(ctx, v, 162, 38 + i * 8);
    });
    drawText(ctx, 'CLEAR EVERY WAVE TO BEAT THE LEVEL.', W / 2, 80, { align: 'center', color: '#9ea3b8' });
    ctx.drawImage(SPR.heart.img, 66, 88);
    drawText(ctx, 'HEALS', 76, 89, { color: '#ff4f4f' });
    ctx.drawImage(SPR.bolt.img, 190, 87);
    drawText(ctx, 'RAPID FIRE', 200, 89, { color: '#ffd23f' });

    ROSTER.forEach(([type, name, desc], i) => {
      const x = 48 + i * 56;
      drawSprite(ctx, SPR[type][Math.floor(this.t * 4) % 2], x, 112);
      drawText(ctx, name, x, 128, { align: 'center' });
      drawText(ctx, desc.split(', ')[0], x, 135, { align: 'center', color: '#5a4f80' });
    });
  }
}
