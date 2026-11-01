import { cx } from '../core/canvas.js';

export const cam = { shake: 0, flash: 0, flashColor: '255,0,0' };

export function addShake(v = 0.25) {
  cam.shake = Math.max(cam.shake, v);
}
export function addFlash(color = '255,0,0', v = 0.3) {
  cam.flash = Math.max(cam.flash, v);
  cam.flashColor = color;
}

export function updateCamera(dt) {
  cam.shake = Math.max(0, cam.shake - dt);
  cam.flash = Math.max(0, cam.flash - dt * 1.6);
}

export function beginCamera() {
  if (cam.shake <= 0) return false;
  cx.save();
  const s = cam.shake * 22;
  cx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  return true;
}
export function endCamera(was) {
  if (was) cx.restore();
}

export function drawFlash(W, H) {
  if (cam.flash <= 0) return;
  cx.fillStyle = `rgba(${cam.flashColor},${cam.flash})`;
  cx.fillRect(0, 0, W, H);
}

export const resetCamera = () => {
  cam.shake = 0;
  cam.flash = 0;
};