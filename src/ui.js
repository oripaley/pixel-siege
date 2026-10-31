// Tiny 3x5 bitmap font, buttons and HUD helpers.
import { Input } from './input.js';
import { SPR } from './sprites.js';

// Each glyph: 5 rows of 3 bits.
const GLYPHS = {
  A: '111101111101101', B: '110101110101110', C: '111100100100111', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '111100101101111', H: '101101111101101',
  I: '111010010010111', J: '001001001101111', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '111101101101111', P: '111101111100100',
  Q: '111101101111001', R: '110101110101101', S: '111100111001111', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111',
  4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001',
  8: '111101111101111', 9: '111101111001111',
  ' ': '000000000000000', '.': '000000000000010', ',': '000000000010100', ':': '000010000010000',
  '!': '010010010000010', '?': '111001011000010', '-': '000000111000000', '+': '000010111010000',
  '/': '001001010100100', '%': '101001010100101', '(': '010100100100010', ')': '010001001001010',
  '<': '001010100010001', '>': '100010001010100', "'": '010010000000000', '=': '000111000111000',
};

const cache = new Map();
function glyph(ch, color) {
  const key = ch + color;
  let g = cache.get(key);
  if (g) return g;
  const bits = GLYPHS[ch];
  if (!bits) return null;
  g = document.createElement('canvas');
  g.width = 3;
  g.height = 5;
  const c = g.getContext('2d');
  c.fillStyle = color;
  for (let i = 0; i < 15; i++) if (bits[i] === '1') c.fillRect(i % 3, Math.floor(i / 3), 1, 1);
  cache.set(key, g);
  return g;
}

export const textWidth = (str, scale = 1) => (str.length ? (str.length * 4 - 1) * scale : 0);

function run(ctx, str, x, y, sc, color) {
  for (let i = 0; i < str.length; i++) {
    const g = glyph(str[i], color);
    if (g) ctx.drawImage(g, x + i * 4 * sc, y, 3 * sc, 5 * sc);
  }
}

// o: { color, scale, align: 'left'|'center'|'right', shadow, outline }
export function drawText(ctx, str, x, y, o = {}) {
  str = String(str).toUpperCase();
  const sc = o.scale || 1;
  const w = textWidth(str, sc);
  let sx = o.align === 'center' ? x - Math.floor(w / 2) : o.align === 'right' ? x - w : x;
  sx = Math.round(sx);
  y = Math.round(y);
  if (o.shadow) run(ctx, str, sx + sc, y + sc, sc, o.shadow);
  if (o.outline) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) run(ctx, str, sx + dx * sc, y + dy * sc, sc, o.outline);
  }
  run(ctx, str, sx, y, sc, o.color || '#f4f4f4');
}

export class Button {
  constructor(label, x, y, w, h, onClick, o = {}) {
    Object.assign(this, { label, x, y, w, h, onClick, enabled: o.enabled ?? true, hover: false });
  }
  update() {
    const m = Input.mouse;
    this.hover = this.enabled && m.x >= this.x && m.x < this.x + this.w && m.y >= this.y && m.y < this.y + this.h;
    if (this.hover && m.clicked) {
      m.clicked = false;
      this.onClick();
    }
  }
  draw(ctx) {
    const { x, y, w, h } = this;
    ctx.fillStyle = '#0b0814';
    ctx.fillRect(x + 1, y + 1, w, h);
    ctx.fillStyle = !this.enabled ? '#2a2236' : this.hover ? '#ffd23f' : '#3b3355';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = !this.enabled ? '#2a2236' : this.hover ? '#fff3a0' : '#5a4f80';
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = '#140c1c';
    ctx.fillRect(x, y + h - 1, w, 1);
    const color = !this.enabled ? '#55566b' : this.hover ? '#140c1c' : '#f4f4f4';
    drawText(ctx, this.label, x + w / 2, y + Math.floor((h - 5) / 2), { align: 'center', color });
  }
}

export function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(20,12,28,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#5a4f80';
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

export function drawHearts(ctx, x, y, hp, max) {
  for (let i = 0; i < max; i++) {
    ctx.drawImage((i < hp ? SPR.heart : SPR.heartEmpty).img, x + i * 8, y);
  }
}
