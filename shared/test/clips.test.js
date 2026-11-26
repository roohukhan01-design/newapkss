const assert = require('assert');
const C = require('../core/clips.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok -', name); };
t('toSeconds reads numbers, text numbers and clock times', () => {
  assert.equal(C.toSeconds(90), 90); assert.equal(C.toSeconds('90'), 90); assert.equal(C.toSeconds('1:30'), 90);
  assert.equal(C.toSeconds('01:01:30'), 3690); assert.equal(C.toSeconds('45s'), 45); assert.equal(C.toSeconds('00:12:30'), 750);
  assert(Number.isNaN(C.toSeconds('abc'))); assert(Number.isNaN(C.toSeconds(null))); assert(Number.isNaN(C.toSeconds(NaN))); assert(Number.isNaN(C.toSeconds('')));
});
t('fitWindow stretches short windows instead of dropping them', () => {
  assert.deepEqual(C.fitWindow(100, 103, 600, 15, 30), [100, 115]);
  assert.deepEqual(C.fitWindow('1:40', '1:43', 600, 15, 30), [100, 115]);
});
t('fitWindow trims long windows and handles the end of the video', () => {
  assert.deepEqual(C.fitWindow(100, 200, 600, 15, 30), [100, 130]);
  assert.deepEqual(C.fitWindow(595, 599, 600, 15, 30), [585, 600]);
});
t('fitWindow fixes backwards or missing ends and rejects junk', () => {
  assert.deepEqual(C.fitWindow(50, 40, 600, 15, 30), [50, 65]);
  assert.deepEqual(C.fitWindow(50, null, 600, 15, 30), [50, 65]);
  assert.equal(C.fitWindow('x', 10, 600, 15, 30), null); assert.equal(C.fitWindow(10, 20, 0, 15, 30), null);
});
t('fitWindow on a very short video uses the whole video', () => {
  assert.deepEqual(C.fitWindow(0, 3, 9, 15, 30), [0, 9]);
});
t('unrelative shifts times counted from the start of the part', () => {
  assert.deepEqual(C.unrelative(30, 60, 1200, 1200), [1230, 1260]);
  assert.deepEqual(C.unrelative(1300, 1330, 1200, 1200), [1300, 1330]);
  assert.deepEqual(C.unrelative(30, 60, 0, 1200), [30, 60]);
});
t('chooseWindows drops overlaps and tops up from the pool', () => {
  const pool = [{ s: 10, e: 40, score: 9 }, { s: 200, e: 230, score: 7 }, { s: 400, e: 430, score: 5 }];
  const r = C.chooseWindows([{ start: 12, end: 30 }, { start: 20, end: 50 }], pool, 3, 600, 15, 30);
  assert.equal(r.length, 3); for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) assert(!(r[i].s < r[j].e && r[i].e > r[j].s));
});
t('chooseWindows still returns clips when the AI picks are all unusable (the reported bug)', () => {
  const pool = [{ s: 100, e: 104, score: 8 }, { s: 300, e: 302, score: 6 }];
  const r = C.chooseWindows([{ start: 'x', end: 'y' }, { start: 5, end: 6 }, null, 7], pool, 2, 600, 15, 30);
  assert(r.length >= 2); r.forEach(w => assert(w.e - w.s >= 15 - 1e-9));
});
t('chooseWindows respects want', () => {
  const pool = []; for (let i = 0; i < 9; i++) pool.push({ s: i * 60, e: i * 60 + 30, score: i });
  assert.equal(C.chooseWindows([], pool, 4, 600, 15, 30).length, 4);
  assert.equal(C.chooseWindows(null, null, 4, 600, 15, 30).length, 0);
});
console.log(n + ' clips tests passed');
