import crypto from 'crypto';
import { get, set, sadd, smembers, mget, incr } from '../lib/db.js';
import { verify, tg } from '../lib/tg.js';
import { getSettings } from '../lib/settings.js';

const rnd = n => crypto.randomInt(n);
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const AV = ['😎', '🤠', '👑', '🦁', '🐺', '🦊', '🐲', '👽', '🤖', '🎩', '💎', '🔥'];
const lvl = xp => 1 + Math.floor(Math.sqrt((xp || 0) / 500));
const crashM = t => Math.exp(0.1 * t);
class E extends Error { constructor(m, c = 400) { super(m); this.code = c; } }
const norm = p => { p.avatar ??= '😎'; p.bio ??= ''; p.xp ??= 0; p.biggest ??= 0; p.friends ??= []; p.reqIn ??= []; p.mq ??= []; return p; };
const pub = p => {
  const l = lvl(p.xp);
  return { id: String(p.id), nick: p.nick || p.name, avatar: p.avatar, bio: p.bio, balance: p.balance, level: l, xp: p.xp,
    xpFrom: 500 * (l - 1) ** 2, xpTo: 500 * l * l, wins: p.wins, games: p.games, biggest: p.biggest,
    friends: p.friends.length, requests: p.reqIn.length, bonusIn: Math.max(0, p.bonusAt + 864e5 - Date.now()), crash: !!p.crash };
};
const lite = (x, now) => ({ id: String(x.id), nick: x.nick || x.name, avatar: x.avatar || '😎', level: lvl(x.xp), online: now - (x.lastSeen || 0) < 120000 });
const pickSym = sy => {
  const t = sy.reduce((a, x) => a + x.w, 0);
  let r = rnd(Math.floor(t * 1000)) / 1000;
  for (const x of sy) { if (r < x.w) return x; r -= x.w; }
  return sy[0];
};
const beats = { r: 's', s: 'p', p: 'r' };

export default async function handler(req, res) {
  try {
    const b = req.body || {}, a = b.action;
    const u = verify(b.initData);
    if (!u) throw new E('Открой приложение через Telegram-бота', 401);
    const S = await getSettings();
    const dirty = {};
    const load = async id => { id = String(id); if (dirty[id]) return dirty[id]; const x = await get('user:' + id); if (x) dirty[id] = norm(x); return x ? dirty[id] : null; };
    let p = await load(u.id);
    if (!p) {
      p = norm({ id: u.id, name: u.first_name || u.username || 'Игрок', balance: S.startBalance, banned: false, created: Date.now(), bonusAt: 0, wins: 0, games: 0 });
      dirty[String(u.id)] = p; await sadd('users', String(u.id));
    }
    if (p.banned) throw new E('Аккаунт заблокирован', 403);
    p.name = u.first_name || u.username || p.name || 'Игрок'; p.lastSeen = Date.now();
    const me = String(p.id);
    let save = !['top', 'social', 'crash_poll'].includes(a);
    let out = {};

    const on = g => { if (!S.games[g]) throw new E('Игра отключена'); };
    const stake = v => {
      v = Math.floor(Number(v));
      if (!(v >= S.minBet && v <= S.maxBet)) throw new E(`Ставка от ${S.minBet} до ${S.maxBet}`);
      if (v > p.balance) throw new E('Недостаточно фишек');
      return v;
    };
    const settle = async (g, bet, win) => {
      p.games++; p.xp += bet;
      if (win > 0) { p.wins++; if (win > p.biggest) p.biggest = win; }
      await Promise.all([incr('stat:bets', bet), incr('stat:payouts', win), incr('stat:games', 1),
        incr(`g:${g}:bets`, bet), incr(`g:${g}:payouts`, win), incr(`g:${g}:n`, 1)]);
    };
    const finishDuel = async m => {
      const A = await load(m.a), B = await load(m.b);
      let sa, sb;
      if (m.type === 'rps') {
        m.res = { a: m.moves.a, b: m.moves.b };
        sa = beats[m.moves.a] === m.moves.b ? 1 : 0; sb = beats[m.moves.b] === m.moves.a ? 1 : 0;
      } else {
        const n = m.type === 'dice' ? 2 : 1;
        const roll = () => Array.from({ length: n }, () => (m.type === 'dice' ? rnd(6) + 1 : rnd(13) + 2));
        m.res = { a: roll(), b: roll() };
        sa = m.res.a.reduce((x, y) => x + y, 0); sb = m.res.b.reduce((x, y) => x + y, 0);
      }
      const pot = m.bet * 2, fee = Math.floor(pot * S.duelFee / 100);
      m.w = sa > sb ? 'a' : sb > sa ? 'b' : null; m.status = 'done';
      let paid = pot;
      if (!m.w) { A.balance += m.bet; B.balance += m.bet; }
      else { const W = m.w === 'a' ? A : B; paid = pot - fee; W.balance += paid; W.wins++; W.biggest = Math.max(W.biggest, paid); }
      A.games++; B.games++; A.xp += m.bet; B.xp += m.bet;
      await Promise.all([set('match:' + m.id, m), incr('g:duel:bets', pot), incr('g:duel:payouts', paid), incr('g:duel:n', 1)]);
    };

    if (a === 'me') {
      out = { cfg: { symbols: S.symbols, minBet: S.minBet, maxBet: S.maxBet, games: S.games, edge: S.edge, duelFee: S.duelFee, dailyBonus: S.dailyBonus, avatars: AV } };
    } else if (a === 'bonus') {
      if (pub(p).bonusIn > 0) throw new E(`Бонус будет доступен через ${Math.ceil(pub(p).bonusIn / 3600000)} ч.`);
      p.balance += S.dailyBonus; p.bonusAt = Date.now(); out = { msg: `+${S.dailyBonus} фишек!` };
    } else if (a === 'promo') {
      const code = String(b.code || '').trim().toUpperCase().slice(0, 30);
      const pr = code && await get('promo:' + code);
      if (!pr) throw new E('Промокод не найден');
      if (pr.usedBy.includes(me)) throw new E('Ты уже использовал этот промокод');
      if (pr.max && pr.usedBy.length >= pr.max) throw new E('Промокод закончился');
      pr.usedBy.push(me); await set('promo:' + code, pr);
      p.balance += pr.amount; out = { msg: `Промокод активирован: +${pr.amount} фишек!` };
    } else if (a === 'profile') {
      p.nick = String(b.nick || '').trim().slice(0, 20) || undefined;
      if (AV.includes(b.avatar)) p.avatar = b.avatar;
      p.bio = String(b.bio || '').slice(0, 60);
      out = { msg: 'Профиль сохранён' };
    } else if (a === 'top') {
      const ids = await smembers('users');
      const all = (await mget(ids.slice(0, 1000).map(i => 'user:' + i))).filter(Boolean);
      out = { top: all.sort((x, y) => y.balance - x.balance).slice(0, 15).map(x => ({ nick: x.nick || x.name, avatar: x.avatar || '😎', level: lvl(x.xp), balance: x.balance })) };
    } else if (a === 'slots') {
      on('slots'); const bt = stake(b.bet); p.balance -= bt;
      const r = [pickSym(S.symbols), pickSym(S.symbols), pickSym(S.symbols)];
      const win = r[0].s === r[1].s && r[1].s === r[2].s ? Math.round(bt * r[0].m) : 0;
      p.balance += win; await settle('slots', bt, win); out = { reels: r.map(x => x.s), win };
    } else if (a === 'flip') {
      on('flip'); const bt = stake(b.bet); p.balance -= bt;
      const won = rnd(10000) < S.flipChance * 100, win = won ? bt * 2 : 0;
      p.balance += win; await settle('flip', bt, win);
      out = { result: won ? b.side : b.side === 'heads' ? 'tails' : 'heads', win };
    } else if (a === 'dice') {
      on('dice'); const bt = stake(b.bet);
      const mode = b.mode === 'over' ? 'over' : 'under';
      const target = Math.min(98, Math.max(2, Math.floor(Number(b.target) || 50)));
      const mult = (100 - S.edge) / (mode === 'under' ? target : 100 - target);
      p.balance -= bt; const roll = rnd(10000) / 100;
      const win = (mode === 'under' ? roll < target : roll > target) ? Math.floor(bt * mult) : 0;
      p.balance += win; await settle('dice', bt, win); out = { roll, win, mult: +mult.toFixed(2) };
    } else if (a === 'roulette') {
      on('roulette'); const bt = stake(b.bet); const k = b.kind, num = Math.floor(Number(b.num));
      if (!['red', 'black', 'even', 'odd', 'low', 'high', 'num'].includes(k) || (k === 'num' && !(num >= 0 && num <= 36))) throw new E('Неверная ставка');
      p.balance -= bt; const n = rnd(37);
      const ok = { red: RED.has(n), black: n > 0 && !RED.has(n), even: n > 0 && n % 2 === 0, odd: n % 2 === 1, low: n >= 1 && n <= 18, high: n >= 19, num: n === num }[k];
      const win = ok ? bt * (k === 'num' ? 36 : 2) : 0;
      p.balance += win; await settle('roulette', bt, win); out = { n, color: n === 0 ? 'green' : RED.has(n) ? 'red' : 'black', win };
    } else if (a === 'crash_start') {
      on('crash');
      if (p.crash) { await settle('crash', p.crash.bet, 0); p.crash = null; }
      const bt = stake(b.bet); p.balance -= bt;
      const uu = rnd(1000000) / 1000000;
      const cp = Math.max(1, Math.min(500, Math.floor(((1 - S.edge / 100) / (1 - uu)) * 100) / 100));
      p.crash = { bet: bt, cp, start: Date.now() }; out = { started: true };
    } else if (a === 'crash_poll') {
      const c = p.crash;
      if (!c) out = { idle: true };
      else {
        const t = (Date.now() - c.start) / 1000, m = crashM(t);
        if (m >= c.cp) { save = true; await settle('crash', c.bet, 0); p.crash = null; out = { crashed: true, cp: c.cp }; }
        else out = { m: Math.floor(m * 100) / 100, t };
      }
    } else if (a === 'crash_cash') {
      const c = p.crash; if (!c) throw new E('Раунд уже закончен');
      const m = crashM((Date.now() - c.start) / 1000); p.crash = null;
      if (m >= c.cp) { await settle('crash', c.bet, 0); out = { crashed: true, cp: c.cp, win: 0 }; }
      else { const mm = Math.floor(m * 100) / 100, win = Math.floor(c.bet * mm); p.balance += win; await settle('crash', c.bet, win); out = { cashed: true, m: mm, win }; }
    } else if (a === 'social') {
      const ms = (await mget(p.mq.slice(-12).map(i => 'match:' + i))).filter(Boolean);
      const ids = new Set([...p.friends, ...p.reqIn, ...ms.flatMap(m => [m.a, m.b])]); ids.delete(me);
      const now = Date.now();
      const us = (await mget([...ids].map(i => 'user:' + i))).filter(Boolean);
      out = { people: us.map(x => lite(x, now)), friends: p.friends, requests: p.reqIn,
        matches: ms.reverse().map(m => ({ ...m, moves: { a: !!m.moves?.a, b: !!m.moves?.b } })) };
    } else if (a === 'friend_add') {
      const id = String(b.id || '').trim();
      if (id === me) throw new E('Это твой собственный ID');
      const t = /^\d+$/.test(id) && await load(id);
      if (!t) throw new E('Игрок не найден. Он должен хотя бы раз открыть приложение');
      if (p.friends.includes(id)) throw new E('Уже в друзьях');
      if (p.reqIn.includes(id)) { p.reqIn = p.reqIn.filter(x => x !== id); p.friends.push(id); t.friends.push(me); out = { msg: 'Вы теперь друзья!' }; }
      else { if (!t.reqIn.includes(me)) t.reqIn.push(me); out = { msg: 'Заявка отправлена' }; }
    } else if (a === 'friend_accept' || a === 'friend_decline') {
      const id = String(b.id);
      if (!p.reqIn.includes(id)) throw new E('Заявка не найдена');
      p.reqIn = p.reqIn.filter(x => x !== id);
      if (a === 'friend_accept') { const t = await load(id); p.friends.push(id); if (t && !t.friends.includes(me)) t.friends.push(me); }
    } else if (a === 'friend_remove') {
      const id = String(b.id); p.friends = p.friends.filter(x => x !== id);
      const t = await load(id); if (t) t.friends = t.friends.filter(x => x !== me);
    } else if (a === 'duel_create') {
      on('duel'); const id = String(b.friend);
      if (!p.friends.includes(id)) throw new E('Играть можно только с друзьями');
      if (!['dice', 'card', 'rps'].includes(b.type)) throw new E('Неизвестная игра');
      const bt = stake(b.bet), t = await load(id); if (!t) throw new E('Игрок не найден');
      p.balance -= bt;
      const m = { id: crypto.randomBytes(4).toString('hex'), type: b.type, bet: bt, a: me, b: id, status: 'pending', moves: {}, t: Date.now() };
      await set('match:' + m.id, m);
      p.mq = [...p.mq, m.id].slice(-20); t.mq = [...t.mq, m.id].slice(-20);
      try { await tg('sendMessage', { chat_id: id, text: `⚔️ ${p.nick || p.name} вызывает тебя на дуэль! Ставка: ${bt} 🪙`, reply_markup: { inline_keyboard: [[{ text: '⚔️ Открыть', web_app: { url: process.env.APP_URL || `https://${req.headers.host}` } }]] } }); } catch {}
      out = { msg: 'Вызов отправлен' };
    } else if (['duel_accept', 'duel_decline', 'duel_move'].includes(a)) {
      const m = await get('match:' + b.id);
      if (!m || (m.a !== me && m.b !== me)) throw new E('Дуэль не найдена');
      if (a === 'duel_decline') {
        if (m.status !== 'pending') throw new E('Уже нельзя отменить');
        const A = await load(m.a); A.balance += m.bet; m.status = 'done'; m.w = 'x'; await set('match:' + m.id, m);
      } else if (a === 'duel_accept') {
        if (m.status !== 'pending' || m.b !== me) throw new E('Нельзя принять');
        if (m.bet > p.balance) throw new E('Недостаточно фишек');
        p.balance -= m.bet;
        if (m.type === 'rps') { m.status = 'active'; await set('match:' + m.id, m); } else await finishDuel(m);
      } else {
        const role = m.a === me ? 'a' : 'b';
        if (m.status !== 'active' || m.type !== 'rps' || !['r', 'p', 's'].includes(b.move) || m.moves[role]) throw new E('Ход недоступен');
        m.moves[role] = b.move;
        if (m.moves.a && m.moves.b) await finishDuel(m); else await set('match:' + m.id, m);
      }
    } else throw new E('unknown action');

    if (save) await Promise.all(Object.entries(dirty).map(([id, x]) => set('user:' + id, x)));
    res.json({ me: pub(p), ...out });
  } catch (e) {
    res.status(e instanceof E ? e.code : 500).json({ error: e.message });
  }
}
