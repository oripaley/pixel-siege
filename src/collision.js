export const circleHit = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.r + b.r) ** 2;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
