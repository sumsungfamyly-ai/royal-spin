// Каталог магазина: cat = frame | chip | theme | fx. Стиль в клиенте берётся из id (после префикса).
export const SHOP = [
  { id: 'f_gold', cat: 'frame', name: 'Золотая рамка', price: 500, icon: '🥇' },
  { id: 'f_neon', cat: 'frame', name: 'Неон', price: 1200, icon: '💚' },
  { id: 'f_flame', cat: 'frame', name: 'Пламя', price: 2500, icon: '🔥' },
  { id: 'f_rainbow', cat: 'frame', name: 'Радуга', price: 5000, icon: '🌈' },
  { id: 'f_royal', cat: 'frame', name: 'Королевская', price: 12000, icon: '👑' },
  { id: 'c_emerald', cat: 'chip', name: 'Изумрудные фишки', price: 600, icon: '💚' },
  { id: 'c_ruby', cat: 'chip', name: 'Рубиновые фишки', price: 600, icon: '❤️' },
  { id: 'c_sapphire', cat: 'chip', name: 'Сапфировые фишки', price: 600, icon: '💙' },
  { id: 'c_holo', cat: 'chip', name: 'Голографические', price: 3500, icon: '🪩' },
  { id: 't_sunset', cat: 'theme', name: 'Закат', price: 1500, icon: '🌇' },
  { id: 't_neon', cat: 'theme', name: 'Неон-сити', price: 2500, icon: '🌃' },
  { id: 't_emerald', cat: 'theme', name: 'Изумруд', price: 2500, icon: '🌿' },
  { id: 't_midnight', cat: 'theme', name: 'Полночь', price: 4000, icon: '🌌' },
  { id: 'x_coins', cat: 'fx', name: 'Дождь монет', price: 800, icon: '🪙' },
  { id: 'x_stars', cat: 'fx', name: 'Звездопад', price: 1500, icon: '⭐' },
  { id: 'x_hearts', cat: 'fx', name: 'Драгоценности', price: 2000, icon: '💎' },
  { id: 'x_fireworks', cat: 'fx', name: 'Фейерверк', price: 4000, icon: '🎆' },
];
export const SHOP_CATS = ['frame', 'chip', 'theme', 'fx'];
