export function show(id) {
  document.querySelectorAll('.scr').forEach(e => e.classList.toggle('on', e.id === id));
}

export function setBan(text) {
  const el = document.getElementById('ban');
  if (el) { el.style.display = ''; el.textContent = text; }
}

export function setHud(left, right) {
  const hl = document.getElementById('hl');
  const hr = document.getElementById('hr');
  if (hl) hl.innerHTML = left;
  if (hr) hr.innerHTML = right;
}

export function hideOverlays() {
  ['over', 'pause-screen', 'stage-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('on');
  });
}

export function showOver(title, body) {
  const ot = document.getElementById('ot');
  const os = document.getElementById('os');
  const over = document.getElementById('over');
  if (ot) ot.textContent = title;
  if (os) os.innerHTML = body;
  if (over) over.classList.add('on');
}

export function showPause(on = true) {
  const el = document.getElementById('pause-screen');
  if (el) el.classList.toggle('on', on);
}

export function showStage(title, copy, btnLabel) {
  const t = document.getElementById('stage-title');
  const c = document.getElementById('stage-copy');
  const b = document.getElementById('stage-next');
  const s = document.getElementById('stage-screen');
  if (t) t.textContent = title;
  if (c) c.textContent = copy;
  if (b) b.textContent = btnLabel;
  if (s) s.classList.add('on');
}