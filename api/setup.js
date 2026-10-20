import { tg } from '../lib/tg.js';
export default async function handler(req, res) {
  if (!process.env.ADMIN_PASSWORD || req.query.key !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'bad key' });
  const base = process.env.APP_URL || `https://${req.headers.host}`;
  const hook = await tg('setWebhook', { url: base + '/api/bot', secret_token: process.env.WEBHOOK_SECRET, allowed_updates: ['message'] });
  const menu = await tg('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Играть', web_app: { url: base } } });
  res.json({ webhook: hook, menu });
}
