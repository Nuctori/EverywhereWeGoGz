import assert from 'node:assert/strict';
import {
  buildTourDestinationSearchCorpus,
  collectDestinationHints,
  destinationHintsMatchCorpus,
  resolveTourDestination,
} from '../src/lib/destination-resolver.ts';
import { decideSearchAction, getPrimarySearchAction } from '../src/lib/search-routing.ts';

const hints = collectDestinationHints('沙扒湾');
assert.ok(hints.includes('广东'), `expected 沙扒湾 to resolve to 广东, got ${JSON.stringify(hints)}`);
assert.equal(destinationHintsMatchCorpus(['广东'], '广州 沙扒湾 海边度假'), true);
assert.equal(destinationHintsMatchCorpus(['广东'], '广西 北海'), false);

const testTour = {
  destination: '其他',
  title: '阳江沙扒湾海边亲子团',
  highlights: ['沙扒湾必打卡', '海边度假', '其他'],
};

assert.equal(resolveTourDestination(testTour), '广东');
assert.match(buildTourDestinationSearchCorpus(testTour), /广东/);
assert.match(buildTourDestinationSearchCorpus(testTour), /阳江沙扒湾海边亲子团/);

assert.equal(decideSearchAction('三亚').reason, 'destination_only');
assert.equal(getPrimarySearchAction('三亚'), 'plain');
assert.equal(decideSearchAction('沙扒湾').reason, 'destination_only');
assert.equal(getPrimarySearchAction('沙扒湾'), 'plain');
assert.equal(decideSearchAction('帮我找沙扒湾').reason, 'destination_only');
assert.equal(getPrimarySearchAction('帮我找沙扒湾'), 'plain');
assert.equal(decideSearchAction('香港').reason, 'destination_only');
assert.equal(getPrimarySearchAction('香港'), 'plain');
assert.equal(decideSearchAction('三亚亲子').reason, 'destination_only');
assert.equal(getPrimarySearchAction('三亚亲子'), 'plain');
assert.equal(decideSearchAction('预算3000内').reason, 'hard_constraints');
assert.equal(getPrimarySearchAction('预算3000内'), 'ai');
assert.equal(decideSearchAction('想去海边').reason, 'plain');
assert.equal(getPrimarySearchAction('想去海边'), 'plain');
assert.equal(decideSearchAction('帮我找同时带温泉和沙滩，预算800内，最好2天游').reason, 'hard_constraints');
assert.equal(getPrimarySearchAction('帮我找同时带温泉和沙滩，预算800内，最好2天游'), 'ai');
assert.equal(decideSearchAction('广州出发，国庆后，爸妈同行，想轻松一点，最好5-7天，预算3000左右').reason, 'hard_constraints');
assert.equal(getPrimarySearchAction('广州出发，国庆后，爸妈同行，想轻松一点，最好5-7天，预算3000左右'), 'ai');
assert.ok(collectDestinationHints('香港').includes('港澳'));
assert.ok(collectDestinationHints('澳门').includes('港澳'));

const hongKongTour = {
  destination: '其他',
  title: '香港迪士尼亲子4日游',
  highlights: ['香港乐园', '亲子'],
};

assert.equal(resolveTourDestination(hongKongTour), '港澳');
assert.match(buildTourDestinationSearchCorpus(hongKongTour), /港澳/);

console.log('destination alias checks passed');
