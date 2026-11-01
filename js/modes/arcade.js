import { W, H, cx } from '../core/canvas.js';
import { S, save, BASKET_W, MAGNET_TIME, FEVER_MULT } from '../core/state.js';
import { BGS, SKINS } from '../data/skins.js';
import { beep } from '../core/audio.js';
import { showOver, setHud, setBan } from '../ui/screens.js';
import { start, stop } from '../core/loop.js';
import { spawnParticles, updateParticles, drawParticles, clearParticles } from '../systems/particles.js';
import { addShake, addFlash, beginCamera, endCamera, updateCamera, drawFlash, resetCamera } from '../systems/camera.js';
import { clamp, rand } from '../core/utils.js';
import { input } from '../systems/input.js';
import { makeStarfield, drawStarfield } from '../render/bg.js';

let A = null;
let bound = false;

export function startArcade() {
  if (!bound) { bindInput(); bound = true; }
  resetCamera();
  clearParticles();
  const bg = BGS[S.bg][2];
  A = {
    x: W / 2, items: [], score: 0, lives: 3, coins: 0, lvl: 1,
    combo: 0, mag: 0, fev: 0, t: 0, sp: 0,
    bw: BASKET_W(), bg,
    stars: makeStarfield(60, W, H),
    msg: 0,
    trail: [],
  };
  setBan('Лови звёзды и драгоценности · не дай им упасть!');
  start(loop);
}

export function stopArcade() { stop(); A = null; }

function bindInput() {
  input.on('pointermove', e => {
    if (!A) return;
    const r = document.getElementById('cv').getBoundingClientRect();
    A.x = clamp(e.clientX - r.left, A.bw / 2, W - A.bw / 2);
  });
  input.on('keydown', e => {
    if (!A) return;
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) A.x = clamp(A.x - A.bw * 0.38, A.bw / 2, W - A.bw / 2);
    if (['ArrowRight', 'd', 'D'].includes(e.key)) A.x = clamp(A.x + A.bw * 0.38, A.bw / 2, W - A.bw / 2);
  });
}

function spawnItem() {
  const r = Math.random();
  let t = 'star';
  if (r > 0.82) t = 'bomb';
  else if (r > 0.74) t = 'coin';
  else if (r > 0.68) t = 'gem';
  else if (r > 0.65) t = 'magnet';
  else if (r > 0.63 && A.lives < 3) t = 'heart';
  A.items.push({
    x: rand(20, W - 20), y: -20, t,
    v: 110 + A.lvl * 14 + rand(0, 40),
    wob: rand(0, Math.PI * 2),
    rot: 0,
  });
}

function loop(dt) {
  if (!A) return;
  A.t += dt;
  A.sp -= dt;
  if (A.sp <= 0) { spawnItem(); A.sp = Math.max(0.35, 0.9 - A.lvl * 0.05); }
  A.mag = Math.max(0, A.mag - dt);
  A.fev = Math.max(0, A.fev - dt);
  A.msg = Math.max(0, A.msg - dt);

  const by = H - 70;

  for (const it of A.items) {
    if (it.d) continue;
    const magnet = A.mag > 0 && ['star', 'coin', 'gem'].includes(it.t);
    if (magnet) {
      const dx = A.x - it.x, dy = by - it.y;
      it.x += dx * dt * 3.2;
      it.y += dy * dt * 1.4;
    } else {
      it.x += Math.sin(A.t * 1.4 + it.wob) * 30 * dt;
      it.y += it.v * dt;
    }
    it.rot += dt * 1.2;

    if (it.y > by - 10 && it.y < by + 20 && Math.abs(it.x - A.x) < A.bw / 2) {
      it.d = true;
      handlePickup(it);
    } else if (it.y > H + 20) {
      it.d = true;
      if (it.t === 'star') A.combo = 0;
    }
  }
  A.items = A.items.filter(i => !i.d);

  A.trail.push({ x: A.x, y: by, t: 0.25 });
  A.trail.forEach(p => p.t -= dt);
  A.trail = A.trail.filter(p => p.t > 0);

  updateParticles(dt);
  updateCamera(dt);
  draw(dt);

  const m = 1 + Math.floor(A.combo / 5);
  setHud(
    `<div style="font-size:28px">${A.score}</div>
     <div style="font-size:13px">Уровень ${A.lvl}/10</div>
     ${m > 1 ? `<div style="color:var(--gold);font-size:13px">Серия ×${m}</div>` : ''}`,
    `<div style="color:#f44;font-size:18px">${'♥'.repeat(A.lives)}</div>
     <div style="color:var(--gold);font-size:13px">● ${A.coins}</div>`
  );

  if (A.lives <= 0) endArcade(A.score, A.coins);
}

function handlePickup(it) {
  if (it.t === 'bomb') {
    A.lives--; A.combo = 0;
    addShake(0.4); addFlash('255,60,60', 0.35);
    beep(120, 0.3, 'square');
    spawnParticles(it.x, it.y, '#ff5c5c', 18, { gravity: 220 });
  } else if (it.t === 'heart') {
    A.lives = Math.min(3, A.lives + 1);
    beep(700);
    spawnParticles(it.x, it.y, '#ff7aa8', 14, { gravity: 140 });
  } else if (it.t === 'magnet') {
    A.mag = MAGNET_TIME();
    beep(600);
    spawnParticles(it.x, it.y, '#9adfff', 18, { gravity: 60 });
  } else if (it.t === 'coin') {
    A.coins += FEVER_MULT();
    beep(900);
    spawnParticles(it.x, it.y, '#ffd76a', 10, { gravity: 200 });
  } else {
    A.combo++;
    const mult = 1 + Math.floor(A.combo / 5);
    A.score += (it.t === 'gem' ? 5 : 1) * mult;
    beep(520 + Math.min(A.combo, 12) * 30);
    spawnParticles(it.x, it.y, it.t === 'gem' ? '#b38cff' : '#4ff', 10, { gravity: 120 });
    const nl = 1 + Math.floor(A.score / 25);
    if (nl > A.lvl && nl <= 10) { A.lvl = nl; A.msg = 1.5; }
  }
}
function draw(dt) {
  const { bg, stars } = A;
  const g = cx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);

  drawStarfield(stars, W, H, dt, 0.35, A.t);

  const was = beginCamera();

  for (const p of A.trail) {
    const a = p.t / 0.25;
    cx.save();
    cx.globalAlpha = a * 0.35;
    cx.fillStyle = SKINS[S.skin][2];
    cx.beginPath();
    cx.ellipse(p.x, p.y + 8, A.bw * 0.3 * a, 6 * a, 0, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
  }

  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  const ic = { star: ['⭐', 30], bomb: ['💣', 28], coin: ['🟡', 24], gem: ['💎', 28], magnet: ['🧲', 28], heart: ['❤️', 26] };
  for (const i of A.items) {
    cx.save();
    cx.shadowColor = i.t === 'bomb' ? '#ff5366' : i.t === 'coin' ? '#ffd76a' : '#9ceaff';
    cx.shadowBlur = 14;
    cx.translate(i.x, i.y);
    cx.rotate(Math.sin(A.t * 2 + i.wob) * 0.2);
    cx.font = ic[i.t][1] + 'px serif';
    cx.fillText(ic[i.t][0], 0, 0);
    cx.restore();
  }

  drawParticles();

  const by = H - 70;
  let basket = SKINS[S.skin][2];
  if (S.skin === 'rain') {
    basket = cx.createLinearGradient(A.x - A.bw / 2, 0, A.x + A.bw / 2, 0);
    ['#f55', '#fc0', '#5e8', '#5cf', '#b6f'].forEach((k, i) => basket.addColorStop(i / 4, k));
  }
  cx.save();
  cx.shadowColor = SKINS[S.skin][2]; cx.shadowBlur = 18;
  cx.fillStyle = basket;
  cx.strokeStyle = '#ffffffaa'; cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(A.x - A.bw / 2, by);
  cx.lineTo(A.x + A.bw / 2, by);
  cx.quadraticCurveTo(A.x + A.bw * 0.42, by + 34, A.x, by + 39);
  cx.quadraticCurveTo(A.x - A.bw * 0.42, by + 34, A.x - A.bw / 2, by);
  cx.closePath(); cx.fill(); cx.stroke();
  cx.restore();

  if (A.mag > 0) {
    cx.strokeStyle = '#f77'; cx.lineWidth = 3;
    cx.beginPath(); cx.arc(A.x, by + 10, A.bw / 2 + 14, Math.PI, 0); cx.stroke();
  }

  if (A.msg > 0) {
    cx.fillStyle = '#fff6'; cx.font = 'bold 34px system-ui';
    cx.fillText('Уровень ' + A.lvl, W / 2, H / 2);
  }

  endCamera(was);
  drawFlash(W, H);
}

function endArcade(score, gold) {
  const isRec = score > S.rec;
  if (isRec) S.rec = score;
  S.gold += gold;
  save();
  stop();
  resetCamera();
  showOver(isRec ? 'Новый рекорд!' : 'Игра окончена',
    `Счёт: ${score} (рекорд ${S.rec})<br>Золото: +${gold}`);
  beep(200, 0.4, 'sawtooth');
  A = null;
}