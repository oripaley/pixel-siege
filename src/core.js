// Shared game constants and the active-scene holder.
export const W = 320;
export const H = 180;

export const core = {
  scene: null,
  time: 0,
  go(scene) {
    this.scene = scene;
  },
};
