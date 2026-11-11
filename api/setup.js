import { tg } from '../lib/tg.js';
import { set } from '../lib/db.js';
export default async function handler(req, res) {
  if (!process.env.ADMIN_PASSWORD || req.query.key !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'bad key' });
  const base = process.env.APP_URL || `https://${req.headers.host}`;
  const hook = await tg('setWebhook', { url: base + '/api/bot', secret_token: process.env.WEBHOOK_SECRET, allowed_updates: ['message', 'callback_query'] });
  const menu = await tg('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Играть', web_app: { url: base } } });
  // подсказки команд админа видны только в личных чатах самих админов
  const cmds = [['admin', 'Админ-меню'], ['stats', 'Статистика'], ['top', 'Топ игроков'], ['user', 'Карточка игрока'], ['give', 'Начислить фишки'], ['broadcast', 'Рассылка'], ['promo', 'Создать промокод'], ['games', 'Включить/выключить игры'], ['lb', 'Заявки в рейтинг'], ['help', 'Все команды']].map(([command, description]) => ({ command, description }));
  const admins = (process.env.ADMIN_IDS || process.env.ADMIN_CHAT_ID || '').split(',').map(x => x.trim()).filter(Boolean);
  const adminCmds = await Promise.all(admins.map(id => tg('setMyCommands', { commands: cmds, scope: { type: 'chat', chat_id: id } })));
  const bot = await tg('getMe', {});
  if (bot.ok) await set('bot:username', bot.result.username);
  res.json({ webhook: hook, menu, adminCommands: adminCmds.map(r => r.ok), bot: bot.ok ? bot.result.username : null });
}
