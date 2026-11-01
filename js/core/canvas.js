export const cv = document.getElementById('cv');
export const cx = cv.getContext('2d');
export let W = 0, H = 0;

export function size() {
  const r = cv.getBoundingClientRect();
  const d = Math.min(devicePixelRatio || 1, 2.5);
  W = r.width; H = r.height;
  cv.width = Math.round(W * d);
  cv.height = Math.round(H * d);
  cx.setTransform(d, 0, 0, d, 0, 0);
}

export const getWH = () => ({ W, H });