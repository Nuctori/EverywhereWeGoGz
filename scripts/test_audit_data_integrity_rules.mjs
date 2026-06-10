import assert from 'node:assert/strict';

import { computeRequiredOutputCount } from './audit_data_integrity_rules.mjs';

assert.equal(
  computeRequiredOutputCount({ min: 35, ratio: 0.75 }, 34),
  34,
  'required count should not exceed the raw unique count',
);

assert.equal(
  computeRequiredOutputCount({ min: 120, ratio: 0.75 }, 150),
  120,
  'absolute minimum should still apply when the raw count can satisfy it',
);

assert.equal(
  computeRequiredOutputCount({ min: 50, ratio: 0.45 }, 240),
  108,
  'dynamic ratio floor should still raise the requirement when it is higher than the minimum',
);

assert.equal(
  computeRequiredOutputCount({ min: 35, ratio: 0.75 }, 0),
  35,
  'sources with no raw count should keep the configured minimum',
);

console.log('audit data integrity rule tests passed');
