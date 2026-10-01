// ?????????????????????????????????
import { strict as assert } from 'node:assert';
import {
  buildTitleSummary,
  getDepartureDateBadgeLabel,
  getReadableDestination,
  getReadableHighlights,
  getReadableTheme,
} from '../src/lib/tour-display.ts';
import { compareRecommended } from '../src/lib/tour-recommendation.ts';
import type { Tour } from '../src/types/tour.ts';

// 夹具日期相对今天生成：写死的日期会过期（2026-06 的夹具到 10 月已全是
// 过去时，getUpcomingDates 过滤后排序断言全变平），这是上一轮审计静默变红的根因。
function futureDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

function candidate(overrides: Partial<Tour> = {}): Tour {
  return {
    id: 'tour-display-test',
    title: '默认线路',
    source: '测试源',
    destination: '广东',
    duration: 3,
    price: 399,
    priceUnit: '人',
    departureDate: futureDate(10),
    transportType: '大巴往返',
    accommodationLevel: '舒适型',
    meals: '含早',
    singleSupplementNote: '',
    highlights: [],
    rating: 0,
    bookingUrl: '',
    images: [],
    tags: [],
    isHot: false,
    isNew: false,
    isFlashSale: false,
    groupSize: '30人',
    theme: '自然风光',
    leisureLevel: 'easy',
    suitableFor: [],
    season: '全年',
    departureDates: [futureDate(10)],
    hotDepartureDates: [],
    ...overrides,
  };
}

assert.equal(
  getReadableDestination(candidate({
    destination: '其他',
    highlights: ['其他必打卡', '特色美食', '精品住宿'],
  })),
  '目的地待确认',
);

assert.equal(
  getReadableDestination(candidate({
    destination: '其他',
    highlights: ['巽寮湾', '沙滩', '精品住宿'],
  })),
  '巽寮湾',
);

assert.equal(
  getReadableDestination(candidate({
    destination: '广东',
    title: '【典·休闲】广西、中越边境崇左动车3天',
    highlights: ['德天跨国瀑布', '明仕田园'],
  })),
  '广西',
);

assert.equal(
  getReadableDestination(candidate({
    destination: '其他',
    title: '【越南全景】河内、下龙湾、会安古镇、胡志明、芽庄、美奈、单动双飞9天',
    highlights: ['下龙湾', '会安古镇'],
  })),
  '越南',
);

assert.equal(
  getReadableDestination(candidate({
    destination: '广东',
    title: '【颂·休闲】安心越南、胡志明、美奈、芽庄、河内6天＊南北四城＊正点航班广州往返',
    highlights: ['胡志明', '芽庄'],
  })),
  '越南',
);

assert.equal(
  getReadableDestination(candidate({
    destination: '桂林',
    title: '【尚·联游】越南河内、下龙湾、柬埔寨金边、吴哥、单动双飞7天',
    highlights: ['产品特色', '海上桂林【下龙湾】'],
  })),
  '越南',
);

assert.equal(
  getReadableDestination(candidate({
    destination: '广东',
    title: '英德天樾王国酒店3天(食4餐)',
    highlights: ['其他必打卡', '特色美食', '精品住宿'],
  })),
  '广东',
);

assert.deepEqual(
  getReadableHighlights(candidate({
    highlights: ['其他必打卡', '盐洲岛', '精品住宿', '盐洲岛'],
  })),
  ['盐洲岛'],
);

assert.deepEqual(
  getReadableHighlights(candidate({
    destination: '广东',
    highlights: ['广东必打卡', '精品住宿'],
  })),
  [],
);

assert.equal(
  getDepartureDateBadgeLabel(candidate({
    departureDate: '',
    departureDates: [],
    dataQuality: {
      hasStructuredDepartureDates: false,
      isDepartureDateReliable: false,
      availabilityConfidence: 'medium',
      riskFlags: ['missing_structured_schedule'],
    },
  })),
  '班期待确认',
);

assert.equal(
  getDepartureDateBadgeLabel(candidate({
    departureDate: '2026-05-30',
    departureDates: ['2026-05-30', '2026-06-01'],
  })),
  '班期已过',
);

assert.equal(
  getReadableTheme(candidate({
    title: '龙门温泉3天',
    theme: '海岛度假',
    tags: ['海岛度假'],
    highlights: ['精品住宿'],
  })),
  '温泉泡汤',
);

assert.equal(
  buildTitleSummary(candidate({
    destination: '其他',
    title: '龙门温泉3天',
    highlights: ['其他必打卡'],
    theme: '温泉',
    transportType: '大巴往返',
  })),
  // 龙门自 2026-09 起归入惠州别名族（relevance 修复 ed9ce3432）：标题能解析出
  // 归属地时，摘要带上归属地比空缺更可读。
  '惠州 · 3天 · 温泉 · 大巴',
);

const tourWithUpcoming = candidate({
  title: '普通线路',
  departureDate: futureDate(2),
  departureDates: [futureDate(2), futureDate(18)],
});
const tourWithPastOnly = candidate({
  title: '已过期线路',
  departureDate: '2020-01-01',
  departureDates: ['2020-01-01'],
});

assert.equal(
  compareRecommended(tourWithUpcoming, tourWithPastOnly, []),
  -compareRecommended(tourWithPastOnly, tourWithUpcoming, []),
);
assert.ok(compareRecommended(tourWithUpcoming, tourWithPastOnly, []) < 0);

console.log('Display semantics audit passed');
