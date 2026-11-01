import { cx } from '../core/canvas.js';

export function roundPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y, x + w, y + h, r);
  cx.arcTo(x + w, y + h, x, y + h, r);
  cx.arcTo(x, y + h, x, y, r);
  cx.arcTo(x, y, x + w, y, r);
  cx.closePath();
}

export function glowText(text, x, y, color, size = 32, font = 'bold') {
  cx.save();
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.shadowColor = color;
  cx.shadowBlur = 24;
  cx.fillStyle = color;
  cx.font = `${font} ${size}px system-ui`;
  cx.fillText(text, x, y);
  cx.restore();
}

export function drawBlock(x, y, size, color, alpha = 1) {
  cx.save();
  cx.globalAlpha = alpha;
  const r = Math.max(4, size * 0.2);
  const g = cx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, color);
  g.addColorStop(1, '#11152b');
  cx.shadowColor = color;
  cx.shadowBlur = 8;
  roundPath(x, y, size, size, r);
  cx.fillStyle = g;
  cx.fill();
  cx.shadowBlur = 0;
  cx.strokeStyle = '#ffffff78';
  cx.lineWidth = Math.max(1, size * 0.035);
  cx.stroke();
  roundPath(x + size * 0.12, y + size * 0.09, size * 0.76, size * 0.16, r * 0.55);
  cx.fillStyle = '#ffffff38';
  cx.fill();
  roundPath(x + size * 0.12, y + size * 0.78, size * 0.76, size * 0.1, r * 0.4);
  cx.fillStyle = '#05091a35';
  cx.fill();
  cx.restore();
}