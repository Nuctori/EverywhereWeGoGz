// 站点排序：把「上车站集合 + 下车站集合」整理成一条不自交的行车顺序
//
// 背景：车盈网/智惠的下车站大量没有到站时间（车盈网 293/1191、智惠 1005/1010），
// 只能按坐标排；直接按接口顺序连线会乱穿（跨省线路尤其明显）。
// 规则：
//   1. 有时间且时间可用的段 → 按时间排（最可靠）；
//   2. 没有时间 / 时间倒挂的段 → 从上一个站点出发的最近邻（贪心 TSP），保证不断回头。
const R = 6371;
const rad = (d) => (d * Math.PI) / 180;

export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const toMin = (t) => {
  if (typeof t !== 'string' || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** 全部站点都有可用时间时按时间升序排（原数组顺序不可信，不乱序就丢弃太浪费）；否则返回 null */
function byTime(stops) {
  if (!stops.length) return null;
  const mins = stops.map((s) => toMin(s.arriveTime));
  if (mins.some((m) => m === null)) return null;
  return [...stops].sort((a, b) => toMin(a.arriveTime) - toMin(b.arriveTime));
}

/** 从 from 出发的最近邻顺序；from 为空时用首站兜底，避免 distanceKm 读到 null */
function nearestChain(from, stops) {
  if (!stops.length) return [];
  const left = [...stops];
  const out = [];
  let cursor = from ?? stops[0];
  while (left.length) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < left.length; i += 1) {
      const d = distanceKm(cursor, left[i]);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    const next = left.splice(best, 1)[0];
    out.push(next);
    cursor = next;
  }
  return out;
}

const centroid = (stops) => {
  if (!stops.length) return null;
  return {
    lat: stops.reduce((s, p) => s + p.lat, 0) / stops.length,
    lng: stops.reduce((s, p) => s + p.lng, 0) / stops.length,
  };
};

/**
 * 沿一个方向投影排序：跨省长线用这个最稳，不会在省份之间来回跳。
 * dir 用 degrees 表示（lat/lng 分量），内部换算成平面距离近似。
 */
function projectOrder(anchor, dir, stops) {
  const len = Math.hypot(dir.lat, dir.lng);
  if (!len || stops.length < 2) return null;
  const dLat = dir.lat / len;
  const dLng = dir.lng / len;
  const cos = Math.cos((anchor.lat * Math.PI) / 180);
  const proj = (p) => (p.lat - anchor.lat) * dLat + (p.lng - anchor.lng) * cos * dLng;
  const sorted = [...stops].sort((a, b) => proj(a) - proj(b));
  // 全部点几乎在同一投影位置（退化）时交给最近邻
  if (Math.abs(proj(sorted[sorted.length - 1]) - proj(sorted[0])) < 0.5) return null;
  return sorted;
}

/** 下车段排序：优先沿"上车站尾部 → 下车站质心"方向（代表车的真实去向），退化再用上车站首尾方向，最后最近邻 */
function orderAlighting(board, alighting) {
  if (alighting.length < 2) return alighting;
  const tail = board[board.length - 1] ?? null;
  // 没有上车站（数据异常）时用下车站自身的质心当锚点，不能传 null
  if (!tail) return nearestChain(centroid(alighting), alighting);

  const center = centroid(alighting);
  if (center) {
    const ordered = projectOrder(tail, { lat: center.lat - tail.lat, lng: center.lng - tail.lng }, alighting);
    if (ordered) return ordered;
  }
  if (board.length >= 2) {
    const head = board[0];
    const dir = { lat: tail.lat - head.lat, lng: tail.lng - head.lng };
    const ordered = projectOrder(tail, dir, alighting);
    if (ordered) return ordered;
  }
  return nearestChain(tail, alighting);
}

/** 路径总长，用于衡量顺序优劣 */
export function pathLengthKm(stops) {
  let total = 0;
  for (let i = 1; i < stops.length; i += 1) total += distanceKm(stops[i - 1], stops[i]);
  return total;
}

/**
 * @param {{boarding: any[], alighting: any[]}} input
 * @returns {any[]} 排好序的站点（board 在前、alight 在后）
 */
export function orderStops({ boarding, alighting }) {
  const board = byTime(boarding) ?? nearestChain(centroid(boarding) ?? boarding[0] ?? null, boarding);
  const tail = board[board.length - 1] ?? null;

  // 下车站：时间可用且整体晚于上车站末尾 → 用时间；否则按行进方向投影，最后退到最近邻
  let alight = null;
  const boardLastMin = board.length ? toMin(board[board.length - 1].arriveTime) : null;
  const timeOrdered = byTime(alighting);
  if (timeOrdered && timeOrdered.length) {
    const firstMin = toMin(timeOrdered[0].arriveTime);
    if (boardLastMin === null || firstMin === null || firstMin >= boardLastMin) alight = timeOrdered;
  }
  if (!alight) alight = orderAlighting(board, alighting);

  return [...board, ...alight];
}

/**
 * 判断上车站是不是"并联接驳"：农村线路会把几十个村口在同一时刻一起接人，
 * 它们不是行车顺序，把这些点串成一条折线必然乱穿。
 */
export function isFeederBoarding(boarding) {
  if (boarding.length <= 12) return false;
  const distinctTimes = new Set(boarding.map((s) => s.arriveTime || '--')).size;
  return distinctTimes / boarding.length < 0.6;
}

/**
 * 站点顺序 + 连线分段。
 * 普通线路不返回 segments（前端默认逐点连线）；并联接驳线路只连"最晚上车点 → 下车链"，
 * 其余上车点只画点不连线，避免一屏乱线。
 */
export function orderAndSegment({ boarding, alighting }) {
  const ordered = orderStops({ boarding, alighting });
  if (!isFeederBoarding(boarding) || alighting.length === 0) return { stops: ordered, segments: null };

  const boardCount = ordered.length - alighting.length;
  const start = Math.max(0, boardCount - 1);
  const segments = [];
  for (let i = start; i < ordered.length - 1; i += 1) segments.push([i, i + 1]);
  return { stops: ordered, segments };
}

