// Умные напоминания: не чаще раза в сутки, учитывают бонус, серию и давность визита.
const H = 36e5, DAY = 24 * H, BONUS_CD = 22 * H, STREAK_WIN = 46 * H;
export function pickMessage(p, now) {
  if (!p || p.banned || p.notif?.on === false) return null;
  const last = p.notif?.last || 0;
  if (last && now - last < 20 * H) return null;
  const seen = p.seen || p.bonusAt || p.created || 0, idle = now - seen;
  const since = p.bonusAt ? now - p.bonusAt : Infinity, ready = since >= BONUS_CD, st = p.streak || 0;
  if (st >= 2 && ready && since < STREAK_WIN && idle > 6 * H) return { kind: 'streak', text: `🔥 Серия из ${st} дней под угрозой! Забери ежедневный бонус сегодня, иначе серия сгорит.` };
  if (ready && idle >= DAY && idle < 3 * DAY) return { kind: 'bonus', text: '🎁 Ежедневный бонус уже ждёт тебя. Заходи, забирай и сыграй в Плинко или Блок Бласт!' };
  if (idle >= 3 * DAY && idle < 14 * DAY) return { kind: 'back', text: `👋 ${p.nick || p.name || 'Игрок'}, давно не виделись! Тебя ждут бонус, новые игры и магазин с рамками и эффектами.` };
  if (idle >= 14 * DAY && (!last || now - last > 7 * DAY)) return { kind: 'miss', text: '🎰 Royal Spin скучает по тебе. Загляни, для возвращения есть бонус!' };
  return null;
}
