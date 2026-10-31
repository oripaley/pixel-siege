// Keyboard + mouse state. Mouse coordinates are in game pixels (320x180).
const BLOCKED = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

export const Input = {
  keys: new Set(),
  pressed: new Set(), // keys pressed since the last update step
  focusLost: false,
  mouse: { x: 160, y: 90, down: false, clicked: false },

  init(canvas, W, H) {
    addEventListener('keydown', (e) => {
      if (BLOCKED.has(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
      this.focusLost = true;
    });

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) * W) / r.width;
      this.mouse.y = ((e.clientY - r.top) * H) / r.height;
    };
    addEventListener('mousemove', pos);
    addEventListener('mousedown', (e) => {
      pos(e);
      if (e.button === 0) {
        this.mouse.down = true;
        this.mouse.clicked = true;
      }
      e.preventDefault();
    });
    addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
    });
    addEventListener('contextmenu', (e) => e.preventDefault());
  },

  isDown(...codes) {
    return codes.some((c) => this.keys.has(c));
  },
  wasPressed(...codes) {
    return codes.some((c) => this.pressed.has(c));
  },
  // Called after every fixed update step.
  endStep() {
    this.pressed.clear();
    this.mouse.clicked = false;
    this.focusLost = false;
  },
};
