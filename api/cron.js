import { smembers, mget, set } from '../lib/db.js';
import { tg } from '../lib/tg.js';
import { pickMessage } from '../lib/notify.js';
export const config = { maxDuration: 30 };
export default async function handler(req, res) {
  const sec = process.env.CRON_SECRET, auth = req.headers.authorization || '';
  if (sec ? auth !== `Bearer ${sec}` : !String(req.headers['user-agent'] || '').startsWith('vercel-cron')) return res.status(401).json({ error: 'forbidden' });
  const base = process.env.APP_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || req.headers.host}`;
  const ids = await smembers('users'), t0 = Date.now(); let sent = 0;
  for (let i = 0; i < ids.length && Date.now() - t0 < 24000; i += 25) {
    const chunk = ids.slice(i, i + 25), us = await mget(chunk.map(x => 'user:' + x));
    await Promise.all(us.map(async (p, j) => {
      const m = pickMessage(p, Date.now()); if (!m) return;
      try {
        const r = await tg('sendMessage', { chat_id: chunk[j], text: m.text, reply_markup: { inline_keyboard: [[{ text: '🎰 Открыть', web_app: { url: base } }]] } });
        p.notif ??= { on: true, last: 0 };
        if (r.ok) { p.notif.last = Date.now(); p.notif.kind = m.kind; sent++; await set('user:' + chunk[j], p); }
        else if (r.error_code === 403) { p.notif.on = false; await set('user:' + chunk[j], p); }
      } catch {}
    }));
  }
  res.json({ ok: true, users: ids.length, sent });
}
