# OSM POI 索引

`public/data/osm-poi-index.json` 是零 Key 的地点补全主源。它只保存酒店、度假村、民宿和旅行景点的最小字段：OSM ID、名称/别名、类别、WGS84 坐标与可用地址。

原始 PBF 仅在 GitHub Actions 的临时目录下载和解析，不写入仓库、不进入 GitHub Pages 产物。月度工作流从 `scripts/osm-poi-regions.json` 指定的省级 Geofabrik 提取构建索引；每周线路刷新直接读取已提交的索引。

匹配必须命中具体地点名。没有名称、仅“当地酒店/参考酒店”等住宿描述，或存在无法消除的同名歧义时，不会写入酒店级坐标。坐标源为 `osm` 时，地图显示 OpenStreetMap contributors 归属。
