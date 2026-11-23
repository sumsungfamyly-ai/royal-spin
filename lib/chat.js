// Чат в партиях: очистка текста и поведение соперника-бота (у каждого бота свой характер)
import crypto from 'crypto';
const R = n => crypto.randomInt(n), pick = a => a[R(a.length)], chance = p => Math.random() < p;
export const MAXLEN = 200, KEEP = 60;
const BAD = /(х[уy]й|х[уy][еёяю]|п[иi]зд|[её]б[аыуо]н|[её]бл[ао]|[её]бат|бл[яе]д|бл[яе]т|су[кч][аи]|сучк|муд[аао]к|п[иi]дор|п[иi]дар|гандон|залуп|шлюх|fuck|shit|bitch|cunt|nigg|faggot)/gi;
export function cleanText(s) {
  let t = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/(https?:\/\/|www\.|t\.me\/|@)\S+/gi, '[ссылка скрыта]').replace(BAD, '***');
  return Array.from(t).slice(0, MAXLEN).join('');
}
/* ---- характеры: silent молчит, terse отвечает коротко и редко, friendly дружелюбный, chatty разговорчивый, rival азартный ---- */
const KINDS = [['silent', 18], ['terse', 24], ['friendly', 30], ['chatty', 16], ['rival', 12]];
const BASE = { silent: .05, terse: .42, friendly: .86, chatty: .95, rival: .62 };
export function botPersona(nick = '') {
  let r = R(100), kind = 'friendly'; for (const [k, w] of KINDS) { if (r < w) { kind = k; break; } r -= w; }
  const ru = /[а-яё]/i.test(nick) ? chance(.92) : chance(.3);
  return { k: kind, ru, em: chance(.45) };
}
const lang = (t, p) => (/[a-z]/i.test(t) && !/[а-яё]/i.test(t) ? 'en' : /[а-яё]/i.test(t) ? 'ru' : p && p.ru ? 'ru' : 'en');
const V = {
  greet: { ru: ['Привет!', 'Привет, погнали', 'Здарова 👋', 'Хай, удачи!', 'о, привет', 'Приветствую', 'Салют'], en: ['Hi!', 'Hey, good luck', 'Yo 👋', 'Hello, have fun', 'sup', 'hey hey', 'Hi, gl'] },
  luck: { ru: ['И тебе удачи!', 'Взаимно 🤝', 'Спасибо, и тебе', 'ага, и тебе', 'Давай, удачи'], en: ['You too!', 'gl hf', 'Thanks, same to you', 'ty, you too', 'hf!'] },
  rematch: { ru: ['Давай, я не против', 'Можно, ставь снова', 'Го ещё партию', 'Хм, давай', 'Только если ставка та же'], en: ['Sure, why not', 'Let’s go again', 'Bring it on', 'ok, one more', 'maybe later'] },
  rush: { ru: ['Думаю, думаю…', 'Секунду 🙂', 'Не торопи, тут сложно', 'Сейчас', 'Погоди, ход сложный', 'Ща'], en: ['Thinking…', 'One sec 🙂', 'Hold on, this is tricky', 'wait a sec', 'give me a moment'] },
  praise: { ru: ['Спасибо 🙂', 'Ты тоже хорошо играешь', 'Приятно играть', 'Стараюсь', 'Благодарю', 'Да ладно, повезло'], en: ['Thanks 🙂', 'You play well too', 'Nice game', 'trying my best', 'ty ty', 'just lucky'] },
  taunt: { ru: ['Ещё посмотрим 😄', 'Не спеши радоваться', 'Партия не закончена', 'Посмотрим, что скажешь в конце', 'Смелый, да?'], en: ['We’ll see 😄', 'Not over yet', 'Don’t celebrate yet', 'big words', 'lets see about that'] },
  how: { ru: ['Норм, играю 🙂 ты как?', 'Всё хорошо, а у тебя?', 'Нормально, думаю над ходом', 'отлично, ты как?'], en: ['Good, playing 🙂 you?', 'All good, you?', 'fine, thinking about my move', 'not bad, u?'] },
  thanks: { ru: ['Не за что', 'Обращайся 🙂', 'Пожалуйста'], en: ['np', 'You’re welcome', 'anytime'] },
  oops: { ru: ['Бывает 🙂', 'Не страшно', 'Ничего, продолжаем', 'ха, бывает'], en: ['happens 🙂', 'no worries', 'all good', 'haha it happens'] },
  laugh: { ru: ['ахах', 'Хех 😄', 'Ха, точно', '😄'], en: ['haha', 'lol 😄', 'heh', '😄'] },
  question: { ru: ['Хм, сложно сказать', 'Не знаю, если честно', 'Думаю, да', 'Пожалуй, нет', 'Может быть 🙂'], en: ['hard to say', 'not sure tbh', 'I think so', 'probably not', 'maybe 🙂'] },
  other: { ru: ['Ок', 'Понял', '👍', 'Хм, интересно', 'Ну ладно 🙂', 'Ага', 'Угу'], en: ['ok', 'got it', '👍', 'hm, interesting', 'fair enough 🙂', 'yep', 'mhm'] },
};
const INTENT = [
  ['greet', /прив|здаров|здравств|хай|добр|салют|hello|\bhi\b|hey|\byo\b|sup\b/i],
  ['luck', /удач|\bgl\b|good luck|успех|\bhf\b/i],
  ['rematch', /реванш|ещё раз|еще раз|rematch|again|\brp\b/i],
  ['rush', /быстр|долго|спишь|ходи|торопись|hurry|slow|fast|wake|\?\?\?/i],
  ['thanks', /спасиб|благодар|thanks|thx|\bty\b/i],
  ['praise', /\bgg\b|\bwp\b|красав|молодец|хорош|отличн|класс|круто|nice|good move|well played/i],
  ['taunt', /лох|слаб|изи|\bez\b|noob|trash|\bbad\b|плох|выиграю|проиграешь|сдавайся/i],
  ['oops', /упс|ошиб|промах|sorry|извин|oops|мисклик/i],
  ['how', /как дела|как ты|как жизнь|how are you|что делаешь|hru/i],
  ['laugh', /ха-?ха|ахах|хах|\blol\b|\bkek\b|смешно|😂|🤣/i],
];
const FOLLOW = { ru: ['А ты давно в шашки играешь?', 'Какой у тебя рейтинг сейчас?', 'Давно в этом приложении?', 'Любишь такие партии?'], en: ['been playing long?', 'what’s your rating?', 'do you like this game?', 'how long have you been here?'] };
const style = (t, p) => { if (p.k === 'terse') { t = t.toLowerCase().replace(/[.!]+$/, ''); } else if (p.em && p.k !== 'rival' && !/[\p{Emoji_Presentation}]/u.test(t) && chance(.25)) t += ' ' + pick(['🙂', '👍', '😄']); return t; };
// Ответ бота: массив [{t, delay}] (пусто, если бот проигнорировал). hist: последние сообщения партии
export function botReply(text, p = { k: 'friendly', ru: true, em: true }, hist = []) {
  const L = lang(text, p); let intent = 'other';
  for (const [k, re] of INTENT) if (re.test(text)) { intent = k; break; }
  if (intent === 'other' && /\?\s*$/.test(text)) intent = 'question';
  let pr = BASE[p.k];
  if (intent === 'greet' || intent === 'luck') pr = p.k === 'silent' ? .25 : Math.min(.97, pr + .15);
  if (intent === 'taunt') pr = p.k === 'rival' ? .95 : p.k === 'silent' ? .03 : pr * .55;
  if (intent === 'praise' || intent === 'thanks') pr = p.k === 'rival' ? .3 : pr;
  if (intent === 'rush') pr = p.k === 'silent' ? .1 : Math.max(pr, .7);
  let streak = 0; for (let i = hist.length - 1; i >= 0 && hist[i].r === 'a'; i--) streak++;   // игрок пишет подряд без ответа
  if (streak >= 3) pr *= .3;
  if (!chance(pr)) return [];
  const used = new Set(hist.map(x => x.t)); let pool = V[intent][L].filter(x => !used.has(x)); if (!pool.length) pool = V[intent][L];
  let t = style(p.k === 'rival' && intent === 'other' ? pick(V.taunt[L]) : pick(pool), p);
  const quick = p.k === 'terse' ? 700 : p.k === 'chatty' ? 1500 : 1100;
  let delay = quick + R(1800) + Math.min(1800, text.length * 35);
  if (chance(p.k === 'chatty' ? .05 : .14)) delay += 6000 + R(14000);   // иногда отвечает не сразу
  const out = [{ t, delay }];
  if (p.k === 'chatty' && (intent === 'greet' || intent === 'how') && chance(.5)) out.push({ t: pick(FOLLOW[L]), delay: delay + 2500 + R(3000) });
  return out;
}
// Бот иногда здоровается сам в начале партии
export function botGreet(p = { k: 'friendly', ru: true }) {
  const pr = { silent: 0, terse: .15, friendly: .4, chatty: .65, rival: .2 }[p.k];
  return chance(pr) ? { t: style(pick(V.greet[p.ru ? 'ru' : 'en']), p), delay: 3500 + R(9000) } : null;
}
// Реплика после конца партии
export function botFinish(botWon, p = { k: 'friendly', ru: true }) {
  const pr = { silent: .05, terse: .3, friendly: .6, chatty: .8, rival: .7 }[p.k];
  if (!chance(pr)) return null;
  const L = p.ru ? 'ru' : 'en';
  const win = { ru: ['gg, хорошая партия', 'gg 🤝', 'Хорошо сыграли', 'Повезло сегодня', 'Было напряжённо'], en: ['gg wp', 'gg, good game', 'gg 🤝', 'close one', 'lucky this time'] };
  const lose = { ru: ['gg, красиво сыграл', 'Сильно, поздравляю 👏', 'gg, реванш?', 'Эх, ладно, gg', 'В следующий раз возьму своё'], en: ['gg, well played', 'gg, you got me', 'wp 👏', 'nice one, rematch?', 'ugh, gg'] };
  const rival = { ru: botWon ? ['Ну что, ещё партию?', 'Говорил же 😄'] : ['Реванш. Сразу.', 'Это случайность'], en: botWon ? ['one more?', 'told you 😄'] : ['rematch. now.', 'that was luck'] };
  return { t: style(pick(p.k === 'rival' && chance(.6) ? rival[L] : (botWon ? win : lose)[L]), p), delay: 900 + R(2200) };
}
