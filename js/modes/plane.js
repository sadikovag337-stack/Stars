import { W, H, cx } from '../core/canvas.js';
import { S, save } from '../core/state.js';
import { beep } from '../core/audio.js';
import { showOver, showStage, setHud, setBan, hideOverlays } from '../ui/screens.js';
import { start, stop } from '../core/loop.js';
import { spawnParticles, updateParticles, drawParticles, clearParticles } from '../systems/particles.js';
import { addShake, beginCamera, endCamera, updateCamera, resetCamera, drawFlash } from '../systems/camera.js';
import { roundPath } from '../render/draw.js';
import { clamp, rand } from '../core/utils.js';
import { input } from '../systems/input.js';
import { makeStarfield, drawStarfield, drawNebula } from '../render/bg.js';

const BOSS_NAMES = ['КОМЕТА-КРУШИТЕЛЬ', 'ДВОЙНОЕ ЯДРО', 'КОРОЛЕВА ЗАТМЕНИЯ'];

let PL = null;
let bound = false;

export function startPlane(type, level) {
  if (!bound) { bindInput(); bound = true; }
  resetCamera();
  clearParticles();
  hideOverlays();
  PL = {
    type,
    level: level || (type === 'story' ? Math.min(30, Math.max(1, S.planeLevel || 1)) : 1),
    score: 0,
    pendingGold: 0,
    kills: 0,
    lives: 3,
    px: W / 2, py: H * 0.77,
    bullets: [], hostile: [], enemies: [], fx: [],
    stars: makeStarfield(95, W, H),
    spawn: 0, shot: 0, t: 0, invuln: 0,
    boss: null,
    keys: {},
    goal: 0,
  };
  initPlaneLevel();
  setBan(type === 'story'
    ? 'СЮЖЕТНАЯ КАМПАНИЯ · Орудия стреляют автоматически'
    : 'БЕСКОНЕЧНЫЙ ПОЛЁТ · продержись как можно дольше');
  start(loop);
}

export function stopPlane() { stop(); PL = null; }

function bindInput() {
  input.on('pointermove', e => {
    if (!PL) return;
    const r = document.getElementById('cv').getBoundingClientRect();
    PL.px = clamp(e.clientX - r.left, 24, W - 24);
    PL.py = clamp(e.clientY - r.top, 78, H - 36);
  });
  input.on('keydown', e => {
    if (!PL) return;
    const k = e.key.toLowerCase();
    const dir = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
                  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down' }[k];
    if (dir) { e.preventDefault(); PL.keys[dir] = true; }
  });
  input.on('keyup', e => {
    if (!PL) return;
    const k = e.key.toLowerCase();
    const dir = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
                  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down' }[k];
    if (dir) PL.keys[dir] = false;
  });
}
function initPlaneLevel() {
  PL.kills = 0;
  PL.spawn = 0.5;
  PL.shot = 0;
  PL.bullets = [];
  PL.hostile = [];
  PL.enemies = [];
  PL.boss = null;
  PL.invuln = Math.max(PL.invuln, 0.8);
  PL.px = W / 2;
  PL.py = H * 0.77;

  if (PL.level % 10 === 0) {
    const kind = (Math.floor(PL.level / 10) - 1) % BOSS_NAMES.length;
    PL.boss = {
      kind,
      name: BOSS_NAMES[kind],
      x: W / 2, y: Math.max(110, H * 0.2),
      hp: 100 + PL.level * 11, max: 100 + PL.level * 11,
      t: 0, fire: 1, phase: 1,
    };
    PL.enemies.push({ type: 'escort', x: W * 0.25, y: PL.boss.y + 45, hp: 3, v: 55, fire: 1.5, t: 0 });
    PL.enemies.push({ type: 'escort', x: W * 0.75, y: PL.boss.y + 45, hp: 3, v: 55, fire: 2, t: 0 });
  } else {
    PL.goal = 5 + Math.floor(PL.level * 0.8);
  }
}

export function nextStage() {
  if (!PL) return;
  document.getElementById('stage-screen').classList.remove('on');
  if (PL.type === 'story' && PL.level >= 30) {
    endPlane(PL.score);
    return;
  }
  PL.level++;
  if (PL.type === 'story') {
    S.planeLevel = Math.max(S.planeLevel, PL.level);
    save();
  }
  initPlaneLevel();
  setBan(PL.type === 'story'
    ? 'СЮЖЕТНАЯ КАМПАНИЯ · Орудия стреляют автоматически'
    : 'БЕСКОНЕЧНЫЙ ПОЛЁТ · продержись как можно дольше');
  start(loop);
}

function clearPlaneStage(bossDefeated) {
  if (!PL) return;

  stop();
  const reward = 10 + PL.level * 2;
  PL.pendingGold += reward;
  S.gold += PL.pendingGold;
  PL.pendingGold = 0;

  if (PL.type === 'story') {
    S.planeLevel = Math.max(S.planeLevel, Math.min(30, PL.level + 1));
  }
  save();

  if (PL.type === 'endless') {
    PL.level++;
    initPlaneLevel();
    start(loop);
    return;
  }

  showStage(
    PL.level >= 30 ? 'Галактика спасена!' : bossDefeated ? 'Босс повержен!' : 'Уровень пройден!',
    `Уровень ${PL.level} завершён. Награда: ${reward} 🟡${PL.level >= 30 ? ' · Ты прошёл всю кампанию!' : ''}`,
    PL.level >= 30 ? 'Завершить кампанию' : 'Следующий уровень'
  );
  beep(bossDefeated ? 880 : 680, 0.2);
}

function planeBurst(x, y, color, count = 14) {
  spawnParticles(x, y, color, count, { speedMin: 35, speedMax: 225, gravity: 45, sizeMax: 6 });
}

function shot(owner, x, y, vx, vy, r = 4) {
  (owner === 'player' ? PL.bullets : PL.hostile).push({ x, y, vx, vy, r });
}

function hitPlane() {
  if (PL.invuln > 0) return;
  PL.lives--;
  PL.invuln = 1.35;
  addShake(0.34);
  planeBurst(PL.px, PL.py, '#ff738f', 24);
  beep(145, 0.22, 'square');
  if (PL.lives <= 0) endPlane(PL.score);
}

function endPlane(score) {
  if (!PL) return;
  const isRec = score > S.planeRec;
  if (isRec) S.planeRec = score;
  S.gold += PL.pendingGold;
  PL.pendingGold = 0;
  save();
  stop();
  resetCamera();
  showOver(isRec ? 'Новый рекорд!' : 'Игра окончена',
    `Счёт: ${score} (рекорд ${S.planeRec})<br>Золото: +${S.gold}`);
  PL = null;
}
function loop(dt) {
  if (!PL) return;
  PL.t += dt;
  PL.shot -= dt;
  PL.invuln = Math.max(0, PL.invuln - dt);
  updateCamera(dt);

  const speed = 245 * dt;
  if (PL.keys.left) PL.px -= speed;
  if (PL.keys.right) PL.px += speed;
  if (PL.keys.up) PL.py -= speed;
  if (PL.keys.down) PL.py += speed;
  PL.px = clamp(PL.px, 24, W - 24);
  PL.py = clamp(PL.py, 78, H - 36);

  for (const s of PL.stars) s.y = (s.y + (30 + s.z * 55) * dt) % H;

  if (PL.shot <= 0) {
    shot('player', PL.px - 8, PL.py - 17, -12, -520);
    shot('player', PL.px + 8, PL.py - 17, 12, -520);
    PL.shot = 0.19;
    spawnParticles(PL.px, PL.py + 17, '#49ddff', 2, { speedMax: 40, lifeMax: 0.18, sizeMax: 3 });
  }

  if (!PL.boss && PL.kills < PL.goal) {
    PL.spawn -= dt;
    if (PL.spawn <= 0) {
      const roll = Math.random();
      const type = PL.level < 3 || roll < 0.58 ? 'scout'
                 : roll < 0.83 ? 'dart' : 'tank';
      PL.enemies.push({
        type, x: rand(24, W - 24), y: -28,
        hp: type === 'tank' ? 4 : type === 'dart' ? 2 : 1,
        v: (55 + PL.level * 5) * (type === 'dart' ? 1.5 : type === 'tank' ? 0.72 : 1),
        fire: 0.9 + Math.random() * 1.8,
        t: Math.random() * 6,
      });
      PL.spawn = Math.max(0.35, 1.15 - PL.level * 0.025);
    }
  }

  for (const e of PL.enemies) {
    e.t = (e.t || 0) + dt;
    e.y += e.v * dt;
    if (e.type === 'dart') e.x += Math.sin(e.t * 3) * 55 * dt;
    e.x = clamp(e.x, 18, W - 18);
    e.fire -= dt;
    if (e.fire <= 0 && e.y > 20 && e.y < H * 0.62) {
      const dx = PL.px - e.x, dy = PL.py - e.y, d = Math.hypot(dx, dy) || 1;
      shot('enemy', e.x, e.y + 10, dx / d * 145, dy / d * 145, 5);
      e.fire = Math.max(0.8, 2.4 - PL.level * 0.035);
    }
    if (e.y > H + 30) e.dead = true;
    if (Math.hypot(e.x - PL.px, e.y - PL.py) < 24) { e.dead = true; hitPlane(); }
  }

  for (const b of PL.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y < -20) b.dead = true;
    for (const e of PL.enemies) {
      if (e.dead) continue;
      if (Math.hypot(b.x - e.x, b.y - e.y) < (e.type === 'tank' ? 23 : 17)) {
        b.dead = true;
        e.hp--;
        planeBurst(b.x, b.y, e.type === 'tank' ? '#ffab69' : '#76eeff', 4);
        if (e.hp <= 0) {
          e.dead = true;
          PL.kills++;
          PL.score += e.type === 'tank' ? 30 : 12;
          PL.pendingGold++;
          planeBurst(e.x, e.y, e.type === 'tank' ? '#ff875a' : '#64dcff', 15);
          beep(410, 0.04);
        }
        break;
      }
    }
  }

  if (PL.boss) {
    const b = PL.boss;
    b.t += dt;
    b.x = W / 2 + Math.sin(b.t * (b.kind === 1 ? 1.1 : 0.7)) * W * 0.31;
    b.y = Math.max(90, H * 0.17 + Math.sin(b.t * 1.7) * 12);
    b.phase = b.hp < b.max * 0.48 ? 2 : 1;
    b.fire -= dt;

    if (b.fire <= 0) {
      if (b.kind === 0) {
        const dx = PL.px - b.x, dy = PL.py - b.y, d = Math.hypot(dx, dy) || 1;
        [-0.24, 0, 0.24].forEach(a =>
          shot('enemy', b.x, b.y + 30,
            Math.sin(a) * dx / d * 220 + Math.cos(a) * 130,
            Math.cos(a) * dy / d * 220 + Math.sin(a) * 130, 7));
        b.fire = b.phase === 2 ? 0.85 : 1.3;
      } else if (b.kind === 1) {
        const count = b.phase === 2 ? 10 : 7;
        for (let i = 0; i < count; i++) {
          const a = Math.PI * 2 * i / count + b.t;
          shot('enemy', b.x, b.y + 24, Math.cos(a) * 155, Math.sin(a) * 155 + 60, 6);
        }
        b.fire = b.phase === 2 ? 1.05 : 1.55;
      } else {
        const dx = PL.px - b.x, dy = PL.py - b.y, d = Math.hypot(dx, dy) || 1;
        [-0.32, -0.16, 0, 0.16, 0.32].forEach(a =>
          shot('enemy', b.x, b.y + 32,
            Math.sin(a) * dx / d * 245 + Math.cos(a) * 110,
            Math.cos(a) * dy / d * 245 + Math.sin(a) * 110, 6));
        b.fire = b.phase === 2 ? 0.7 : 1.05;
      }
    }

    for (const s of PL.bullets) {
      if (s.dead) continue;
      if (Math.hypot(s.x - b.x, s.y - b.y) < (b.kind === 1 ? 52 : 58)) {
        s.dead = true;
        b.hp--;
        if (Math.random() < 0.35) planeBurst(s.x, s.y, b.kind === 2 ? '#e374ff' : '#ffb45c', 3);
      }
    }

    if (b.hp <= 0) {
      PL.score += 250 + PL.level * 12;
      PL.pendingGold += 20 + Math.floor(PL.level / 2);
      PL.boss = null;
      PL.hostile = [];
      addShake(0.5);
      planeBurst(b.x, b.y, '#ffc85e', 55);
      beep(960, 0.3);
      clearPlaneStage(true);
      return;
    }
    if (Math.hypot(b.x - PL.px, b.y - PL.py) < 64) hitPlane();
  }

  for (const s of PL.hostile) {
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.y > H + 20 || s.y < -20 || s.x < -20 || s.x > W + 20) s.dead = true;
    else if (Math.hypot(s.x - PL.px, s.y - PL.py) < s.r + 14) { s.dead = true; hitPlane(); }
  }

  PL.bullets = PL.bullets.filter(b => !b.dead);
  PL.hostile = PL.hostile.filter(b => !b.dead);
  PL.enemies = PL.enemies.filter(e => !e.dead);

  updateParticles(dt);

  if (!PL) return;
  if (!PL.boss && PL.kills >= PL.goal) { clearPlaneStage(false); return; }

  draw(dt);

  setHud(
    `<div style="font-size:23px">${PL.score}</div>
     <div style="font-size:12px">${PL.type === 'story' ? 'СЮЖЕТ' : 'БЕСКОНЕЧНЫЙ'} · УРОВЕНЬ ${PL.level}</div>`,
    `<div style="color:#ff879d;font-size:17px">${'♥'.repeat(PL.lives)}</div>
     <div style="color:#ffd76a;font-size:12px">${PL.boss ? `БОСС · ${Math.max(0, Math.ceil(PL.boss.hp))} HP` : `ЦЕЛЬ ${PL.kills}/${PL.goal || 0}`}</div>`
  );
  setBan(PL.boss
    ? `БОСС ${PL.level} · ${PL.boss.name}`
    : PL.type === 'story' ? `СЮЖЕТ · уровень ${PL.level} из 30` : `БЕСКОНЕЧНЫЙ ПОЛЁТ · уровень ${PL.level}`);
}
function draw(dt) {
  const was = beginCamera();

  const g = cx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#071331'); g.addColorStop(0.58, '#17265a'); g.addColorStop(1, '#371d65');
  cx.fillStyle = g; cx.fillRect(-20, -20, W + 40, H + 40);

  drawNebula(W, H, PL.t);
  drawStarfield(PL.stars, W, H, dt, 1, PL.t);

  if (PL.boss) {
    const b = PL.boss;
    cx.save();
    cx.translate(b.x, b.y);
    cx.shadowColor = b.kind === 2 ? '#e65fff' : '#ff5a78';
    cx.shadowBlur = 25 + Math.sin(PL.t * 6) * 8;
    const colors = b.kind === 0 ? ['#ffb05b', '#d94d6c']
                 : b.kind === 1 ? ['#74f2ff', '#695cff']
                 : ['#f37aff', '#692eae'];
    cx.fillStyle = colors[0];
    cx.beginPath();
    cx.moveTo(-54, -8); cx.lineTo(-92, 24); cx.lineTo(-48, 20); cx.lineTo(-25, 38);
    cx.lineTo(0, 30); cx.lineTo(25, 38); cx.lineTo(48, 20); cx.lineTo(92, 24);
    cx.lineTo(54, -8); cx.lineTo(37, -34); cx.lineTo(0, -46); cx.lineTo(-37, -34);
    cx.closePath(); cx.fill();
    cx.fillStyle = colors[1];
    cx.beginPath(); cx.ellipse(0, -7, 26, 28, 0, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#fff5bc'; cx.shadowBlur = 12;
    cx.beginPath();
    cx.ellipse(-11, -9, 5, 8, 0, 0, Math.PI * 2);
    cx.ellipse(11, -9, 5, 8, 0, 0, Math.PI * 2);
    cx.fill();
    for (let i = 0; i < (b.kind === 1 ? 2 : 1); i++) {
      cx.strokeStyle = colors[0]; cx.lineWidth = 3;
      cx.beginPath();
      cx.arc((i ? 1 : -1) * 31, -8, 12 + Math.sin(PL.t * 7 + i) * 3, 0, Math.PI * 2);
      cx.stroke();
    }
    cx.restore();

    cx.fillStyle = '#ffffff22';
    roundPath(W * 0.17, 65, W * 0.66, 9, 5); cx.fill();
    const bw = W * 0.66;
    const grad = cx.createLinearGradient(W * 0.17, 0, W * 0.83, 0);
    grad.addColorStop(0, '#ff4e78'); grad.addColorStop(0.5, '#ffcf65'); grad.addColorStop(1, '#ff5ec4');
    cx.fillStyle = grad;
    roundPath(W * 0.17, 65, bw * Math.max(0, b.hp / b.max), 9, 5); cx.fill();
  }

  for (const e of PL.enemies) {
    cx.save();
    cx.translate(e.x, e.y);
    cx.rotate(Math.PI);
    cx.shadowColor = e.type === 'tank' ? '#ff874f' : '#55ddff';
    cx.shadowBlur = 14;
    const c = e.type === 'tank' ? '#ff875a' : e.type === 'dart' ? '#bc7cff' : '#54dfff';
    cx.fillStyle = c;
    cx.beginPath();
    cx.moveTo(0, -17); cx.lineTo(17, 11); cx.lineTo(6, 7); cx.lineTo(0, 14);
    cx.lineTo(-6, 7); cx.lineTo(-17, 11); cx.closePath(); cx.fill();
    cx.fillStyle = '#fff'; cx.fillRect(-2, -7, 4, 5);
    cx.restore();
  }

  for (const b of PL.bullets) {
    cx.save();
    cx.shadowColor = '#69efff'; cx.shadowBlur = 15;
    cx.fillStyle = '#d5ffff';
    cx.beginPath(); cx.ellipse(b.x, b.y, 3, 8, 0, 0, Math.PI * 2); cx.fill();
    cx.restore();
  }
  for (const b of PL.hostile) {
    cx.save();
    cx.shadowColor = '#ff668f'; cx.shadowBlur = 12;
    cx.fillStyle = '#ff9da7';
    cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, Math.PI * 2); cx.fill();
    cx.restore();
  }

  drawParticles();

  if (PL.invuln <= 0 || Math.floor(PL.t * 16) % 2 === 0) {
    cx.save();
    cx.translate(PL.px, PL.py);
    cx.shadowColor = '#4cecff'; cx.shadowBlur = 22;
    const flame = 10 + Math.sin(PL.t * 25) * 5;
    const fg = cx.createLinearGradient(0, 8, 0, flame + 19);
    fg.addColorStop(0, '#eaffff');
    fg.addColorStop(0.45, '#38dfff');
    fg.addColorStop(1, '#8e60ff00');
    cx.fillStyle = fg;
    cx.beginPath();
    cx.moveTo(-5, 9); cx.lineTo(0, flame + 20); cx.lineTo(5, 9); cx.closePath(); cx.fill();
    cx.fillStyle = '#65dfff';
    cx.beginPath();
    cx.moveTo(0, -21); cx.lineTo(8, 3); cx.lineTo(24, 13); cx.lineTo(12, 14);
    cx.lineTo(8, 8); cx.lineTo(6, 19); cx.lineTo(-6, 19); cx.lineTo(-8, 8);
    cx.lineTo(-12, 14); cx.lineTo(-24, 13); cx.lineTo(-8, 3); cx.closePath(); cx.fill();
    cx.fillStyle = '#d8ffff';
    cx.beginPath(); cx.ellipse(0, 0, 3.8, 9, 0, 0, Math.PI * 2); cx.fill();
    cx.restore();
  }

  endCamera(was);
  drawFlash(W, H);
}