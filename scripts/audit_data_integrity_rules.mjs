export function computeRequiredOutputCount(rule, rawCount) {
  if (!rawCount) {
    return rule.min;
  }

  const ratioMin = Math.floor(rawCount * rule.ratio);
  // 比例门禁在所有情况下都成立：抓到的 raw 里，管线至少要留下 ratio 份额。
  // 绝对下限只在 raw 自己达标（rawCount >= min）时才叠加。否则
  // min(rawCount, max(min, ratio*raw)) 会收缩成 rawCount 本身，把「至少保留 60%」
  // 悄悄收严成「必须保留 100%」——而 merge 必然要去重/过滤，某源一旦缩到 min 以下
  // 就永远过不去（2026-10 天涯户外 173/174、167/168 连续三轮红灯即由此而来）。
  const baseline = rawCount >= rule.min ? Math.max(rule.min, ratioMin) : ratioMin;

  return Math.min(rawCount, baseline);
}
