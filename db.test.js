import test from 'node:test';
import assert from 'node:assert/strict';

const originalUrl = process.env.KV_REST_API_URL;
const originalFetch = globalThis.fetch;
process.env.KV_REST_API_URL = 'https://redis.test';
const requests = [];
globalThis.fetch = async (url, options) => {
  requests.push({ url, body: JSON.parse(options.body) });
  return { json: async () => ({ result: 'OK' }) };
};
const { acquireLock, releaseLock, setManyIf } = await import('../lib/db.js?db-tests');

test('conditional match write performs one Redis compare-and-set with all JSON values', async () => {
  const result = await setManyIf('match:one', '{"rev":1}', [
    ['match:one', { rev: 2, status: 'done' }],
    ['user:one', { balance: 400 }],
  ]);
  assert.equal(result, 'OK');
  const [command, script, keys, matchKey, expected, ...writes] = requests.at(-1).body;
  assert.equal(command, 'EVAL');
  assert.match(script, /redis\.call\('GET', KEYS\[1\]\).*ARGV\[1\]/);
  assert.equal(keys, 1);
  assert.equal(matchKey, 'match:one');
  assert.equal(expected, '{"rev":1}');
  assert.deepEqual(writes, ['match:one', '{"rev":2,"status":"done"}', 'user:one', '{"balance":400}']);
});

test('lock release compares the unique owner token before deleting', async () => {
  const token = await acquireLock('mlock:one', 120);
  assert.ok(token);
  const acquire = requests.at(-1).body;
  assert.deepEqual(acquire.slice(0, 2), ['SET', 'mlock:one']);
  assert.equal(acquire[2], token);
  await releaseLock('mlock:one', token);
  const release = requests.at(-1).body;
  assert.equal(release[0], 'EVAL');
  assert.equal(release.at(-1), token);
  assert.match(release[1], /redis\.call\('DEL', KEYS\[1\]\)/);
});

test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.KV_REST_API_URL;
  else process.env.KV_REST_API_URL = originalUrl;
});
