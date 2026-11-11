import test from 'node:test';
import assert from 'node:assert/strict';
import { BG, bbSolvable, bbTray } from '../lib/board.js';

test('single-player Block Blast challenge trays remain placeable', () => {
  for (let i = 0; i < 20; i++) {
    const board = Array(64).fill(0);
    const tray = bbTray(board, true);
    assert.equal(tray.length, 3);
    assert.ok(bbSolvable(board, tray));
  }
});

test('Block Blast ends in a loss when the next tray has no legal placement', () => {
  const bd = Array.from({ length: 64 }, (_, i) => ((Math.floor(i / 8) + i % 8) % 2 ? 1 : 0));
  const result = BG.coblast.apply({ bd, pcs: [0, 1, 1], sc: 0, edge: 3 }, 'a', { i: 0, x: 0, y: 0 });
  assert.deepEqual(result.res, { t: 'loss' });
});

test('co-op Mines reports a loss on a mine and a win after all safe cells are opened', () => {
  const mines = [0, 1, 24];
  const loss = BG.comines.apply({ mines, open: [], cnt: 3, edge: 3 }, 'a', { i: 0 });
  assert.deepEqual(loss.res, { t: 'loss' });

  const open = Array.from({ length: 25 }, (_, i) => i).filter(i => !mines.includes(i) && i !== 23);
  const win = BG.comines.apply({ mines, open, cnt: 3, edge: 3 }, 'a', { i: 23 });
  assert.equal(win.res.t, 'coop');
});
