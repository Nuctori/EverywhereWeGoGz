import { strict as assert } from 'node:assert';
import { parseCalendarDate, daysBetweenCalendarDates, compareCalendarDates } from '../src/lib/calendar-date.ts';

// 缓存必须不改变语义：合法值原样返回，非法值恒为 null（且反复调用一致）
const valid = ['2026-10-18', '2026-01-01', '2026-12-31'];
for (const v of valid) {
  assert.equal(parseCalendarDate(v), v, `${v} must round-trip`);
  assert.equal(parseCalendarDate(v), v, `${v} must stay stable on repeat (cache hit)`);
}
const invalid = ['', '  ', '2026-02-30', '2026-13-01', '2026-1-1', 'abc', null, undefined];
for (const v of invalid) {
  assert.equal(parseCalendarDate(v as string), null, `${String(v)} must be rejected`);
  assert.equal(parseCalendarDate(v as string), null, `${String(v)} must stay rejected on repeat (cached null)`);
}
// 带首尾空格的合法值应被 trim 后接受
assert.equal(parseCalendarDate(' 2026-10-18 '), '2026-10-18');

// 缓存不得影响跨函数结果
assert.equal(daysBetweenCalendarDates('2026-10-18', '2026-10-25'), 7);
assert.equal(daysBetweenCalendarDates('2026-10-25', '2026-10-18'), -7);
assert.equal(compareCalendarDates('2026-10-18', '2026-10-19'), -1);
assert.equal(compareCalendarDates('2026-10-19', '2026-10-18'), 1);
assert.equal(compareCalendarDates('2026-10-18', '2026-10-18'), 0);
// 脏数据排在合法日期之后
assert.equal(compareCalendarDates('bogus', '2026-10-18'), 1);

// 大规模重复调用必须一致（这正是优化针对的场景）
for (let i = 0; i < 2000; i++) {
  assert.equal(parseCalendarDate('2026-10-18'), '2026-10-18');
  assert.equal(parseCalendarDate('2026-02-30'), null);
}
console.info('calendar date cache audit passed');
