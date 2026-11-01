import { cx } from '../core/canvas.js';
import { rand } from '../core/utils.js';

const pool = [];

export function spawnParticles(x, y, color, count = 10, opts = {}) {
  const {
    speedMin = 35, speedMax = 190,
    lifeMin = 0.3, lifeMax = 0.85,
    sizeMin = 2, sizeMax = 6,
    gravity = 0,
    shape = 'circle',
  } = opts;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = rand(speedMin, speedMax);
    pool.push({
      x, y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      t: 0, life: rand(lifeMin, lifeMax),
      size: rand(sizeMin, sizeMax),
      color, gravity, shape,
    });
  }
}

export function spawnSpark(x, y, color) {
  pool.push({
    x, y, vx: 0, vy: 0, t: 0, life: 0.5,
    size: 8, color, gravity: 0, shape: 'ring',
  });
}

export function updateParticles(dt) {
  for (const p of pool) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
  }
  for (let i = pool.length - 1; i >= 0; i--) {
    if (pool[i].t >= pool[i].life) pool.splice(i, 1);
  }
}

export function drawParticles() {
  for (const p of pool) {
    const a = Math.max(0, 1 - p.t / p.life);
    cx.save();
    cx.globalAlpha = a;
    cx.shadowColor = p.color;
    cx.shadowBlur = 10;
    cx.fillStyle = p.color;
    if (p.shape === 'ring') {
      const k = 1 - a;
      cx.strokeStyle = p.color;
      cx.lineWidth = 3 * a + 0.5;
      cx.beginPath();
      cx.arc(p.x, p.y, p.size + k * 40, 0, Math.PI * 2);
      cx.stroke();
    } else {
      cx.beginPath();
      cx.arc(p.x, p.y, Math.max(0.1, p.size * a), 0, Math.PI * 2);
      cx.fill();
    }
    cx.restore();
  }
}

export const clearParticles = () => pool.length = 0;