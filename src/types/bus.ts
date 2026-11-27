// 站点巴士（滴滴）图层的数据模型，与 scripts/build_bus_routes.mjs 的生成物一一对应。
// 数据是 GCJ-02：渲染前必须按底图坐标系换算，见 lib/bus-route-geometry.ts。

/** 一个可用上/下车点。name 是站点全名，county 是区县名（原接口不一定给）。 */
/** 乔巴士线路上的一个站点（坐标是 WGS-84，来自 OSM/Nominatim）。 */
export type BusLineStop = {
  name: string;
  lat: number;
  lng: number;
  role: 'board' | 'alight';
  /** 定位精度：node=按地名精确命中，county/city=退到区县/城市中心 */
  precision?: 'node' | 'county' | 'city';
  arriveTime?: string;
  adcode?: string;
};

/** 一条真实线路：有名字、有班次、有一串有序站点。 */
export type BusLine = {
  id: string;
  name: string;
  /** 每条线路自己的坐标系：乔巴士是 WGS-84，滴滴是 GCJ-02，不能混。 */
  coordinateSystem: 'wgs84' | 'gcj02';
  date?: string;
  originCity?: string;
  destinationCity?: string;
  departTimes: string[];
  priceFen: number | null;
  carrier?: string;
  /** 独立供应商标签（智惠大巴聚合多家：gzl/kgyx/dadui/tbs/ylx），主源线路为空 */
  supplier?: string;
  supplierLabel?: string;
  provinceCode?: string;
  stops: BusLineStop[];
  /**
   * 班次分段：每对是 stops 的下标 [上车站, 下车站]，一段就是一次真实行程。
   * 创想巴士这类一条线路几十个上下车点的来源必须给这个——按 stops 串折线会把同一班车
   * 画成横穿两座城市；没有该字段的老来源仍按 stops 画。
   */
  segments?: [number, number][];
};

export type BusLineData = {
  generatedAt: string;
  source: { providers: string[]; raw?: string[] };
  routes: BusLine[];
};

export type BusStation = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  county: string;
};

/** 出发城市：自身也是城市中心坐标 + 全部可用站点。 */
export type BusOriginCity = {
  cityId: number;
  name: string;
  lat: number;
  lng: number;
  stations: BusStation[];
};

/**
 * 一条「出发城市 → 到达城市」的线路。
 * 只表示两城之间有站点巴士，不含站点序列，所以地图上按弧线示意。
 */
export type BusRoute = {
  id: string;
  originCityId: number;
  destination: {
    cityId: number;
    name: string;
    lat: number;
    lng: number;
    stationCount: number;
    /**
     * 到达城市所在省份的两位行政区划前缀：44 广东、45 广西、81 香港。
     * 取不到区县代码时是 'unknown'，按"非广东"处理，绝不默认当省内线路。
     */
    provinceCode: string;
  };
  /** 到达城市可用上下车点 */
  stations: BusStation[];
};

export type BusRouteData = {
  generatedAt: string;
  coordinateSystem: 'gcj02';
  source: {
    provider: string;
    api: string;
    pulledAt: string;
    note: string;
  };
  origins: BusOriginCity[];
  routes: BusRoute[];
};
