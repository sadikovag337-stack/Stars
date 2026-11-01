export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
export const easeOutElastic = t => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};