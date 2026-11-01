import { S, save } from './state.js';

let ac = null;
export const isSoundOn = () => S.sound !== false;

export function toggleSound() {
  S.sound = !isSoundOn();
  save();
  const el = document.getElementById('sound-toggle');
  if (el) el.textContent = S.sound ? 'Звук: включён' : 'Звук: выключен';
  return S.sound;
}

export function beep(f, d = 0.08, t = 'sine', vol = 0.06) {
  if (!isSoundOn()) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = t; o.frequency.value = f;
    g.gain.value = vol;
    o.connect(g); g.connect(ac.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
    o.stop(ac.currentTime + d);
  } catch (e) {}
}

export function chord(notes, d = 0.25) {
  notes.forEach((n, i) => setTimeout(() => beep(n, d, 'triangle', 0.05), i * 40));
}