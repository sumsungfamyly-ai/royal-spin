// Чат в партиях: очистка текста и реплики соперника-бота
import crypto from 'crypto';
const R = n => crypto.randomInt(n), pick = a => a[R(a.length)];
export const MAXLEN = 200, KEEP = 60;
const BAD = /(х[уy]й|х[уy][еёяю]|п[иi]зд|[её]б[аыуо]н|[её]бл[ао]|[её]бат|бл[яе]д|бл[яе]т|су[кч][аи]|сучк|муд[аао]к|п[иi]дор|п[иi]дар|гандон|залуп|шлюх|fuck|shit|bitch|cunt|nigg|faggot)/gi;
export function cleanText(s) {
  let t = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/(https?:\/\/|www\.|t\.me\/|@)\S+/gi, '[ссылка скрыта]').replace(BAD, '***');
  return Array.from(t).slice(0, MAXLEN).join('');
}
const lang = t => (/[a-z]/i.test(t) && !/[а-яё]/i.test(t) ? 'en' : 'ru');
const RULES = [
  [/прив|здаров|здравств|хай|добр|hello|\bhi\b|hey|\byo\b|sup/i, { ru: ['Привет!', 'Привет, погнали', 'Здарова 👋', 'Хай, удачи!'], en: ['Hi!', 'Hey, good luck', 'Yo 👋', 'Hello, have fun'] }, 1],
  [/удач|\bgl\b|good luck|успех|hf/i, { ru: ['И тебе удачи!', 'Взаимно 🤝', 'Спасибо, и тебе'], en: ['You too!', 'gl hf', 'Thanks, same to you'] }, 1],
  [/реванш|ещё раз|еще раз|rematch|again|\brp\b/i, { ru: ['Давай, я не против', 'Можно, ставь снова', 'Го ещё партию'], en: ['Sure, why not', 'Let’s go again', 'Bring it on'] }, 1],
  [/быстр|долго|спишь|ходи|hurry|slow|fast|wake|\?\?\?/i, { ru: ['Думаю, думаю…', 'Секунду 🙂', 'Не торопи, тут сложно'], en: ['Thinking…', 'One sec 🙂', 'Hold on, this is tricky'] }, 1],
  [/gg|wp|красав|молодец|хорош|отличн|класс|nice|good move|well played|круто/i, { ru: ['Спасибо 🙂', 'Ты тоже хорошо играешь', 'Приятно играть'], en: ['Thanks 🙂', 'You play well too', 'Nice game'] }, .85],
  [/лох|слаб|изи|\bez\b|noob|trash|bad|плох|хах|ха-ха|lol|ахах/i, { ru: ['Ещё посмотрим 😄', 'Не спеши радоваться', 'Ха, партия не закончена'], en: ['We’ll see 😄', 'Not over yet', 'Don’t celebrate yet'] }, .7],
  [/как дела|как ты|how are you|что делаешь|hru/i, { ru: ['Норм, играю 🙂 ты как?', 'Всё хорошо, а у тебя?'], en: ['Good, playing 🙂 you?', 'All good, you?'] }, .9],
];
const NEUTRAL = { ru: ['Ок', 'Понял', '👍', 'Хм, интересно', 'Ну ладно 🙂', 'Ага'], en: ['ok', 'got it', '👍', 'hm, interesting', 'fair enough 🙂', 'yep'] };
// Ответ бота: { t, delay } или null (человек тоже не всегда отвечает)
export function botReply(text) {
  const L = lang(text);
  for (const [re, set, p] of RULES) if (re.test(text)) return Math.random() < p ? { t: pick(set[L]), delay: 1100 + R(1600) + Math.min(1800, text.length * 40) } : null;
  return Math.random() < .5 ? { t: pick(NEUTRAL[L]), delay: 1300 + R(2000) } : null;
}
// Фраза после конца партии (иногда): бот победил или проиграл
export function botFinish(botWon) {
  if (Math.random() > .55) return null;
  const en = Math.random() < .4;
  return { t: botWon ? pick(en ? ['gg wp', 'gg, good game', 'gg 🤝'] : ['gg, хорошая партия', 'gg 🤝', 'Хорошо сыграли']) : pick(en ? ['gg, well played', 'gg, you got me', 'wp 👏'] : ['gg, красиво сыграл', 'Сильно, поздравляю 👏', 'gg, реванш?']), delay: 900 + R(1400) };
}
