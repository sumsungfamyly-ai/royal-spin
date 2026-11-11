import { tg } from '../lib/tg.js';
import { getSettings } from '../lib/settings.js';
import { get, set } from '../lib/db.js';
import { isAdmin, adminCommand, adminCallback } from '../lib/botadmin.js';
export default async function handler(req, res) {
  if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.WEBHOOK_SECRET) return res.status(401).end();
  const base = process.env.APP_URL || `https://${req.headers.host}`;
  try {
    if (req.body?.callback_query) { await adminCallback(req.body.callback_query, base); return res.status(200).json({ ok: true }); }
    const a = req.body?.message;
    if (a?.text && a.chat?.type === 'private' && isAdmin(a.from?.id) && a.text.startsWith('/') && !a.text.startsWith('/start') && (await adminCommand(a, base))) return res.status(200).json({ ok: true });
  } catch (e) { console.error('admin bot error', e); return res.status(200).json({ ok: true }); }
  const m = req.body?.message;
  if (m?.text?.startsWith('/start')) {
    const S = await getSettings();
    const rf = (m.text.split(' ')[1] || '').match(/^ref_(\d+)$/);
    if (rf && String(m.from.id) !== rf[1] && !(await get('user:' + m.from.id))) await set('ref:' + m.from.id, rf[1]);
    await tg('sendMessage', {
      chat_id: m.chat.id, text: S.welcome,
      reply_markup: { inline_keyboard: [[{ text: '🎰 Открыть приложение', web_app: { url: base } }]] },
    });
  }
  res.status(200).json({ ok: true });
}
