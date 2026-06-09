import { strict as assert } from 'node:assert';
import {
  buildTitleSummary,
  getDepartureDateBadgeLabel,
  getReadableDestination,
  getReadableHighlights,
  getReadableTheme,
} from '../src/lib/tour-display.ts';
import type { Tour } from '../src/types/tour.ts';

function candidate(overrides: Partial<Tour> = {}): Tour {
  return {
    id: 'tour-display-test',
    title: '默认线路',
    source: '测试源',
    destination: '广东',
    duration: 3,
    price: 399,
    priceUnit: '人',
    departureDate: '2026-06-12',
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
    departureDates: ['2026-06-12'],
    hotDepartureDates: [],
    ...overrides,
  };
}

assert.equal(
  getReadableDestination(candidate({
    destination: '其他',
    highlights: ['其他必打卡', '特色美食', '精品住宿'],
  })),
  '以线路标题为准',
);

assert.equal(
  getReadableDestination(candidate({
    destination: '其他',
    highlights: ['巽寮湾', '沙滩', '精品住宿'],
  })),
  '巽寮湾',
);

assert.deepEqual(
  getReadableHighlights(candidate({
    highlights: ['其他必打卡', '盐洲岛', '精品住宿', '盐洲岛'],
  })),
  ['盐洲岛'],
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
  '3天 · 温泉 · 大巴',
);

console.log('Display semantics audit passed');
