import type { Tour } from '@/types/tour';

const GENERIC_DESTINATION_FALLBACK = '以线路标题为准';
const HIGHLIGHT_PLACEHOLDERS = new Set([
  '其他必打卡',
  '特色美食',
  '精品住宿',
]);
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
  const normalized = normalizeDisplayText(value).replace(/必打卡$/, '');
  if (!normalized) return false;
  if (HIGHLIGHT_PLACEHOLDERS.has(value) || HIGHLIGHT_PLACEHOLDERS.has(normalized)) return false;
  if (GENERIC_HIGHLIGHT_TERMS.has(normalized)) return false;
  return normalized.length >= 2;
}

function isDestinationOnlyHighlight(tour: Tour, value: string) {
  const normalized = normalizeDisplayText(value);
  if (!normalized.includes('必打卡')) return false;

  const stripped = normalized.replace(/必打卡/g, '').trim();
  const destination = normalizeDisplayText(tour.destination);
  return Boolean(stripped && destination && stripped === destination);
}

export function getReadableHighlights(tour: Tour) {
  const seen = new Set<string>();
  return (tour.highlights || [])
    .filter((item) => !isDestinationOnlyHighlight(tour, item))
    .map((item) => normalizeDisplayText(item).replace(/必打卡$/, ''))
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
  if (tour.destination && tour.destination !== '其他') {
    return tour.destination;
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
 * 获取最近的未来出发日期（返回 ISO 日期字符串）
 */
export function getUpcomingDepartureDate(tour: Tour) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = [tour.departureDate, ...(tour.departureDates || [])]
    .filter(Boolean)
    .map((value) => new Date(`${value}T00:00:00`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const futureDate = dates.find((date) => date.getTime() >= today.getTime());
  return futureDate ? futureDate.toISOString().slice(0, 10) : '';
}

export function getDepartureDateBadgeLabel(tour: Tour) {
  const upcomingDate = getUpcomingDepartureDate(tour);
  if (upcomingDate) return formatShortDate(upcomingDate);
  const hasAnyStructuredDate = [tour.departureDate, ...(tour.departureDates || [])].some(Boolean);
  if (hasAnyStructuredDate) {
    return '班期已过';
  }
  if (
    tour.dataQuality?.isDepartureDateReliable === false ||
    tour.dataQuality?.hasStructuredDepartureDates === false
  ) {
    return '班期待确认';
  }
  return '待定';
}

/**
 * 简短日期标签（用于卡片展示）
 */
export function formatShortDate(dateStr: string | undefined): string {
  if (!dateStr) return '待定';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (diffDays >= 0 && diffDays <= 7) return `${month}月${day}日 · 即将出发`;
  return `${month}月${day}日`;
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
