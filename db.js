import { randomUUID } from 'node:crypto';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function cmd(...a) {
  if (!URL_) throw new Error('База не подключена (Upstash Redis)');
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN }, body: JSON.stringify(a) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const parse = v => (v ? JSON.parse(v) : null);
export const get = async k => parse(await cmd('GET', k));
export const getWithRaw = async k => {
  const raw = await cmd('GET', k);
  return { value: parse(raw), raw };
};
export const set = (k, v) => cmd('SET', k, JSON.stringify(v));
export const setMany = entries => entries.length
  ? cmd('MSET', ...entries.flatMap(([k, v]) => [k, JSON.stringify(v)]))
  : Promise.resolve('OK');
const CAS_MSET = "if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end; local a = {}; for i = 2, #ARGV do a[#a + 1] = ARGV[i] end; return redis.call('MSET', unpack(a))";
export const setManyIf = (key, expected, entries) => cmd('EVAL', CAS_MSET, 1, key, expected, ...entries.flatMap(([k, v]) => [k, JSON.stringify(v)]));
export const sadd = (k, m) => cmd('SADD', k, m);
export const smembers = k => cmd('SMEMBERS', k);
export const incr = (k, n) => cmd('INCRBY', k, Math.round(n));
export const num = async k => Number(await cmd('GET', k)) || 0;
export const mget = async keys => (keys.length ? (await cmd('MGET', ...keys)).map(parse) : []);
export const del = k => cmd('DEL', k);
export const srem = (k, m) => cmd('SREM', k, m);

export const lock = async (k, sec) => (await cmd('SET', k, '1', 'NX', 'EX', sec)) === 'OK';
export const acquireLock = async (k, sec) => {
  const token = randomUUID();
  return (await cmd('SET', k, token, 'NX', 'EX', sec)) === 'OK' ? token : null;
};
export const releaseLock = (k, token) => cmd('EVAL', "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end", 1, k, token);
export const once = async (k, sec) => (await cmd('SET', k, '1', 'NX', ...(sec ? ['EX', sec] : []))) === 'OK';
