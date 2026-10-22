import { get, set } from './db.js';
export const DEFAULTS = {
  welcome: '🎰 Добро пожаловать в Royal Spin!\n\nСлоты, краш, рулетка, кости и дуэли с друзьями. Жми кнопку ниже и играй!',
  startBalance: 1000, dailyBonus: 500, minBet: 10, maxBet: 1000, flipChance: 48, edge: 3, duelFee: 5,
  games: { slots: true, flip: true, dice: true, roulette: true, crash: true, duel: true },
  symbols: [
    { s: '🍒', w: 30, m: 8 }, { s: '🍋', w: 25, m: 12 }, { s: '🔔', w: 20, m: 25 },
    { s: '💎', w: 15, m: 50 }, { s: '7️⃣', w: 10, m: 150 },
  ],
};
export async function getSettings() {
  const s = (await get('settings')) || {};
  return { ...DEFAULTS, ...s, games: { ...DEFAULTS.games, ...(s.games || {}) } };
}
const n = (v, d, lo, hi) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
export function clean(i = {}) {
  const D = DEFAULTS;
  let symbols = D.symbols;
  if (Array.isArray(i.symbols) && i.symbols.length >= 2)
    symbols = i.symbols.slice(0, 10).map(x => ({ s: String(x.s).slice(0, 4), w: n(x.w, 1, 1, 1000), m: n(x.m, 1, 0, 10000) }));
  const games = {};
  for (const k of Object.keys(D.games)) games[k] = i.games ? !!i.games[k] : D.games[k];
  return {
    welcome: String(i.welcome ?? D.welcome).slice(0, 1000),
    startBalance: Math.round(n(i.startBalance, D.startBalance, 0, 1e9)),
    dailyBonus: Math.round(n(i.dailyBonus, D.dailyBonus, 0, 1e9)),
    minBet: Math.round(n(i.minBet, D.minBet, 1, 1e9)),
    maxBet: Math.round(n(i.maxBet, D.maxBet, 1, 1e9)),
    flipChance: n(i.flipChance, D.flipChance, 1, 99),
    edge: n(i.edge, D.edge, 0, 20), duelFee: n(i.duelFee, D.duelFee, 0, 30),
    games, symbols,
  };
}
export const saveSettings = i => set('settings', clean(i));
