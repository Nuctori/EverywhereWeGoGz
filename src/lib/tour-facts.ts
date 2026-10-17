// 线路事实层：把数据里"能不能出发 / 价格怎么算 / 可以怎么去"提炼成用户能直接读懂的事实。
//
// 三条硬约束（改动前请先读完）：
// 1. 只陈述结构化数据里存在的事实。字段缺失就返回空串，绝不推断"好像有早餐""大概是四星"。
// 2. 日期一律按广州日历日处理（见 @/lib/calendar-date），不用 Date 做时区换算。
// 3. 这里不做文案润色：卡片上的差异点必须能在原始字段里被逐条复核。
import type { Tour } from '@/types/tour';
import { formatShortDate } from '@/lib/tour-display';
import { parseCalendarDate, todayCalendarDate } from '@/lib/calendar-date';
import { getEffectiveDepartureDates } from '@/lib/tour-recommendation';

export interface DeparturePlan {
  /** 最近一个"今天或之后"的班期（YYYY-MM-DD）；空串表示没有未来班期。 */
  nextDate: string;
  /** 未来班期数量。 */
  upcomingCount: number;
  /** 全部可识别班期数量（含已过）。 */
  totalCount: number;
  status: 'scheduled' | 'expired' | 'unconfirmed' | 'unknown';
}

function normalizeDates(tour: Pick<Tour, 'departureDate' | 'departureDates'>) {
  return getEffectiveDepartureDates(tour as Pick<Tour, 'departureDate' | 'departureDates'>);
}

/**
 * 班期计划：卡片徽标、详情页、排序共用同一口径，避免"徽标说今天可出发、排序按旧首日"。
 */
export function getDeparturePlan(
  tour: Pick<Tour, 'departureDate' | 'departureDates' | 'dataQuality'>,
  today: string = todayCalendarDate(),
): DeparturePlan {
  const dates = normalizeDates(tour);
  const upcoming = dates.filter((date) => date >= today);
  if (upcoming.length > 0) {
    return {
      nextDate: upcoming[0],
      upcomingCount: upcoming.length,
      totalCount: dates.length,
      status: 'scheduled',
    };
  }
  if (dates.length > 0) {
    return { nextDate: '', upcomingCount: 0, totalCount: dates.length, status: 'expired' };
  }
  const quality = (tour as Pick<Tour, 'dataQuality'>).dataQuality;
  if (quality?.isDepartureDateReliable === false || quality?.hasStructuredDepartureDates === false) {
    return { nextDate: '', upcomingCount: 0, totalCount: 0, status: 'unconfirmed' };
  }
  return { nextDate: '', upcomingCount: 0, totalCount: 0, status: 'unknown' };
}

/**
 * 卡片主徽标文案：只在"确实有未来班期 / 确实全过期 / 确实没数据"三种状态里选一种，
 * 不再把已过期的 first 班期日期当成"下一步"展示。
 * 这里只给日期本身，由卡片决定是放进图片角标还是价格行，避免同一句话出现两遍。
 */
export function getDepartureLeadLabel(
  tour: Pick<Tour, 'departureDate' | 'departureDates' | 'dataQuality'>,
  today: string = todayCalendarDate(),
) {
  const plan = getDeparturePlan(tour, today);
  switch (plan.status) {
    case 'scheduled':
      return { tone: 'ok' as const, label: formatShortDate(plan.nextDate), nextDate: plan.nextDate };
    case 'expired':
      return { tone: 'muted' as const, label: '现有班期均已结束', nextDate: '' };
    case 'unconfirmed':
      return { tone: 'warn' as const, label: '班期待确认', nextDate: '' };
    default:
      return { tone: 'warn' as const, label: '班期待补充', nextDate: '' };
  }
}

/** 未来班期密度：用于"这个团还灵不灵、好不好挑日子"的差异点。 */
export function getDepartureCadenceLabel(plan: DeparturePlan) {
  if (plan.status !== 'scheduled') return '';
  if (plan.upcomingCount >= 8) return `未来还有 ${plan.upcomingCount} 个班期可选`;
  if (plan.upcomingCount >= 2) return `未来还有 ${plan.upcomingCount} 个班期`;
  return '仅此一班';
}

const MEAL_NOTE_MAX_LENGTH = 26;

/**
 * 餐食只做"计数式"提炼：数据里 meals 常常是一整段行程原文（"早餐后前往……"），
 * 直接截断会给用户看半句话。这里只在能稳定识别出"含 X 早/X 正餐"时给结论。
 */
export function getMealSummary(tour: Pick<Tour, 'meals' | 'duration' | 'meta'>) {
  const counts = tour.meta?.structuredDetails?.mealCounts;
  if (counts && (counts.breakfast || counts.lunch || counts.dinner)) {
    const parts: string[] = [];
    if (counts.breakfast) parts.push(`早餐×${counts.breakfast}`);
    if (counts.lunch) parts.push(`午餐×${counts.lunch}`);
    if (counts.dinner) parts.push(`晚餐×${counts.dinner}`);
    return { hasDetail: true, label: `含 ${parts.join(' · ')}` };
  }
  const raw = (tour.meals || '').replace(/\s+/g, '');
  if (!raw) return { hasDetail: false, label: '' };
  const selfPaid = (raw.match(/自理/g) || []).length;
  if (selfPaid >= 2 && raw.length <= 40) {
    return { hasDetail: true, label: '多数餐需自理' };
  }
  if (raw.length <= MEAL_NOTE_MAX_LENGTH && !/前往|游览|车程/.test(raw)) {
    return { hasDetail: true, label: `餐食：${raw}` };
  }
  return { hasDetail: false, label: '' };
}

const TRANSPORT_LABEL: Record<string, string> = {
  大巴往返: '大巴往返',
  飞机往返: '飞机往返',
  高铁往返: '高铁往返',
  动车往返: '动车往返',
  邮轮: '邮轮',
};

/** 交通方式归一：源数据就四种，未知就不写，不要编"当地交通"。 */
export function getTransportLabel(tour: Pick<Tour, 'transportType'>) {
  const value = (tour.transportType || '').replace(/\s+/g, '');
  if (!value) return '';
  return TRANSPORT_LABEL[value] || value.replace(/往返$/, '') + (value.endsWith('往返') ? '往返' : '');
}

/**
 * 价格口径：卡片上"¥249"到底是谁的价格、包不包住，必须同一行说清楚。
 * 只组合数据里真实存在的条件，缺什么就少说什么。
 */
export function getPriceBasisLabel(tour: Pick<Tour, 'singleSupplementNote'>) {
  const hasSingleNote = Boolean(tour.singleSupplementNote?.trim());
  return hasSingleNote ? '按双人入住折算 / 人，单房差另计' : '按双人入住折算 / 人，单房差未注明';
}

/** 从单房差原文里抠出"补 xxx 元"，抠不到就当没写。 */
export function getSingleSupplementAmountLabel(tour: Pick<Tour, 'singleSupplementNote'>) {
  const note = tour.singleSupplementNote || '';
  const matched = note.match(/(?:补房差|单房差)[^0-9]{0,6}(\d{2,5})\s*元/);
  return matched ? `单房差约 ¥${Number(matched[1]).toLocaleString()}` : '';
}

export interface DistinctFact {
  key: 'boarding' | 'meal' | 'stay' | 'group' | 'cadence';
  label: string;
  detail?: string;
}

/**
 * 差异点：优先抽"能区分两条线路"的字段（上车点、餐、住宿、成团人数、班期密度），
 * 而不是把目的地+天数再复述一遍。
 */
export function getDistinctFacts(tour: Tour, today: string = todayCalendarDate()): DistinctFact[] {
  const facts: DistinctFact[] = [];
  const boarding = tour.boarding;
  if (boarding) {
    const names = (boarding.points || []).map((point) => point.name).filter(Boolean);
    const summary = boarding.summary?.trim();
    if (summary) {
      facts.push({ key: 'boarding', label: summary, detail: names.length ? names.slice(0, 6).join('、') : undefined });
    } else if (names.length) {
      facts.push({
        key: 'boarding',
        label: names.length <= 2 ? names.join('、') : `${names[0]} 等 ${names.length} 个上车点`,
        detail: names.slice(0, 6).join('、'),
      });
    }
  }

  const meal = getMealSummary(tour);
  if (meal.hasDetail && meal.label) {
    facts.push({ key: 'meal', label: meal.label });
  }

  const stay = (tour.accommodationLevel || '').trim();
  if (stay && stay !== '酒店住宿') {
    facts.push({ key: 'stay', label: stay });
  }

  const group = (tour.groupSize || '').trim();
  if (group) {
    facts.push({ key: 'group', label: group });
  }

  const cadence = getDepartureCadenceLabel(getDeparturePlan(tour, today));
  if (cadence) {
    facts.push({ key: 'cadence', label: cadence });
  }

  return facts;
}


/** 只有真正对应到班期的日期才值得展示；否则交给调用方渲染状态词。 */
export function resolveDepartureDisplay(
  tour: Tour,
  today: string = todayCalendarDate(),
): { kind: 'date'; date: string } | { kind: 'status'; status: DeparturePlan['status'] } {
  const plan = getDeparturePlan(tour, today);
  if (plan.nextDate) return { kind: 'date', date: plan.nextDate };
  return { kind: 'status', status: plan.status };
}

export function isCalendarDate(value: string | undefined) {
  return Boolean(value && parseCalendarDate(value));
}
