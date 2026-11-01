import { cv } from '../core/canvas.js';

const handlers = { pointermove: [], pointerdown: [], pointerup: [], keydown: [], keyup: [] };

export const input = {
  on(type, fn) { handlers[type]?.push(fn); },
  off(type, fn) {
    const arr = handlers[type];
    if (!arr) return;
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  },
  clear() { for (const k in handlers) handlers[k].length = 0; },
};

function emit(type, e) { for (const fn of handlers[type]) fn(e); }

cv.addEventListener('pointermove', e => emit('pointermove', e));
cv.addEventListener('pointerdown', e => emit('pointerdown', e));
cv.addEventListener('pointerup', e => emit('pointerup', e));
addEventListener('keydown', e => emit('keydown', e));
addEventListener('keyup', e => emit('keyup', e));

export function localPoint(e) {
  const r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}