import crypto from 'crypto';
import { get, set, del, sadd, smembers, mget, incr, lock, once } from '../lib/db.js';
import { verify, tg } from '../lib/tg.js';
import { getSettings } from '../lib/settings.js';

const rnd = n => crypto.randomInt(n);
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const AV = ['😎', '🤠', '👑', '🦁', '🐺', '🦊', '🐲', '👽', '🤖', '🎩', '💎', '🔥'];
const lvl = xp => 1 + Math.floor(Math.sqrt((xp || 0) / 500));
const sleep = ms => new Promise(z => setTimeout(z, ms));
const crashM = t => Math.exp(0.25 * t);
const day = () => new Date().toISOString().slice(0, 10);
const yday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const nextDay = () => { const n = new Date(); return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1) - Date.now(); };
const STREAK = [1, 1.5, 2, 2.5, 3, 4, 5];
const QUESTS = [
  { id: 'g10', t: 'Сыграй 10 раундов', k: 'games', n: 10, r: 150 },
  { id: 'w3', t: 'Выиграй 3 раза', k: 'wins', n: 3, r: 250 },
  { id: 'b1000', t: 'Поставь суммарно 1000 фишек', k: 'bet', n: 1000, r: 200 },
];
const ACH = [
  { id: 'first', t: '🏆 Первая победа', d: 'Выиграй раунд', n: 1, r: 100, k: p => p.wins },
  { id: 'g100', t: '🎲 Завсегдатай', d: 'Сыграй 100 раундов', n: 100, r: 500, k: p => p.games },
  { id: 'g1000', t: '🎰 Ветеран', d: 'Сыграй 1000 раундов', n: 1000, r: 3000, k: p => p.games },
  { id: 'big', t: '💰 Крупный куш', d: 'Выиграй 5 000 за раунд', n: 5000, r: 1000, k: p => p.biggest },
  { id: 'jack', t: '💎 Джекпот', d: 'Выиграй 50 000 за раунд', n: 50000, r: 5000, k: p => p.biggest },
  { id: 'fr3', t: '👥 Душа компании', d: 'Добавь 3 друзей', n: 3, r: 300, k: p => p.friends.length },
  { id: 'duel5', t: '⚔️ Дуэлянт', d: 'Выиграй 5 дуэлей', n: 5, r: 500, k: p => p.duelWins || 0 },
  { id: 'lv5', t: '⭐ Пятый уровень', d: 'Достигни 5 уровня', n: 5, r: 700, k: p => lvl(p.xp) },
  { id: 'st7', t: '🔥 Неделя подряд', d: 'Серия входов 7 дней', n: 7, r: 1000, k: p => p.streak || 0 },
  { id: 'ref3', t: '📣 Амбассадор', d: 'Пригласи 3 друзей', n: 3, r: 1500, k: p => p.refs || 0 },
];
class E extends Error { constructor(m, c = 400) { super(m); this.code = c; } }
const norm = p => { p.lvl ??= lvl(p.xp); p.q ??= { d: '', games: 0, wins: 0, bet: 0, done: [] }; p.ach ??= {}; p.hist ??= []; p.streak ??= 0; p.refs ??= 0; p.duelWins ??= 0; p.avatar ??= '😎'; p.bio ??= ''; p.xp ??= 0; p.biggest ??= 0; p.friends ??= []; p.reqIn ??= []; p.mq ??= []; return p; };
const pub = (p, up) => {
  const l = lvl(p.xp);
  return { id: String(p.id), nick: p.nick || p.name, avatar: p.avatar, bio: p.bio, balance: p.balance, level: l, xp: p.xp,
    xpFrom: 500 * (l - 1) ** 2, xpTo: 500 * l * l, wins: p.wins, games: p.games, biggest: p.biggest,
    friends: p.friends.length, requests: p.reqIn.length, bonusIn: p.lastDay === day() ? nextDay() : 0, streak: p.lastDay === day() || p.lastDay === yday() ? p.streak : 0, refs: p.refs, lvlUp: up || 0, crash: !!p.crash, wheelIn: Math.max(0, (p.wheelAt || 0) + 864e5 - Date.now()) };
};
const lite = (x, now) => ({ id: String(x.id), nick: x.nick || x.name, avatar: x.avatar || '😎', level: lvl(x.xp), online: now - (x.lastSeen || 0) < 120000 });
const pickSym = sy => {
  const t = sy.reduce((a, x) => a + x.w, 0);
  let r = rnd(Math.floor(t * 1000)) / 1000;
  for (const x of sy) { if (r < x.w) return x; r -= x.w; }
  return sy[0];
};
const beats = { r: 's', s: 'p', p: 'r' };
const WHEEL = [100, 50, 250, 100, 500, 50, 2500, 150], WT = [22, 28, 10, 18, 6, 28, 1, 12];
const WHEEL2 = [1000, 2000, 3000, 5000, 10000, 25000, 50000, 100000], WT2 = [520, 250, 110, 70, 32, 12, 5, 1];
const draw = () => ({ r: rnd(13) + 1, s: rnd(4) });
const val = h => { let t = 0, a = 0; for (const c of h) { t += c.r > 10 ? 10 : c.r === 1 ? 11 : c.r; if (c.r === 1) a++; } while (t > 21 && a) { t -= 10; a--; } return t; };
const bjView = g => ({ player: g.player, dealer: [g.dealer[0]], pv: val(g.player) });
const minesMult = (c, k, edge) => { let m = 1 - edge / 100; for (let j = 0; j < k; j++) m *= (25 - j) / (25 - c - j); return Math.floor(m * 100) / 100; };
const PLINKO = [8, 3, 1.4, 0.7, 0.4, 0.7, 1.4, 3, 8];
const towerMult = (k, edge) => { let m = 1 - edge / 100; for (let j = 0; j < k; j++) m *= 4 / 3; return Math.floor(m * 100) / 100; };
const CHEST_PR = [0, 0.5, 1.2, 2.5, 8, 20], CHEST_W = [50, 22, 15, 8, 4, 1];
const chestDraw = () => { let r = rnd(CHEST_W.reduce((a, x) => a + x, 0)), i = 0; while (r >= CHEST_W[i]) { r -= CHEST_W[i]; i++; } return CHEST_PR[i]; };

export default async function handler(req, res) {
  let lk = null, mlk = null; const pend = [], held = [];
  const relAll = async () => { const ks = [lk, mlk, ...held].filter(Boolean); lk = mlk = null; held.length = 0; await Promise.allSettled(ks.map(k => del(k))); };
  try {
    const b = req.body || {}, a = b.action;
    const u = verify(b.initData);
    if (!u) throw new E('Открой приложение через Telegram-бота', 401);
    const NOLOCK = ['top', 'social', 'crash_poll', 'resume', 'bonus_info', 'history'], need = !NOLOCK.includes(b.action);
    if (need) { if (!(await lock('lock:' + u.id, 6))) throw new E('Подожди секунду…', 429); lk = 'lock:' + u.id; }
    const [S, raw] = await Promise.all([getSettings(), get('user:' + u.id)]);
    const dirty = {};
    if (raw) dirty[String(u.id)] = norm(raw);
    const load = async id => { id = String(id); if (dirty[id]) return dirty[id]; const x = await get('user:' + id); if (x) dirty[id] = norm(x); return x ? dirty[id] : null; };
    const xload = async id => {
      id = String(id); if (dirty[id]) return dirty[id];
      for (let i = 0; i < 6; i++) {
        if (await lock('lock:' + id, 6)) { held.push('lock:' + id); const x = await get('user:' + id); if (x) dirty[id] = norm(x); return x ? dirty[id] : null; }
        await sleep(120);
      }
      throw new E('Игрок сейчас занят, попробуй ещё раз', 429);
    };
    let p = await load(u.id);
    if (!p) {
      p = norm({ id: u.id, name: u.first_name || u.username || 'Игрок', balance: S.startBalance, banned: false, created: Date.now(), bonusAt: 0, wins: 0, games: 0 });
      dirty[String(u.id)] = p; await sadd('users', String(u.id));
      const rf = await get('ref:' + u.id);
      if (rf && String(rf) !== String(u.id)) {
        const R = await xload(rf);
        if (R) {
          p.balance += S.refBonus; R.balance += S.refBonus; R.refs += 1; p.friends.push(String(rf)); R.friends.push(String(u.id)); p.refBy = String(rf);
          try { await tg('sendMessage', { chat_id: rf, text: `🎉 По твоей ссылке пришёл друг! +${S.refBonus} 🪙` }); } catch {}
        }
        await del('ref:' + u.id);
      }
    }
    if (p.banned) throw new E('Аккаунт заблокирован', 403);
    p.name = u.first_name || u.username || p.name || 'Игрок'; p.lastSeen = Date.now();
    const me = String(p.id);
    let save = need;
    let out = {};

    const on = g => { if (!S.games[g]) throw new E('Игра отключена'); };
    const stake = v => {
      v = Math.floor(Number(v));
      if (!(v >= S.minBet && v <= S.maxBet)) throw new E(`Ставка от ${S.minBet} до ${S.maxBet}`);
      if (v > p.balance) throw new E('Недостаточно фишек');
      return v;
    };
    let lvlUp = 0;
    const track = (P, g, bet, win) => {
      const d = day(); if (P.q.d !== d) P.q = { d, games: 0, wins: 0, bet: 0, done: [] };
      P.q.games++; P.q.bet += bet; if (win > bet) P.q.wins++;
      P.hist = [{ g, b: bet, w: win, t: Date.now() }, ...P.hist].slice(0, 20);
      const L = lvl(P.xp); if (L > P.lvl) { P.balance += 100 * L; P.lvl = L; if (P === p) lvlUp = L; }
    };
    const hv = h => { const c = h.card, f = pr => (pr > 0 ? Math.floor(h.mult * (1 - S.edge / 100) / pr * 100) / 100 : null); return { card: c, mult: h.mult, steps: h.steps, bet: h.bet, mh: f((13 - c) / 13), ml: f((c - 1) / 13) }; };
    const settle = async (g, bet, win) => {
      p.games++; p.xp += Math.min(bet, 500); track(p, g, bet, win);
      if (win > bet) { p.wins++; if (win > p.biggest) p.biggest = win; }
      pend.push(Promise.all([incr(`g:${g}:bets`, bet), incr(`g:${g}:payouts`, win), incr(`g:${g}:n`, 1)]));
    };
    const bjFinish = async x => {
      const pv = val(x.player); while (pv <= 21 && val(x.dealer) < 17) x.dealer.push(draw());
      const dv = val(x.dealer), nat = x.player.length === 2 && pv === 21 && !x.doubled; let win = 0, rs = 'lose';
      if (pv > 21) rs = 'lose';
      else if (nat && !(dv === 21 && x.dealer.length === 2)) { win = Math.floor(x.bet * 2.5); rs = 'blackjack'; }
      else if (dv > 21 || pv > dv) { win = x.bet * 2; rs = 'win'; }
      else if (pv === dv) { win = x.bet; rs = 'push'; }
      p.balance += win; await settle('blackjack', x.bet, win); p.bj = null;
      return { bj: { player: x.player, dealer: x.dealer, pv, dv, done: true, win, res: rs } };
    };
    const finishDuel = async m => {
      const A = await xload(m.a), B = await xload(m.b);
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
      A.games++; B.games++; A.xp += Math.min(m.bet, 500); B.xp += Math.min(m.bet, 500);
      track(A, 'duel', m.bet, m.w === 'a' ? paid : !m.w ? m.bet : 0); track(B, 'duel', m.bet, m.w === 'b' ? paid : !m.w ? m.bet : 0);
      if (m.w) { const W2 = m.w === 'a' ? A : B; W2.duelWins = (W2.duelWins || 0) + 1; }
      await Promise.all([set('match:' + m.id, m), incr('g:duel:bets', pot), incr('g:duel:payouts', paid), incr('g:duel:n', 1)]);
    };

    if (a === 'me') {
      if (p.crash && crashM((Date.now() - p.crash.start) / 1000) >= p.crash.cp) { await settle('crash', p.crash.bet, 0); p.crash = null; }
      out = { cfg: { symbols: S.symbols, minBet: S.minBet, maxBet: S.maxBet, games: S.games, edge: S.edge, duelFee: S.duelFee, dailyBonus: S.dailyBonus, avatars: AV, wheel: WHEEL, wheel2: WHEEL2, wheelCost: S.wheelCost, faq: S.faq, refBonus: S.refBonus, streak: STREAK, bot: await get('bot:username') } };
    } else if (a === 'bonus') {
      if (p.lastDay === day()) throw new E('Бонус уже получен сегодня. Заходи завтра!');
      if (!(await once('claim:bonus:' + me + ':' + day(), 172800))) throw new E('Бонус уже получен сегодня. Заходи завтра!');
      p.streak = p.lastDay === yday() ? p.streak + 1 : 1; p.lastDay = day();
      const r = Math.round(S.dailyBonus * STREAK[(p.streak - 1) % 7]); p.balance += r;
      out = { msg: `+${r} фишек! Серия: ${p.streak} дн. 🔥` };
    } else if (a === 'bonus_info') {
      const qd = p.q.d === day() ? p.q : { games: 0, wins: 0, bet: 0, done: [] };
      out = {
        bonus: { streak: pub(p).streak, can: p.lastDay !== day(), mults: STREAK, base: S.dailyBonus, left: pub(p).bonusIn },
        quests: QUESTS.map(q => ({ id: q.id, t: q.t, n: q.n, r: q.r, have: Math.min(qd[q.k], q.n), claimed: qd.done.includes(q.id) })),
        ach: ACH.map(x => ({ id: x.id, t: x.t, d: x.d, n: x.n, r: x.r, have: Math.min(x.k(p), x.n), claimed: !!p.ach[x.id] })),
      };
    } else if (a === 'quest_claim') {
      if (p.q.d !== day()) p.q = { d: day(), games: 0, wins: 0, bet: 0, done: [] };
      const q = QUESTS.find(x => x.id === b.id); if (!q) throw new E('Задание не найдено');
      if (p.q.done.includes(q.id)) throw new E('Награда уже получена');
      if (p.q[q.k] < q.n) throw new E('Задание ещё не выполнено');
      if (!(await once('claim:q:' + me + ':' + day() + ':' + q.id, 172800))) throw new E('Награда уже получена');
      p.q.done.push(q.id); p.balance += q.r; out = { msg: `+${q.r} фишек!` };
    } else if (a === 'ach_claim') {
      const x = ACH.find(y => y.id === b.id); if (!x) throw new E('Достижение не найдено');
      if (p.ach[x.id]) throw new E('Награда уже получена');
      if (x.k(p) < x.n) throw new E('Достижение ещё не получено');
      if (!(await once('claim:a:' + me + ':' + x.id, 0))) throw new E('Награда уже получена');
      p.ach[x.id] = 1; p.balance += x.r; out = { msg: `+${x.r} фишек!` };
    } else if (a === 'history') {
      out = { hist: p.hist };
    } else if (a === 'hilo_start') {
      on('hilo'); if (p.hilo) { await settle('hilo', p.hilo.bet, 0); p.hilo = null; }
      const bt = stake(b.bet); p.balance -= bt; p.hilo = { bet: bt, card: rnd(13) + 1, mult: 1, steps: 0 }; out = { hilo: hv(p.hilo) };
    } else if (a === 'hilo_guess') {
      const h = p.hilo; if (!h) throw new E('Раунд не начат');
      const hi = b.dir !== 'lo', c = h.card, pr = hi ? (13 - c) / 13 : (c - 1) / 13;
      if (pr <= 0) throw new E('Так ставить нельзя');
      const nx = rnd(13) + 1, ok = hi ? nx > c : nx < c;
      if (!ok) { await settle('hilo', h.bet, 0); p.hilo = null; out = { hilo: { lost: true, card: nx, prev: c } }; }
      else { h.mult = Math.floor(h.mult * (1 - S.edge / 100) / pr * 100) / 100; h.card = nx; h.steps++; out = { hilo: hv(h), prev: c }; }
    } else if (a === 'hilo_cash') {
      const h = p.hilo; if (!h || !h.steps) throw new E('Сделай хотя бы один ход');
      const win = Math.floor(h.bet * h.mult); p.balance += win; await settle('hilo', h.bet, win); p.hilo = null; out = { cashed: true, win, mult: h.mult };
    } else if (a === 'promo') {
      const code = String(b.code || '').trim().toUpperCase().slice(0, 30);
      const pr = code && await get('promo:' + code);
      if (!pr) throw new E('Промокод не найден');
      if (pr.usedBy.includes(me)) throw new E('Ты уже использовал этот промокод');
      if (pr.max && pr.usedBy.length >= pr.max) throw new E('Промокод закончился');
      if (!(await once('claim:promo:' + code + ':' + me, 0))) throw new E('Ты уже использовал этот промокод');
      pr.usedBy.push(me); await set('promo:' + code, pr);
      p.balance += pr.amount; out = { msg: `Промокод активирован: +${pr.amount} фишек!` };
    } else if (a === 'profile') {
      p.nick = String(b.nick || '').trim().slice(0, 20) || undefined;
      if (AV.includes(b.avatar)) p.avatar = b.avatar;
      p.bio = String(b.bio || '').slice(0, 60);
      out = { msg: 'Профиль сохранён' };
    } else if (a === 'top') {
      const by = ['balance', 'xp', 'biggest'].includes(b.by) ? b.by : 'balance';
      const ids = await smembers('users');
      const all = (await mget(ids.slice(0, 1000).map(i => 'user:' + i))).filter(Boolean);
      out = { by, top: all.sort((x, y) => (y[by] || 0) - (x[by] || 0)).slice(0, 15).map(x => ({ nick: x.nick || x.name, avatar: x.avatar || '😎', level: lvl(x.xp), value: by === 'xp' ? lvl(x.xp) : x[by] || 0 })) };
    } else if (a === 'slots') {
      on('slots'); const bt = stake(b.bet); p.balance -= bt;
      const r = [pickSym(S.symbols), pickSym(S.symbols), pickSym(S.symbols)];
      let win = 0, kind = 'none', hit = [];
      if (r[0].s === r[1].s && r[1].s === r[2].s) { win = Math.round(bt * r[0].m); kind = 'triple'; hit = [0, 1, 2]; }
      else for (const [i, j] of [[0, 1], [1, 2], [0, 2]]) if (r[i].s === r[j].s) { win = Math.floor(bt * (r[i].p || 0)); if (win > 0) { kind = 'pair'; hit = [i, j]; } break; }
      p.balance += win; await settle('slots', bt, win); out = { reels: r.map(x => x.s), win, kind, hit };
    } else if (a === 'flip') {
      on('flip'); const bt = stake(b.bet); p.balance -= bt;
      const won = rnd(10000) < S.flipChance * 100, win = won ? bt * 2 : 0;
      p.balance += win; await settle('flip', bt, win);
      out = { result: won ? b.side : b.side === 'heads' ? 'tails' : 'heads', win };
    } else if (a === 'dice') {
      on('dice'); const bt = stake(b.bet);
      const mode = ['under', 'over', 'exact'].includes(b.mode) ? b.mode : 'under', t = Math.floor(Number(b.target));
      if (!(t >= 2 && t <= 12)) throw new E('Выбери сумму от 2 до 12');
      let cnt = 0; for (let s = 2; s <= 12; s++) if (mode === 'under' ? s < t : mode === 'over' ? s > t : s === t) cnt += 6 - Math.abs(s - 7);
      const mult = 36 / cnt * (1 - S.edge / 100);
      if (cnt === 0 || mult < 1.02) throw new E('Так ставить нельзя, выбери другое число');
      p.balance -= bt; const d1 = rnd(6) + 1, d2 = rnd(6) + 1, sum = d1 + d2;
      const won = mode === 'under' ? sum < t : mode === 'over' ? sum > t : sum === t, win = won ? Math.floor(bt * mult) : 0;
      p.balance += win; await settle('dice', bt, win); out = { d1, d2, sum, win, mult: +mult.toFixed(2), chance: +(cnt / 36 * 100).toFixed(1) };
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
        if (m >= c.cp) out = { crashed: true, cp: c.cp };
        else out = { m: Math.floor(m * 100) / 100, t };
      }
    } else if (a === 'crash_cash') {
      const c = p.crash; if (!c) throw new E('Раунд уже закончен');
      const m = crashM((Date.now() - c.start) / 1000); p.crash = null;
      if (m >= c.cp) { await settle('crash', c.bet, 0); out = { crashed: true, cp: c.cp, win: 0 }; }
      else { const mm = Math.floor(m * 100) / 100, win = Math.floor(c.bet * mm); p.balance += win; await settle('crash', c.bet, win); out = { cashed: true, m: mm, win }; }
    } else if (a === 'mines_start') {
      on('mines'); if (p.mines) { await settle('mines', p.mines.bet, 0); p.mines = null; }
      const bt = stake(b.bet), cnt = Math.min(24, Math.max(1, Math.floor(Number(b.count)) || 3));
      p.balance -= bt; const ms = new Set(); while (ms.size < cnt) ms.add(rnd(25));
      p.mines = { bet: bt, cnt, mines: [...ms], open: [] }; out = { started: true };
    } else if (a === 'mines_open') {
      const x = p.mines, i = Math.floor(Number(b.i)); if (!x) throw new E('Раунд не начат');
      if (!(i >= 0 && i < 25) || x.open.includes(i)) throw new E('Нельзя открыть');
      if (x.mines.includes(i)) { await settle('mines', x.bet, 0); p.mines = null; out = { boom: true, mines: x.mines }; }
      else {
        x.open.push(i); const mult = minesMult(x.cnt, x.open.length, S.edge);
        if (x.open.length === 25 - x.cnt) { const win = Math.floor(x.bet * mult); p.balance += win; await settle('mines', x.bet, win); p.mines = null; out = { cashed: true, win, mult, mines: x.mines }; }
        else out = { safe: true, mult };
      }
    } else if (a === 'mines_cash') {
      const x = p.mines; if (!x || !x.open.length) throw new E('Сначала открой клетку');
      const mult = minesMult(x.cnt, x.open.length, S.edge), win = Math.floor(x.bet * mult);
      p.balance += win; await settle('mines', x.bet, win); p.mines = null; out = { cashed: true, win, mult, mines: x.mines };
    } else if (a === 'bj_start') {
      on('blackjack'); if (p.bj) { await settle('blackjack', p.bj.bet, 0); p.bj = null; }
      const bt = stake(b.bet); p.balance -= bt;
      const x = { bet: bt, player: [draw(), draw()], dealer: [draw(), draw()] };
      if (val(x.player) === 21) out = await bjFinish(x); else { p.bj = x; out = { bj: bjView(x) }; }
    } else if (a === 'bj_hit' || a === 'bj_stand' || a === 'bj_double') {
      const x = p.bj; if (!x) throw new E('Раунд не начат');
      if (a === 'bj_double') {
        if (x.player.length !== 2) throw new E('Удвоить можно только первым ходом');
        if (x.bet > p.balance) throw new E('Недостаточно фишек');
        p.balance -= x.bet; x.bet *= 2; x.doubled = true; x.player.push(draw()); out = await bjFinish(x);
      } else if (a === 'bj_hit') { x.player.push(draw()); out = val(x.player) >= 21 ? await bjFinish(x) : { bj: bjView(x) }; }
      else out = await bjFinish(x);
    } else if (a === 'wheel_paid') {
      on('wheel'); if (p.balance < S.wheelCost) throw new E('Недостаточно фишек');
      p.balance -= S.wheelCost; let r = rnd(WT2.reduce((x, y) => x + y, 0)), idx = 0; while (r >= WT2[idx]) { r -= WT2[idx]; idx++; }
      const win = WHEEL2[idx]; p.balance += win; await settle('wheel', S.wheelCost, win); out = { idx, prize: win };
    } else if (a === 'rps') {
      on('rps'); const bt = stake(b.bet); if (!['r', 'p', 's'].includes(b.move)) throw new E('Выбери ход');
      p.balance -= bt; const bot = ['r', 'p', 's'][rnd(3)];
      const rs = b.move === bot ? 'draw' : beats[b.move] === bot ? 'win' : 'lose';
      const win = rs === 'win' ? Math.floor(bt * 2 * (1 - S.edge / 100)) : rs === 'draw' ? bt : 0;
      p.balance += win; await settle('rps', bt, win); out = { bot, res: rs, win };
    } else if (a === 'wheel') {
      on('wheel'); const w = pub(p).wheelIn; if (w > 0) throw new E(`Колесо будет доступно через ${Math.ceil(w / 3600000)} ч.`);
      if (!(await once('cd:wheel:' + me, 86400))) throw new E('Колесо уже крутили сегодня');
      let r = rnd(WT.reduce((x, y) => x + y, 0)), idx = 0; while (r >= WT[idx]) { r -= WT[idx]; idx++; }
      p.balance += WHEEL[idx]; p.wheelAt = Date.now(); out = { idx, prize: WHEEL[idx] };
    } else if (a === 'resume') {
      out = {
        hilo: p.hilo ? hv(p.hilo) : null, bj: p.bj ? bjView(p.bj) : null,
        mines: p.mines ? { bet: p.mines.bet, cnt: p.mines.cnt, open: p.mines.open, mult: p.mines.open.length ? minesMult(p.mines.cnt, p.mines.open.length, S.edge) : 1 } : null,
        tower: p.tower ? { bet: p.tower.bet, floor: p.tower.floor, picks: p.tower.picks, mult: towerMult(p.tower.floor, S.edge), next: towerMult(p.tower.floor + 1, S.edge) } : null,
      };
    } else if (a === 'plinko') {
      on('plinko'); const bt = stake(b.bet); p.balance -= bt;
      const path = Array.from({ length: 8 }, () => rnd(2)), slot = path.reduce((s, x) => s + x, 0);
      const win = Math.floor(bt * PLINKO[slot] * (1 - S.edge / 100));
      p.balance += win; await settle('plinko', bt, win); out = { path, slot, mult: PLINKO[slot], win };
    } else if (a === 'tower_start') {
      on('tower'); if (p.tower) { await settle('tower', p.tower.bet, 0); p.tower = null; }
      const bt = stake(b.bet); p.balance -= bt;
      p.tower = { bet: bt, floor: 0, bombs: Array.from({ length: 8 }, () => rnd(4)), picks: [] };
      out = { started: true, next: towerMult(1, S.edge) };
    } else if (a === 'tower_pick') {
      const t = p.tower, col = Math.floor(Number(b.col));
      if (!t) throw new E('Раунд не начат');
      if (!(col >= 0 && col < 4)) throw new E('Выбери сундук');
      if (t.bombs[t.floor] === col) {
        const bombs = t.bombs; await settle('tower', t.bet, 0); p.tower = null;
        out = { boom: true, col, floor: t.floor, bombs };
      } else {
        t.picks.push(col); t.floor++;
        if (t.floor >= 8) {
          const win = Math.floor(t.bet * towerMult(8, S.edge)); p.balance += win; await settle('tower', t.bet, win);
          const bombs = t.bombs; p.tower = null; out = { cashed: true, win, mult: towerMult(8, S.edge), bombs, col };
        } else out = { safe: true, col, floor: t.floor, mult: towerMult(t.floor, S.edge), next: towerMult(t.floor + 1, S.edge) };
      }
    } else if (a === 'tower_cash') {
      const t = p.tower; if (!t || !t.floor) throw new E('Поднимись хотя бы на этаж');
      const mult = towerMult(t.floor, S.edge), win = Math.floor(t.bet * mult), bombs = t.bombs;
      p.balance += win; await settle('tower', t.bet, win); p.tower = null; out = { cashed: true, win, mult, bombs };
    } else if (a === 'limbo') {
      on('limbo'); const bt = stake(b.bet), t = Math.round(Number(b.target) * 100) / 100;
      if (!(t >= 1.01 && t <= 100)) throw new E('Множитель от 1.01 до 100');
      p.balance -= bt;
      const u = (rnd(1e9) + 1) / 1e9, result = Math.min(1e6, Math.floor((1 - S.edge / 100) / u * 100) / 100);
      const won = result >= t, win = won ? Math.floor(bt * t) : 0;
      p.balance += win; await settle('limbo', bt, win); out = { result, target: t, win };
    } else if (a === 'penalty') {
      on('penalty'); const bt = stake(b.bet), side = ['l', 'c', 'r'].includes(b.side) ? b.side : null;
      if (!side) throw new E('Выбери угол');
      p.balance -= bt; const keeper = ['l', 'c', 'r'][rnd(3)], scored = side !== keeper;
      const win = scored ? Math.floor(bt * 1.5 * (1 - S.edge / 100)) : 0;
      p.balance += win; await settle('penalty', bt, win); out = { side, keeper, scored, win };
    } else if (a === 'chests') {
      on('chests'); const bt = stake(b.bet), pick = Math.floor(Number(b.pick));
      if (!(pick >= 0 && pick < 4)) throw new E('Выбери сундук');
      p.balance -= bt; const prizes = [chestDraw(), chestDraw(), chestDraw(), chestDraw()];
      const win = Math.floor(bt * prizes[pick] * (1 - S.edge / 100));
      p.balance += win; await settle('chests', bt, win); out = { prizes, pick, win };
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
      const t = /^\d+$/.test(id) && await xload(id);
      if (!t) throw new E('Игрок не найден. Он должен хотя бы раз открыть приложение');
      if (p.friends.includes(id)) throw new E('Уже в друзьях');
      if (p.reqIn.includes(id)) { p.reqIn = p.reqIn.filter(x => x !== id); p.friends.push(id); t.friends.push(me); out = { msg: 'Вы теперь друзья!' }; }
      else { if (!t.reqIn.includes(me)) t.reqIn.push(me); out = { msg: 'Заявка отправлена' }; }
    } else if (a === 'friend_accept' || a === 'friend_decline') {
      const id = String(b.id);
      if (!p.reqIn.includes(id)) throw new E('Заявка не найдена');
      p.reqIn = p.reqIn.filter(x => x !== id);
      if (a === 'friend_accept') { const t = await xload(id); p.friends.push(id); if (t && !t.friends.includes(me)) t.friends.push(me); }
    } else if (a === 'friend_remove') {
      const id = String(b.id); p.friends = p.friends.filter(x => x !== id);
      const t = await xload(id); if (t) t.friends = t.friends.filter(x => x !== me);
    } else if (a === 'duel_create') {
      on('duel'); const id = String(b.friend);
      if (!p.friends.includes(id)) throw new E('Играть можно только с друзьями');
      if (!['dice', 'card', 'rps'].includes(b.type)) throw new E('Неизвестная игра');
      const bt = stake(b.bet), t = await xload(id); if (!t) throw new E('Игрок не найден');
      p.balance -= bt;
      const m = { id: crypto.randomBytes(4).toString('hex'), type: b.type, bet: bt, a: me, b: id, status: 'pending', moves: {}, t: Date.now() };
      await set('match:' + m.id, m);
      p.mq = [...p.mq, m.id].slice(-20); t.mq = [...t.mq, m.id].slice(-20);
      try { await tg('sendMessage', { chat_id: id, text: `⚔️ ${p.nick || p.name} вызывает тебя на дуэль! Ставка: ${bt} 🪙`, reply_markup: { inline_keyboard: [[{ text: '⚔️ Открыть', web_app: { url: process.env.APP_URL || `https://${req.headers.host}` } }]] } }); } catch {}
      out = { msg: 'Вызов отправлен' };
    } else if (['duel_accept', 'duel_decline', 'duel_move'].includes(a)) {
      for (let i = 0; i < 8 && !mlk; i++) { if (await lock('mlock:' + b.id, 6)) mlk = 'mlock:' + b.id; else await sleep(120); }
      if (!mlk) throw new E('Подожди секунду…', 429);
      const m = await get('match:' + b.id);
      if (!m || (m.a !== me && m.b !== me)) throw new E('Дуэль не найдена');
      if (a === 'duel_decline') {
        if (m.status !== 'pending') throw new E('Уже нельзя отменить');
        const A = await xload(m.a); A.balance += m.bet; m.status = 'done'; m.w = 'x'; await set('match:' + m.id, m);
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

    await Promise.all([...pend, ...(save ? Object.entries(dirty).map(([id, x]) => set('user:' + id, x)) : [])]);
    await relAll();
    res.json({ me: pub(p, lvlUp), ...out });
  } catch (e) {
    await relAll();
    res.status(e instanceof E ? e.code : 500).json({ error: e.message });
  }
}
