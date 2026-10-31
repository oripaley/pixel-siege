import { core, W } from '../core.js';
import { Input } from '../input.js';
import { Save } from '../save.js';
import { getFloor } from '../sprites.js';
import { drawText, drawPanel, Button } from '../ui.js';
import { getLevel, CAMPAIGN_LENGTH } from '../levels.js';
import { MAX_HP } from '../entities/player.js';
import { GameScene } from './game.js';
import { MenuScene } from './menu.js';

const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export class LevelCompleteScene {
  constructor(levelNum, run, stats) {
    this.levelNum = levelNum;
    this.t = 0;
    const acc = stats.shots ? stats.hits / stats.shots : 0;
    const levelBonus = levelNum * 250;
    const accBonus = Math.round(acc * 100) * 10;
    const flawless = stats.damageTaken === 0;
    const score = run.score + levelBonus + accBonus + (flawless ? 1000 : 0);
    this.next = { score, hp: Math.min(MAX_HP, run.hp + 1) };
    this.isBest = Save.record({ score, reachedLevel: levelNum + 1 });

    this.lines = [
      ['KILLS', String(stats.kills)],
      ['ACCURACY', `${Math.round(acc * 100)}%`],
      ['TIME', fmtTime(stats.time)],
      ['LEVEL BONUS', `+${levelBonus}`],
      ['ACCURACY BONUS', `+${accBonus}`],
      ...(flawless ? [['FLAWLESS!', '+1000']] : []),
      ['HEALTH', run.hp < MAX_HP ? '+1 HP' : 'FULL'],
      ['SCORE', String(score)],
    ];
    this.campaignDone = levelNum === CAMPAIGN_LENGTH;
    this.nextName = getLevel(levelNum + 1).name;

    this.buttons = [
      new Button('NEXT LEVEL', W / 2 - 104, 156, 100, 15, () => this.continue()),
      new Button('MAIN MENU', W / 2 + 4, 156, 100, 15, () => core.go(new MenuScene())),
    ];
  }

  continue() {
    core.go(new GameScene(this.levelNum + 1, this.next));
  }

  update(dt) {
    this.t += dt;
    for (const b of this.buttons) b.update();
    if (this.t > 0.5 && Input.wasPressed('Enter', 'Space')) this.continue();
  }

  draw(ctx) {
    ctx.drawImage(getFloor(W, 180), 0, 0);
    ctx.fillStyle = 'rgba(11,8,20,0.6)';
    ctx.fillRect(0, 0, W, 180);

    const pop = Math.min(1, this.t / 0.3);
    drawText(ctx, `LEVEL ${this.levelNum} CLEAR!`, W / 2, 10 - Math.round((1 - pop) * 20), {
      scale: 3, align: 'center', color: '#ffd23f', shadow: '#a8232e',
    });

    drawPanel(ctx, 70, 34, W - 140, 98);
    this.lines.forEach(([label, value], i) => {
      if (this.t < 0.4 + i * 0.15) return;
      const y = 40 + i * 11;
      const last = i === this.lines.length - 1;
      const color = last ? '#ffd23f' : label === 'FLAWLESS!' ? '#73b84a' : '#f4f4f4';
      drawText(ctx, label, 80, y, { color: last ? '#ffd23f' : '#9ea3b8' });
      drawText(ctx, value, W - 80, y, { align: 'right', color });
    });

    const done = this.t > 0.4 + this.lines.length * 0.15;
    if (done) {
      if (this.isBest && Math.floor(this.t * 4) % 2) drawText(ctx, 'NEW BEST SCORE!', W / 2, 137, { align: 'center', color: '#73b84a' });
      const msg = this.campaignDone ? 'CAMPAIGN COMPLETE! ENDLESS MODE AWAITS' : `NEXT: LEVEL ${this.levelNum + 1} - ${this.nextName}`;
      drawText(ctx, msg, W / 2, 146, { align: 'center', color: '#9ea3b8' });
    }
    for (const b of this.buttons) b.draw(ctx);
  }
}
