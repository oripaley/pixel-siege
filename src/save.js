// Persistent progress (best score, unlocked levels). Storage may be unavailable.
const KEY = 'pixel-siege.save.v1';

export const Save = {
  data: { best: 0, maxLevel: 1, muted: false },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d) Object.assign(this.data, d);
    } catch {
      /* ignore */
    }
  },
  store() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* ignore */
    }
  },
  record({ score = 0, reachedLevel = 1 }) {
    const isBest = score > this.data.best;
    this.data.best = Math.max(this.data.best, score);
    this.data.maxLevel = Math.max(this.data.maxLevel, reachedLevel);
    this.store();
    return isBest;
  },
};
