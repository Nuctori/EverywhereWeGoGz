// 日历日语义回归：保证"今天/明天/已过期"在东八区与跨夏令时时区都不漂移。
import assert from 'node:assert/strict';
import {
  addCalendarDays,
  compareCalendarDates,
  daysBetweenCalendarDates,
  parseCalendarDate,
  toCalendarDate,
  todayCalendarDate,
} from '../src/lib/calendar-date.ts';
import {
  formatRelativeDayLabel,
  formatShortDate,
  getDepartureBadge,
  getDepartureDateBadgeLabel,
  getUpcomingDepartureDate,
} from '../src/lib/tour-display.ts';
import { getDaysUntil, getEffectiveDepartureDates, getUpcomingDates } from '../src/lib/tour-recommendation.ts';

const NOW = new Date();
const today = toCalendarDate(NOW);
const tomorrow = addCalendarDays(today, 1);
const yesterday = addCalendarDays(today, -1);
assert.ok(today && tomorrow && yesterday);

// 1) 本地日历日与 UTC 日期解耦：toCalendarDate 必须按本地年月日，不能用 toISOString。
const boundary = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 0, 30, 0);
assert.equal(
  toCalendarDate(boundary),
  `${NOW.getFullYear()}-${`${NOW.getMonth() + 1}`.padStart(2, '0')}-${`${NOW.getDate()}`.padStart(2, '0')}`,
  'toCalendarDate must format local Y-M-D (00:30 local must not become yesterday)',
);
assert.equal(todayCalendarDate(boundary), toCalendarDate(boundary));

// 2) 解析：脏数据不静默兜底，格式对但日期不存在也拒绝。
assert.equal(parseCalendarDate('2026-02-30'), null);
assert.equal(parseCalendarDate('2026-13-01'), null);
assert.equal(parseCalendarDate('2026-10-18T00:00:00Z'), null);
assert.equal(parseCalendarDate(''), null);
assert.equal(parseCalendarDate(null), null);
assert.equal(parseCalendarDate(' 2026-10-18 '), '2026-10-18');

// 3) 加减天数跨月/跨年/闰年。
assert.equal(addCalendarDays('2026-12-31', 1), '2027-01-01');
assert.equal(addCalendarDays('2024-02-28', 1), '2024-02-29');
assert.equal(addCalendarDays('2023-02-28', 1), '2023-03-01');
assert.equal(addCalendarDays('2026-03-01', -1), '2026-02-28');
assert.equal(daysBetweenCalendarDates('2026-03-01', '2026-03-31'), 30);
assert.equal(daysBetweenCalendarDates('2026-03-31', '2026-03-01'), -30);

// 4) 排序：脏值排在合法日期之后，不参与比较。
assert.deepEqual(
  ['2026-11-01', 'bad', '2026-10-20', '2026-02-30'].sort(compareCalendarDates),
  ['2026-10-20', '2026-11-01', 'bad', '2026-02-30'],
);

// 5) 班期判定：今天出发必须算"可出发"，不能因 UTC 换算被判过期。
const base = {
  id: 'calendar-test',
  title: '日历回归线路',
  source: '测试源',
  destination: '广东',
  duration: 2,
  price: 199,
  priceUnit: '人',
  transportType: '大巴往返',
  accommodationLevel: '',
  meals: '',
  singleSupplementNote: '',
  highlights: [],
  rating: 0,
  bookingUrl: '',
  images: [],
  tags: [],
  isHot: false,
  isNew: false,
  isFlashSale: false,
  groupSize: '',
  theme: '',
  leisureLevel: 'easy',
  suitableFor: [],
  season: '',
};

const todayTour = { ...base, departureDate: today, departureDates: [today] };
const pastTour = { ...base, departureDate: yesterday, departureDates: [yesterday] };
const tomorrowTour = { ...base, departureDate: tomorrow, departureDates: [tomorrow] };
const noDateTour = { ...base, departureDate: '', departureDates: [] };

assert.equal(getUpcomingDepartureDate(todayTour, today), today);
assert.equal(getDepartureBadge(todayTour, today).status, 'scheduled');
// 日期只给"月日"，"今天/明天"由 formatRelativeDayLabel 单独给（卡片上只出现一次日期）
assert.equal(getDepartureBadge(todayTour, today).label, formatShortDate(today));
assert.equal(formatRelativeDayLabel(today, today), '今天');
assert.equal(getDepartureDateBadgeLabel({ ...todayTour, departureDate: today }), formatShortDate(today));
assert.equal(getDepartureBadge(pastTour, today).status, 'expired');
assert.equal(getDepartureBadge(pastTour, today).label, '班期已过');
assert.equal(getDepartureBadge(tomorrowTour, today).status, 'scheduled');
assert.equal(getDepartureBadge(tomorrowTour, today).label, formatShortDate(tomorrow));
assert.equal(formatRelativeDayLabel(tomorrow, today), '明天');
assert.equal(getDepartureBadge(noDateTour, today).status, 'unknown');
assert.equal(
  getDepartureBadge({ ...noDateTour, dataQuality: { isDepartureDateReliable: false } }, today).status,
  'unconfirmed',
);
assert.equal(
  getDepartureBadge({ ...noDateTour, dataQuality: { hasStructuredDepartureDates: false } }, today).status,
  'unconfirmed',
);

// 6) 展示层不再对中文文案做字符串嗅探的替代品：状态是枚举。
assert.notEqual(getDepartureBadge(todayTour, today).status, getDepartureBadge(pastTour, today).status);

// 7) 推荐排序的日期基准与展示一致。
assert.equal(getUpcomingDates(todayTour, today).length, 1);
assert.equal(getUpcomingDates(pastTour, today).length, 0);
assert.equal(getDaysUntil(today, today), 0);
assert.equal(getDaysUntil(tomorrow, today), 1);
assert.equal(getDaysUntil('bad', today), null);
assert.deepEqual(
  getEffectiveDepartureDates({ departureDate: '2026-10-20', departureDates: ['bad', '2026-10-20', '2026-10-01'] }),
  ['2026-10-01', '2026-10-20'],
);

// 8) formatShortDate 对带时刻的串不做"今天/明天"猜测，只给月日。
//    注意：带时刻的串换算成"哪一天"取决于运行机时区（UTC 串在 UTC-x 仍是 17 号），
//    所以这里只断言"不猜测"，不断言具体日号。
assert.equal(formatShortDate(''), '待定');
assert.equal(formatShortDate(undefined), '待定');
assert.match(formatShortDate('2026-10-18T00:00:00Z'), /^10月1[78]日$/);
assert.doesNotMatch(formatShortDate('2026-10-18T00:00:00Z'), /今天|明天|天后/);
assert.equal(formatShortDate('not-a-date'), 'not-a-date');

console.info('calendar date semantics tests passed (today=%s)', today);
