import { S, save } from '../core/state.js';
import { SKINS, BGS, BLKS, UPS } from '../data/skins.js';
import { beep } from '../core/audio.js';
import { show } from './screens.js';

let tab = 'up';

export function openShop() {
  ['over', 'pause-screen', 'stage-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('on');
  });
  show('shop');
  renderShop();
}

export function renderShop() {
  const sg = document.getElementById('sg');
  if (sg) sg.textContent = S.gold;

  const tabs = [['up', 'Улучшения'], ['skin', 'Скины'], ['bg', 'Фоны'], ['blk', 'Блоки']];
  const tabsEl = document.getElementById('tabs');
  if (tabsEl) {
    tabsEl.innerHTML = tabs
      .map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`)
      .join('');
    tabsEl.querySelectorAll('.tab').forEach(b => {
      b.addEventListener('click', () => { tab = b.dataset.tab; renderShop(); });
    });
  }

  let h = '';
  if (tab === 'up') {
    for (const k in UPS) {
      const [n, d, max, pr] = UPS[k];
      const l = S.up[k];
      h += `<div class="it row"><div>${n}</div><small>${d} (ур. ${l}/${max})</small>
        ${l < max
          ? `<button class="buy" data-buy-up="${k}">${pr[l]} 🟡</button>`
          : '<button class="buy eq">Макс.</button>'}</div>`;
    }
  } else {
    const D = tab === 'skin' ? SKINS : tab === 'bg' ? BGS : BLKS;
    for (const k in D) {
      const [n, pr, c] = D[k];
      const id = tab + ':' + k;
      const own = S.own.includes(id);
      const eq = S[tab] === k;
      const col = Array.isArray(c) ? c[0] : c;
      h += `<div class="it">${n}<div class="sw" style="background:${col}"></div>
        <button class="buy ${eq ? 'eq' : ''}" data-buy-it="${tab}|${k}|${pr}">
          ${eq ? 'Надето' : own ? 'Надеть' : pr + ' 🟡'}</button></div>`;
    }
  }

  const grid = document.getElementById('sgrid');
  if (!grid) return;
  grid.innerHTML = h;

  grid.querySelectorAll('[data-buy-up]').forEach(b =>
    b.addEventListener('click', () => buyUp(b.dataset.buyUp)));
  grid.querySelectorAll('[data-buy-it]').forEach(b =>
    b.addEventListener('click', () => {
      const [t, k, pr] = b.dataset.buyIt.split('|');
      buyIt(t, k, +pr);
    }));
}

function buyUp(k) {
  const p = UPS[k][3][S.up[k]];
  if (S.gold >= p) { S.gold -= p; S.up[k]++; save(); beep(800); }
  else beep(150);
  renderShop();
}

function buyIt(t, k, pr) {
  const id = t + ':' + k;
  if (!S.own.includes(id)) {
    if (S.gold < pr) { beep(150); return renderShop(); }
    S.gold -= pr;
    S.own.push(id);
  }
  S[t] = k;
  save();
  beep(800);
  renderShop();
}