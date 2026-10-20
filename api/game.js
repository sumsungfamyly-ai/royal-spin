import crypto from 'crypto';
import { get, set, sadd, smembers, mget, incr } from '../lib/db.js';
import { verify } from '../lib/tg.js';
import { getSettings } from '../lib/settings.js';

const rnd = n => crypto.randomInt(n);
function pick(sy) {
  const t = sy.reduce((a, x) => a + x.w, 0);
  let r = rnd(Math.floor(t * 1000)) / 1000;
  for (const x of sy) { if (r < x.w) return x; r -= x.w; }
  return sy[0];
}

export default async function handler(req, res) {
  try {
    const { initData, action, bet, side } = req.body || {};
    const u = verify(initData);
    if (!u) return res.status(401).json({ error: 'Открой приложение через Telegram-бота' });
    const S = await getSettings();
    let p = await get('user:' + u.id);
    if (!p) {
      p = { id: u.id, name: u.first_name || u.username || 'Игрок', balance: S.startBalance, banned: false, created: Date.now(), bonusAt: 0, wins: 0, games: 0 };
      await sadd('users', String(u.id));
    }
    p.name = u.first_name || u.username || p.name;
    if (p.banned) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    const cfg = { symbols: S.symbols, minBet: S.minBet, maxBet: S.maxBet, slotsOn: S.slotsOn, flipOn: S.flipOn, dailyBonus: S.dailyBonus };
    let out = {};

    if (action === 'me') {
      out = { cfg };
    } else if (action === 'bonus') {
      const left = p.bonusAt + 86400000 - Date.now();
      if (left > 0) return res.status(400).json({ error: `Бонус будет доступен через ${Math.ceil(left / 3600000)} ч.` });
      p.balance += S.dailyBonus; p.bonusAt = Date.now();
      out = { msg: `+${S.dailyBonus} фишек!` };
    } else if (action === 'top') {
      const ids = await smembers('users');
      const all = (await mget(ids.slice(0, 1000).map(i => 'user:' + i))).filter(Boolean);
      out = { top: all.sort((a, b) => b.balance - a.balance).slice(0, 10).map(x => ({ name: x.name, balance: x.balance })) };
    } else if (action === 'slots' || action === 'flip') {
      const on = action === 'slots' ? S.slotsOn : S.flipOn;
      if (!on) return res.status(400).json({ error: 'Игра отключена' });
      const b = Math.floor(Number(bet));
      if (!(b >= S.minBet && b <= S.maxBet)) return res.status(400).json({ error: `Ставка от ${S.minBet} до ${S.maxBet}` });
      if (b > p.balance) return res.status(400).json({ error: 'Недостаточно фишек' });
      p.balance -= b; p.games++;
      let win = 0;
      if (action === 'slots') {
        const reels = [pick(S.symbols), pick(S.symbols), pick(S.symbols)];
        if (reels[0].s === reels[1].s && reels[1].s === reels[2].s) win = Math.round(b * reels[0].m);
        out = { reels: reels.map(r => r.s) };
      } else {
        const won = rnd(10000) < S.flipChance * 100;
        win = won ? b * 2 : 0;
        out = { result: won ? side : side === 'heads' ? 'tails' : 'heads' };
      }
      p.balance += win; if (win) p.wins++;
      await Promise.all([incr('stat:bets', b), incr('stat:payouts', win), incr('stat:games', 1)]);
      out.win = win;
    } else return res.status(400).json({ error: 'unknown action' });

    await set('user:' + u.id, p);
    res.json({ balance: p.balance, name: p.name, ...out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
