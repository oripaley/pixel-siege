// Retro sound effects synthesized with the Web Audio API (no audio files).
// The AudioContext is created on the first user gesture (browser autoplay rules).
import { Save } from './save.js';

const VOLUME = 0.35;
let ac = null;
let master = null;
let noiseBuf = null;
const lastPlayed = new Map();

function tone({ type = 'square', f0, f1 = f0, dur = 0.1, vol = 0.2, delay = 0 }) {
  const t = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ dur = 0.2, vol = 0.2, type = 'lowpass', f0 = 2000, f1 = f0, delay = 0 }) {
  const t = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) filter.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

const notes = (freqs, step, o = {}) => freqs.forEach((f, i) => tone({ f0: f, dur: step * 1.4, delay: i * step, ...o }));

// name -> [play function, minimum seconds between plays]
const SOUNDS = {
  shoot: [() => {
    tone({ f0: 900, f1: 180, dur: 0.07, vol: 0.09 });
    noise({ dur: 0.04, vol: 0.06, type: 'highpass', f0: 3000 });
  }, 0.03],
  enemyShoot: [() => tone({ type: 'triangle', f0: 620, f1: 260, dur: 0.14, vol: 0.12 }), 0.06],
  hit: [() => tone({ f0: 320, f1: 140, dur: 0.045, vol: 0.08 }), 0.03],
  death: [() => {
    noise({ dur: 0.25, vol: 0.22, f0: 1600, f1: 200 });
    tone({ f0: 220, f1: 60, dur: 0.16, vol: 0.1 });
  }, 0.04],
  bigDeath: [() => {
    noise({ dur: 0.5, vol: 0.3, f0: 1200, f1: 100 });
    tone({ type: 'sawtooth', f0: 160, f1: 40, dur: 0.4, vol: 0.14 });
  }, 0.05],
  bossDeath: [() => {
    noise({ dur: 1.4, vol: 0.4, f0: 2000, f1: 60 });
    tone({ type: 'sawtooth', f0: 220, f1: 30, dur: 1.2, vol: 0.2 });
    noise({ dur: 0.8, vol: 0.3, f0: 800, f1: 80, delay: 0.3 });
  }, 0.5],
  hurt: [() => {
    tone({ type: 'sawtooth', f0: 240, f1: 70, dur: 0.25, vol: 0.2 });
    noise({ dur: 0.15, vol: 0.15, f0: 900 });
  }, 0.1],
  playerDeath: [() => {
    noise({ dur: 1.0, vol: 0.35, f0: 1500, f1: 80 });
    tone({ type: 'sawtooth', f0: 300, f1: 40, dur: 0.9, vol: 0.18 });
  }, 0.5],
  pickup: [() => notes([660, 880, 1320], 0.06, { vol: 0.1 }), 0.05],
  powerup: [() => notes([440, 660, 880, 1100, 1320], 0.045, { vol: 0.1 }), 0.05],
  wave: [() => notes([440, 660], 0.1, { type: 'triangle', vol: 0.16 }), 0.2],
  bossWarning: [() => {
    for (let i = 0; i < 4; i++) tone({ type: 'sawtooth', f0: i % 2 ? 165 : 220, dur: 0.18, vol: 0.14, delay: i * 0.2 });
  }, 1],
  charge: [() => tone({ type: 'sawtooth', f0: 70, f1: 200, dur: 0.6, vol: 0.13 }), 0.3],
  levelClear: [() => {
    notes([523, 659, 784], 0.1, { vol: 0.12 });
    tone({ f0: 1047, dur: 0.45, vol: 0.12, delay: 0.3 });
  }, 1],
  gameOver: [() => notes([392, 330, 262, 196], 0.2, { type: 'triangle', vol: 0.2 }), 1],
  click: [() => tone({ f0: 1000, f1: 700, dur: 0.04, vol: 0.08 }), 0.03],
  hover: [() => tone({ f0: 1400, dur: 0.015, vol: 0.03 }), 0.03],
};

export const Sound = {
  muted: false,

  // Call from a user gesture (click / key press).
  init() {
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = this.muted ? 0 : VOLUME;
        master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
    } catch {
      ac = null; // audio unsupported: stay silent
    }
  },

  setMuted(m) {
    this.muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : VOLUME, ac.currentTime, 0.01);
  },

  toggle() {
    this.setMuted(!this.muted);
    Save.data.muted = this.muted;
    Save.store();
    this.play('click');
  },

  get label() {
    return this.muted ? 'SOUND: OFF' : 'SOUND: ON';
  },

  play(name) {
    if (!ac || this.muted || ac.state !== 'running') return;
    const [fn, gap] = SOUNDS[name];
    const now = ac.currentTime;
    if (now - (lastPlayed.get(name) ?? -1) < gap) return;
    lastPlayed.set(name, now);
    try {
      fn();
    } catch {
      /* ignore */
    }
  },
};
