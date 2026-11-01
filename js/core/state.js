import { SKINS, BGS, BLKS } from '../data/skins.js';

export const S = {
  gold: 0, rec: 0, prec: 0, planeRec: 0, planeLevel: 1,
  up: { basket: 0, magnet: 0, fever: 0 },
  own: ['skin:gold', 'bg:night', 'blk:clay'],
  skin: 'gold', bg: 'night', blk: 'clay',
  sound: true,
};

try { Object.assign(S, JSON.parse(localStorage.getItem('zv') || '{}')); } catch (e) {}

export const save = () => {
  try { localStorage.setItem('zv', JSON.stringify(S)); } catch (e) {}
};

export const BASKET_W = () => 70 + S.up.basket * 18;
export const MAGNET_TIME = () => 5 + S.up.magnet * 3;
export const FEVER_MULT = () => S.up.fever ? 2 : 1;

if (!SKINS[S.skin]) S.skin = 'gold';
if (!BGS[S.bg]) S.bg = 'night';
if (!BLKS[S.blk]) S.blk = 'clay';