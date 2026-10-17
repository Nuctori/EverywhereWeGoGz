// 线路展示层：负责标题摘要、目的地兜底、主题推断和日期展示文案。
//
// 日期一律按"日历日"处理（见 @/lib/calendar-date）：数据里的 departureDate 是
// "广州当地某天出发"，换算成绝对时刻再切回字符串会在 UTC+ 时区整体前移一天。
import type { Tour } from '@/types/tour';
import { resolveTourDestination, sanitizeTourHighlights } from '@/lib/destination-resolver';
import {
  daysBetweenCalendarDates,
  parseCalendarDate,
  todayCalendarDate,
} from '@/lib/calendar-date';

const GENERIC_DESTINATION_FALLBACK = '目的地待确认';
const GENERIC_HIGHLIGHT_TERMS = new Set([
  '其他',
  '纯玩',
  '品质',
  '亲子',
  '情侣',
  '家庭',
  '行程',
  '线路',
  '推荐线路',
  '自然风光',
  '海岛度假',
  '美食之旅',
  '古镇文化',
  '摄影之旅',
  '户外徒步',
  '温泉泡汤',
  '森林山水',
  '文化逛城',
  '玩水清凉',
]);

function normalizeDisplayText(value: string | undefined) {
  return (value || '').trim();
}

function isMeaningfulHighlight(value: string) {
  const normalized = normalizeDisplayText(value);
  if (!normalized) return false;
  if (GENERIC_HIGHLIGHT_TERMS.has(normalized)) return false;
  return normalized.length >= 2;
}

export function getReadableHighlights(tour: Tour) {
  const seen = new Set<string>();
  return sanitizeTourHighlights(tour)
    .map((item) => normalizeDisplayText(item))
    .filter((item) => isMeaningfulHighlight(item))
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

/**
 * 获取可读的目的地名称
 */
export function getReadableDestination(tour: Tour) {
  const resolvedDestination = resolveTourDestination(tour);
  if (resolvedDestination && resolvedDestination !== '其他') {
    return resolvedDestination;
  }
  const candidate = getReadableHighlights(tour)[0];
  return candidate || GENERIC_DESTINATION_FALLBACK;
}

/**
 * 格式化日期显示
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '待定';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 获取最近的未来出发日期（返回 `YYYY-MM-DD`，今天是"未来"，空串表示没有可出发班期）
 */
export function getUpcomingDepartureDate(tour: Tour, today: string = todayCalendarDate()) {
  const dates = [tour.departureDate, ...(tour.departureDates || [])]
    .map((value) => parseCalendarDate(value || ''))
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates.find((date) => date >= today) ?? '';
}

/** 班期状态：展示层唯一真相，调用方不再对中文文案做字符串嗅探。 */
export type DepartureStatus = 'scheduled' | 'expired' | 'unconfirmed' | 'unknown';

export interface DepartureBadge {
  status: DepartureStatus;
  /** 徽标文案（纯展示，不参与判断）。 */
  label: string;
  /** status 为 scheduled 时的最近可出发日历日。 */
  upcomingDate?: string;
}

export function getDepartureBadge(
  tour: Tour,
  today: string = todayCalendarDate(),
): DepartureBadge {
  const upcomingDate = getUpcomingDepartureDate(tour, today);
  if (upcomingDate) {
    return { status: 'scheduled', label: formatShortDate(upcomingDate), upcomingDate };
  }
  const hasAnyStructuredDate = [tour.departureDate, ...(tour.departureDates || [])].some(
    (value) => Boolean(parseCalendarDate(value || '')),
  );
  if (hasAnyStructuredDate) {
    return { status: 'expired', label: '班期已过' };
  }
  if (
    tour.dataQuality?.isDepartureDateReliable === false ||
    tour.dataQuality?.hasStructuredDepartureDates === false
  ) {
    return { status: 'unconfirmed', label: '班期待确认' };
  }
  return { status: 'unknown', label: '待定' };
}

// 根据最近未来出发日期返回徽标文本：有未来日期则显示日期，无则输出“班期已过”/“班期待确认”/“待定”。
export function getDepartureDateBadgeLabel(tour: Tour) {
  return getDepartureBadge(tour).label;
}

/**
 * 简短日期标签（用于卡片展示）
 *
 * 只接受纯日历日（`YYYY-MM-DD`）。带时刻的 ISO 串先按本地历法归一，不参与
 * "今天/明天/后天"推算——那类值表达的是绝对时刻，换算成"哪一天出发"需要业务时区，
 * 属于上游数据清洗的职责，展示层不猜。
 */
export function formatShortDate(dateStr: string | undefined): string {
  if (!dateStr) return '待定';
  const calendarDate = parseCalendarDate(dateStr);
  if (!calendarDate) {
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? dateStr : `${parsed.getMonth() + 1}月${parsed.getDate()}日`;
  }
  const [, monthText, dayText] = calendarDate.split('-');
  return `${Number(monthText)}月${Number(dayText)}日`;
}

/**
 * "今天/明天/N天后"的临近感单独成函数。
 *
 * 卡片上日期只出现一次：角标写"最早 10月18日 出发"，这里再给"今天/明天"作为补充，
 * 避免再拼一遍日期造成"10月18日 · 今天可出发 出发"这种重复病句。
 */
export function formatRelativeDayLabel(dateStr: string | undefined, today: string = todayCalendarDate()): string {
  const calendarDate = parseCalendarDate(dateStr || '');
  if (!calendarDate) return '';
  const diffDays = daysBetweenCalendarDates(today, calendarDate);
  if (diffDays === null) return '';
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}天后`;
  return '';
}

// 主题信号模式
const THEME_SIGNALS = [
  { label: '海边度假', pattern: /海边|海滩|沙滩|海岛|海景|双月湾|巽寮湾|沙扒湾|南澳岛|海陵岛|浮潜|潜水/ },
  { label: '森林山水', pattern: /森林|氧吧|瀑布|峡谷|山水|雪山|草原|湿地|溶洞|漓江|九寨沟|长白山|呼伦贝尔/ },
  { label: '文化逛城', pattern: /古城|古镇|博物馆|非遗|寺庙|骑楼|水乡|文化|潮州|开平/ },
  { label: '玩水清凉', pattern: /漂流|溯溪|桨板|sup|水上乐园|水世界|嬉水|亲水|泳池/ },
  { label: '温泉泡汤', pattern: /温泉|泡汤|汤泉|私汤|热泉|spa/i },
];

const THEME_MISMATCH_CHECKS = [
  { pattern: /海岛|海边|沙滩|海景/, requires: /海边|海滩|沙滩|海岛|海景|双月湾|巽寮湾|沙扒湾|南澳岛|海陵岛|浮潜|潜水/ },
  { pattern: /温泉/, requires: /温泉|泡汤|汤泉|私汤|热泉|spa/i },
  { pattern: /亲子|乐园|度假村/, requires: /亲子|乐园|度假村|水上乐园|博物馆|动物园|玩水/ },
];

/**
 * 从线路数据推断可读主题
 */
// 基于标题/目的地/标签加权推断主题，若标签主题与内容矛盾则信任推断结果
export function getReadableTheme(tour: Tour) {
  const readableHighlights = getReadableHighlights(tour);
  const evidenceCorpus = [
    tour.title,
    ...readableHighlights,
  ].join(' ');
  const weightedSources = [
    { text: normalizeDisplayText(tour.title), weight: 3 },
    { text: readableHighlights.join(' '), weight: 2 },
    { text: normalizeDisplayText(tour.destination), weight: 1 },
    { text: (tour.tags || []).join(' '), weight: 1 },
  ];
  const inferred = THEME_SIGNALS
    .map((item) => ({
      label: item.label,
      score: weightedSources.reduce((total, source) => (
        source.text && item.pattern.test(source.text) ? total + source.weight : total
      ), 0),
    }))
    .sort((left, right) => right.score - left.score)[0];
  const theme = tour.theme?.trim();

  if (!theme) return inferred?.score ? inferred.label : '';

  const mismatched = THEME_MISMATCH_CHECKS.some(
    (item) => item.pattern.test(theme) && evidenceCorpus && !item.requires.test(evidenceCorpus),
  );

  return mismatched && inferred?.score ? inferred.label : theme;
}

/**
 * 构建标题摘要
 */
export function buildTitleSummary(tour: Tour) {
  const destinationLabel = getReadableDestination(tour);
  const chunks = [
    destinationLabel !== GENERIC_DESTINATION_FALLBACK ? destinationLabel : '',
    `${tour.duration}天`,
  ];
  const readableTheme = getReadableTheme(tour);
  if (readableTheme) chunks.push(readableTheme);
  if (tour.transportType) chunks.push(tour.transportType.replace('往返', ''));
  return chunks.filter(Boolean).join(' · ');
}
