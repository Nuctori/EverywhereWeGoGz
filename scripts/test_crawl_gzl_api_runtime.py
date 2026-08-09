#!/usr/bin/env python3
import importlib.util
import pathlib


def load_module():
    module_path = pathlib.Path(__file__).with_name("crawl_gzl_api.py")
    spec = importlib.util.spec_from_file_location("crawl_gzl_api", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def main():
    mod = load_module()
    assert mod.SEARCH_TYPES == [
        ("ALL", "全部"),
        ("PRODUCTGROUP", "跟团游"),
        ("FREETRAVEL", "自由行"),
        ("YJYT", "一家一团"),
    ]

    endpoint, payload = mod.resolve_schedule_request(
        "12345",
        "PRODUCTGROUP",
        "http://nn.gzl.cn/domestic/12345.html",
    )
    assert endpoint and endpoint.endswith("/grouptour/scheduleDateMap.json")
    assert payload == {"pdId": "12345", "activityId": ""}

    free_endpoint, free_payload = mod.resolve_schedule_request(
        "ABC",
        "FREETRAVEL",
        "http://nn.gzl.cn/freetour/ABC.html",
    )
    assert free_endpoint and free_endpoint.endswith("/freetour/scheduleDateMap.json")
    assert free_payload == {"pdId": "ABC", "ctripPdSn": "", "activityId": ""}

    unsupported_endpoint, unsupported_payload = mod.resolve_schedule_request(
        "T1",
        "TICKET",
        "http://nn.gzl.cn/tickets/T1.html",
    )
    assert unsupported_endpoint is None
    assert unsupported_payload is None

    base_item = {
        "source": "广之旅",
        "sourceId": "12345",
        "productType": "PRODUCTGROUP",
        "title": "测试线路",
        "price": 1999,
        "startingPrice": 1999,
        "priceSource": "b2cMinPrice",
        "url": "http://nn.gzl.cn/domestic/12345.html",
        "days": 5,
        "departureDates": ["2026-06-20"],
        "departureDate": "2026-06-20",
        "meta": {
            "priceSource": "b2cMinPrice",
            "productType": "PRODUCTGROUP",
        },
    }

    enriched = mod.apply_schedule_snapshot(
        base_item,
        {
            "departure_dates": ["2026-06-25", "2026-06-28"],
            "departure_date": "2026-06-25",
            "price": 2599,
        },
    )
    assert enriched["price"] == 2599
    assert enriched["priceSource"] == "scheduleDateMap"
    assert enriched["departureDates"] == ["2026-06-25", "2026-06-28"]
    assert enriched["departureDate"] == "2026-06-25"
    assert enriched["meta"]["priceSource"] == "scheduleDateMap"

    fallback = mod.apply_schedule_snapshot(
        base_item,
        {},
    )
    assert fallback["price"] == 1999
    assert fallback["priceSource"] == "b2cMinPrice"
    assert fallback["departureDates"] == ["2026-06-20"]
    assert fallback["departureDate"] == "2026-06-20"

    print("crawl_gzl_api runtime audit passed")


if __name__ == "__main__":
    main()
