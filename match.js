export function friendPayouts(mode, result, bet) {
  if (!Number.isSafeInteger(bet) || bet <= 0) throw new RangeError('Invalid friend-game stake');
  if (result === 'x') return [bet, 0];
  if (mode === 'coop') {
    if (result === 'coop') return [bet * 2, bet * 2];
    if (result === 'draw') return [bet, bet];
    if (result === 'loss') return [0, 0];
    throw new TypeError('Invalid co-op match result');
  }
  if (mode !== 'versus') throw new TypeError('Invalid friend-game mode');
  if (result === 'draw' || result == null) return [bet, bet];
  if (result === 'a') return [bet * 2, 0];
  if (result === 'b') return [0, bet * 2];
  throw new TypeError('Invalid versus match result');
}
