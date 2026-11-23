// 站点巴士图层的几何工具：城市间示意弧线 + 坐标系统换算。
//
// 为什么需要单独的模块：滴滴给的是 GCJ-02，而地图底图可能是 GCJ-02（高德）也可能是
// WGS-84（OSM）。同一个站点在两套底图上的位置必须各自正确，否则线路会整体偏几百米。
import { gcj02ToWgs84, wgs84ToGcj02, type MapTileProvider } from './map-tile-pool';

export type BusGeoPoint = { lat: number; lng: number };

/** GCJ-02 与 WGS-84 往返换算允许的误差上限（度）。约 0.1 米，远小于视觉可辨距离。 */
export const GCJ02_TO_WGS84_TOLERANCE = 1e-6;

const MIN_ARC_LENGTH = 1e-9;

/**
 * 把两座城市之间的线路画成一条向一侧弯曲的二次贝塞尔弧线。
 *
 * 直线连接会让同一出发城市的多条线路完全重叠，弧线让它们在视觉上可以分开。
 * 弯向固定为"更大纬度"（内陆）那一侧：广东的海岸线在南边，往北鼓才能让
 * 广州→湛江、广州→香港这类线路不横穿北部湾和珠江口，看起来像巴士开进了海里。
 *
 * 返回值是 [lat, lng] 序列，首尾严格等于入参，方便端点标记与之对齐。
 */
export function buildBusRouteArc(
  start: BusGeoPoint,
  end: BusGeoPoint,
  { samples = 24, bow = 0.18 }: { samples?: number; bow?: number } = {},
): Array<[number, number]> {
  const latDelta = end.lat - start.lat;
  const lngDelta = end.lng - start.lng;
  // 经度一度对应的实际距离随纬度收缩；在同一坐标系里按 cos(纬度) 缩放才不会把弧线画歪。
  const lngScale = Math.cos((((start.lat + end.lat) / 2) * Math.PI) / 180) || 1;
  const x = lngDelta * lngScale;
  const y = latDelta;
  const length = Math.hypot(x, y);

  if (!Number.isFinite(length) || length <= MIN_ARC_LENGTH) {
    return [[start.lat, start.lng], [end.lat, end.lng]];
  }

  // 控制点 = 弦中点 + 垂直方向位移，方向取"纬度更高"的一侧；
  // 二次贝塞尔在中点的偏移正好是控制点位移的一半。
  const side = x >= 0 ? 1 : -1;
  const controlLat = (start.lat + end.lat) / 2 + Math.abs(x) * bow;
  const controlLng = (start.lng + end.lng) / 2 - (y * bow * side) / lngScale;

  const points: Array<[number, number]> = [];
  for (let step = 0; step <= samples; step += 1) {
    const t = step / samples;
    const remaining = 1 - t;
    points.push([
      remaining * remaining * start.lat + 2 * remaining * t * controlLat + t * t * end.lat,
      remaining * remaining * start.lng + 2 * remaining * t * controlLng + t * t * end.lng,
    ]);
  }
  // 浮点运算会让首尾差一点点；端点必须与城市标记重合，所以直接写回原值。
  points[0] = [start.lat, start.lng];
  points[points.length - 1] = [end.lat, end.lng];
  return points;
}

/**
 * 把一条线路串成"走廊"折线：城市中心 → 出发城市的所有上车点 → 目的地城市的所有下车点 → 城市中心。
 *
 * 每条线的上下车点本身就是这趟车的沿途站点，所以连线应该穿过它们，而不是在两座城市之间
 * 凭空弯一道。站点列表没有官方顺序，这里按"沿起终城市连线的前进方向"排序，
 * 保证折线一路向前不折返；连线因此贴着真实站点走，不会拐进海里。
 */
export function buildBusRouteCorridor(
  from: BusGeoPoint,
  fromStops: BusGeoPoint[],
  toStops: BusGeoPoint[],
  to: BusGeoPoint,
  { minStep = 5e-4 }: { minStep?: number } = {},
): Array<[number, number]> {
  // 经度一度对应的实际距离随纬度收缩，投影时按 cos(纬度) 缩放，排序才不会被经度差带偏。
  const lngScale = Math.cos((from.lat * Math.PI) / 180) || 1;
  const dirLat = to.lat - from.lat;
  const dirLng = (to.lng - from.lng) * lngScale;
  const project = (point: BusGeoPoint) =>
    (point.lat - from.lat) * dirLat + (point.lng - from.lng) * lngScale * dirLng;
  const order = (points: BusGeoPoint[]) => [...points].sort((left, right) => project(left) - project(right));

  // 城市中心和站点一起排序：城市中心不在两端也没关系，折线只按行进方向串起所有真实站点，
  // 不会为了"从市中心出发"而先往回折。
  const path = order([from, ...fromStops, ...toStops, to]);
  const corridor: Array<[number, number]> = [];
  for (const point of path) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
    const previous = corridor[corridor.length - 1];
    // 同一个站点在城市中心和站点列表里重复出现时只留一个顶点，避免零长度线段。
    if (previous && Math.abs(previous[0] - point.lat) < minStep && Math.abs(previous[1] - point.lng) < minStep) {
      continue;
    }
    corridor.push([point.lat, point.lng]);
  }
  if (corridor.length < 2) return [[from.lat, from.lng], [to.lat, to.lng]];
  return corridor;
}

/** 把 GCJ-02 的巴士坐标换算到底图使用的坐标系。 */
export function busPointForProvider(point: BusGeoPoint, provider: MapTileProvider): [number, number] {
  if (provider.coordinateSystem === 'gcj02') return [point.lat, point.lng];
  return gcj02ToWgs84(point.lat, point.lng);
}

/** 乔巴士站点是 WGS-84（OSM/Nominatim），高德底图要 GCJ-02，方向与上面相反。 */
export function wgs84PointForProvider(point: BusGeoPoint, provider: MapTileProvider): [number, number] {
  if (provider.coordinateSystem === 'gcj02') {
    return wgs84ToGcj02(point.lat, point.lng) as [number, number];
  }
  return [point.lat, point.lng];
}
