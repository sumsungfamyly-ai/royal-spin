import crypto from 'crypto';
import { get, set, del, sadd, smembers, mget, incr, lock, once } from '../lib/db.js';
import { verify, tg } from '../lib/tg.js';
import { getSettings } from '../lib/settings.js';
import { SHOP, SHOP_CATS } from '../lib/shop.js';
import { BG, bbTray } from '../lib/board.js';

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
const BONUS_CD = 22 * 36e5, STREAK_WIN = 46 * 36e5;
const effStreak = (p, now) => (p.bonusAt && now - p.bonusAt <= STREAK_WIN ? p.streak : 0);
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
  { id: 'st7', t: '🔥 Неделя подряд', d: 'Серия входов 7 дней', n: 7, r: 1000, k: p => p.bestStreak || p.streak || 0 },
  { id: 'ref3', t: '📣 Амбассадор', d: 'Пригласи 3 друзей', n: 3, r: 1500, k: p => p.refs || 0 },
];
/* ---- ДУРАК (подкидной, 2 игрока, 36 карт): карта = масть*9 + (ранг-6) ---- */
const rk = c => c % 9 + 6, st = c => Math.floor(c / 9), other = r => (r === 'a' ? 'b' : 'a');
const dBeats = (d, a, tr) => (st(d) === st(a) ? rk(d) > rk(a) : st(d) === tr && st(a) !== tr);
const dRanks = m => { const s = new Set(); for (const [x, y] of m.table) { s.add(rk(x)); if (y != null) s.add(rk(y)); } return s; };
const dCanAdd = m => { const h = m.hands[m.att], rs = dRanks(m); return m.table.length < m.limit && h.some(c => rs.has(rk(c))); };
const dFill = m => { for (const r of [m.att, other(m.att)]) while (m.hands[r].length < 6 && m.deck.length) m.hands[r].push(m.deck.pop()); };
function dNew(id, a, b, bet) {
  const deck = Array.from({ length: 36 }, (_, i) => i);
  for (let i = 35; i > 0; i--) { const j = rnd(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const hands = { a: [], b: [] }; for (let i = 0; i < 6; i++) { hands.a.push(deck.pop()); hands.b.push(deck.pop()); }
  const trump = st(deck[0]), lt = h => Math.min(99, ...h.filter(c => st(c) === trump).map(rk));
  const la = lt(hands.a), lb = lt(hands.b), att = la < lb ? 'a' : lb < la ? 'b' : (rnd(2) ? 'a' : 'b');
  const now = Date.now();
  return { id, a, b, bet, status: 'active', deck, hands, trump, table: [], att, turn: att, phase: 'attack', taking: false,
    limit: Math.min(6, hands[other(att)].length), w: null, rev: 1, last: 'Игра началась', t: now, mv: now };
}
function dEnd(m) {   // после раунда: добор, проверка победы; возвращает 'a' | 'b' | 'draw' | null
  dFill(m); m.table = []; m.taking = false;
  if (!m.deck.length) { const ea = !m.hands.a.length, eb = !m.hands.b.length; if (ea && eb) return 'draw'; if (ea) return 'a'; if (eb) return 'b'; }
  m.limit = Math.min(6, m.hands[other(m.att)].length); m.phase = 'attack'; m.turn = m.att; return null;
}
function dBito(m) { m.last = 'Бито'; m.att = other(m.att); return dEnd(m); }
function dTake(m) { const d = other(m.att); for (const [x, y] of m.table) { m.hands[d].push(x); if (y != null) m.hands[d].push(y); } m.last = 'Соперник взял карты'; return dEnd(m); }
function dMove(m, who, mv) {
  if (m.status !== 'active') throw new E('Игра окончена');
  if (m.turn !== who) throw new E('Сейчас не твой ход');
  const hand = m.hands[who], def = other(m.att), c = Number(mv.c); let res = null;
  const mine = () => { const i = hand.indexOf(c); if (i < 0) throw new E('У тебя нет этой карты'); hand.splice(i, 1); };
  if (mv.k === 'attack') {
    if (who !== m.att || m.phase !== 'attack') throw new E('Сейчас нельзя ходить');
    if (!hand.includes(c)) throw new E('У тебя нет этой карты');
    if (m.table.length && !dRanks(m).has(rk(c))) throw new E('Нужна карта того же ранга, что уже на столе');
    if (m.table.length >= m.limit) throw new E('Больше карт подкидывать нельзя');
    mine(); m.table.push([c, null]); m.last = m.taking ? 'Подкинули ещё карту' : 'Атака';
    if (m.taking) { if (!dCanAdd(m)) res = dTake(m); } else { m.phase = 'defend'; m.turn = def; }
  } else if (mv.k === 'defend') {
    if (who !== def || m.phase !== 'defend') throw new E('Сейчас нельзя отбиваться');
    const i = Number(mv.i), pr = m.table[i]; if (!pr || pr[1] != null) throw new E('Эту карту уже отбили');
    if (!hand.includes(c)) throw new E('У тебя нет этой карты');
    if (!dBeats(c, pr[0], m.trump)) throw new E('Эта карта не бьёт');
    mine(); pr[1] = c; m.last = 'Отбито';
    if (m.table.every(x => x[1] != null)) { m.phase = 'attack'; m.turn = m.att; if (!dCanAdd(m) || !hand.length) res = dBito(m); }
  } else if (mv.k === 'take') {
    if (who !== def || m.phase !== 'defend') throw new E('Сейчас нельзя взять');
    m.taking = true; m.phase = 'attack'; m.turn = m.att; m.last = 'Соперник берёт, можно подкинуть';
    if (!dCanAdd(m)) res = dTake(m);
  } else if (mv.k === 'pass') {
    if (who !== m.att || m.phase !== 'attack' || !m.table.length) throw new E('Нечего завершать');
    if (m.taking) res = dTake(m); else { if (m.table.some(x => x[1] == null)) throw new E('Не все карты отбиты'); res = dBito(m); }
  } else throw new E('Неизвестный ход');
  m.rev++; m.mv = Date.now(); return res;
}
function dView(m, role) {
  const opp = other(role), hand = [...m.hands[role]].sort((x, y) => x - y), legal = { atk: [], def: {} };
  if (m.status === 'active' && m.turn === role) {
    if (role === m.att) legal.atk = hand.filter(c => (!m.table.length || dRanks(m).has(rk(c))) && m.table.length < m.limit);
    else for (const c of hand) { const ix = []; m.table.forEach((pr, i) => { if (pr[1] == null && dBeats(c, pr[0], m.trump)) ix.push(i); }); if (ix.length) legal.def[c] = ix; }
  }
  return { id: m.id, status: m.status, bet: m.bet, role, oppId: m[opp], oppN: m.hands ? m.hands[opp].length : 0, hand, table: m.table, deckN: m.deck ? m.deck.length : 0,
    trump: m.trump, trumpCard: m.deck && m.deck.length ? m.deck[0] : null, att: m.att, turn: m.turn, phase: m.phase, taking: m.taking, limit: m.limit,
    w: m.w, last: m.last, rev: m.rev, mv: m.mv, legal };
}
class E extends Error { constructor(m, c = 400) { super(m); this.code = c; } }
const norm = p => { p.lb ??= { s: 'none' }; if (p.lastDay) { const t = Date.parse(p.lastDay + 'T12:00:00Z'); if (!p.bonusAt || t > p.bonusAt) p.bonusAt = t; delete p.lastDay; } p.bestStreak ??= p.streak || 0; p.dq ??= []; p.shop ??= { own: [], eq: {} }; p.bgq ??= []; p.notif ??= { on: true, last: 0 }; p.lvl ??= lvl(p.xp); p.q ??= { d: '', games: 0, wins: 0, bet: 0, done: [] }; p.ach ??= {}; p.hist ??= []; p.streak ??= 0; p.refs ??= 0; p.duelWins ??= 0; p.avatar ??= '😎'; p.bio ??= ''; p.xp ??= 0; p.biggest ??= 0; p.friends ??= []; p.reqIn ??= []; p.mq ??= []; return p; };
const pub = (p, up) => {
  const l = lvl(p.xp);
  return { id: String(p.id), nick: p.nick || p.name, avatar: p.avatar, bio: p.bio, balance: p.balance, level: l, xp: p.xp,
    xpFrom: 500 * (l - 1) ** 2, xpTo: 500 * l * l, wins: p.wins, games: p.games, biggest: p.biggest,
    friends: p.friends.length, requests: p.reqIn.length, bonusIn: p.bonusAt ? Math.max(0, p.bonusAt + BONUS_CD - Date.now()) : 0, streak: effStreak(p, Date.now()), refs: p.refs, lvlUp: up || 0, eq: p.shop?.eq || {}, notif: p.notif?.on !== false, admin: ADMINS.includes(String(p.id)), lb: p.lb.s, lbNote: p.lb.note || '', lbAt: p.lb.t || 0, crash: !!p.crash, wheelIn: Math.max(0, (p.wheelAt || 0) + 864e5 - Date.now()) };
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

/* ---- бот для Дурака ---- */
const bCost = (c, tr) => rk(c) + (st(c) === tr ? 100 : 0);
function botNext(m) {
  const h = [...m.hands.b], tr = m.trump;
  if (m.phase === 'attack') {
    const rs = dRanks(m), ok = h.filter(c => (!m.table.length || rs.has(rk(c))) && m.table.length < m.limit).sort((x, y) => bCost(x, tr) - bCost(y, tr));
    if (!m.table.length) return { k: 'attack', c: ok[0] };
    const cheap = ok.filter(c => st(c) !== tr && (m.taking || rk(c) <= 10));
    return cheap.length ? { k: 'attack', c: cheap[0] } : { k: 'pass' };
  }
  const open = m.table.map((x, i) => [x[0], i]).filter((_, i) => m.table[i][1] == null), left = [...h]; let trumps = 0;
  for (const [a, i] of open) {
    const opts = left.filter(c => dBeats(c, a, tr)).sort((x, y) => bCost(x, tr) - bCost(y, tr));
    if (!opts.length) return { k: 'take' };
    if (st(opts[0]) === tr) trumps++;
    left.splice(left.indexOf(opts[0]), 1); if (i === open[0][1]) var first = { k: 'defend', c: opts[0], i };
  }
  if (trumps && m.deck.length > 6 && open.every(([a]) => st(a) !== tr && rk(a) <= 9)) return { k: 'take' };
  return first;
}
function botPlay(m) {
  for (let n = 0; n < 40 && m.status === 'active' && m.turn === 'b'; n++) {
    let r; try { r = dMove(m, 'b', botNext(m)); } catch { try { r = dMove(m, 'b', { k: m.phase === 'defend' ? 'take' : 'pass' }); } catch { return null; } }
    if (r) return r;
  }
  return null;
}
const ADMINS = (process.env.ADMIN_IDS || process.env.ADMIN_CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);
const BGN = { checkers: '♟️ Шашки', connect4: '🔴 Четыре в ряд', coblast: '🧩 Блок Бласт вдвоём', comines: '💣 Мины вдвоём' };
const bgView = (m, role) => {
  const E_ = BG[m.game], my = m.status === 'active' && m.turn === role, st = m.st || {};
  return { id: m.id, game: m.game, status: m.status, bet: m.bet, role, w: m.w, rev: m.rev, turn: m.turn, mv: m.mv, pay: m.pay, mult: m.mult, rx: m.rx || null, coop: !!E_.coop, free: !!E_.free, opt: m.opt, oppId: role === 'a' ? m.b : m.a, st: E_.coop ? (m.st ? E_.pub(m.st, m.status === 'done') : null) : m.game === 'checkers' ? { bd: st.bd, last: st.last, q: st.q } : { g: st.g, last: st.last }, legal: my && !E_.coop ? (m.game === 'checkers' ? E_.legal(st, role).map(x => ({ p: x.p, c: x.c })) : E_.legal(st, role)) : [] };
};
const PL = (r, e) => { const k = { low: [6, 2.5], mid: [40, 3], high: [260, 3.6] }[r], P = [1, 12, 66, 220, 495, 792, 924, 792, 495, 220, 66, 12, 1].map(x => x / 4096), w = P.map((_, i) => .3 + k[0] * Math.pow(Math.abs(i - 6) / 6, k[1])), t = w.reduce((a, x, i) => a + x * P[i], 0); return w.map(x => Math.floor(x / t * (1 - e / 100) * 100) / 100); };
const BBS = [[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],[[0,0],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[1,1]],[[0,1],[1,0],[1,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[0,2],[1,0]]];
const bbFits = (bd, s, x, y) => BBS[s].every(([r, c]) => { const R = y + r, C = x + c; return R >= 0 && R < 8 && C >= 0 && C < 8 && !bd[R * 8 + C]; });
const bbAny = (bd, pcs) => pcs.some(s => s !== null && bd.some((_, i) => bbFits(bd, s, i % 8, (i / 8) | 0)));
const bbMult = (sc, e) => Math.min(25, Math.floor(sc / 150 * (1 - e / 100) * 100) / 100);
export default async function handler(req, res) {
  let lk = null, mlk = null; const pend = [], held = [];
  const relAll = async () => { const ks = [lk, mlk, ...held].filter(Boolean); lk = mlk = null; held.length = 0; await Promise.allSettled(ks.map(k => del(k))); };
  try {
    const b = req.body || {}, a = b.action;
    const u = verify(b.initData);
    if (!u) throw new E('Открой приложение через Telegram-бота', 401);
    if (b.action === 'durak_state') {
      const me0 = String(u.id), m = await get('durak:' + b.id);
      if (!m || (m.a !== me0 && m.b !== me0)) throw new E('Игра не найдена', 404);
      if (b.rev === m.rev && b.st === m.status) return res.json({ same: true });
      const role = m.a === me0 ? 'a' : 'b', out0 = { durak: m.hands ? dView(m, role) : { id: m.id, status: m.status, bet: m.bet, role, oppId: m[other(role)], w: m.w, rev: m.rev } };
      if (b.rev === undefined) { const oid = m[other(role)], o = oid === 'bot' ? { id: 'bot', nick: 'Бот', avatar: '🤖', xp: 2000 } : await get('user:' + oid); if (o) out0.opp = { id: String(o.id), nick: o.nick || o.name, avatar: o.avatar || '😎', level: lvl(o.xp) }; }
      return res.json(out0);
    }
    const NOLOCK = ['top', 'social', 'crash_poll', 'resume', 'bonus_info', 'history'], need = !NOLOCK.includes(b.action);
    if (need) { for (let i = 0; i < 14 && !lk; i++) { if (await lock('lock:' + u.id, 6)) lk = 'lock:' + u.id; else await sleep(110); } if (!lk) throw new E('Сервер занят, попробуй ещё раз', 429); }
    const [S, raw] = await Promise.all([getSettings(), get('user:' + u.id)]);
    const dirty = {};
    if (raw) dirty[String(u.id)] = norm(raw);
    const load = async id => { id = String(id); if (dirty[id]) return dirty[id]; const x = await get('user:' + id); if (x) dirty[id] = norm(x); return x ? dirty[id] : null; };
    const xload = async id => {
      id = String(id); if (id === 'bot') return norm({ id: 'bot', name: 'Бот', nick: 'Бот', avatar: '🤖', balance: 0, wins: 0, games: 0, xp: 2000 }); if (dirty[id]) return dirty[id];
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
    const tzo = Math.max(-840, Math.min(840, Math.round(Number(b.tz)) || 0)), today = () => new Date(Date.now() - tzo * 60000).toISOString().slice(0, 10);
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
      const d = P === p ? today() : (P.q.d || today()); if (P.q.d !== d) P.q = { d, games: 0, wins: 0, bet: 0, done: [] };
      P.q.games++; P.q.bet += bet; if (win > bet) P.q.wins++;
      P.hist = [{ g, b: bet, w: win, t: Date.now() }, ...P.hist].slice(0, 20);
      const L = lvl(P.xp); if (L > P.lvl) { P.balance += 100 * L; P.lvl = L; if (P === p) lvlUp = L; }
    };
    const info = () => {
      const now = Date.now(), eff = effStreak(p, now), qd = p.q.d === today() ? p.q : { games: 0, wins: 0, bet: 0, done: [] }, left = p.bonusAt ? Math.max(0, p.bonusAt + BONUS_CD - now) : 0;
      return {
        bonus: { streak: eff, can: left === 0, left, breaks: eff && p.bonusAt ? Math.max(0, p.bonusAt + STREAK_WIN - now) : 0, mults: STREAK, base: S.dailyBonus, next: Math.round(S.dailyBonus * STREAK[eff % 7]), best: p.bestStreak },
        quests: QUESTS.map(q => ({ id: q.id, t: q.t, n: q.n, r: q.r, have: Math.min(qd[q.k], q.n), claimed: qd.done.includes(q.id) })),
        ach: ACH.map(x => ({ id: x.id, t: x.t, d: x.d, n: x.n, r: x.r, have: Math.min(x.k(p), x.n), claimed: !!p.ach[x.id] })),
      };
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
      const now = Date.now();
      if (p.bonusAt && now - p.bonusAt < BONUS_CD) throw new E('Бонус ещё не готов');
      if (!(await once('claim:bonus:' + me + ':' + (p.bonusAt || 0), 259200))) throw new E('Бонус уже получен');
      const eff = effStreak(p, now); p.streak = eff + 1; p.bestStreak = Math.max(p.bestStreak, p.streak); p.bonusAt = now;
      const r = Math.round(S.dailyBonus * STREAK[(p.streak - 1) % 7]); p.balance += r;
      out = { msg: `+${r} фишек! Серия: ${p.streak} дн.`, reward: r, info: info() };
    } else if (a === 'bonus_info') {
      out = info();
    } else if (a === 'quest_claim') {
      if (p.q.d !== today()) p.q = { d: today(), games: 0, wins: 0, bet: 0, done: [] };
      const q = QUESTS.find(x => x.id === b.id); if (!q) throw new E('Задание не найдено');
      if (p.q.done.includes(q.id)) throw new E('Награда уже получена');
      if (p.q[q.k] < q.n) throw new E('Задание ещё не выполнено');
      if (!(await once('claim:q:' + me + ':' + today() + ':' + q.id, 172800))) throw new E('Награда уже получена');
      p.q.done.push(q.id); p.balance += q.r; out = { msg: `+${q.r} фишек!`, reward: q.r, info: info() };
    } else if (a === 'ach_claim') {
      const x = ACH.find(y => y.id === b.id); if (!x) throw new E('Достижение не найдено');
      if (p.ach[x.id]) throw new E('Награда уже получена');
      if (x.k(p) < x.n) throw new E('Достижение ещё не получено');
      if (!(await once('claim:a:' + me + ':' + x.id, 0))) throw new E('Награда уже получена');
      p.ach[x.id] = 1; p.balance += x.r; out = { msg: `+${x.r} фишек!`, reward: x.r, info: info() };
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
      const [all, manual] = await Promise.all([mget(ids.slice(0, 1000).map(i => 'user:' + i)), get('lb:manual')]);
      const real = all.filter(Boolean).filter(x => S.lbOpen || (x.lb && x.lb.s === 'approved'))
        .map(x => ({ nick: x.nick || x.name, avatar: x.avatar || '😎', level: lvl(x.xp), value: by === 'xp' ? lvl(x.xp) : x[by] || 0, me: String(x.id) === me }));
      const man = (manual || []).map(m => ({ nick: m.nick, avatar: m.avatar || '🏆', level: m.level || 1, value: by === 'xp' ? m.level || 1 : by === 'biggest' ? m.biggest || 0 : m.balance || 0 }));
      const rows = real.concat(man).sort((x, y) => y.value - x.value), mi = rows.findIndex(r => r.me);
      out = { by, open: !!S.lbOpen, rank: mi >= 0 ? mi + 1 : 0, top: rows.slice(0, 20), total: rows.length };
    } else if (a === 'lb_apply') {
      if (S.lbOpen) throw new E('Рейтинг открыт для всех, заявка не нужна');
      const st = p.lb.s;
      if (st === 'pending') throw new E('Заявка уже на рассмотрении');
      if (st === 'approved') throw new E('Ты уже в рейтинге');
      if (st === 'rejected' && Date.now() - (p.lb.t || 0) < 864e5) throw new E('Повторно подать заявку можно через сутки после отказа');
      p.lb = { s: 'pending', t: Date.now() };
      if (process.env.ADMIN_CHAT_ID) { try { await tg('sendMessage', { chat_id: process.env.ADMIN_CHAT_ID, text: `🏆 Новая заявка в рейтинг: ${p.nick || p.name} (ID ${p.id}), уровень ${lvl(p.xp)}, фишек ${p.balance}` }); } catch {} }
      out = { msg: 'Заявка отправлена администратору' };
    } else if (a === 'lb_leave') {
      p.lb = { s: 'none', t: Date.now() }; out = { msg: 'Ты вышел из рейтинга' };
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
    } else if (a === 'plinko') {
      on('plinko'); const bt = stake(b.bet), risk = ['low', 'mid', 'high'].includes(b.risk) ? b.risk : 'mid'; p.balance -= bt;
      const path = Array.from({ length: 12 }, () => rnd(2)), slot = path.reduce((x, y) => x + y, 0), mult = PL(risk, S.edge)[slot], win = Math.floor(bt * mult);
      p.balance += win; await settle('plinko', bt, win); out = { path, slot, mult, win };
    } else if (a === 'bb_state') {
      out = { bb: p.bb ? { bd: p.bb.bd, pcs: p.bb.pcs, sc: p.bb.sc, bet: p.bb.bet, mult: bbMult(p.bb.sc, S.edge) } : null };
    } else if (a === 'bb_start') {
      on('blockblast'); if (!p.bb) { const bt = stake(b.bet); p.balance -= bt; p.bb = { bet: bt, bd: Array(64).fill(0), pcs: bbTray(Array(64).fill(0)), sc: 0 }; }
      out = { bb: { bd: p.bb.bd, pcs: p.bb.pcs, sc: p.bb.sc, bet: p.bb.bet, mult: bbMult(p.bb.sc, S.edge) } };
    } else if (a === 'bb_move' || a === 'bb_cash') {
      on('blockblast'); const g = p.bb; if (!g) throw new E('Нет активной игры'); let over = a === 'bb_cash';
      if (!over) {
        const k = Math.floor(Number(b.i)), x = Math.floor(Number(b.x)), y = Math.floor(Number(b.y)), s = g.pcs[k];
        if (!(k >= 0 && k < 3) || s === null || s === undefined || !bbFits(g.bd, s, x, y)) throw new E('Сюда нельзя');
        BBS[s].forEach(([r, c]) => { g.bd[(y + r) * 8 + x + c] = 1 + (s % 6); }); g.sc += BBS[s].length; g.pcs[k] = null;
        const rows = [], cols = []; for (let n = 0; n < 8; n++) { if (g.bd.slice(n * 8, n * 8 + 8).every(Boolean)) rows.push(n); if ([0,1,2,3,4,5,6,7].every(r => g.bd[r * 8 + n])) cols.push(n); }
        const ln = rows.length + cols.length; rows.forEach(r => { for (let c = 0; c < 8; c++) g.bd[r * 8 + c] = 0; }); cols.forEach(c => { for (let r = 0; r < 8; r++) g.bd[r * 8 + c] = 0; }); g.sc += 10 * ln * ln;
        if (g.pcs.every(v => v === null)) g.pcs = bbTray(g.bd);
        over = !bbAny(g.bd, g.pcs) || bbMult(g.sc, S.edge) >= 25;
      }
      const mult = bbMult(g.sc, S.edge);
      if (over) { const win = Math.floor(g.bet * mult); p.balance += win; await settle('blockblast', g.bet, win); p.bb = null; out = { over: true, win, mult, bb: { bd: g.bd, pcs: g.pcs, sc: g.sc } }; }
      else out = { bb: { bd: g.bd, pcs: g.pcs, sc: g.sc, bet: g.bet, mult } };
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
      out = { hilo: p.hilo ? hv(p.hilo) : null, bj: p.bj ? bjView(p.bj) : null, mines: p.mines ? { bet: p.mines.bet, cnt: p.mines.cnt, open: p.mines.open, mult: p.mines.open.length ? minesMult(p.mines.cnt, p.mines.open.length, S.edge) : 1 } : null };
    } else if (a === 'social') {
      const ms = (await mget(p.mq.slice(-12).map(i => 'match:' + i))).filter(Boolean);
      const dms = (await mget(p.dq.slice(-8).map(i => 'durak:' + i))).filter(Boolean).reverse();
      const ids = new Set([...p.friends, ...p.reqIn, ...ms.flatMap(m => [m.a, m.b]), ...dms.flatMap(m => [m.a, m.b])]); ids.delete(me);
      const now = Date.now();
      const us = (await mget([...ids].map(i => 'user:' + i))).filter(Boolean);
      out = { durak: dms.map(m => ({ id: m.id, a: m.a, b: m.b, bet: m.bet, status: m.status, w: m.w, t: m.t })), people: us.map(x => lite(x, now)), friends: p.friends, requests: p.reqIn,
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
    } else if (a === 'durak_bot') {
      on('durak'); const bt = stake(b.bet); p.balance -= bt;
      const m = dNew(crypto.randomBytes(4).toString('hex'), me, 'bot', bt); botPlay(m);
      p.dq = [...p.dq, m.id].slice(-20); await set('durak:' + m.id, m); out = { durakId: m.id };
    } else if (a === 'duel_create' && b.type === 'durak') {
      on('durak'); const id = String(b.friend);
      if (!p.friends.includes(id)) throw new E('Играть можно только с друзьями');
      const bt = stake(b.bet), t = await xload(id); if (!t) throw new E('Игрок не найден');
      p.balance -= bt;
      const m = { id: crypto.randomBytes(4).toString('hex'), a: me, b: id, bet: bt, status: 'pending', w: null, rev: 1, t: Date.now(), mv: Date.now() };
      await set('durak:' + m.id, m); p.dq = [...p.dq, m.id].slice(-20); t.dq = [...t.dq, m.id].slice(-20);
      try { await tg('sendMessage', { chat_id: id, text: `🃏 ${p.nick || p.name} зовёт тебя сыграть в Дурака! Ставка: ${bt} 🪙`, reply_markup: { inline_keyboard: [[{ text: '🃏 Открыть', web_app: { url: process.env.APP_URL || `https://${req.headers.host}` } }]] } }); } catch {}
      out = { msg: 'Вызов в Дурака отправлен', durakId: m.id };
    } else if (a === 'durak_accept' || a === 'durak_decline' || a === 'durak_move' || a === 'durak_resign' || a === 'durak_claim') {
      for (let i = 0; i < 8 && !mlk; i++) { if (await lock('mlock:' + b.id, 6)) mlk = 'mlock:' + b.id; else await sleep(120); }
      if (!mlk) throw new E('Подожди секунду…', 429);
      const m = await get('durak:' + b.id); if (!m || (m.a !== me && m.b !== me)) throw new E('Игра не найдена');
      const role = m.a === me ? 'a' : 'b', prevRev = m.rev;
      const finish = async w => {
        const A = await xload(m.a), B = await xload(m.b), pot = m.bet * 2, fee = Math.floor(pot * S.duelFee / 100); m.status = 'done'; m.w = w; m.rev++;
        let paid = pot;
        if (w === 'draw') { A.balance += m.bet; B.balance += m.bet; } else if (w === 'x') { A.balance += m.bet; } else { const W = w === 'a' ? A : B; paid = pot - fee; W.balance += paid; W.wins++; W.duelWins = (W.duelWins || 0) + 1; W.biggest = Math.max(W.biggest, paid); }
        if (w !== 'x') {
          A.games++; B.games++; A.xp += Math.min(m.bet, 500); B.xp += Math.min(m.bet, 500);
          track(A, 'durak', m.bet, w === 'a' ? paid : w === 'draw' ? m.bet : 0); track(B, 'durak', m.bet, w === 'b' ? paid : w === 'draw' ? m.bet : 0);
          pend.push(Promise.all([incr('g:durak:bets', pot), incr('g:durak:payouts', w === 'draw' ? pot : paid), incr('g:durak:n', 1)]));
        }
      };
      if (a === 'durak_decline') {
        if (m.status !== 'pending') throw new E('Уже нельзя отменить');
        await finish('x');
      } else if (a === 'durak_accept') {
        if (m.status !== 'pending' || m.b !== me) throw new E('Нельзя принять');
        if (m.bet > p.balance) throw new E('Недостаточно фишек');
        p.balance -= m.bet; Object.assign(m, dNew(m.id, m.a, m.b, m.bet));
      } else if (a === 'durak_move') {
        const r = dMove(m, role, b.mv || {}); if (r) await finish(r); else if (m.b === 'bot') { const r2 = botPlay(m); if (r2) await finish(r2); }
      } else if (a === 'durak_resign') {
        if (m.status !== 'active') throw new E('Игра окончена'); await finish(other(role));
      } else {
        if (m.status !== 'active' || m.turn === role) throw new E('Нельзя'); if (Date.now() - m.mv < 120000) throw new E('Подожди: у соперника ещё есть время на ход');
        await finish(role);
      }
      if (a === 'durak_accept') { m.rev = prevRev + 1; m.mv = Date.now(); }
      await set('durak:' + m.id, m); out = { durak: m.hands ? dView(m, role) : { id: m.id, status: m.status, bet: m.bet, role, w: m.w, rev: m.rev } };
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
    } else if (a === 'shop') {
      out = { shop: { items: SHOP, own: p.shop.own, eq: p.shop.eq } };
    } else if (a === 'shop_buy') {
      const it = SHOP.find(x => x.id === String(b.id)); if (!it) throw new E('Товар не найден');
      if (p.shop.own.includes(it.id)) throw new E('Уже куплено');
      if (p.balance < it.price) throw new E('Не хватает фишек');
      p.balance -= it.price; p.shop.own.push(it.id); p.shop.eq[it.cat] = it.id;
      out = { shop: { items: SHOP, own: p.shop.own, eq: p.shop.eq } };
    } else if (a === 'shop_eq') {
      const id = String(b.id || ''), cat = String(b.cat || '');
      if (!id) { if (!SHOP_CATS.includes(cat)) throw new E('Неверная категория'); delete p.shop.eq[cat]; }
      else { const it = SHOP.find(x => x.id === id); if (!it || !p.shop.own.includes(id)) throw new E('Сначала купи этот товар'); p.shop.eq[it.cat] = id; }
      out = { shop: { items: SHOP, own: p.shop.own, eq: p.shop.eq } };
    } else if (a === 'bg_bot') {
      const gm = String(b.game); if (!BG[gm] || BG[gm].coop) throw new E('Эта игра только с другом'); on(gm); const bt = stake(b.bet); p.balance -= bt;
      const m = { id: crypto.randomBytes(4).toString('hex'), game: gm, a: me, b: 'bot', bet: bt, status: 'active', turn: 'a', w: null, rev: 1, t: Date.now(), mv: Date.now(), st: BG[gm].init() };
      p.bgq = [...p.bgq, m.id].slice(-20); await set('bg:' + m.id, m); out = { bg: bgView(m, 'a') };
    } else if (a === 'bg_invite') {
      const gm = String(b.game); if (!BG[gm]) throw new E('Неизвестная игра'); on(gm); const id = String(b.friend);
      if (!p.friends.includes(id)) throw new E('Играть можно только с друзьями');
      const bt = stake(b.bet), t = await xload(id); if (!t) throw new E('Игрок не найден'); p.balance -= bt;
      const m = { id: crypto.randomBytes(4).toString('hex'), game: gm, a: me, b: id, bet: bt, status: 'pending', turn: 'a', w: null, rev: 1, t: Date.now(), mv: Date.now(), st: null, opt: Number(b.opt) || 0 };
      await set('bg:' + m.id, m); p.bgq = [...p.bgq, m.id].slice(-20); t.bgq = [...(t.bgq || []), m.id].slice(-20);
      if (t.notif?.on !== false) { try { await tg('sendMessage', { chat_id: id, text: `${BGN[gm]}: ${p.nick || p.name} зовёт тебя сыграть! Ставка: ${bt} 🪙`, reply_markup: { inline_keyboard: [[{ text: 'Открыть', web_app: { url: process.env.APP_URL || `https://${req.headers.host}` } }]] } }); } catch {} }
      out = { msg: 'Приглашение отправлено', bg: bgView(m, 'a') };
    } else if (a === 'bg_list') {
      const ms = (await mget(p.bgq.slice(-14).map(i => 'bg:' + i))).filter(m => m && (m.status !== 'done' || Date.now() - m.mv < 36e5)).reverse();
      const ids = [...new Set(ms.map(m => (m.a === me ? m.b : m.a)).filter(x => x !== 'bot'))], us = (await mget(ids.map(i => 'user:' + i))).filter(Boolean), nm = {}; us.forEach(u => { nm[u.id] = { id: u.id, nick: u.nick || u.name, avatar: u.avatar }; });
      out = { list: ms.map(m => { const role = m.a === me ? 'a' : 'b', oid = role === 'a' ? m.b : m.a; return { id: m.id, game: m.game, status: m.status, bet: m.bet, role, w: m.w, turn: m.turn, opp: oid === 'bot' ? { id: 'bot', nick: 'Бот', avatar: '🤖' } : nm[oid] || { id: oid, nick: 'Игрок', avatar: '👤' } }; }) };
    } else if (a === 'bg_state') {
      const m = await get('bg:' + b.id); if (!m || (m.a !== me && m.b !== me)) throw new E('Игра не найдена');
      if (b.rev && Number(b.rev) === m.rev) { out = { same: true }; } else {
      const role = m.a === me ? 'a' : 'b', oid = role === 'a' ? m.b : m.a, o = oid === 'bot' ? { id: 'bot', nick: 'Бот', avatar: '🤖' } : await get('user:' + oid);
      out = { bg: bgView(m, role), opp: o ? { id: o.id, nick: o.nick || o.name, avatar: o.avatar } : { id: oid, nick: 'Игрок', avatar: '👤' } };
      }
    } else if (a === 'bg_accept' || a === 'bg_decline' || a === 'bg_move' || a === 'bg_resign' || a === 'bg_claim' || a === 'bg_cash' || a === 'bg_react') {
      for (let i = 0; i < 8 && !mlk; i++) { if (await lock('mlock:' + b.id, 6)) mlk = 'mlock:' + b.id; else await sleep(120); }
      if (!mlk) throw new E('Подожди секунду…', 429);
      const m = await get('bg:' + b.id); if (!m || (m.a !== me && m.b !== me)) throw new E('Игра не найдена');
      const role = m.a === me ? 'a' : 'b', E_ = BG[m.game];
      const finish = async w => {
        const A = await xload(m.a), B = await xload(m.b), pot = m.bet * 2, fee = Math.floor(pot * S.duelFee / 100);
        if (w && typeof w === 'object') {
          const pay = Math.floor(m.bet * w.mult); m.status = 'done'; m.w = 'coop'; m.pay = pay; m.mult = w.mult; m.rev++; m.mv = Date.now();
          [A, B].forEach(P => { P.balance += pay; P.games++; P.xp += Math.min(m.bet, 500); if (pay > m.bet) { P.wins++; P.biggest = Math.max(P.biggest, pay); } track(P, m.game, m.bet, pay); });
          pend.push(Promise.all([incr('g:' + m.game + ':bets', pot), incr('g:' + m.game + ':payouts', pay * 2), incr('g:' + m.game + ':n', 1)])); return;
        }
        m.status = 'done'; m.w = w; m.rev++; m.mv = Date.now();
        let paid = pot;
        if (w === 'draw') { A.balance += m.bet; B.balance += m.bet; } else if (w === 'x') { A.balance += m.bet; } else { const W = w === 'a' ? A : B; paid = pot - fee; W.balance += paid; W.wins++; W.duelWins = (W.duelWins || 0) + 1; W.biggest = Math.max(W.biggest, paid); }
        if (w !== 'x') {
          A.games++; B.games++; A.xp += Math.min(m.bet, 500); B.xp += Math.min(m.bet, 500);
          track(A, m.game, m.bet, w === 'a' ? paid : w === 'draw' ? m.bet : 0); track(B, m.game, m.bet, w === 'b' ? paid : w === 'draw' ? m.bet : 0);
          pend.push(Promise.all([incr('g:' + m.game + ':bets', pot), incr('g:' + m.game + ':payouts', w === 'draw' ? pot : paid), incr('g:' + m.game + ':n', 1)]));
        }
      };
      const flip = r => (r === 'a' ? 'b' : 'a');
      if (a === 'bg_accept') {
        if (m.status !== 'pending' || m.b !== me) throw new E('Нельзя принять'); if (m.bet > p.balance) throw new E('Недостаточно фишек');
        p.balance -= m.bet; m.status = 'active'; m.turn = 'a'; m.st = E_.init(S.edge, m.opt); m.rev++; m.mv = Date.now();
      } else if (a === 'bg_decline') {
        if (m.status !== 'pending' || m.b !== me) throw new E('Нельзя отклонить'); await finish('x');
      } else if (a === 'bg_move') {
        if (m.status !== 'active') throw new E('Игра окончена'); if (m.turn !== role && !E_.free) throw new E('Сейчас не твой ход');
        let o; try { o = E_.apply(m.st, role, b.mv || {}); } catch (e) { throw new E(e.message || 'Нельзя так сходить'); }
        m.st = o.st; m.rev++; m.mv = Date.now();
        if (o.res) await finish(o.res);
        else if (m.b === 'bot') { const o2 = E_.apply(m.st, 'b', E_.bot(m.st, 'b')); m.st = o2.st; m.rev++; if (o2.res) await finish(o2.res); else m.turn = 'a'; }
        else {
          m.turn = flip(role); const oid = m[m.turn];
          if (!E_.free && Date.now() - (m.nt || 0) > 180000) try { const T = await get('user:' + oid); if (T && T.notif?.on !== false && Date.now() - (T.seen || 0) > 90000) { m.nt = Date.now(); await tg('sendMessage', { chat_id: oid, text: `⏳ Твой ход в игре «${BGN[m.game]}» против ${p.nick || p.name}`, reply_markup: { inline_keyboard: [[{ text: 'Сходить', web_app: { url: process.env.APP_URL || `https://${req.headers.host}` } }]] } }); } } catch {}
        }
      } else if (a === 'bg_react') {
        const em = ['👍', '😂', '😮', '😡', '🔥', '🤝'].includes(b.e) ? b.e : null;
        if (!em || m.b === 'bot' || m.status === 'pending') throw new E('Нельзя'); if (Date.now() - ((m.rx && m.rx.t) || 0) < 1500) throw new E('Не так быстро');
        m.rx = { r: role, e: em, t: Date.now() }; m.rev++;
      } else if (a === 'bg_cash') {
        if (!E_.coop || m.status !== 'active') throw new E('Нельзя'); await finish({ t: 'coop', mult: E_.cash(m.st).mult });
      } else if (a === 'bg_resign') {
        if (m.status === 'active' && E_.coop) await finish({ t: 'coop', mult: E_.cash(m.st).mult });
        else if (m.status === 'active') await finish(flip(role)); else if (m.status === 'pending' && role === 'a') await finish('x'); else throw new E('Игра окончена');
      } else if (a === 'bg_claim') {
        if (m.status !== 'active' || m.turn === role || m.b === 'bot') throw new E('Нельзя'); if (Date.now() - m.mv < 10 * 60 * 1000) throw new E('Соперник ещё может ходить');
        await finish(E_.coop ? { t: 'coop', mult: E_.cash(m.st).mult } : role);
      }
      await set('bg:' + m.id, m); const oid2 = role === 'a' ? m.b : m.a, o2 = b.o ? null : oid2 === 'bot' ? { id: 'bot', nick: 'Бот', avatar: '🤖' } : await get('user:' + oid2);
      out = { bg: bgView(m, role), opp: o2 ? { id: o2.id, nick: o2.nick || o2.name, avatar: o2.avatar } : null };
    } else if (a === 'notif_set') {
      p.notif.on = !!b.on; out = {};
    } else throw new E('unknown action');

    p.seen = Date.now();
    await Promise.all([...pend, ...(save ? Object.entries(dirty).map(([id, x]) => set('user:' + id, x)) : [])]);
    await relAll();
    res.json({ me: pub(p, lvlUp), act: { mines: !!p.mines, hilo: !!p.hilo, bj: !!p.bj, bb: !!p.bb, crash: !!(p.crash && crashM((Date.now() - p.crash.start) / 1000) < p.crash.cp) }, ...out });
  } catch (e) {
    await relAll();
    res.status(e instanceof E ? e.code : 500).json({ error: e.message });
  }
}
