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
/* ---- характеры (как часто отвечает) и стили (как пишет) ----
   k: silent молчит, terse коротко и редко, friendly дружелюбный, chatty разговорчивый, rival азартный
   s: zoom молодёжный, polite вежливый, joker шутник, vet суровый ветеран, hype эмоциональный, chill спокойный */
const KINDS = [['silent', 14], ['terse', 22], ['friendly', 32], ['chatty', 18], ['rival', 14]];
const STYLES = [['zoom', 24], ['polite', 18], ['joker', 16], ['vet', 12], ['hype', 14], ['chill', 16]];
const BASE = { silent: .05, terse: .45, friendly: .88, chatty: .96, rival: .65 };
const DEF_S = { silent: 'chill', terse: 'vet', friendly: 'polite', chatty: 'joker', rival: 'hype' };
const wpick = t => { let r = R(t.reduce((a, x) => a + x[1], 0)); for (const [k, w] of t) { if (r < w) return k; r -= w; } return t[0][0]; };
export function botPersona(nick = '') {
  let k = wpick(KINDS), s = wpick(STYLES);
  if (s === 'vet' && (k === 'chatty' || k === 'friendly') && chance(.7)) k = 'terse';
  if (s === 'hype' && k === 'silent') k = 'rival';
  if (s === 'joker' && k === 'terse') k = 'friendly';
  const ru = /[а-яё]/i.test(nick) ? chance(.92) : chance(.3);
  return { k, s, ru, em: chance(.45) };
}
const lang = (t, p) => (/[a-z]/i.test(t) && !/[а-яё]/i.test(t) ? 'en' : /[а-яё]/i.test(t) ? 'ru' : p && p.ru ? 'ru' : 'en');
const sty = p => (p && (p.s || DEF_S[p.k])) || 'polite';

/* нейтральные фразы: работают для любого стиля, потом стиль их «переодевает» */
const V = {
  greet: { ru: ['Привет!', 'Привет, погнали', 'Здарова 👋', 'Хай, удачи!', 'о, привет', 'Приветствую', 'Салют', 'Привет, давай сыграем красиво', 'Здравствуй!'], en: ['Hi!', 'Hey, good luck', 'Yo 👋', 'Hello, have fun', 'sup', 'hey hey', 'Hi, gl', 'Hello there!'] },
  luck: { ru: ['И тебе удачи!', 'Взаимно 🤝', 'Спасибо, и тебе', 'ага, и тебе', 'Давай, удачи', 'Пусть победит сильнейший', 'Взаимно, играем честно'], en: ['You too!', 'gl hf', 'Thanks, same to you', 'ty, you too', 'hf!', 'May the best one win'] },
  rematch: { ru: ['Давай, я не против', 'Можно, ставь снова', 'Го ещё партию', 'Хм, давай', 'Только если ставка та же', 'Реванш так реванш'], en: ['Sure, why not', 'Let’s go again', 'Bring it on', 'ok, one more', 'maybe later', 'Rematch accepted'] },
  rush: { ru: ['Думаю, думаю…', 'Секунду 🙂', 'Не торопи, тут сложно', 'Сейчас', 'Погоди, ход непростой', 'Ща', 'Подожди, я считаю'], en: ['Thinking…', 'One sec 🙂', 'Hold on, this is tricky', 'wait a sec', 'give me a moment', 'calculating…'] },
  praise: { ru: ['Спасибо 🙂', 'Ты тоже хорошо играешь', 'Приятно играть', 'Стараюсь', 'Благодарю', 'Да ладно, повезло', 'О, приятно слышать'], en: ['Thanks 🙂', 'You play well too', 'Nice game', 'trying my best', 'ty ty', 'just lucky', 'appreciate it'] },
  taunt: { ru: ['Ещё посмотрим 😄', 'Не спеши радоваться', 'Партия не закончена', 'Посмотрим, что скажешь в конце', 'Смелый, да?', 'Слова — это слова, а ходы — это ходы'], en: ['We’ll see 😄', 'Not over yet', 'Don’t celebrate yet', 'big words', 'lets see about that', 'talk is cheap'] },
  how: { ru: ['Норм, играю 🙂 ты как?', 'Всё хорошо, а у тебя?', 'Нормально, думаю над ходом', 'отлично, ты как?', 'Бодро! А у тебя как?'], en: ['Good, playing 🙂 you?', 'All good, you?', 'fine, thinking about my move', 'not bad, u?', 'doing great, you?'] },
  thanks: { ru: ['Не за что', 'Обращайся 🙂', 'Пожалуйста', 'Рад помочь'], en: ['np', 'You’re welcome', 'anytime', 'glad to help'] },
  oops: { ru: ['Бывает 🙂', 'Не страшно', 'Ничего, продолжаем', 'ха, бывает', 'Со всеми случается'], en: ['happens 🙂', 'no worries', 'all good', 'haha it happens', 'it happens to everyone'] },
  laugh: { ru: ['ахах', 'Хех 😄', 'Ха, точно', '😄', 'Ахаха, да'], en: ['haha', 'lol 😄', 'heh', '😄', 'haha true'] },
  question: { ru: ['Хм, сложно сказать', 'Не знаю, если честно', 'Думаю, да', 'Пожалуй, нет', 'Может быть 🙂', 'Хороший вопрос, подумаю'], en: ['hard to say', 'not sure tbh', 'I think so', 'probably not', 'maybe 🙂', 'good question'] },
  other: { ru: ['Ок', 'Понял', '👍', 'Хм, интересно', 'Ну ладно 🙂', 'Ага', 'Угу', 'Понятно'], en: ['ok', 'got it', '👍', 'hm, interesting', 'fair enough 🙂', 'yep', 'mhm', 'I see'] },
  isbot: { ru: ['Да, я бот 🙂 Это написано в карточке соперника. Играю по тем же правилам', 'Бот, да. Ставки честные, правила те же', 'Ага, я бот. Надеюсь, не обидел 🙂', 'Да, бот. Но ходы делаю всерьёз'], en: ['Yep, I’m a bot 🙂 it says so on my card. Same rules for everyone', 'Bot, yes. Fair rules, serious moves', 'Yeah, I’m a bot. Hope that’s ok 🙂', 'I am a bot, yes. Still playing to win'] },
  name: { ru: ['Я {bot}', 'Меня зовут {bot}', '{bot}, как в профиле 🙂'], en: ['I’m {bot}', 'It’s {bot}, like on my profile 🙂', 'call me {bot}'] },
  where: { ru: ['Я бот, живу на сервере ☁️', 'С сервера, я же бот 🙂', 'Из облака, прописка там'], en: ['I live on a server ☁️', 'From the cloud, I’m a bot 🙂', 'the server is my home'] },
  bye: { ru: ['Пока!', 'Давай, удачи', 'Бывай', 'До встречи 🙂', 'Увидимся'], en: ['Bye!', 'See you', 'take care', 'cya 🙂', 'Later!'] },
  money: { ru: ['Ставка есть ставка, играем 🙂', 'Фишки любят счёт', 'Главное — не ставить последнее', 'Ставка делает партию интереснее'], en: ['A bet is a bet 🙂', 'chips love to be counted', 'just don’t bet your last ones', 'stakes make it fun'] },
  draw: { ru: ['Ничья не предусмотрена, давай доиграем', 'Не, давай до конца', 'Посмотрим по ходу партии'], en: ['Let’s play it out', 'nah, to the end', 'we’ll see how it goes'] },
  rude: { ru: ['Давай без этого 🙂', 'Не надо так, мы же играем', 'Спокойно, это просто игра', 'Эмоции в сторону, ходи'], en: ['Let’s keep it friendly 🙂', 'no need for that, it’s a game', 'easy, it’s just a game', 'keep calm and move'] },
  answer: { ru: ['Понятно 🙂', 'Ясно, круто', 'О, здорово', 'Хм, интересно', 'Понял, спасибо, что рассказал'], en: ['I see 🙂', 'cool', 'oh nice', 'hm, interesting', 'got it, thanks for sharing'] },
  game: {
    checkers: { ru: ['В шашках главное — держать центр', 'Береги заднюю линию, не спеши в дамки', 'Шашки любят терпение', 'Иногда лучше отдать одну, чтобы забрать две'], en: ['In checkers the centre matters most', 'guard your back row', 'checkers love patience', 'sometimes you give one to take two'] },
    connect4: { ru: ['В «Четыре в ряд» центральная колонка решает', 'Следи за диагоналями, они коварные', 'Тут надо думать на два хода вперёд'], en: ['The centre column decides a lot', 'watch the diagonals, they’re sneaky', 'think two moves ahead here'] },
    coblast: { ru: ['Тут главное не забить поле', 'Большие фигуры оставляй на потом', 'Вместе у нас получится больше'], en: ['don’t clog the board', 'save the big pieces for later', 'together we can score more'] },
    comines: { ru: ['Тут важно не торопиться', 'Каждая открытая клетка — риск', 'Вместе безопаснее 🙂'], en: ['no need to rush here', 'every opened cell is a risk', 'safer together 🙂'] },
    any: { ru: ['Ход обдумываю', 'Партия интересная', 'Тут надо думать'], en: ['thinking about my move', 'this is a good one', 'this needs some thought'] },
  },
};
/* свои фразы стилей: подмешиваются к нейтральным и дают разный «голос» */
const S = {
  zoom: { ru: { greet: ['прив', 'ку', 'здарова, го катку', 'хай, погнали'], luck: ['го, удачи', 'взаимно)', 'и те не хворать'], praise: ['спс)', 'ну норм вышло', 'ты тоже огонь'], taunt: ['ну ну, посмотрим', 'не кринжуй)', 'изи не будет'], how: ['норм, ты как?', 'жив, играю)', 'кайфую, ты как?'], other: ['ну ок', 'ясн', 'ага)', 'чётко'], laugh: ['хах', 'ору', 'ахах))'], oops: ['да норм, бывает', 'не парься)'], rematch: ['го ещё', 'давай, не вопрос'], thanks: ['обращайся)', 'не за что'] },
    en: { greet: ['yo', 'sup', 'hey, lets go'], luck: ['gl hf', 'u too'], praise: ['thx', 'ty fam'], taunt: ['we’ll see lol', 'big talk'], other: ['k', 'ye', 'fair'], laugh: ['lmao', 'lol'], oops: ['np', 'all good'] } },
  polite: { ru: { greet: ['Добрый день! Приятной игры', 'Здравствуйте! Желаю хорошей партии', 'Привет! Рад играть с тобой'], luck: ['Благодарю, и тебе удачи', 'Взаимно, желаю приятной игры'], praise: ['Благодарю, очень приятно', 'Спасибо, ты тоже играешь достойно'], how: ['Спасибо, всё хорошо. А как твои дела?', 'Хорошо, благодарю. А у тебя?'], other: ['Понятно, спасибо', 'Хорошо, принято', 'Интересная мысль'], thanks: ['Пожалуйста, обращайся', 'Всегда рад'], oops: ['Ничего страшного', 'Не переживай, бывает'], rematch: ['С удовольствием сыграю ещё раз', 'Конечно, давай реванш'], taunt: ['Давай просто сыграем достойно', 'Посмотрим, как сложится партия'] },
    en: { greet: ['Hello! Wishing you a good game', 'Good day! Pleased to play with you'], luck: ['Thank you, best of luck to you too'], praise: ['Thank you, that’s kind of you'], how: ['I’m well, thank you. And you?'], other: ['I see, thank you', 'Understood'], thanks: ['You’re most welcome'], oops: ['No harm done', 'Please don’t worry'] } },
  joker: { ru: { greet: ['Привет! Я пришёл, увидел, и сейчас всё сломаю 😄', 'О, свежая жертва… то есть соперник 😜', 'Привет! Только не бей сильно 🤪'], luck: ['Удача любит смелых, а я люблю печенье 🍪', 'И тебе! Но фишки всё равно мои 😎'], praise: ['Я знаю, я великолепен 😎', 'Спасибо! Скину тебе скромность за полцены'], how: ['Как сыр в масле, но без масла 😄 ты как?', 'Отлично! Правда, фишки пока думают, а я нет 😜'], other: ['Ну это сильно 😄', 'Записал в мемуары', 'Принято, шеф 🫡'], taunt: ['О, пошли страшные слова 😱', 'Дрожу как желе 😄'], laugh: ['Ахах, я сам себя иногда боюсь', '😂😂'], oops: ['Бывает, я вчера вообще в стену зашёл 😄'], rematch: ['Реванш? Я как раз разогрелся 😎'], rush: ['Тсс, гений работает 🧠', 'Мой процессор дымится, секунду 😄'], question: ['Спроси чего попроще, а то я перегреюсь 😄'] },
    en: { greet: ['Hey! I came, I saw, I’m about to blunder 😄', 'Oh, fresh opponent 😜'], luck: ['Luck loves the brave, I love cookies 🍪'], praise: ['I know, I’m magnificent 😎'], how: ['Living the dream, mostly 😄 you?'], other: ['Bold move 😄', 'Noted, chief 🫡'], taunt: ['Oh no, scary words 😱'], laugh: ['haha I scare myself sometimes', '😂😂'], rush: ['Shh, genius at work 🧠'] } },
  vet: { ru: { greet: ['Привет. Играем.', 'Здорово. Ходи.', 'Привет.'], luck: ['И тебе.', 'Взаимно.'], praise: ['Ладно.', 'Принято.'], how: ['Нормально. Ходи.', 'Работаю. А ты?'], other: ['Ясно.', 'Ну.', 'Угу.', 'Ходи.'], taunt: ['Покажи на доске.', 'Разговоры — потом.', 'Ходи давай.'], oops: ['Бывает.', 'Дальше.'], rematch: ['Можно.', 'Ставь.'], thanks: ['Ага.'], laugh: ['Хм.'], rush: ['Думаю.', 'Не мешай.'], question: ['Не знаю.', 'Вряд ли.', 'Возможно.'] },
    en: { greet: ['Hi. Play.', 'Hey.'], luck: ['You too.'], praise: ['Fine.', 'Noted.'], other: ['Right.', 'Hm.', 'Your move.'], taunt: ['Show me on the board.', 'Talk later.'], oops: ['Happens.', 'Move on.'], rematch: ['Fine.', 'Place your bet.'], rush: ['Thinking.', 'Quiet.'] } },
  hype: { ru: { greet: ['ПРИВЕТ!!! Погнали!', 'Хай-хай! Сейчас будет жарко 🔥', 'ЗДАРОВА! Готов к битве?!'], luck: ['И ТЕБЕ УДАЧИ! Она пригодится 🔥', 'Взаимно!! Играем на максимум!'], praise: ['СПАСИБО!!! Ты тоже огонь 🔥', 'Вот это да! Приятно!'], how: ['ОТЛИЧНО! Адреналин зашкаливает! Ты как?', 'Огонь! Партия классная! А ты?'], other: ['Ого!', 'Жёстко!', 'Вот это поворот!', 'Ну давай давай!'], taunt: ['ПОСМОТРИМ!!! Я только разогрелся!', 'Ха! Это мы ещё проверим 🔥', 'Громкие слова! Докажи!'], laugh: ['АХАХАХ 😂', 'Ржу!!!'], oops: ['Да ладно, бывает!!', 'Не вешай нос! Дальше!'], rematch: ['ДА! РЕВАНШ! Ставь!', 'Давай-давай, ещё одну! 🔥'], rush: ['Сейчас-сейчас!!', 'Ща всё будет!'] },
    en: { greet: ['HEY!!! Let’s go!', 'Yo yo! Things are about to heat up 🔥'], luck: ['GOOD LUCK!! You’ll need it 🔥'], praise: ['THANKS!!! You’re on fire too 🔥'], other: ['Whoa!', 'Intense!', 'Bring it!'], taunt: ['WE’LL SEE!!! I’m just warming up!', 'Big words! Prove it!'], laugh: ['HAHAHA 😂'], rematch: ['YES! REMATCH!', 'Again! Again! 🔥'] } },
  chill: { ru: { greet: ['привет, не спеша сыграем', 'о, привет. без суеты', 'привет) красивая будет партия'], luck: ['спасибо, и тебе, без нервов', 'взаимно, главное — удовольствие'], praise: ['спасибо, приятно', 'да так, само получилось'], how: ['спокойно, играю. ты как?', 'ровно, не тороплюсь. у тебя как?'], other: ['мм, ясно', 'ну да', 'понимаю', 'ладно, без спешки'], taunt: ['ну, партия длинная', 'не надо нервничать', 'посмотрим не спеша'], oops: ['да ничего, бывает', 'спокойно, дальше'], rematch: ['можно, без спешки', 'давай, почему нет'], rush: ['не торопимся, думаю', 'сейчас, тут надо спокойно'], laugh: ['хех, да', 'ха, точно'] },
    en: { greet: ['hey, no rush, let’s play', 'hi. easy game ahead'], luck: ['thanks, and no stress'], praise: ['thanks, appreciate it'], other: ['mm, I see', 'yeah', 'fair enough'], taunt: ['long game still', 'no need to stress'], oops: ['it’s fine, happens'], rush: ['no rush, thinking'] } },
};
const INTENT = [
  ['isbot', /ты бот|ты робот|ты человек|ты живой|ты настоящий|бот\?|ты реальный|are you (a )?(bot|human|real|robot)|you a bot|is this a bot|human\?/i],
  ['name', /как (тебя )?зовут|твоё имя|твое имя|your name|who are you|ты кто/i],
  ['where', /откуда ты|ты откуда|где живёшь|где живешь|where are you from|where do you live|ты из/i],
  ['bye', /пока\b|до свидан|я пошёл|я пошел|мне пора|бывай|\bbye\b|see you|cya|gtg|я ушёл|я ушел/i],
  ['greet', /прив|здаров|здравств|хай|добр(ый|ое|ого)|салют|hello|\bhi\b|hey|\byo\b|sup\b|ку-?ку|\bку\b/i],
  ['luck', /удач|\bgl\b|good luck|успех|\bhf\b/i],
  ['rematch', /реванш|ещё раз|еще раз|ещё партию|еще партию|rematch|again|\brp\b/i],
  ['draw', /ничья|ничью|draw|давай мир/i],
  ['rush', /быстр|долго|спишь|ходи|торопись|hurry|slow|fast|wake|\?\?\?|тормоз/i],
  ['thanks', /спасиб|благодар|thanks|thx|\bty\b|сенкс/i],
  ['praise', /\bgg\b|\bwp\b|красав|молодец|хорош|отличн|класс|круто|умн|сильн|nice|good move|well played|clever/i],
  ['taunt', /лох|слаб|изи|\bez\b|noob|trash|\bbad\b|плох|выиграю|проиграешь|сдавайся|разгромлю|ты проиграл|you lose/i],
  ['rude', /\*\*\*|дурак|идиот|тупой|тупая|придурок|stupid|idiot|dumb|shut up|заткнись/i],
  ['oops', /упс|ошиб|промах|sorry|извин|oops|мисклик|не туда/i],
  ['how', /как дела|как ты|как жизнь|как настроение|how are you|что делаешь|hru|как сам/i],
  ['money', /ставк|фишк|деньг|выигрыш|банк|chips|bet\b|money|stake/i],
  ['game', /шашк|дамк|рубить|рубит|четыре в ряд|4 в ряд|колонк|ход\b|ходом|ходу|диагонал|центр|фигур|мин[аы]|поле|checkers|connect|\bmove\b|board/i],
  ['laugh', /ха-?ха|ахах|хах|\blol\b|\bkek\b|смешно|😂|🤣|ору\b/i],
];
const FOLLOW = { ru: ['А ты давно в эту игру играешь?', 'Какой у тебя рейтинг сейчас?', 'Давно в этом приложении?', 'Любишь такие партии?', 'А какая твоя любимая игра тут?', 'Ты чаще выигрываешь или проигрываешь?'], en: ['been playing long?', 'what’s your rating?', 'do you like this game?', 'how long have you been here?', 'what’s your favourite game here?', 'do you win more than you lose?'] };
const EMO = { joker: ['😄', '😜', '🤪', '😎'], zoom: [')', '))', ' 😅'], polite: ['🙂'], chill: ['🙂', '🙃'], hype: ['🔥', '💪'], vet: [] };
const HAS_EMOJI = /\p{Extended_Pictographic}/u;
const first = n => { const w = String(n || '').split(/[_\s.\d]+/)[0] || ''; return w.length >= 2 && w.length <= 14 ? w : ''; };
// «Переодевание» фразы в голос стиля
function dress(t, p, L) {
  const s = sty(p);
  if (s === 'zoom') { t = t.replace(/[.!]+$/, ''); if (!/^[A-ZА-ЯЁ]{2,}/.test(t)) t = t.charAt(0).toLowerCase() + t.slice(1); if (p.em && !HAS_EMOJI.test(t) && !/\)$/.test(t) && chance(.3)) t += pick(EMO.zoom); }
  else if (s === 'polite') { if (!/[.!?…🙂👍👏🤝]$/u.test(t)) t += chance(.6) ? '.' : '!'; if (p.em && !HAS_EMOJI.test(t) && chance(.2)) t += ' 🙂'; }
  else if (s === 'joker') { if (!HAS_EMOJI.test(t) && chance(.5)) t += ' ' + pick(EMO.joker); }
  else if (s === 'vet') { t = t.replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').trim().replace(/\s+/g, ' '); if (t && !/[.!?…]$/.test(t)) t += '.'; }
  else if (s === 'hype') { if (t.length <= 16 && chance(.4)) t = t.toUpperCase(); if (!/[!?]$|\p{Extended_Pictographic}\uFE0F?$/u.test(t)) t = t.replace(/[.]+$/, '') + '!'; if (!HAS_EMOJI.test(t) && chance(.25)) t += ' ' + pick(EMO.hype); }
  else if (s === 'chill') { t = t.replace(/[.!]+$/, ''); t = t.charAt(0).toLowerCase() + t.slice(1); if (chance(.18)) t = (L === 'ru' ? pick(['мм, ', 'ну, ', 'эм, ']) : pick(['hmm, ', 'well, '])) + t; }
  return t;
}
const fill = (t, ctx) => t.replace(/\{bot\}/g, (ctx && ctx.bot) || 'бот');
function phrase(intent, p, L, ctx, used) {
  const s = sty(p);
  let neutral = intent === 'game' ? (V.game[ctx && V.game[ctx.game] ? ctx.game : 'any'] || V.game.any)[L].concat(chance(.35) ? V.game.any[L] : []) : (V[intent] || V.other)[L];
  const own = (S[s] && S[s][L] && S[s][L][intent]) || [];
  let pool = (own.length && chance(.65) ? own : neutral).filter(x => !used.has(x));
  if (!pool.length) pool = (own.length ? own.concat(neutral) : neutral).filter(x => !used.has(x));
  if (!pool.length) pool = neutral;
  return dress(fill(pick(pool), ctx), p, L);
}
// Ответ бота: массив [{t, delay}] (пусто, если бот проигнорировал). hist: последние сообщения партии; ctx: { game, bot, nick }
export function botReply(text, p = { k: 'friendly', ru: true, em: true }, hist = [], ctx = {}) {
  const L = lang(text, p), s = sty(p); let intent = 'other';
  for (const [k, re] of INTENT) if (re.test(text)) { intent = k; break; }
  if (intent === 'other') {
    const lastBot = [...hist].reverse().find(x => x.r !== 'a' && x.at <= Date.now() + 60000);
    if (lastBot && /\?\s*$/.test(lastBot.t) && Date.now() - lastBot.at < 120000 && text.length > 1) intent = 'answer';
    else if (/\?\s*$/.test(text)) intent = 'question';
  }
  let pr = BASE[p.k];
  if (intent === 'isbot' || intent === 'name') pr = p.k === 'silent' ? .6 : .97;        // на прямой вопрос «ты бот?» почти всегда отвечаем честно
  else if (intent === 'greet' || intent === 'luck' || intent === 'bye') pr = p.k === 'silent' ? .25 : Math.min(.97, pr + .15);
  else if (intent === 'taunt') pr = p.k === 'rival' || s === 'hype' ? .95 : p.k === 'silent' ? .03 : pr * .6;
  else if (intent === 'rude') pr = s === 'vet' ? .25 : p.k === 'silent' ? .05 : .55;
  else if (intent === 'praise' || intent === 'thanks') pr = p.k === 'rival' ? .35 : pr;
  else if (intent === 'rush') pr = p.k === 'silent' ? .1 : Math.max(pr, .7);
  else if (intent === 'answer') pr = p.k === 'silent' ? .15 : Math.min(.95, pr + .05);
  let streak = 0; for (let i = hist.length - 1; i >= 0 && hist[i].r === 'a'; i--) streak++;   // игрок пишет подряд без ответа
  if (streak >= 3) pr *= .3;
  if (!chance(pr)) return [];
  const used = new Set(hist.map(x => x.t));
  let t = phrase(p.k === 'rival' && intent === 'other' ? 'taunt' : intent, p, L, ctx, used);
  const nm = first(ctx.nick); if (nm && intent === 'greet' && ['polite', 'joker', 'chill'].includes(s) && p.k !== 'terse' && chance(.35)) t = t.replace(/[.!)]*$/, '') + ', ' + nm + (s === 'polite' ? '!' : '');
  const quick = { vet: 1300, hype: 600, zoom: 800, joker: 1100, polite: 1300, chill: 1700 }[s] || 1000;
  let delay = quick + R(1800) + Math.min(2200, text.length * 40) + Math.min(1600, t.length * 28);
  if (chance(p.k === 'chatty' ? .05 : .14)) delay += 6000 + R(14000);   // иногда отвечает не сразу
  const out = [{ t, delay }];
  if (p.k === 'chatty' && (intent === 'greet' || intent === 'how') && chance(.5)) out.push({ t: dress(pick(FOLLOW[L]), p, L), delay: delay + 2500 + R(3000) });
  else if (s === 'hype' && intent !== 'rude' && chance(.2)) out.push({ t: dress(pick(V.other[L]), p, L), delay: delay + 1200 + R(1500) });   // эмоциональный дописывает вторым сообщением
  return out;
}
// Бот иногда здоровается сам в начале партии
export function botGreet(p = { k: 'friendly', ru: true }) {
  const pr = { silent: 0, terse: .15, friendly: .4, chatty: .65, rival: .2 }[p.k];
  return chance(pr) ? { t: phrase('greet', p, p.ru ? 'ru' : 'en', {}, new Set()), delay: 3500 + R(9000) } : null;
}
// Реплика после конца партии
const FIN = {
  win: { ru: ['gg, хорошая партия', 'gg 🤝', 'Хорошо сыграли', 'Повезло сегодня', 'Было напряжённо', 'Спасибо за партию'], en: ['gg wp', 'gg, good game', 'gg 🤝', 'close one', 'lucky this time', 'thanks for the game'] },
  lose: { ru: ['gg, красиво сыграл', 'Сильно, поздравляю 👏', 'gg, реванш?', 'Эх, ладно, gg', 'В следующий раз возьму своё', 'Ты был сильнее'], en: ['gg, well played', 'gg, you got me', 'wp 👏', 'nice one, rematch?', 'ugh, gg', 'you were better'] },
  rival: { ru: ['Ну что, ещё партию?', 'Говорил же 😄'], rl: ['Реванш. Сразу.', 'Это случайность'], en: ['one more?', 'told you 😄'], enl: ['rematch. now.', 'that was luck'] },
  own: {
    zoom: { win: ['изи катка)', 'гг, повезло малость', 'ну норм поиграли'], lose: ['гг, красавчик', 'ой всё, реванш?', 'ну ты дал)'] },
    polite: { win: ['Благодарю за партию, было приятно', 'Хорошая игра, спасибо'], lose: ['Поздравляю с победой, вы сыграли отлично', 'Прекрасная партия, спасибо'] },
    joker: { win: ['Я победил, но скромно, почти не хвастаюсь 😎', 'Записываю в личные подвиги 😄'], lose: ['Это я тебе поддался. Нет, правда. Ладно, нет 😄', 'Ну всё, иду плакать в углу 😭😄'] },
    vet: { win: ['Партия окончена.', 'Неплохо.'], lose: ['Сильно сыграл.', 'Признаю.'] },
    hype: { win: ['ДААА! Вот это партия! 🔥', 'ЕСТЬ! Спасибо за бой!'], lose: ['ВАУ!!! Красиво! Реванш, реванш! 🔥', 'Ну ты даёшь!!! Поздравляю!'] },
    chill: { win: ['спасибо за партию, приятно поиграли', 'хорошо посидели'], lose: ['красиво, поздравляю', 'спокойно, ты молодец'] },
  },
};
export function botFinish(botWon, p = { k: 'friendly', ru: true }) {
  const pr = { silent: .05, terse: .3, friendly: .6, chatty: .8, rival: .7 }[p.k];
  if (!chance(pr)) return null;
  const L = p.ru ? 'ru' : 'en', s = sty(p);
  let t;
  if (p.ru && FIN.own[s] && chance(.5)) t = pick(FIN.own[s][botWon ? 'win' : 'lose']);
  else if (p.k === 'rival' && chance(.6)) t = pick(botWon ? FIN.rival[L] : FIN.rival[p.ru ? 'rl' : 'enl']);
  else t = pick((botWon ? FIN.win : FIN.lose)[L]);
  return { t: FIN.own[s] && FIN.own[s][botWon ? 'win' : 'lose'].includes(t) ? t : dress(t, p, L), delay: 900 + R(2200) };
}
