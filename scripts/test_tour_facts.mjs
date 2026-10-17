// 线路事实层语义测试：班期、价格口径、差异点抽取。
// 目标不是"跑通"，而是钉死三条用户可见承诺：
// 1) 卡片不会把已过期的班期当成"最近出发"；
// 2) 价格永远带"按双人入住折算"的口径；
// 3) 缺数据时不编事实（餐食/住宿/交通缺了就少写）。
import assert from 'node:assert/strict';
import {
  getDepartureCadenceLabel,
  getDepartureLeadLabel,
  getDeparturePlan,
  getDistinctFacts,
  getMealSummary,
  getPriceBasisLabel,
  getSingleSupplementAmountLabel,
  getTransportLabel,
} from '@/lib/tour-facts';

const TODAY = '2026-10-18';

function base(overrides = {}) {
  return {
    id: 'tour_x',
    title: '测试线路',
    source: '测试社',
    destination: '广州',
    duration: 3,
    price: 299,
    departureDate: '',
    departureDates: [],
    transportType: '大巴往返',
    accommodationLevel: '酒店住宿',
    meals: '',
    singleSupplementNote: '',
    highlights: [],
    tags: [],
    ...overrides,
  };
}

// 1) 未来班期：取最近一个 >= today 的日期，并统计未来班期数
const scheduled = getDeparturePlan(
  base({ departureDate: '2026-10-14', departureDates: ['2026-10-14', '2026-10-16', '2026-10-18', '2026-10-20'] }),
  TODAY,
);
assert.equal(scheduled.status, 'scheduled');
assert.equal(scheduled.nextDate, '2026-10-18');
assert.equal(scheduled.upcomingCount, 2);
assert.equal(scheduled.totalCount, 4);
assert.equal(getDepartureLeadLabel(base({ departureDate: '2026-10-18' }), TODAY).tone, 'ok');

// 2) 全部过期：不再冒充"今天可出发"，也不塌成"待定"
const expired = getDeparturePlan(
  base({ departureDate: '2026-10-14', departureDates: ['2026-10-14', '2026-10-16'] }),
  TODAY,
);
assert.equal(expired.status, 'expired');
assert.equal(expired.nextDate, '');
assert.equal(getDepartureLeadLabel(base({ departureDate: '2026-10-14' }), TODAY).label, '现有班期均已结束');

// 3) 没有结构化班期：区分"来源标注不可靠"与"完全没有数据"
assert.equal(
  getDeparturePlan(base({ dataQuality: { isDepartureDateReliable: false } }), TODAY).status,
  'unconfirmed',
);
assert.equal(getDeparturePlan(base(), TODAY).status, 'unknown');
assert.equal(getDepartureLeadLabel(base(), TODAY).label, '班期待补充');

// 4) 班期密度文案只在有未来班期时出现
assert.equal(getDepartureCadenceLabel(expired), '');
assert.equal(getDepartureCadenceLabel(getDeparturePlan(base({ departureDate: '2026-10-19' }), TODAY)), '仅此一班');
assert.equal(
  getDepartureCadenceLabel(
    getDeparturePlan(base({ departureDates: ['2026-10-19', '2026-10-21', '2026-10-23'] }), TODAY),
  ),
  '未来还有 3 个班期',
);
assert.equal(
  getDepartureCadenceLabel(
    getDeparturePlan(
      base({ departureDates: Array.from({ length: 9 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`) }),
      TODAY,
    ),
  ),
  '未来还有 9 个班期可选',
);

// 5) 价格口径永远带上"按双人入住折算"，单房差是"另计"还是"未注明"必须说清
assert.equal(getPriceBasisLabel(base()), '按双人入住折算 / 人，单房差未注明');
assert.equal(
  getPriceBasisLabel(base({ singleSupplementNote: '若出现单男单女需补房差' })),
  '按双人入住折算 / 人，单房差另计',
);
assert.equal(getSingleSupplementAmountLabel(base({ singleSupplementNote: '参考价：补房差490元' })), '单房差约 ¥490');
assert.equal(getSingleSupplementAmountLabel(base({ singleSupplementNote: '需补房差，具体咨询客服' })), '');

// 6) 餐食：有计数就说计数；没有计数且原文是行程段落时不编
assert.equal(
  getMealSummary(base({ meta: { structuredDetails: { mealCounts: { breakfast: 2, lunch: 1, dinner: 0 } } } })).label,
  '含 早餐×2 · 午餐×1',
);
assert.equal(getMealSummary(base({ meals: '早餐后前往盘州，抵达后参观古银杏村' })).hasDetail, false);
assert.equal(getMealSummary(base({ meals: '午餐自理，晚餐自理' })).label, '多数餐需自理');

// 7) 交通：未知就不写，不猜
assert.equal(getTransportLabel(base({ transportType: '' })), '');
assert.equal(getTransportLabel(base({ transportType: '高铁往返' })), '高铁往返');

// 8) 差异点：按信息量排序，上车点优先；缺啥少啥
const facts = getDistinctFacts(
  base({
    boarding: { points: [{ name: '珠江新城B2' }, { name: '体育西' }, { name: '东圃' }], summary: '珠江新城B2 等3个上车点' },
    accommodationLevel: '五星酒店',
    groupSize: '20人成团',
    departureDate: '2026-10-19',
  }),
  TODAY,
);
assert.deepEqual(
  facts.map((fact) => fact.key),
  ['boarding', 'stay', 'group', 'cadence'],
);
assert.equal(facts[0].label, '珠江新城B2 等3个上车点');
assert.deepEqual(
  getDistinctFacts(base(), TODAY).map((fact) => fact.key),
  [],
);

console.log('tour facts tests passed');
