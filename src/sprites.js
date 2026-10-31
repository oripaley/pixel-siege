// Pixel-art sprites defined as character grids, baked once to offscreen canvases.
// Each baked sprite has { img, flash, w, h } — `flash` is a white silhouette for hit flashes.

export const PAL = {
  k: '#140c1c', // outline
  K: '#30243c', // deep shadow
  w: '#f4f4f4', // white
  s: '#f1c08f', // skin
  S: '#c88a5e', // skin shadow
  g: '#3e7d3a', // green
  G: '#73b84a', // light green
  d: '#27492a', // dark green
  b: '#2d3557', // navy
  B: '#4f6bd1', // blue
  c: '#7fc8f8', // cyan
  r: '#a8232e', // red
  R: '#ff4f4f', // light red
  y: '#ffd23f', // yellow
  o: '#f0862a', // orange
  p: '#5d2e8a', // purple
  P: '#a65ee0', // light purple
  m: '#55566b', // metal
  M: '#9ea3b8', // light metal
};

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function bake(rows, remap = {}) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const img = canvas(w, h);
  const flash = canvas(w, h);
  const ic = img.getContext('2d');
  const fc = flash.getContext('2d');
  fc.fillStyle = '#ffffff';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      const col = remap[ch] ?? PAL[ch];
      if (ch === '.' || !col) continue;
      ic.fillStyle = col;
      ic.fillRect(x, y, 1, 1);
      fc.fillRect(x, y, 1, 1);
    }
  }
  return { img, flash, w, h };
}

// Build a symmetric sprite from its left half.
const mirror = (half) => half.map((r) => r + [...r].reverse().join(''));
// Copy a grid, replacing rows starting at `start`.
const withRows = (base, start, rows) => base.map((r, i) => (i >= start && i < start + rows.length ? rows[i - start] : r));

// ---------------------------------------------------------------- player
const PLAYER = [
  '....kkkkkk....',
  '...kGGGGGgk...',
  '..kGGggggggk..',
  '..kggggggggk..',
  '..kkkkkkkkkkk.',
  '...kssskwsk...',
  '...ksssssSk...',
  '....kSSSSk....',
  '...kkggggkk...',
  '..kgGgggggdk..',
  '..kgGgggggdk..',
  '..ksgggggdsk..',
  '...kbbbbbbk...',
  '...kbbkkbbk...',
  '...kbk..kbk...',
  '...kkk..kkk...',
];
const LEGS = {
  stepA: ['...kbbkkbbk...', '..kbk....kbk..', '.kkk.....kkk..'],
  mid: ['...kbbbbbbk...', '....kbkkbk....', '....kkkkkk....'],
  stepB: ['...kbbkkbbk...', '...kbk.kbk....', '..kkk..kkk....'],
};

const GUN = [
  '.kkkkkkkkkk',
  'kmMMMMMMMMk',
  'kmmmmmmkkkk',
  'kmmkk......',
  '.kk........',
];

// ---------------------------------------------------------------- enemies
const GRUNT = [
  '...kkkkkk...',
  '..kGGGGGGk..',
  '.kGGwwwwGGk.',
  '.kGwwkkwwGk.',
  '.kGwwkkwwgk.',
  '.kGGwwwwggk.',
  'kGGGGGGgggdk',
  'kgGkkkkkggdk',
  'kggkRRRkgddk',
  '.kgggggggdk.',
  '.kdk...kdk..',
  '.kk.....kk..',
];
const GRUNT_LEGS_B = ['..kdk.kdk...', '..kk...kk...'];

const RUNNER = [
  '..k......k..',
  '...k....k...',
  '..kkkkkkkk..',
  '.kRRRRRRRRk.',
  'kRRykRRykRRk',
  'kRRkkRRkkRRk',
  'kRrRRRRRRrRk',
  '.krrrrrrrrk.',
  'k.k.k..k.k.k',
  '............',
];
const RUNNER_B = withRows(withRows(RUNNER, 0, ['.k........k.', '..k......k..']), 8, ['.k.k.kk.k.k.']);

const TANK = [
  '....kkkkkkkk....',
  '...kPPPPPPPPk...',
  '..kPPPPPPPPPpk..',
  '..kPkkPPPPkkpk..',
  '..kPkyPPPPykpk..',
  '..kPPPPPPPPPpk..',
  '.kkPkwkwkwkwpkk.',
  'kPPkPPPPPPPPpkPk',
  'kPpkpPPPPPPppkpk',
  'kppkpppppppppkpk',
  '.kk.kpppppppk.k.',
  '....kppkkppk....',
  '....kpk..kpk....',
  '...kkkk..kkkk...',
];
const TANK_B = withRows(TANK, 12, ['...kpk....kpk...', '..kkkk....kkkk..']);

const SHOOTER = [
  '..kkkk..kkkk..',
  '......kk......',
  '....kkkkkk....',
  '...kBBBBBBk...',
  '..kBBccccBBk..',
  '.kBBcwwwwcBBk.',
  '.kBBcwRRwcBBk.',
  '.kBBcwRRwcBbk.',
  '.kBBcwwwwcBbk.',
  '..kBBccccBbk..',
  '...kbbbbbbk...',
  '....kk..kk....',
];
const SHOOTER_B = withRows(SHOOTER, 0, ['...kk....kk...']);

const BOSS_HALF = [
  '..k.........',
  '..kk....kkkk',
  '..kyk.kkrrrr',
  '...kykrrRRrr',
  '...kkrRRRRrr',
  '..krrRRRRrrr',
  '..krRkkkkrrr',
  '..krkyyyykrr',
  '..krkyywykrr',
  '..krkyyyykrr',
  '..krrkkkkrrr',
  '.kkrrrrrrrrr',
  'kRkrrrrrrkkr',
  'kRkrkkkkkkkk',
  'kRkrkwkwkwkw',
  'kRkrkkkkkkkk',
  '.kkrrrrrrrrr',
  '..krrrrrrrrr',
  '..kkrrkkkkkk',
  '...krrk.....',
  '...kkkk.....',
];
const BOSS_HALF_B = withRows(BOSS_HALF, 19, ['....krrk....', '....kkkk....']);

// ---------------------------------------------------------------- items / ui
const HEART = ['.RR.RR.', 'RRRRRRR', 'RwRRRRR', '.RRRRR.', '..RRR..', '...R...'];
const BOLT = ['...kkkk', '..kyyk.', '.kyyk..', 'kyyyyyk', '..kyyk.', '.kyyk..', 'kyk....', 'kk.....'];
const CROSSHAIR = [
  '...kRk...',
  '...kRk...',
  '...kRk...',
  'kkk...kkk',
  'RRR.w.RRR',
  'kkk...kkk',
  '...kRk...',
  '...kRk...',
  '...kRk...',
];

export const SPR = {
  player: {
    idle: bake(PLAYER),
    walk: [LEGS.stepA, LEGS.mid, LEGS.stepB, LEGS.mid].map((l) => bake(withRows(PLAYER, 13, l))),
  },
  gun: bake(GUN),
  grunt: [bake(GRUNT), bake(withRows(GRUNT, 10, GRUNT_LEGS_B))],
  runner: [bake(RUNNER), bake(RUNNER_B)],
  tank: [bake(TANK), bake(TANK_B)],
  shooter: [bake(SHOOTER), bake(SHOOTER_B)],
  boss: [bake(mirror(BOSS_HALF)), bake(mirror(BOSS_HALF_B))],
  heart: bake(HEART),
  heartEmpty: bake(HEART, { R: '#3b3355', w: '#3b3355' }),
  bolt: bake(BOLT),
  crosshair: bake(CROSSHAIR),
};

// Draw a sprite centered on (x, y).
export function drawSprite(ctx, s, x, y, o = {}) {
  const img = o.flash ? s.flash : s.img;
  const sc = o.scale || 1;
  const w = s.w * sc;
  const h = s.h * sc;
  const dx = Math.round(x - w / 2);
  const dy = Math.round(y - h / 2);
  if (o.flip) {
    ctx.save();
    ctx.translate(dx + w, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, dx, dy, w, h);
  }
}

// Small pixel ellipse shadow under a character.
export function drawShadow(ctx, x, y, w) {
  w = Math.round(w);
  x = Math.round(x - w / 2);
  y = Math.round(y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 1, y - 1, w - 2, 3);
  ctx.fillRect(x, y, w, 1);
}

// Procedural metal-plate arena floor.
export function makeFloor(W, H) {
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const px = (x, y, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  };
  g.fillStyle = '#232331';
  g.fillRect(0, 0, W, H);
  for (let ty = 0; ty < H; ty += 16) {
    for (let tx = 0; tx < W; tx += 16) {
      const v = Math.random();
      g.fillStyle = v < 0.15 ? '#272738' : v < 0.3 ? '#20202c' : '#232331';
      g.fillRect(tx, ty, 16, 16);
      g.fillStyle = '#191923';
      g.fillRect(tx, ty, 16, 1);
      g.fillRect(tx, ty, 1, 16);
      g.fillStyle = '#2c2c3e';
      g.fillRect(tx + 1, ty + 1, 15, 1);
      for (let i = 0; i < 4; i++) {
        px(tx + 2 + Math.floor(Math.random() * 13), ty + 2 + Math.floor(Math.random() * 13), Math.random() < 0.5 ? '#2e2e41' : '#1c1c27');
      }
      if (Math.random() < 0.08) {
        let x = tx + 4 + Math.floor(Math.random() * 8);
        let y = ty + 4 + Math.floor(Math.random() * 8);
        for (let i = 0; i < 7; i++) {
          px(x, y, '#17171f');
          x += Math.floor(Math.random() * 3) - 1;
          y += Math.random() < 0.7 ? 1 : 0;
        }
      }
      if (Math.random() < 0.07) {
        for (const [bx, by] of [[3, 3], [12, 3], [3, 12], [12, 12]]) {
          px(tx + bx, ty + by, '#3a3a4e');
          px(tx + bx, ty + by + 1, '#17171f');
        }
      }
    }
  }
  // vignette toward the edges
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `rgba(8,6,14,${0.28 - i * 0.035})`;
    g.fillRect(i, i, W - i * 2, 1);
    g.fillRect(i, H - 1 - i, W - i * 2, 1);
    g.fillRect(i, i, 1, H - i * 2);
    g.fillRect(W - 1 - i, i, 1, H - i * 2);
  }
  return c;
}

let sharedFloor = null;
export function getFloor(W, H) {
  if (!sharedFloor) sharedFloor = makeFloor(W + 16, H + 16);
  return sharedFloor;
}
