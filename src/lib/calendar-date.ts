// 线路"日历日"语义的唯一出处。
//
// 数据里的 departureDate/departureDates 是**不带时区前缀的日历日**（`YYYY-MM-DD`），
// 表示"在广州当地某一天出发"，不是某个绝对时刻。任何用 `new Date(x).toISOString()`
// 或 `new Date(x).toISOString().slice(0, 10)` 把它换算回字符串的做法，都会在东八区
// 这类 UTC+ 时区把日期整体前移一天（本地 10-18 的 00:00 在 UTC 是 10-17T16:00Z），
// 于是"今天可出发"的团被判成"已过期"，排序基准也差一天。
//
// 因此本模块只做两件事：
//   1. 用本地年月日格式化"今天"（toCalendarDate）；
//   2. 把日历日解析成"UTC 午夜的 Date"只用于做日期加法（addCalendarDays /
//      daysBetweenCalendarDates），避免夏令时把 24h 推算成 23h/25h。

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

// 日历日校验是纯函数，且输入的取值集合很小（数据里就那几百个日期，反复出现）。
// 每次校验都要 new Date(Date.UTC(...)) 回读，在排序比较器和评分里会被调用到
// 十万量级（线上 CPU 剖面里占 35%），这里按字符串记忆化。
// 存 null 表示"已确认非法"，避免对脏数据反复重算。
const calendarDateCache = new Map<string, string | null>();
const CALENDAR_DATE_CACHE_MAX = 4096;

function pad2(value: number) {
  return `${value}`.padStart(2, '0');
}

/** 本地日历日 → `YYYY-MM-DD`。绝不经过 toISOString（那是 UTC 视角）。 */
export function toCalendarDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 今天的本地日历日。 */
export function todayCalendarDate(now: Date = new Date()): string {
  return toCalendarDate(now);
}

/** 合法日历日返回 `YYYY-MM-DD`，脏数据（空串/非日期/2 月 30 日）返回 null。 */
export function parseCalendarDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  const cached = calendarDateCache.get(trimmed);
  if (cached !== undefined) return cached;

  const match = CALENDAR_DATE_PATTERN.exec(trimmed);
  if (!match) {
    if (calendarDateCache.size >= CALENDAR_DATE_CACHE_MAX) calendarDateCache.clear();
    calendarDateCache.set(trimmed, null);
    return null;
  }
  const [, year, month, day] = match;
  const probe = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  // 回读校验挡掉 2026-02-30 / 2026-13-01 这类"格式对、日期不存在"的值。
  const valid =
    probe.getUTCFullYear() === Number(year) &&
    probe.getUTCMonth() === Number(month) - 1 &&
    probe.getUTCDate() === Number(day);
  const result = valid ? trimmed : null;
  if (calendarDateCache.size >= CALENDAR_DATE_CACHE_MAX) calendarDateCache.clear();
  calendarDateCache.set(trimmed, result);
  return result;
}

export function isValidCalendarDate(value: string | null | undefined): boolean {
  return parseCalendarDate(value) !== null;
}

/** 日历日加减天数；入参非法时返回 null，不做静默兜底。 */
export function addCalendarDays(value: string, days: number): string | null {
  const normalized = parseCalendarDate(value);
  if (!normalized || !Number.isFinite(days)) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day);
  return new Date(base + Math.trunc(days) * MS_PER_DAY).toISOString().slice(0, 10);
}

/** `b - a` 的整数天数（a 早于 b 为正）。任一侧非法返回 null。 */
export function daysBetweenCalendarDates(a: string, b: string): number | null {
  const left = parseCalendarDate(a);
  const right = parseCalendarDate(b);
  if (!left || !right) return null;
  const [ay, am, ad] = left.split('-').map(Number);
  const [by, bm, bd] = right.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / MS_PER_DAY);
}

/** 两个日历日先规范化成 `YYYY-MM-DD` 再比较，脏数据排在所有合法日期之后。 */
export function compareCalendarDates(a: string | null | undefined, b: string | null | undefined): number {
  const left = parseCalendarDate(a);
  const right = parseCalendarDate(b);
  if (left && right) return left < right ? -1 : left > right ? 1 : 0;
  if (left) return -1;
  if (right) return 1;
  return 0;
}
