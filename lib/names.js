// Ники и аватарки соперников-ботов: каждый раз новые, по-русски и по-английски
import crypto from 'crypto';
const R = n => crypto.randomInt(n), pick = a => a[R(a.length)];
const RU_N = ['Саша', 'Дима', 'Макс', 'Лёха', 'Ваня', 'Серёга', 'Антон', 'Кирилл', 'Тёма', 'Рома', 'Паша', 'Женя', 'Никита', 'Артём', 'Егор', 'Миша', 'Олег', 'Влад', 'Данил', 'Стас', 'Гоша', 'Костя', 'Игорь', 'Катя', 'Оля', 'Аня', 'Лена', 'Маша', 'Даша', 'Настя', 'Юля', 'Ира', 'Соня', 'Вика', 'Полина', 'Алёна', 'Ксюша', 'Лиза', 'Дана', 'Рита'];
const RU_W = ['Тигр', 'Волк', 'Лис', 'Медведь', 'Ворон', 'Дракон', 'Ниндзя', 'Шаман', 'Барон', 'Граф', 'Король', 'Ас', 'Босс', 'Снайпер', 'Лунатик', 'Кот', 'Сокол', 'Пират', 'Гном', 'Тролль', 'Профи', 'Везунчик', 'Азарт', 'Жокер', 'Банкир', 'Мастер', 'Пончик', 'Пельмень', 'Хомяк', 'Енот', 'Бобёр', 'Шторм', 'Рыцарь', 'Шустрик', 'Тузик', 'Бродяга'];
const RU_A = ['Тёмный', 'Быстрый', 'Хитрый', 'Ленивый', 'Смелый', 'Лютый', 'Весёлый', 'Грозный', 'Дерзкий', 'Счастливый', 'Ночной', 'Золотой', 'Серый', 'Рыжий', 'Тихий', 'Крутой', 'Шальной', 'Упрямый'];
const LAT_R = ['Dimon', 'Vanya', 'Sanya', 'Tema', 'Kolyan', 'Zhenya', 'Katyusha', 'Nastya', 'Olya', 'Vlad', 'Misha', 'Seryoga', 'Pasha', 'Lyosha', 'Dasha', 'Sonya'];
const EN_N = ['Alex', 'Max', 'Sam', 'Mike', 'Dan', 'Nick', 'Leo', 'Jack', 'Tom', 'Ben', 'Chris', 'Ryan', 'Kate', 'Anna', 'Emma', 'Lily', 'Mia', 'Zoe', 'Ivy', 'Sofia', 'Ethan', 'Noah', 'Luke', 'Adam', 'Eric', 'Ruby', 'Nina', 'Oscar', 'Mark', 'Josh'];
const EN_W = ['Wolf', 'Fox', 'Raven', 'Falcon', 'Tiger', 'Shadow', 'Ghost', 'Ninja', 'Viking', 'Ace', 'Joker', 'King', 'Queen', 'Rider', 'Hunter', 'Sniper', 'Storm', 'Blaze', 'Frost', 'Nova', 'Pixel', 'Turbo', 'Rogue', 'Phoenix', 'Dragon', 'Bandit', 'Shark', 'Cobra', 'Panda', 'Pilot', 'Comet', 'Titan', 'Wizard', 'Gambler'];
const EN_A = ['Dark', 'Swift', 'Lucky', 'Silent', 'Crazy', 'Wild', 'Cool', 'Happy', 'Sneaky', 'Golden', 'Night', 'Royal', 'Iron', 'Neon', 'Lazy', 'Mad', 'Mighty', 'Sly'];
const num = () => (R(3) ? String(R(98) + 2).padStart(2, '0') : String(1980 + R(30)));
const STYLES = [
  () => pick(RU_N), () => pick(RU_N) + '_' + num(), () => pick(RU_A) + ' ' + pick(RU_W), () => pick(RU_W) + num(), () => pick(RU_N) + '_' + pick(RU_W),
  () => pick(LAT_R) + '_' + num(), () => pick(LAT_R),
  () => pick(EN_N) + num(), () => pick(EN_N) + '_' + pick(EN_W), () => pick(EN_A) + pick(EN_W), () => pick(EN_W) + '_' + num(), () => pick(EN_A) + pick(EN_W) + num(), () => pick(EN_N).toLowerCase() + '.' + pick(EN_W).toLowerCase(),
];
export function botNick(avoid = '') {
  for (let i = 0; i < 12; i++) { const n = pick(STYLES)(); if (n.length <= 20 && n.toLowerCase() !== String(avoid).toLowerCase()) return n; }
  return 'Игрок' + num();
}
export const botIdentity = (avoid, avatars) => ({ nick: botNick(avoid), avatar: pick(avatars && avatars.length ? avatars : ['😎']) });
