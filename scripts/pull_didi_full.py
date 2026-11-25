"""全量导出滴滴站点巴士：城市对 → 班次 → 线路 → 途经站点（含坐标）。

流程
  1) 枚举城市对，POST pIntercityMultiEstimate（按 last_shift_id 翻页），
     每个班次卡带 route_id / bus_shift_id / 发车时间 / 票价；
  2) 按去重后的 route_id 拉 pGetSelectStationPointPageInfo，拿到该线路完整站点表；
  3) 合并成 didi_routes_full.json。

断点续跑：原始响应按城市对缓存在 raw/didi_pairs/，已存在即跳过。
用法: python pull_didi_full.py [--days N] [--cities 3,133,...]
"""
import argparse
import datetime
import json
import os
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw", "didi_pairs")
RAW_STATION = os.path.join(HERE, "raw", "didi_stations")
TOKEN_PATH = os.path.join(HERE, "token.json")
OUT = os.path.join(HERE, "data", "didi_routes_full.json")

EST_URL = "https://api.udache.com/gulfstream/mamba/v1/pIntercityMultiEstimate"
ST_URL = "https://api.udache.com/intercity/ticket/api/v1/other/pGetSelectStationPointPageInfo"

UA = "Mozilla/5.0 (iPhone) MicroMessenger/8.0"
REFERER = "https://page.udache.com/"


def load_token():
    return json.load(open(TOKEN_PATH, encoding="utf-8"))


def common(tok):
    return {
        "lang": "zh-CN",
        "token": tok.get("token", ""),
        "access_key_id": int(tok.get("access_key_id") or 9),
        "app_version": tok.get("app_version") or "8.0.38",
        "dchn": tok.get("dchn") or "dp8mBpx",
        "xpsid": tok.get("xpsid") or "",
        "xpsid_root": tok.get("xpsid_root") or "",
        "client_type": int(tok.get("client_type") or 201),
    }


def day_time(days):
    tz = datetime.timezone(datetime.timedelta(hours=8))
    d = (datetime.datetime.now(tz) + datetime.timedelta(days=days)).replace(
        hour=0, minute=0, second=0, microsecond=0)
    return int(d.timestamp())


def post_json(url, body):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json", "User-Agent": UA, "Referer": REFERER})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read())


def get_json(url, query, start_city_id=3):
    req = urllib.request.Request(
        url + "?" + urllib.parse.urlencode(query),
        headers={"User-Agent": UA, "Referer": REFERER, "cityid": str(start_city_id)})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read())


def with_retry(fn, attempts=4, base=1.2):
    """501/超时这类瞬时失败退避重试；风控通常是短时限流，等一会儿就好。"""
    last = None
    for i in range(attempts):
        try:
            return fn()
        except Exception as exc:
            last = exc
            time.sleep(base * (i + 1))
    raise last


def estimate(tok, start_city, end_city, days, last_shift_id="", refresh=1):
    body = common(tok)
    body.update({
        "is_estimate_v2": True, "support_county": 1, "is_drn": 0,
        "last_shift_id": last_shift_id, "refresh": refresh,
        "current_lat": "23.076824", "current_lng": "113.274288",
        "day_time": day_time(days), "start_time_v2": 0, "end_time_v2": 0,
        "filter": [{}, {}], "sort": 1,
        "start_city": int(start_city), "start_county_id": 0, "start_station_id": 0,
        "end_city": int(end_city), "end_county_id": 0, "end_station_id": 0,
    })
    return post_json(EST_URL, body)


def station_page(tok, route_id, start_city_id):
    q = common(tok)
    q.update({"route_id": route_id, "start_city_id": start_city_id,
              "page_source": 0, "nginx_cors": 1})
    return get_json(ST_URL, q, start_city_id)


def card_summary(card):
    info = card.get("station_info") or {}
    det = info.get("detail") or {}
    start = info.get("start") or {}
    end = info.get("end") or {}
    return {
        "route_id": det.get("route_id"),
        "shift_id": card.get("bus_shift_id"),
        "time_msg": card.get("time_msg") or "",
        "fee_msg": card.get("fee_msg") or "",
        "duration_text": det.get("sub_title") or "",
        "start_station_id": start.get("station_id"),
        "start_name": start.get("name"),
        "end_station_id": end.get("station_id"),
        "end_name": end.get("name"),
        "station_list": [
            {"id": s.get("id"), "name": s.get("name"), "type": s.get("type"),
             "lat": s.get("lat"), "lng": s.get("lng")}
            for s in (det.get("station_list") or [])
        ],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=1, help="服务日期偏移，1=明天")
    ap.add_argument("--cities", default="", help="逗号分隔的 cityId，默认从 bus-routes.json 取")
    ap.add_argument("--limit-pairs", type=int, default=0)
    ap.add_argument("--sleep", type=float, default=0.35)
    args = ap.parse_args()

    tok = load_token()
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(RAW_STATION, exist_ok=True)

    cities = json.load(open(os.path.join(HERE, "data", "city_list.json"), encoding="utf-8")) \
        if os.path.exists(os.path.join(HERE, "data", "city_list.json")) else []

    pairs = []
    for s in cities:
        for e in cities:
            if s["cityId"] != e["cityId"]:
                pairs.append((s["cityId"], s["name"], e["cityId"], e["name"]))
    if args.limit_pairs:
        pairs = pairs[:args.limit_pairs]

    print(f"[plan] 城市 {len(cities)} 个，城市对 {len(pairs)} 个，服务日偏移 {args.days}", flush=True)

    cards_all = []
    for index, (sid, sname, eid, ename) in enumerate(pairs, 1):
        path = os.path.join(RAW, f"{sid}-{eid}.json")
        if os.path.exists(path):
            payload = json.load(open(path, encoding="utf-8"))
        else:
            try:
                payload = {"start": sid, "end": eid, "pages": []}
                last, pages = "", 0
                while pages < 25:
                    resp = with_retry(lambda: estimate(tok, sid, eid, args.days, last, 1 if not last else 0))
                    if resp.get("errno") not in (0, None):
                        payload["error"] = f"{resp.get('errno')}:{resp.get('errmsg')}"
                        break
                    data = resp.get("data") or {}
                    got = data.get("estimate_card") or []
                    payload["pages"].append(data)
                    pages += 1
                    nxt = data.get("last_shift_id") or ""
                    if data.get("last_item") or not got or not nxt or nxt == last:
                        break
                    last = nxt
                    time.sleep(args.sleep)
                json.dump(payload, open(path, "w", encoding="utf-8"), ensure_ascii=False)
            except Exception as exc:  # 单对失败不影响整体
                print(f"[{index}/{len(pairs)}] {sname}->{ename} 失败: {exc}", flush=True)
                time.sleep(1.5)
                continue
            time.sleep(args.sleep)

        n = sum(len(p.get("estimate_card") or []) for p in payload.get("pages", []))
        print(f"[{index}/{len(pairs)}] {sname}->{ename} 班次 {n}"
              + (f"  error={payload['error']}" if payload.get("error") else ""), flush=True)

    for path in sorted(os.listdir(RAW)):
        payload = json.load(open(os.path.join(RAW, path), encoding="utf-8"))
        for page in payload.get("pages", []):
            for card in page.get("estimate_card") or []:
                cards_all.append(card_summary(card))

    route_ids = {}
    for card in cards_all:
        rid = card.get("route_id")
        if rid:
            route_ids.setdefault(rid, card["start_name"])

    print(f"[routes] 班次 {len(cards_all)} 条，去重线路 {len(route_ids)} 条", flush=True)

    stations = {}
    for index, (rid, _start) in enumerate(sorted(route_ids.items()), 1):
        path = os.path.join(RAW_STATION, f"{rid}.json")
        if os.path.exists(path):
            payload = json.load(open(path, encoding="utf-8"))
        else:
            try:
                payload = with_retry(lambda: station_page(tok, rid, 3))
                json.dump(payload, open(path, "w", encoding="utf-8"), ensure_ascii=False)
            except Exception as exc:
                print(f"[station {index}/{len(route_ids)}] {rid} 失败: {exc}", flush=True)
                time.sleep(1.5)
                continue
            time.sleep(args.sleep)
        data = payload.get("data") or {}
        stations[rid] = [{
            "id": s.get("station_id"), "name": s.get("station_name"),
            "type": s.get("station_type"), "lat": s.get("station_lat"),
            "lng": s.get("station_lng"), "county_id": s.get("county_id"),
            "city_id": s.get("city_id"),
        } for s in (data.get("station_list") or [])]
        n = len(stations[rid])
        if index % 20 == 0 or index == len(route_ids):
            print(f"[station {index}/{len(route_ids)}] route {rid} 站点 {n}", flush=True)

    out = {
        "pulled_at": datetime.datetime.now().strftime("%Y-%m-%d"),
        "service_date_offset_days": args.days,
        "shifts": cards_all,
        "routes": stations,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"[done] 班次 {len(cards_all)} / 线路 {len(stations)} -> {OUT}", flush=True)


if __name__ == "__main__":
    main()
