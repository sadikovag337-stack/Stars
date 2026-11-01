let raf = 0;
let last = performance.now();
let cb = null;
export const isRunning = () => !!cb;

export function start(loopFn) {
  cancelAnimationFrame(raf);
  cb = loopFn;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}

function tick(n) {
  if (!cb) return;
  const dt = Math.min(0.04, (n - last) / 1000);
  last = n;
  cb(dt, n);
  if (cb) raf = requestAnimationFrame(tick);
}

export function stop() {
  cb = null;
  cancelAnimationFrame(raf);
}

export function pause() {
  cancelAnimationFrame(raf);
}
export function resume() {
  if (cb) { last = performance.now(); raf = requestAnimationFrame(tick); }
}