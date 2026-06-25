import assert from 'node:assert/strict';
import { findTourByDeepLink, getRequestedTourId } from '@/lib/tour-deeplink';
import type { TourSummary } from '@/types/tour';

const tours: TourSummary[] = [
  {
    id: 'tour_2705',
    title: '北海涠洲岛动车4天',
    source: '广之旅',
    destination: '广西',
    duration: 4,
    price: 2399,
    priceUnit: '元/人',
    departureDate: '2026-06-25',
    transportType: '动车往返',
    accommodationLevel: '舒适型',
    meals: '4早餐2正餐',
    singleSupplementNote: '',
    highlights: ['涠洲岛', '蓝眼泪'],
    rating: 0,
    bookingUrl: 'https://example.com/tour_2705',
    images: ['https://example.com/2705.jpg'],
    tags: ['海岛'],
    isHot: true,
    isNew: false,
    isFlashSale: false,
    groupSize: '20人',
    theme: '海岛度假',
    leisureLevel: 'easy',
    suitableFor: ['情侣'],
    season: '夏季',
  },
];

assert.equal(getRequestedTourId('?tour=tour_2705&source=wechat'), 'tour_2705');
assert.equal(getRequestedTourId('tour=tour_2705'), 'tour_2705');
assert.equal(getRequestedTourId('?source=wechat'), '');
assert.equal(findTourByDeepLink('?tour=tour_2705&source=wechat', tours)?.id, 'tour_2705');
assert.equal(findTourByDeepLink('?tour=tour_missing', tours), null);

console.log('tour deeplink tests passed');
