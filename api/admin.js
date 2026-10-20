import crypto from 'crypto';
import { get, set, smembers, mget, num } from '../lib/db.js';
import { tg } from '../lib/tg.js';
import { getSettings, saveSettings } from '../lib/settings.js';

const secret = () => (process.env.ADMIN_PASSWORD || '') + '|' + (process.env.BOT_TOKEN || '');
const sign = e => e + '.' + crypto.createHmac('sha256', secret()).update(String(e)).digest('hex');
const eq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const valid = t => { const e = Number((t || '').split('.')[0]); return e > Date.now() && eq(sign(e), t); };

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
      const [bets, payouts, games, ids] = await Promise.all([num('stat:bets'), num('stat:payouts'), num('stat:games'), smembers('users')]);
      return res.json({ users: ids.length, bets, payouts, games, profit: bets - payouts, rtp: bets ? +((payouts / bets) * 100).toFixed(1) : 0 });
    }
    if (action === 'users') {
      const ids = await smembers('users');
      const all = (await mget(ids.slice(0, 1000).map(i => 'user:' + i))).filter(Boolean);
      return res.json({ users: all.sort((a, b) => b.balance - a.balance).slice(0, 300) });
    }
    if (action === 'setBalance' || action === 'ban') {
      const p = await get('user:' + d.id);
      if (!p) return res.status(404).json({ error: 'Игрок не найден' });
      if (action === 'setBalance') p.balance = Math.max(0, Math.round(Number(d.balance)) || 0);
      else p.banned = !!d.banned;
      await set('user:' + d.id, p);
      return res.json({ ok: true });
    }
    if (action === 'getSettings') return res.json(await getSettings());
    if (action === 'saveSettings') { await saveSettings(d.settings); return res.json(await getSettings()); }
    if (action === 'broadcast') {
      const text = String(d.text || '').slice(0, 3000);
      if (!text) return res.status(400).json({ error: 'Пустой текст' });
      const ids = (await smembers('users')).slice(0, 1000);
      let sent = 0;
      for (let i = 0; i < ids.length; i += 25)
        sent += (await Promise.all(ids.slice(i, i + 25).map(id => tg('sendMessage', { chat_id: id, text })))).filter(r => r.ok).length;
      return res.json({ sent, total: ids.length });
    }
    res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
