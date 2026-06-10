export function computeRequiredOutputCount(rule, rawCount) {
  const dynamicMin = rawCount > 0 ? Math.floor(rawCount * rule.ratio) : 0;
  const baseline = Math.max(rule.min, dynamicMin);

  if (rawCount > 0) {
    return Math.min(rawCount, baseline);
  }

  return baseline;
}
