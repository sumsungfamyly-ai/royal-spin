// Рейтинг Эло и лиги для настольных игр (шашки, четыре в ряд)
export const START = 1000, K = 32;
export const LEAGUES = [[1500, 'Алмаз', '💎'], [1300, 'Платина', '🔷'], [1100, 'Золото', '🥇'], [900, 'Серебро', '🥈'], [0, 'Бронза', '🥉']];
export const league = r => { const l = LEAGUES.find(x => r >= x[0]) || LEAGUES[LEAGUES.length - 1]; return { n: l[1], i: l[2] }; };
// sa: 1 победа первого, 0.5 ничья, 0 поражение. Возвращает новые рейтинги.
export function eloPair(ra, rb, sa) {
  const ea = 1 / (1 + 10 ** ((rb - ra) / 400));
  return [Math.round(ra + K * (sa - ea)), Math.round(rb + K * ((1 - sa) - (1 - ea)))];
}
