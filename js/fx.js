// Efeitos: partículas (canvas), sons sintetizados (WebAudio), vibração e tilt 3D.
import { state } from './state.js';

// ------------------------------------------------------------
//  Partículas
// ------------------------------------------------------------
const canvas = document.getElementById('fx');
const ctx = canvas.getContext('2d');
let parts = [];
let running = false;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
}
resize();
addEventListener('resize', resize);

function loop() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.globalCompositeOperation = 'lighter';
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.life -= p.decay;
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.vr;
    const a = Math.max(0, Math.min(1, p.life));
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.shape === 'spark') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillRect(-p.size * 2.5, -p.size * 0.3, p.size * 5, p.size * 0.6);
      ctx.restore();
    } else if (p.shape === 'star') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      const s = p.size * (0.6 + a * 0.6);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(0, -s * 2); ctx.lineTo(s * 0.35, -s * 0.35); ctx.rotate(Math.PI / 2);
      }
      ctx.fill(); ctx.restore();
    } else if (p.shape === 'confetti') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(loop);
  else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

export function burst(x, y, { colors = ['#fff'], count = 40, speed = 7, shape = 'spark', g = 0.08, size = 2.2, decay = 0.018, spread = Math.PI * 2, angle = 0 } = {}) {
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = speed * (0.35 + Math.random() * 0.75);
    parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      g, drag: 0.965, life: 1, decay: decay * (0.7 + Math.random() * 0.6),
      size: size * (0.6 + Math.random() * 0.8),
      color: colors[i % colors.length], shape,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    });
  }
  kick();
}

export function confetti(colors) {
  const w = innerWidth;
  for (let i = 0; i < 120; i++) {
    parts.push({
      x: Math.random() * w, y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
      g: 0.04, drag: 0.995, life: 1.6, decay: 0.006,
      size: 3 + Math.random() * 3, color: colors[i % colors.length],
      shape: 'confetti', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.25,
    });
  }
  kick();
}

export function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// ------------------------------------------------------------
//  Som (sintetizado, sem arquivos)
// ------------------------------------------------------------
let ac = null;
function audio() {
  if (!state.settings.sound) return null;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  } catch { return null; }
}

function tone(freq, dur, { type = 'sine', vol = 0.12, at = 0, slide = 0 } = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(dur, { vol = 0.15, at = 0, from = 800, to = 4000, q = 1 } = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + at;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  tap: () => tone(660, 0.06, { type: 'triangle', vol: 0.05 }),
  tearTick: () => noise(0.05, { vol: 0.05, from: 2000, to: 3500, q: 3 }),
  tear: () => { noise(0.35, { vol: 0.22, from: 900, to: 5000, q: 0.8 }); tone(180, 0.3, { type: 'sawtooth', vol: 0.03, slide: 300 }); },
  whoosh: () => noise(0.4, { vol: 0.1, from: 300, to: 1800, q: 0.6 }),
  flip: () => { noise(0.12, { vol: 0.08, from: 1500, to: 3000, q: 2 }); },
  coin: () => { tone(988, 0.08, { type: 'square', vol: 0.04 }); tone(1319, 0.18, { type: 'square', vol: 0.04, at: 0.07 }); },
  reveal(rarity) {
    const seq = {
      comum: [523],
      rara: [523, 784],
      muito: [523, 659, 988],
      especial: [523, 659, 784, 1047, 1319],
    }[rarity];
    seq.forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.09, at: i * 0.08 }));
    if (rarity === 'especial') { tone(1568, 0.9, { type: 'sine', vol: 0.06, at: 0.4 }); noise(0.9, { vol: 0.06, from: 4000, to: 9000, at: 0.3 }); }
  },
  charge: () => tone(120, 1.1, { type: 'sawtooth', vol: 0.05, slide: 700 }),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.08, at: i * 0.11 })),
};

export function haptic(pattern = 10) {
  try { navigator.vibrate && navigator.vibrate(pattern); } catch { /* sem suporte */ }
}

// ------------------------------------------------------------
//  Tilt 3D com "spring" — usado em cartas e pacotes
//  Escreve variáveis CSS: --rx --ry (graus), --mx --my (0–100%), --hyp (0–1)
// ------------------------------------------------------------
let gyro = null;              // {x, y} normalizado -1..1
let gyroAsked = false;

export async function enableGyro() {
  if (gyroAsked || !state.settings.tilt) return;
  gyroAsked = true;
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') return;
    }
    let base = null;
    addEventListener('deviceorientation', e => {
      if (e.beta == null) return;
      if (!base) base = { b: e.beta, g: e.gamma };
      const x = Math.max(-1, Math.min(1, (e.gamma - base.g) / 25));
      const y = Math.max(-1, Math.min(1, (e.beta - base.b) / 25));
      gyro = { x, y };
    });
  } catch { /* sem giroscópio */ }
}

export function attachTilt(el, { max = 16, idle = true, target = el } = {}) {
  let tx = 0, ty = 0, cx = 0, cy = 0, active = false, raf = 0, alive = true;
  let t0 = performance.now();

  const onMove = e => {
    const r = el.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    tx = Math.max(-1, Math.min(1, tx)); ty = Math.max(-1, Math.min(1, ty));
    active = true;
  };
  const onLeave = () => { active = false; };

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerdown', onMove);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('pointercancel', onLeave);
  el.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') onLeave(); });

  const step = time => {
    if (!alive || !el.isConnected) return;
    let gx = tx, gy = ty;
    if (!active) {
      if (gyro && state.settings.tilt) { gx = gyro.x; gy = gyro.y; }
      else if (idle) {
        const t = (time - t0) / 1000;
        gx = Math.sin(t * 0.9) * 0.35; gy = Math.cos(t * 0.7) * 0.25;
      } else { gx = 0; gy = 0; }
    }
    cx += (gx - cx) * 0.1; cy += (gy - cy) * 0.1;
    target.style.setProperty('--rx', `${(-cy * max).toFixed(2)}deg`);
    target.style.setProperty('--ry', `${(cx * max).toFixed(2)}deg`);
    target.style.setProperty('--mx', `${((cx + 1) * 50).toFixed(1)}%`);
    target.style.setProperty('--my', `${((cy + 1) * 50).toFixed(1)}%`);
    target.style.setProperty('--hyp', Math.min(1, Math.hypot(cx, cy)).toFixed(3));
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { alive = false; cancelAnimationFrame(raf); };
}
