import { cx } from '../core/canvas.js';
import { rand } from '../core/utils.js';

export function makeStarfield(count, W, H) {
  return Array.from({ length: count }, () => ({
    x: rand(0, W), y: rand(0, H),
    z: rand(0.4, 2.4),
    tw: rand(0, Math.PI * 2),
  }));
}

export function drawStarfield(stars, W, H, dt, speed = 1, t = 0) {
  for (const s of stars) {
    s.y = (s.y + s.z * 60 * speed * dt) % H;
    const a = 0.35 + Math.sin(t * 2 + s.tw) * 0.25;
    cx.globalAlpha = a;
    cx.fillStyle = '#e2f5ff';
    cx.fillRect(s.x, s.y, s.z, s.z * 2.4);
  }
  cx.globalAlpha = 1;
}

export function drawNebula(W, H, t) {
  const spots = [
    { color: '#2463a533', x: W * 0.2, y: H * 0.2 },
    { color: '#9435b533', x: W * 0.55, y: H * 0.48 },
    { color: '#1bc7d533', x: W * 0.85, y: H * 0.72 },
  ];
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    const x = s.x + Math.sin(t * 0.16 + i * 3) * W * 0.08;
    const y = s.y + Math.cos(t * 0.12 + i * 2) * H * 0.05;
    const rg = cx.createRadialGradient(x, y, 0, x, y, W * 0.32);
    rg.addColorStop(0, s.color);
    rg.addColorStop(1, 'transparent');
    cx.fillStyle = rg;
    cx.fillRect(0, 0, W, H);
  }
}