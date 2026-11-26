import { smembers, mget, get, set, lock, del } from '../lib/db.js';
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
        if (r.ok) sent++;
        if (!r.ok && r.error_code !== 403) return;
        // Профиль меняем под той же блокировкой, что и игра, и по свежим данным: иначе можно затереть баланс игрока
        const key = 'lock:' + chunk[j]; let got = false;
        for (let k = 0; k < 8 && !got; k++) { got = await lock(key, 6); if (!got) await new Promise(z => setTimeout(z, 120)); }
        if (!got) return;
        try {
          const fresh = await get('user:' + chunk[j]); if (!fresh) return;
          fresh.notif ??= { on: true, last: 0 };
          if (r.ok) { fresh.notif.last = Date.now(); fresh.notif.kind = m.kind; } else fresh.notif.on = false;
          await set('user:' + chunk[j], fresh);
        } finally { await del(key); }
      } catch {}
    }));
  }
  res.json({ ok: true, users: ids.length, sent });
}
