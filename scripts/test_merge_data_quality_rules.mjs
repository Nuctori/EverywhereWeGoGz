import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const script = String.raw`
import sys

sys.path.insert(0, "scripts")
import merge_data

# make_tour_key 不依赖 sourceId/URL：同一实体（source|title|price）必须折叠成同一键，
# 无论记录带不带康辉旧站的 prodcode 字段。
with_id = {
    "source": "康辉",
    "sourceId": "SP021374955",
    "url": "http://gz.cctpage.com/PC/TourLine/Details?prodcode=SP021374955",
    "title": "单订房 三英温泉",
    "price": 1999,
}
url_only = {
    "source": "康辉",
    "url": "http://gz.cctpage.com/PC/TourLine/Details?prodcode=sp021374955",
    "title": "单订房 三英温泉",
    "price": 1999,
}
assert merge_data.make_tour_key(with_id) == merge_data.make_tour_key(url_only)

# boarding_url_key 归一化：host 差异（www/m）折叠，query 保留（360jlb/jrt365 的实体 id 在 query）
assert (
    merge_data.boarding_url_key("https://www.gdcts.com/product/line/detail/id/43708")
    == merge_data.boarding_url_key("http://m.gdcts.com/product/line/detail/id/43708")
)
assert (
    merge_data.boarding_url_key("https://www.outdoors.com.cn/route/linedetail/id/1.html?did=9")
    == "outdoors:route:1"
)
assert (
    merge_data.boarding_url_key("https://m.360jlb.com/m/event?id=100")
    != merge_data.boarding_url_key("https://m.360jlb.com/m/event?id=200")
)

# 结构化发团日期判定
assert merge_data.has_structured_departure_dates({"departureDates": ["2026-05-06"]})
assert not merge_data.has_structured_departure_dates({"departureDates": ["bad-date"]})
assert not merge_data.has_structured_departure_dates({})
`;

const result = spawnSync('python', ['-c', script], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

assert.equal(result.status, 0, result.stderr || result.stdout);
console.log('merge data quality rule tests passed');
