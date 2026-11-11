// Админ-панель прямо в боте Telegram: команды и кнопки, доступны только админам из ADMIN_IDS / ADMIN_CHAT_ID
import { get, set, del, sadd, srem, smembers, mget, num, lock } from './db.js';
import { tg } from './tg.js';
import { getSettings, saveSettings } from './settings.js';

export const ADMINS = (process.env.ADMIN_IDS || process.env.ADMIN_CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);
export const isAdmin = id => ADMINS.includes(String(id));
const GS = ['slots', 'flip', 'dice', 'roulette', 'crash', 'mines', 'blackjack', 'rps', 'hilo', 'durak', 'duel', 'plinko', 'blockblast', 'checkers', 'connect4', 'coblast', 'comines'];
const GN = { slots: '🎰 Слоты', flip: '🪙 Монетка', dice: '🎲 Кости', roulette: '🎡 Рулетка', crash: '🚀 Краш', mines: '💣 Мины', blackjack: '🃏 Блэкджек', rps: '✊ КНБ', hilo: '⬆️ Хай-Лоу', durak: '🃏 Дурак', duel: '⚔️ Дуэли', plinko: '🔮 Плинко', blockblast: '🧩 Блок Бласт', checkers: '♟️ Шашки', connect4: '🔴 4 в ряд', coblast: '🧩 Бласт вдвоём', comines: '💣 Мины вдвоём', wheel: '🎁 Колесо' };
const sleep = ms => new Promise(z => setTimeout(z, ms));
const money = n => new Intl.NumberFormat('ru-RU').format(Math.round(n || 0));
const allUsers = async () => (await mget((await smembers('users')).slice(0, 1000).map(i => 'user:' + i))).filter(Boolean);
async function withUser(id, fn) {
  const k = 'lock:' + id; let ok = false;
  for (let i = 0; i < 14 && !ok; i++) { ok = await lock(k, 6); if (!ok) await sleep(110); }
  if (!ok) throw new Error('Игрок сейчас занят, попробуй ещё раз');
  try { const u = await get('user:' + id); if (!u) return null; const r = await fn(u); await set('user:' + id, u); return r === undefined ? true : r; } finally { await del(k); }
}
const findUser = async q => {
  q = String(q || '').replace('@', '').trim(); if (!q) return null;
  if (/^\d+$/.test(q)) { const u = await get('user:' + q); if (u) return u; }
  const l = q.toLowerCase(); return (await allUsers()).find(u => String(u.nick || '').toLowerCase() === l || String(u.name || '').toLowerCase() === l) || null;
};
const base = () => process.env.APP_URL;
const send = (chat, text, extra = {}) => tg('sendMessage', { chat_id: chat, text: String(text).slice(0, 4000), ...extra });
const menuKb = url => ({ reply_markup: { inline_keyboard: [
  [{ text: '📊 Статистика', callback_data: 'a:stats' }, { text: '👥 Топ игроков', callback_data: 'a:top' }],
  [{ text: '🎮 Игры вкл/выкл', callback_data: 'a:games' }, { text: '🏆 Заявки в рейтинг', callback_data: 'a:lb' }],
  [{ text: '🎟 Промокоды', callback_data: 'a:promos' }, { text: '📖 Команды', callback_data: 'a:help' }],
  [{ text: '🛠 Полная админка', web_app: { url: url + '/admin?tg=1' } }]] } });

const HELP = `Команды администратора:
/admin — меню
/stats — статистика
/top — топ игроков по фишкам
/user <id или ник> — карточка игрока
/give <id> <сумма> — начислить (можно с минусом)
/setbal <id> <сумма> — установить баланс
/ban <id>  /unban <id> — блокировка
/giveall <сумма> — начислить всем
/broadcast <текст> — рассылка всем
/promo <КОД> <сумма> [лимит] — создать промокод
/promos — список промокодов
/delpromo <КОД> — удалить промокод
/games — включить или выключить игры
/lb — заявки в рейтинг`;

async function statsText() {
  const us = await allUsers(), now = Date.now();
  const per = await Promise.all(GS.map(async g => ({ g, bets: await num(`g:${g}:bets`), payouts: await num(`g:${g}:payouts`), n: await num(`g:${g}:n`) })));
  const bets = per.reduce((s, x) => s + x.bets, 0), pay = per.reduce((s, x) => s + x.payouts, 0), n = per.reduce((s, x) => s + x.n, 0);
  const top = per.filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 6).map(x => `${GN[x.g] || x.g}: ${money(x.n)} партий, RTP ${x.bets ? ((x.payouts / x.bets) * 100).toFixed(0) : 0}%`).join('\n');
  return `📊 Royal Spin\n👥 Игроков: ${us.length} (онлайн 5 мин: ${us.filter(u => (u.lastSeen || 0) > now - 3e5).length}, новых за 24 ч: ${us.filter(u => u.created > now - 864e5).length})\n🪙 Фишек у игроков: ${money(us.reduce((s, u) => s + u.balance, 0))}\n🎲 Партий: ${money(n)}\n💸 Ставки: ${money(bets)}, выплаты: ${money(pay)}\n💰 Прибыль казино: ${money(bets - pay)} (RTP ${bets ? ((pay / bets) * 100).toFixed(1) : 0}%)${top ? '\n\nПопулярные игры:\n' + top : ''}`;
}
async function topText() {
  const us = (await allUsers()).sort((a, b) => b.balance - a.balance).slice(0, 10);
  return '👥 Топ по фишкам\n' + us.map((u, i) => `${i + 1}. ${u.avatar || '😎'} ${u.nick || u.name} · ${money(u.balance)} 🪙 · id ${u.id}${u.banned ? ' 🚫' : ''}`).join('\n');
}
const userCard = u => ({
  text: `${u.avatar || '😎'} ${u.nick || u.name}${u.banned ? ' 🚫 заблокирован' : ''}\nid ${u.id} · @${u.username || '—'}\n🪙 ${money(u.balance)} · игр ${u.games || 0} · побед ${u.wins || 0}\nопыт ${u.xp || 0} · друзей ${(u.friends || []).length}\nс нами с ${new Date(u.created || 0).toLocaleDateString('ru-RU')}`,
  extra: { reply_markup: { inline_keyboard: [[{ text: '+1 000', callback_data: `u:g1000:${u.id}` }, { text: '+10 000', callback_data: `u:g10000:${u.id}` }, { text: '−1 000', callback_data: `u:g-1000:${u.id}` }], [u.banned ? { text: '✅ Разблокировать', callback_data: `u:unban:${u.id}` } : { text: '🚫 Заблокировать', callback_data: `u:ban:${u.id}` }]] } },
});
async function gamesKb() {
  const S = await getSettings(), keys = [...GS.filter(g => g !== 'duel'), 'wheel', 'duel'], rows = [];
  for (let i = 0; i < keys.length; i += 2) rows.push(keys.slice(i, i + 2).map(k => ({ text: `${S.games[k] === false ? '⛔' : '✅'} ${GN[k] || k}`, callback_data: 'g:' + k })));
  return { reply_markup: { inline_keyboard: rows } };
}
async function lbList(chat) {
  const pend = (await allUsers()).filter(u => u.lb && u.lb.s === 'pending').slice(0, 5);
  if (!pend.length) return send(chat, '🏆 Новых заявок в рейтинг нет.');
  for (const u of pend) await send(chat, `🏆 Заявка в рейтинг\n${u.avatar || '😎'} ${u.nick || u.name} · ${money(u.balance)} 🪙 · игр ${u.games || 0}${u.lb.note ? '\n«' + u.lb.note + '»' : ''}`, { reply_markup: { inline_keyboard: [[{ text: '✅ Одобрить', callback_data: 'l:ok:' + u.id }, { text: '✖ Отклонить', callback_data: 'l:no:' + u.id }]] } });
}
async function promoList() {
  const codes = await smembers('promos'), ps = (await mget(codes.map(c => 'promo:' + c))).map((p, i) => p && `${codes[i]}: ${money(p.amount)} 🪙, использовано ${p.usedBy.length}${p.max ? '/' + p.max : ''}`).filter(Boolean);
  return ps.length ? '🎟 Промокоды\n' + ps.join('\n') + '\n\nСоздать: /promo КОД сумма [лимит]\nУдалить: /delpromo КОД' : '🎟 Промокодов нет. Создать: /promo КОД сумма [лимит]';
}
const askConfirm = async (chat, adminId, pending, text) => { await set('admp:' + adminId, pending); return send(chat, text, { reply_markup: { inline_keyboard: [[{ text: '✅ Подтвердить', callback_data: 'c:ok' }, { text: '✖ Отмена', callback_data: 'c:no' }]] } }); };

/** Команды из сообщений. Возвращает true, если команда обработана. */
export async function adminCommand(m, url) {
  const chat = m.chat.id, text = (m.text || '').trim(), [c0, ...args] = text.split(/\s+/), cmd = c0.split('@')[0].toLowerCase();
  const need = n => args.length >= n;
  try {
    if (cmd === '/admin') { await send(chat, '🛠 Админ-панель Royal Spin', menuKb(url)); return true; }
    if (cmd === '/help' || cmd === '/adminhelp') { await send(chat, HELP); return true; }
    if (cmd === '/stats') { await send(chat, await statsText()); return true; }
    if (cmd === '/top') { await send(chat, await topText()); return true; }
    if (cmd === '/games') { await send(chat, '🎮 Нажми на игру, чтобы включить или выключить', await gamesKb()); return true; }
    if (cmd === '/lb') { await lbList(chat); return true; }
    if (cmd === '/promos') { await send(chat, await promoList()); return true; }
    if (cmd === '/user') { const u = await findUser(args.join(' ')); if (!u) await send(chat, 'Игрок не найден. Формат: /user <id или ник>'); else { const k = userCard(u); await send(chat, k.text, k.extra); } return true; }
    if (cmd === '/give' || cmd === '/setbal') {
      const amt = Math.round(Number(args[1])); if (!need(2) || !Number.isFinite(amt)) { await send(chat, `Формат: ${cmd} <id> <сумма>`); return true; }
      let after = 0; const r = await withUser(args[0], u => { u.balance = Math.max(0, cmd === '/give' ? u.balance + amt : amt); after = u.balance; });
      await send(chat, r ? `✅ Баланс игрока ${args[0]}: ${money(after)} 🪙` : 'Игрок не найден'); return true;
    }
    if (cmd === '/ban' || cmd === '/unban') {
      if (!need(1)) { await send(chat, `Формат: ${cmd} <id>`); return true; }
      const r = await withUser(args[0], u => { u.banned = cmd === '/ban'; }); await send(chat, r ? (cmd === '/ban' ? '🚫 Игрок заблокирован' : '✅ Игрок разблокирован') : 'Игрок не найден'); return true;
    }
    if (cmd === '/giveall') {
      const amt = Math.round(Number(args[0])); if (!amt) { await send(chat, 'Формат: /giveall <сумма>'); return true; }
      const n = (await smembers('users')).length; await askConfirm(chat, m.from.id, { t: 'ga', amt }, `Начислить ${money(amt)} 🪙 всем игрокам (${n})?`); return true;
    }
    if (cmd === '/broadcast') {
      const body = text.slice(c0.length).trim(); if (!body) { await send(chat, 'Формат: /broadcast <текст>'); return true; }
      const n = (await smembers('users')).length; await askConfirm(chat, m.from.id, { t: 'bc', text: body.slice(0, 3000) }, `Отправить всем игрокам (${n})?\n\n${body.slice(0, 500)}`); return true;
    }
    if (cmd === '/promo') {
      const code = String(args[0] || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30), amount = Math.round(Number(args[1])), max = Math.max(0, Math.round(Number(args[2])) || 0);
      if (!code || !(amount > 0)) { await send(chat, 'Формат: /promo КОД сумма [лимит]. Код только латиница и цифры.'); return true; }
      await set('promo:' + code, { amount, max, usedBy: [] }); await sadd('promos', code); await send(chat, `🎟 Промокод ${code}: ${money(amount)} 🪙${max ? ', лимит ' + max : ''}`); return true;
    }
    if (cmd === '/delpromo') { const code = String(args[0] || '').toUpperCase(); if (!code) { await send(chat, 'Формат: /delpromo КОД'); return true; } await del('promo:' + code); await srem('promos', code); await send(chat, '🗑 Промокод удалён'); return true; }
  } catch (e) { await send(chat, '⚠️ ' + (e.message || 'Ошибка')); return true; }
  return false;
}

/** Нажатия на кнопки. */
export async function adminCallback(cq, url) {
  const id = cq.from.id, chat = cq.message?.chat?.id, mid = cq.message?.message_id, d = String(cq.data || ''), ans = (t, alert) => tg('answerCallbackQuery', { callback_query_id: cq.id, text: t, show_alert: !!alert });
  if (!isAdmin(id) || !chat) return ans('Нет доступа', true);
  const edit = (text, extra = {}) => tg('editMessageText', { chat_id: chat, message_id: mid, text: String(text).slice(0, 4000), ...extra });
  try {
    if (d === 'a:stats') { await ans(); return send(chat, await statsText()); }
    if (d === 'a:top') { await ans(); return send(chat, await topText()); }
    if (d === 'a:help') { await ans(); return send(chat, HELP); }
    if (d === 'a:promos') { await ans(); return send(chat, await promoList()); }
    if (d === 'a:lb') { await ans(); return lbList(chat); }
    if (d === 'a:games') { await ans(); return send(chat, '🎮 Нажми на игру, чтобы включить или выключить', await gamesKb()); }
    if (d.startsWith('g:')) {
      const k = d.slice(2), S = await getSettings(); S.games[k] = S.games[k] === false; await saveSettings(S);
      await ans(`${GN[k] || k}: ${S.games[k] === false ? 'выключено' : 'включено'}`); return tg('editMessageReplyMarkup', { chat_id: chat, message_id: mid, ...(await gamesKb()) });
    }
    if (d.startsWith('u:')) {
      const [, act, uid] = d.split(':'); let after = null;
      const r = await withUser(uid, u => { if (act === 'ban') u.banned = true; else if (act === 'unban') u.banned = false; else if (act.startsWith('g')) { u.balance = Math.max(0, u.balance + Math.round(Number(act.slice(1)))); } after = u; });
      if (!r) return ans('Игрок не найден', true);
      await ans('Готово'); const k = userCard(after); return edit(k.text, k.extra);
    }
    if (d.startsWith('l:')) {
      const [, act, uid] = d.split(':'), ok = act === 'ok';
      const r = await withUser(uid, u => { if (!(u.lb && u.lb.s === 'pending')) throw new Error('Заявка уже обработана'); u.lb = { s: ok ? 'approved' : 'rejected', t: Date.now(), note: '' }; });
      if (!r) return ans('Игрок не найден', true);
      try { await send(uid, ok ? '🏆 Заявка одобрена! Ты теперь в рейтинге.' : '🏆 Заявка в рейтинг отклонена.'); } catch {}
      await ans(ok ? 'Одобрено' : 'Отклонено'); return edit(`${ok ? '✅ Одобрено' : '✖ Отклонено'}: заявка игрока ${uid}`);
    }
    if (d === 'c:no') { await del('admp:' + id); await ans('Отменено'); return edit('Отменено'); }
    if (d === 'c:ok') {
      const p = await get('admp:' + id); if (!p) { await ans('Нет действия для подтверждения', true); return edit('Действие устарело, повтори команду.'); }
      await del('admp:' + id); await ans('Выполняю…');
      if (p.t === 'ga') {
        const ids = (await smembers('users')).slice(0, 1000); let n = 0;
        for (let i = 0; i < ids.length; i += 25) n += (await Promise.all(ids.slice(i, i + 25).map(x => withUser(x, u => { u.balance = Math.max(0, u.balance + p.amt); }).catch(() => null)))).filter(Boolean).length;
        return edit(`✅ Начислено ${money(p.amt)} 🪙 игрокам: ${n}`);
      }
      if (p.t === 'bc') {
        const ids = (await smembers('users')).slice(0, 1000); let sent = 0;
        for (let i = 0; i < ids.length; i += 25) sent += (await Promise.all(ids.slice(i, i + 25).map(x => tg('sendMessage', { chat_id: x, text: p.text })))).filter(r => r.ok).length;
        return edit(`📣 Рассылка отправлена: ${sent} из ${ids.length}`);
      }
    }
    return ans();
  } catch (e) { await ans('⚠️ ' + (e.message || 'Ошибка'), true); }
}
