import crypto from 'crypto';
import { get, set, del, sadd, srem, smembers, mget, num } from '../lib/db.js';
import { tg } from '../lib/tg.js';
import { getSettings, saveSettings } from '../lib/settings.js';

const GS = ['slots', 'flip', 'dice', 'roulette', 'crash', 'mines', 'blackjack', 'rps', 'hilo', 'plinko', 'tower', 'limbo', 'penalty', 'chests', 'duel'];
const secret = () => (process.env.ADMIN_PASSWORD || '') + '|' + (process.env.BOT_TOKEN || '');
const sign = e => e + '.' + crypto.createHmac('sha256', secret()).update(String(e)).digest('hex');
const eq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const valid = t => { const e = Number((t || '').split('.')[0]); return e > Date.now() && eq(sign(e), t); };
const allUsers = async () => {
  const ids = (await smembers('users')).slice(0, 1000);
  return (await mget(ids.map(i => 'user:' + i))).filter(Boolean);
};

export default async function handler(req, res) {
  try {
    const { action, ...d } = req.body || {};
    if (action === 'login') {
      if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: 'ADMIN_PASSWORD не задан' });
      const ok = eq(d.login, process.env.ADMIN_LOGIN || 'admin') & eq(d.password, process.env.ADMIN_PASSWORD);
      if (!ok) { await new Promise(r => setTimeout(r, 800)); return res.status(401).json({ error: 'Неверный логин или пароль' }); }
      return res.json({ token: sign(Date.now() + 12 * 3600000) });
    }
    if (!valid(req.headers['x-token'])) return res.status(401).json({ error: 'auth' });

    if (action === 'stats') {
      const [users, per] = await Promise.all([allUsers(),
        Promise.all(GS.map(async g => ({ g, bets: await num(`g:${g}:bets`), payouts: await num(`g:${g}:payouts`), n: await num(`g:${g}:n`) })))]);
      const bets = per.reduce((s, x) => s + x.bets, 0), payouts = per.reduce((s, x) => s + x.payouts, 0), games = per.reduce((s, x) => s + x.n, 0);
      const day = Date.now() - 864e5;
      return res.json({ users: users.length, online: users.filter(u => (u.lastSeen || 0) > Date.now() - 300000).length,
        new24: users.filter(u => u.created > day).length, chips: users.reduce((s, u) => s + u.balance, 0),
        bets, payouts, games, profit: bets - payouts, rtp: bets ? +((payouts / bets) * 100).toFixed(1) : 0, per });
    }
    if (action === 'users') {
      const us = await allUsers();
      return res.json({ users: us.sort((a, b) => b.balance - a.balance).slice(0, 500).map(u => ({
        id: u.id, name: u.nick || u.name, tg: u.name, avatar: u.avatar || '😎', balance: u.balance, games: u.games, wins: u.wins,
        xp: u.xp || 0, friends: (u.friends || []).length, banned: !!u.banned, lastSeen: u.lastSeen || 0, created: u.created })) });
    }
    if (action === 'setBalance' || action === 'ban') {
      const p = await get('user:' + d.id);
      if (!p) return res.status(404).json({ error: 'Игрок не найден' });
      if (action === 'setBalance') p.balance = Math.max(0, Math.round(Number(d.balance)) || 0); else p.banned = !!d.banned;
      await set('user:' + d.id, p); return res.json({ ok: true });
    }
    if (action === 'giveAll') {
      const amt = Math.round(Number(d.amount)); if (!amt) return res.status(400).json({ error: 'Укажи сумму' });
      const us = await allUsers();
      for (let i = 0; i < us.length; i += 25)
        await Promise.all(us.slice(i, i + 25).map(u => { u.balance = Math.max(0, u.balance + amt); return set('user:' + u.id, u); }));
      return res.json({ count: us.length });
    }
    if (action === 'getSettings') return res.json(await getSettings());
    if (action === 'saveSettings') { await saveSettings(d.settings); return res.json(await getSettings()); }
    if (action === 'promoList') {
      const codes = await smembers('promos');
      const list = (await mget(codes.map(c => 'promo:' + c))).map((p, i) => p && { code: codes[i], amount: p.amount, max: p.max, used: p.usedBy.length }).filter(Boolean);
      return res.json({ promos: list });
    }
    if (action === 'promoCreate') {
      const code = String(d.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30), amount = Math.round(Number(d.amount));
      if (!code || !(amount > 0)) return res.status(400).json({ error: 'Нужны код (латиница/цифры) и сумма' });
      await set('promo:' + code, { amount, max: Math.max(0, Math.round(Number(d.max)) || 0), usedBy: [] }); await sadd('promos', code);
      return res.json({ ok: true });
    }
    if (action === 'promoDelete') { await del('promo:' + d.code); await srem('promos', d.code); return res.json({ ok: true }); }
    if (action === 'broadcast') {
      const text = String(d.text || '').slice(0, 3000);
      if (!text) return res.status(400).json({ error: 'Пустой текст' });
      const ids = (await smembers('users')).slice(0, 1000); let sent = 0;
      for (let i = 0; i < ids.length; i += 25)
        sent += (await Promise.all(ids.slice(i, i + 25).map(id => tg('sendMessage', { chat_id: id, text })))).filter(r => r.ok).length;
      return res.json({ sent, total: ids.length });
    }
    res.status(400).json({ error: 'unknown action' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
