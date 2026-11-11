import test from 'node:test';
import assert from 'node:assert/strict';
import { friendPayouts } from '../lib/match.js';

test('versus settles the full two-player pot to the winner and refunds ties', () => {
  assert.deepEqual(friendPayouts('versus', 'a', 200), [400, 0]);
  assert.deepEqual(friendPayouts('versus', 'b', 200), [0, 400]);
  assert.deepEqual(friendPayouts('versus', 'draw', 200), [200, 200]);
});

test('co-op pays each teammate twice their own stake only on a win', () => {
  assert.deepEqual(friendPayouts('coop', 'coop', 200), [400, 400]);
  assert.deepEqual(friendPayouts('coop', 'draw', 200), [200, 200]);
  assert.deepEqual(friendPayouts('coop', 'loss', 200), [0, 0]);
});

test('declining a pending invitation refunds only the inviter', () => {
  assert.deepEqual(friendPayouts('coop', 'x', 200), [200, 0]);
  assert.deepEqual(friendPayouts('versus', 'x', 200), [200, 0]);
});
