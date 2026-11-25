"""按 route_id 取该线路完整上/下车点（含坐标）。

用法: python probe_didi_stations.py 206457
"""
import json
import os
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
TOKEN = json.load(open(os.path.join(HERE, "token.json"), encoding="utf-8"))
URL = "https://api.udache.com/intercity/ticket/api/v1/other/pGetSelectStationPointPageInfo"


def fetch(route_id, start_city_id=3):
    q = {
        "route_id": route_id, "start_city_id": start_city_id,
        "page_source": 0, "nginx_cors": 1,
        "lang": "zh-CN", "token": TOKEN.get("token", ""),
        "access_key_id": TOKEN.get("access_key_id") or 9,
        "app_version": TOKEN.get("app_version") or "8.0.38",
        "dchn": TOKEN.get("dchn") or "dp8mBpx",
        "xpsid": TOKEN.get("xpsid") or "",
        "xpsid_root": TOKEN.get("xpsid_root") or "",
        "client_type": TOKEN.get("client_type") or 201,
    }
    req = urllib.request.Request(URL + "?" + urllib.parse.urlencode(q), headers={
        "User-Agent": "Mozilla/5.0 (iPhone) MicroMessenger/8.0",
        "Referer": "https://page.udache.com/",
        "cityid": str(start_city_id),
    })
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read())


if __name__ == "__main__":
    rid = sys.argv[1] if len(sys.argv) > 1 else "206457"
    r = fetch(rid)
    print("errno:", r.get("errno"), str(r.get("errmsg"))[:40])
    d = r.get("data") or {}
    info = d.get("page_info") or {}
    print("route_id:", info.get("route_id"), "title:", info.get("page_title"),
          "stations:", len(d.get("station_list") or []))
    for s in d.get("station_list") or []:
        print(f"  type={s.get('station_type')} {s.get('station_name')} "
              f"@ {s.get('station_lat')},{s.get('station_lng')} county={s.get('county_id')}")
