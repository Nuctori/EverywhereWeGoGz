import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const script = String.raw`
import sys
from datetime import date

sys.path.insert(0, "scripts")
import merge_data

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
assert merge_data.extract_kanghui_prodcode(url_only["url"]) == "SP021374955"

today = date(2026, 7, 3)
assert merge_data.has_only_past_departures({"departureDates": ["2026-05-06"]}, today)
assert not merge_data.has_only_past_departures({"departureDates": ["2026-05-06", "2026-07-03"]}, today)
assert not merge_data.has_only_past_departures({"departureDates": ["2026-07-04"]}, today)
assert not merge_data.has_only_past_departures({"departureDates": []}, today)
assert not merge_data.has_only_past_departures({"departureDates": ["bad-date"]}, today)

assert merge_data.is_gdcts_tour({"bookingUrl": "http://m.gdcts.com/product/line/detail/id/41229"})
assert merge_data.is_outdoors_tour({"bookingUrl": "https://www.outdoors.com.cn/route/linedetail/id/1.html"})
`;

const result = spawnSync('python', ['-c', script], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

assert.equal(result.status, 0, result.stderr || result.stdout);
console.log('merge data quality rule tests passed');
