// Level data: each level is a list of waves; each wave maps enemy type -> count.
export const LEVELS = [
  { name: 'FIRST CONTACT', interval: 1.2, waves: [{ grunt: 6 }, { grunt: 10 }] },
  { name: 'FAST MOVERS', interval: 1.0, waves: [{ grunt: 8 }, { grunt: 6, runner: 4 }, { grunt: 6, runner: 8 }] },
  { name: 'HEAVY METAL', interval: 1.0, waves: [{ grunt: 8, runner: 4 }, { grunt: 6, tank: 2 }, { grunt: 6, runner: 6, tank: 3 }] },
  { name: 'INCOMING FIRE', interval: 0.95, waves: [{ grunt: 6, shooter: 3 }, { runner: 6, shooter: 4 }, { grunt: 6, tank: 2, shooter: 4 }] },
  { name: 'THE BIG ONE', interval: 0.9, waves: [{ grunt: 10, runner: 6 }, { grunt: 6, tank: 3, shooter: 4 }, { boss: 1, grunt: 6, runner: 4 }] },
  { name: 'SWARM', interval: 0.7, waves: [{ runner: 14 }, { grunt: 12, runner: 8 }, { runner: 12, shooter: 4, tank: 2 }] },
  { name: 'CROSSFIRE', interval: 0.8, waves: [{ grunt: 8, shooter: 6 }, { runner: 10, shooter: 6 }, { grunt: 8, tank: 4, shooter: 6 }] },
  { name: 'IRON WALL', interval: 0.8, waves: [{ grunt: 10, tank: 5 }, { runner: 10, tank: 6 }, { grunt: 10, tank: 6, shooter: 6 }] },
  { name: 'NO MERCY', interval: 0.65, waves: [{ grunt: 16, runner: 10 }, { runner: 10, tank: 4, shooter: 8 }, { grunt: 14, runner: 10, tank: 5, shooter: 8 }] },
  { name: 'FINAL STAND', interval: 0.7, bossHp: 1.15, waves: [{ grunt: 14, runner: 10, shooter: 5 }, { runner: 10, tank: 6, shooter: 8 }, { boss: 2, grunt: 8, runner: 8 }] },
];

export const CAMPAIGN_LENGTH = LEVELS.length;

export function getLevel(n) {
  if (n <= LEVELS.length) {
    return { bossHp: 1, ...LEVELS[n - 1], num: n, hpScale: 1, speedScale: 1 + (n - 1) * 0.025 };
  }
  // Endless mode: generated, steadily harder levels with a boss every 5th.
  const k = n - LEVELS.length;
  const count = 3 + Math.min(2, Math.floor(k / 3));
  const waves = [];
  for (let i = 0; i < count; i++) {
    waves.push({
      grunt: 8 + k * 2 + i * 2,
      runner: 5 + k + i * 2,
      tank: 2 + Math.floor(k / 2) + i,
      shooter: 3 + Math.floor(k / 2) + i,
    });
  }
  if (n % 5 === 0) waves[waves.length - 1].boss = 1 + Math.floor(k / 10);
  return {
    name: `ENDLESS ${k}`,
    waves,
    num: n,
    interval: Math.max(0.35, 0.65 - k * 0.02),
    hpScale: 1 + k * 0.12,
    speedScale: Math.min(1.5, 1.22 + k * 0.02),
    bossHp: 1.2,
  };
}
