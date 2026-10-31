import { core, W, H } from '../core.js';
import { Input } from '../input.js';
import { Save } from '../save.js';
import { Sound } from '../audio.js';
import { getFloor } from '../sprites.js';
import { drawText, drawPanel, Button } from '../ui.js';
import { GameScene } from './game.js';
import { MenuScene } from './menu.js';

export class GameOverScene {
  constructor(levelNum, score) {
    this.levelNum = levelNum;
    this.score = score;
    this.t = 0;
    this.isBest = Save.record({ score, reachedLevel: levelNum });
    Sound.play('gameOver');
    this.buttons = [
      new Button('RETRY LEVEL', W / 2 - 104, 132, 100, 15, () => this.retry()),
      new Button('MAIN MENU', W / 2 + 4, 132, 100, 15, () => core.go(new MenuScene())),
    ];
  }

  retry() {
    core.go(new GameScene(this.levelNum));
  }

  update(dt) {
    this.t += dt;
    for (const b of this.buttons) b.update();
    if (this.t > 0.5 && Input.wasPressed('Enter', 'Space')) this.retry();
  }

  draw(ctx) {
    ctx.drawImage(getFloor(W, H), 0, 0);
    ctx.fillStyle = 'rgba(40,6,16,0.7)';
    ctx.fillRect(0, 0, W, H);

    const drop = Math.round(Math.max(0, 1 - this.t / 0.4) * -40);
    drawText(ctx, 'GAME OVER', W / 2, 26 + drop, { scale: 5, align: 'center', color: '#ff4f4f', outline: '#140c1c', shadow: '#a8232e' });

    drawPanel(ctx, 90, 64, W - 180, 56);
    drawText(ctx, `REACHED LEVEL ${this.levelNum}`, W / 2, 72, { align: 'center', color: '#9ea3b8' });
    drawText(ctx, String(this.score), W / 2, 84, { scale: 2, align: 'center', color: '#ffd23f' });
    if (this.isBest) {
      if (Math.floor(this.t * 4) % 2) drawText(ctx, 'NEW BEST SCORE!', W / 2, 106, { align: 'center', color: '#73b84a' });
    } else {
      drawText(ctx, `BEST ${Save.data.best}`, W / 2, 106, { align: 'center', color: '#5a4f80' });
    }
    for (const b of this.buttons) b.draw(ctx);
  }
}
