import type { LatLngExpression } from 'leaflet';

export type MapTileProvider = {
  id: string;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string;
  coordinateSystem: 'wgs84' | 'gcj02';
};

// 高德直连瓦片不需要 API key，但不是官方 JS API 接入；后续如有 key 可替换为正式服务。
export const MAP_TILE_PROVIDERS: MapTileProvider[] = [
  {
    id: 'amap-direct',
    label: '高德底图',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=8&x={x}&y={y}&z={z}',
    attribution: '&copy; 高德地图',
    subdomains: '1234',
    coordinateSystem: 'gcj02',
  },
  {
    id: 'osm-bfsu',
    label: 'OpenStreetMap 国内镜像',
    url: 'https://tile.openstreetmap.bfsu.edu.cn/osm/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    coordinateSystem: 'wgs84',
  },
  {
    id: 'osm-bjtu',
    label: 'OpenStreetMap 国内镜像',
    url: 'https://tile.openstreetmap.bjtu.edu.cn/osm/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    coordinateSystem: 'wgs84',
  },
  {
    id: 'osm-official',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    coordinateSystem: 'wgs84',
  },
];

const PI = Math.PI;
const AXIS = 6378245.0;
const OFFSET = 0.00669342162296594323;

function transformLatitude(x: number, y: number) {
  let result = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  result += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3;
  result += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3;
  return result;
}

function transformLongitude(x: number, y: number) {
  let result = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  result += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3;
  result += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3;
  return result;
}

export function wgs84ToGcj02(latitude: number, longitude: number): LatLngExpression {
  if (longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271) {
    return [latitude, longitude];
  }

  const deltaLatitude = transformLatitude(longitude - 105, latitude - 35);
  const deltaLongitude = transformLongitude(longitude - 105, latitude - 35);
  const radLatitude = latitude / 180 * PI;
  const magic = 1 - OFFSET * Math.sin(radLatitude) ** 2;
  const sqrtMagic = Math.sqrt(magic);
  return [
    latitude + (deltaLatitude * 180) / ((AXIS * (1 - OFFSET)) / (magic * sqrtMagic) * PI),
    longitude + (deltaLongitude * 180) / (AXIS / sqrtMagic * Math.cos(radLatitude) * PI),
  ];
}
