import { tg } from '../lib/tg.js';
import { getSettings } from '../lib/settings.js';
import { get, set } from '../lib/db.js';
export default async function handler(req, res) {
  if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.WEBHOOK_SECRET) return res.status(401).end();
  const m = req.body?.message;
  if (m?.text?.startsWith('/start')) {
    const S = await getSettings();
    const rf = (m.text.split(' ')[1] || '').match(/^ref_(\d+)$/);
    if (rf && String(m.from.id) !== rf[1] && !(await get('user:' + m.from.id))) await set('ref:' + m.from.id, rf[1]);
    const base = process.env.APP_URL || `https://${req.headers.host}`;
    await tg('sendMessage', {
      chat_id: m.chat.id, text: S.welcome,
      reply_markup: { inline_keyboard: [[{ text: '🎰 Открыть приложение', web_app: { url: base } }]] },
    });
  }
  res.status(200).json({ ok: true });
}
