import assert from 'node:assert/strict';
import { formatDepartureDateToggleLabel } from '@/lib/departure-date-display';

assert.equal(formatDepartureDateToggleLabel(0, false), '');
assert.equal(formatDepartureDateToggleLabel(1, false), '查看全部 1 个团期');
assert.equal(formatDepartureDateToggleLabel(18, false), '查看全部 18 个团期');
assert.equal(formatDepartureDateToggleLabel(18, true), '收起团期');

console.log('departure date display tests passed');
