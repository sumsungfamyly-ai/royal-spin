// Проверка, что всё загружено и настроено: открой https://ТВОЙ-САЙТ/api/health
import { get } from '../lib/db.js';
import { BUILD } from '../lib/version.js';
export default async function handler(req, res) {
  let db = false; try { await get('health:ping'); db = true; } catch {}
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ok: db, build: BUILD, time: new Date().toISOString(),
    env: {
      BOT_TOKEN: !!process.env.BOT_TOKEN, WEBHOOK_SECRET: !!process.env.WEBHOOK_SECRET,
      REDIS: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL), ADMIN: !!(process.env.ADMIN_IDS || process.env.ADMIN_CHAT_ID), ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD, CRON_SECRET: !!process.env.CRON_SECRET,
    },
  });
}
