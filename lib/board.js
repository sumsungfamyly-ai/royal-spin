// Настольные игры на двоих: русские шашки и «Четыре в ряд». Чистая логика + ИИ бота.
const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const own = v => (v === 0 ? null : v <= 2 ? 'a' : 'b');
const promoRow = side => (side === 'a' ? 0 : 7);

/* ---------- Шашки ---------- */
function capFrom(bd, s, side, king, caps, path, out) {
  const r0 = (s / 8) | 0, c0 = s % 8;
  for (const [dr, dc] of DIRS) {
    let r = r0 + dr, c = c0 + dc;
    if (king) while (inb(r, c) && bd[r * 8 + c] === 0) { r += dr; c += dc; }
    if (!inb(r, c)) continue;
    const t = r * 8 + c, v = bd[t];
    if (v === 0 || own(v) === side || caps.has(t)) continue;
    const lands = []; let lr = r + dr, lc = c + dc;
    while (inb(lr, lc) && bd[lr * 8 + lc] === 0) { lands.push(lr * 8 + lc); if (!king) break; lr += dr; lc += dc; }
    caps.add(t); const cont = [], term = [];
    for (const L of lands) {
      const promo = !king && ((L / 8) | 0) === promoRow(side), sub = [];
      capFrom(bd, L, side, king || promo, caps, [...path, L], sub);
      if (sub.length) cont.push(...sub); else term.push({ p: [...path, L], c: [...caps] });
    }
    caps.delete(t);
    out.push(...(cont.length ? cont : term));
  }
}
export function ckMoves(bd, side) {
  const caps = [];
  for (let s = 0; s < 64; s++) {
    const v = bd[s]; if (own(v) !== side) continue;
    const b2 = bd.slice(); b2[s] = 0; capFrom(b2, s, side, v % 2 === 0, new Set(), [s], caps);
  }
  if (caps.length) return caps;
  const out = [];
  for (let s = 0; s < 64; s++) {
    const v = bd[s]; if (own(v) !== side) continue;
    const king = v % 2 === 0, r0 = (s / 8) | 0, c0 = s % 8;
    for (const [dr, dc] of DIRS) {
      if (!king && dr !== (side === 'a' ? -1 : 1)) continue;
      let r = r0 + dr, c = c0 + dc;
      while (inb(r, c) && bd[r * 8 + c] === 0) { out.push({ p: [s, r * 8 + c], c: [] }); if (!king) break; r += dr; c += dc; }
    }
  }
  return out;
}
export function ckApply(bd, mv) {
  const nb = bd.slice(), from = mv.p[0], to = mv.p[mv.p.length - 1]; let v = nb[from]; nb[from] = 0;
  for (const x of mv.c) nb[x] = 0;
  if (v === 1 && mv.p.some(q => ((q / 8) | 0) === 0)) v = 2;
  if (v === 3 && mv.p.some(q => ((q / 8) | 0) === 7)) v = 4;
  nb[to] = v; return nb;
}
const ckInit = () => { const bd = Array(64).fill(0); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) { if (r < 3) bd[r * 8 + c] = 3; else if (r > 4) bd[r * 8 + c] = 1; } return bd; };
function ckEval(bd, side) {
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const v = bd[i]; if (!v) continue; const o = own(v), r = (i / 8) | 0, c = i % 8, ctr = 3 - Math.abs(3.5 - c) * .5 - Math.abs(3.5 - r) * .3;
    const val = v % 2 === 0 ? 330 + ctr * 3 : 100 + (o === 'a' ? 7 - r : r) * 5 + ctr * 2;
    s += o === side ? val : -val;
  }
  return s;
}
function ckSearch(bd, side, depth, alpha, beta, ctx, ply) {
  const mv = ckMoves(bd, side);
  if (!mv.length) return -9000 + ply;
  if (depth <= 0) { if (mv[0].c.length && ply < ctx.maxPly) depth = 1; else return ckEval(bd, side); }
  if (++ctx.n > ctx.cap) return ckEval(bd, side);
  mv.sort((x, y) => y.c.length - x.c.length);
  let best = -1e9; const o = side === 'a' ? 'b' : 'a';
  for (const m of mv) {
    const v = -ckSearch(ckApply(bd, m), o, depth - 1, -beta, -alpha, ctx, ply + 1);
    if (v > best) best = v; if (best > alpha) alpha = best; if (alpha >= beta) break;
  }
  return best;
}
function ckBot(st, side, depth = 4) {
  const mv = ckMoves(st.bd, side); if (mv.length === 1) return 0;
  const ctx = { n: 0, cap: 60000, maxPly: depth + 4 }, o = side === 'a' ? 'b' : 'a', sc = [];
  mv.forEach((m, i) => sc.push([-ckSearch(ckApply(st.bd, m), o, depth - 1, -1e9, 1e9, ctx, 1) + Math.random() * 6, i]));
  sc.sort((x, y) => y[0] - x[0]); return sc[0][1];
}

/* ---------- Четыре в ряд (7×6) ---------- */
const C4W = 7, C4H = 6;
const c4Drop = (g, c) => { for (let r = C4H - 1; r >= 0; r--) if (!g[r * C4W + c]) return r; return -1; };
function c4Win(g, p) {
  for (let r = 0; r < C4H; r++) for (let c = 0; c < C4W; c++) {
    if (g[r * C4W + c] !== p) continue;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let k = 1; while (k < 4) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= C4H || cc < 0 || cc >= C4W || g[rr * C4W + cc] !== p) break; k++; }
      if (k === 4) return true;
    }
  }
  return false;
}
function c4Eval(g, p) {
  const q = 3 - p; let s = 0;
  for (let r = 0; r < C4H; r++) for (let c = 0; c < C4W; c++) {
    if (c === 3 && g[r * C4W + c] === p) s += 3;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const er = r + dr * 3, ec = c + dc * 3; if (er < 0 || er >= C4H || ec < 0 || ec >= C4W) continue;
      let a = 0, b = 0; for (let k = 0; k < 4; k++) { const v = g[(r + dr * k) * C4W + c + dc * k]; if (v === p) a++; else if (v === q) b++; }
      if (a && !b) s += [0, 1, 6, 30][a]; else if (b && !a) s -= [0, 1, 6, 40][b];
    }
  }
  return s;
}
const ORD = [3, 2, 4, 1, 5, 0, 6];
function c4Search(g, p, depth, alpha, beta) {
  const cols = ORD.filter(c => g[c] === 0); if (!cols.length) return 0;
  if (depth === 0) return c4Eval(g, p);
  let best = -1e9;
  for (const c of cols) {
    const r = c4Drop(g, c); g[r * C4W + c] = p;
    const v = c4Win(g, p) ? 10000 + depth : -c4Search(g, 3 - p, depth - 1, -beta, -alpha);
    g[r * C4W + c] = 0;
    if (v > best) best = v; if (best > alpha) alpha = best; if (alpha >= beta) break;
  }
  return best;
}
function c4Bot(st, side, depth = 5) {
  const p = side === 'a' ? 1 : 2, g = st.g.slice(), sc = [];
  for (const c of ORD) {
    if (g[c]) continue; const r = c4Drop(g, c); g[r * C4W + c] = p;
    const v = c4Win(g, p) ? 1e5 : -c4Search(g, 3 - p, depth - 1, -1e9, 1e9);
    g[r * C4W + c] = 0; sc.push([v + Math.random() * 3, c]);
  }
  sc.sort((x, y) => y[0] - x[0]); return { c: sc[0][1] };
}

/* ---------- Общий интерфейс ---------- */
export const BG = {
  checkers: {
    init: () => ({ bd: ckInit(), q: 0, last: null }),
    legal: (st, side) => ckMoves(st.bd, side),
    // mv: { i } — индекс хода в списке legal
    apply(st, side, mv) {
      const list = ckMoves(st.bd, side), m = list[mv.i]; if (!m) throw new Error('Нельзя так сходить');
      const man = st.bd[m.p[0]] % 2 === 1, nb = ckApply(st.bd, m), o = side === 'a' ? 'b' : 'a';
      const q = m.c.length || man ? 0 : st.q + 1, ns = { bd: nb, q, last: m.p }, nxt = ckMoves(nb, o);
      let res = null; if (!nxt.length) res = side; else if (q >= 30) res = 'draw';
      return { st: ns, res };
    },
    bot: (st, side) => ({ i: ckBot(st, side) }),
  },
  connect4: {
    init: () => ({ g: Array(C4W * C4H).fill(0), last: null }),
    legal: st => [0, 1, 2, 3, 4, 5, 6].filter(c => st.g[c] === 0),
    apply(st, side, mv) {
      const c = Math.floor(Number(mv.c)); if (!(c >= 0 && c < C4W) || st.g[c]) throw new Error('Колонка занята');
      const p = side === 'a' ? 1 : 2, g = st.g.slice(), r = c4Drop(g, c); g[r * C4W + c] = p;
      let res = null; if (c4Win(g, p)) res = side; else if (g.every(Boolean)) res = 'draw';
      return { st: { g, last: r * C4W + c }, res };
    },
    bot: (st, side) => c4Bot(st, side),
  },
};
