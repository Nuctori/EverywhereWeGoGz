import assert from 'node:assert/strict';
import { resolveSourceDetailUrl } from '../src/lib/source-detail-url.ts';

const staleGroupUrl = 'http://www.jrt365.com/tourgroup/tourgroup_ziliao.aspx?groupno=OLD';

assert.equal(
  resolveSourceDetailUrl({
    source: '假日通',
    title: '金水台温泉2天（含晚）',
    bookingUrl: staleGroupUrl,
    meta: { sourceAttributes: { printUrl: 'http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=233M958001' } },
  }),
  'http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=233M958001',
  'JRT365 should prefer the stable print URL over a rotating group URL',
);

assert.equal(
  resolveSourceDetailUrl({
    source: '假日通',
    title: '金水台温泉2天（含晚）',
    bookingUrl: staleGroupUrl,
    meta: { sourceAttributes: { tournameno: '233M958001' } },
  }),
  'http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=233M958001',
  'JRT365 should derive the stable print URL from tournameno',
);

assert.equal(
  resolveSourceDetailUrl({
    source: '假日通',
    title: '金水台温泉2天（含晚）',
    bookingUrl: staleGroupUrl,
    meta: { sourceAttributes: { printUrl: 'javascript:alert(1)', tournameno: '' } },
  }),
  'http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=%E9%87%91%E6%B0%B4%E5%8F%B0%E6%B8%A9%E6%B3%892%E5%A4%A9%EF%BC%88%E5%90%AB%E6%99%9A%EF%BC%89',
  'invalid stable URLs should fall back to a title search instead of opening a stale group URL',
);

const otherSourceUrl = 'https://example.com/tour';
assert.equal(
  resolveSourceDetailUrl({ source: '康辉', title: '测试线路', bookingUrl: otherSourceUrl }),
  otherSourceUrl,
  'other sources should keep their existing booking URL behavior',
);

assert.equal(
  resolveSourceDetailUrl({ source: '假日通', title: '旧线路', bookingUrl: staleGroupUrl }),
  'http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=%E6%97%A7%E7%BA%BF%E8%B7%AF',
  'deep-link summaries without source metadata should use title search',
);

console.log('Source detail URL tests passed.');
