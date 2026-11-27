// 站点排序的边界契约：缺时间、空数组、时间倒挂都不能抛错；并联接驳只连主干
import assert from 'node:assert/strict';
import { orderStops, orderAndSegment, isFeederBoarding, pathLengthKm, distanceKm } from './stop-order.mjs';

const stop = (name, lat, lng, time, role = 'board') => ({ name, lat, lng, role, arriveTime: time });

// 1) 空输入
assert.deepEqual(orderStops({ boarding: [], alighting: [] }), []);
assert.deepEqual(orderAndSegment({ boarding: [], alighting: [] }).stops, []);

// 2) 上车站全无时间（原来会 nearestChain(null, …) 抛 TypeError）
const noTimeBoard = [stop('A', 23.1, 113.2, ''), stop('B', 23.3, 113.4, '')];
const r2 = orderStops({ boarding: noTimeBoard, alighting: [stop('C', 23.5, 113.6, '', 'alight')] });
assert.equal(r2.length, 3, '上车站无时间时仍要输出全部站点');

// 3) 下车站为空（原来 byTime([]) 为真值后取 [0].arriveTime 抛错）
const r3 = orderStops({ boarding: [stop('A', 23.1, 113.2, '07:00')], alighting: [] });
assert.equal(r3.length, 1);

// 4) 上车站时间倒挂，走兜底路径
const reversed = [stop('A', 23.1, 113.2, '08:00'), stop('B', 23.2, 113.3, '07:00')];
const r4 = orderStops({ boarding: reversed, alighting: [] });
assert.equal(r4.length, 2);

// 5) 正常线路：上车站按时间排
const r5 = orderStops({
  boarding: [stop('P2', 23.2, 113.3, '07:10'), stop('P1', 23.1, 113.2, '07:00')],
  alighting: [stop('Q1', 22.5, 113.0, '09:00', 'alight')],
});
assert.deepEqual(r5.map((s) => s.name), ['P1', 'P2', 'Q1']);

// 6) 下车站无时间：沿行进方向投影，不能比首末直线还绕
const board = [stop('P1', 23.0, 113.0, '07:00'), stop('P2', 23.5, 113.2, '08:00')];
const alight = [
  stop('Q3', 21.0, 112.0, '', 'alight'),
  stop('Q1', 22.0, 112.5, '', 'alight'),
  stop('Q2', 21.5, 112.2, '', 'alight'),
];
const r6 = orderStops({ boarding: board, alighting: alight });
assert.deepEqual(r6.slice(2).map((s) => s.name), ['Q1', 'Q2', 'Q3'], '下车站应按行进方向由近及远');

// 7) 并联接驳：判定为 feeder 且只连主干
const feeder = Array.from({ length: 20 }, (_, i) => stop(`村${i}`, 23 + i * 0.01, 113 + i * 0.01, i < 15 ? '06:30' : '07:00'));
assert.equal(isFeederBoarding(feeder), true);
const r7 = orderAndSegment({ boarding: feeder, alighting: [stop('终点', 22.0, 112.0, '', 'alight')] });
assert.ok(Array.isArray(r7.segments) && r7.segments.length > 0, 'feeder 线路要返回主干分段');
assert.equal(r7.segments[0][0], feeder.length - 1, '主干应从最晚上车点开始');
assert.equal(r7.stops.length, feeder.length + 1);

// 8) 普通线路不设 segments（前端默认逐点连线）
const r8 = orderAndSegment({ boarding: board, alighting: alight });
assert.equal(r8.segments, null);

// 9) 距离与路径长度基本正确（广州→深圳直线约 100km）
const gz = { lat: 23.13, lng: 113.26 };
const sz = { lat: 22.54, lng: 114.06 };
const d = distanceKm(gz, sz);
assert.ok(d > 90 && d < 130, `广州→深圳距离异常: ${d}`);
assert.ok(pathLengthKm([gz, sz, gz]) > d * 1.9);

console.log('[stop-order] OK 9 组边界用例');
