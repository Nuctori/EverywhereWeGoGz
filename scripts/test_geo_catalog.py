# -*- coding: utf-8 -*-
import unittest

from geo_catalog import classify_route, normalize_tour_geo


class GeoCatalogTest(unittest.TestCase):
    def test_explicit_departure_is_source_data(self):
        fields, sources = normalize_tour_geo(
            {"departureCity": "广州", "destination": "清远"},
            "清远温泉两日游",
            "清远",
        )
        self.assertEqual(fields["departureCity"], "广州")
        self.assertEqual(sources["departureCity"], "source")
        self.assertEqual(classify_route(fields), "local")

    def test_unambiguous_title_departure_is_inferred(self):
        fields, sources = normalize_tour_geo({}, "广州往返桂林三日游", "桂林")
        self.assertEqual(fields["departureCity"], "广州")
        self.assertEqual(sources["departureCity"], "inferred")
        self.assertEqual(classify_route(fields), "nearby-province")

    def test_common_flight_and_multi_city_departure_forms(self):
        for title in ("德国法国13天（南航广州起止）", "东欧十天（海航深圳直飞）", "欧洲十天（广州/深圳起止）"):
            fields, sources = normalize_tour_geo({}, title, "法国")
            self.assertEqual(fields["departureCity"], "广州" if "广州" in title else "深圳")
            self.assertEqual(sources["departureCity"], "inferred")

    def test_missing_departure_is_not_fabricated(self):
        fields, _ = normalize_tour_geo({}, "北京五日游", "北京")
        self.assertEqual(fields.get("departureCity"), None)
        self.assertEqual(fields["geoStatus"], "destination_only")
        self.assertEqual(classify_route(fields), "unknown")

    def test_departure_alias_is_not_used_as_destination_fallback(self):
        fields, _ = normalize_tour_geo({}, "欧洲十天（广州出发）", "其他")
        self.assertEqual(fields["destinationCity"], "")
        self.assertEqual(fields["geoStatus"], "unmapped")

    def test_broad_region_does_not_get_city_coordinates(self):
        for destination in ("云南", "湖南", "日本", "法国", "海口", "阳朔", "洛杉矶"):
            fields, _ = normalize_tour_geo({}, f"{destination}旅游", destination)
            self.assertEqual(fields["destinationCity"], "")
            self.assertIsNone(fields["destinationLatitude"])
            self.assertIn(fields["geoStatus"], {"destination_only", "unmapped"})

    def test_route_categories(self):
        base = {"departureProvince": "广东", "destinationCountry": "中国"}
        self.assertEqual(classify_route({**base, "destinationProvince": "广东"}), "local")
        self.assertEqual(classify_route({**base, "destinationProvince": "广西"}), "nearby-province")
        self.assertEqual(classify_route({**base, "destinationProvince": "北京"}), "national")
        self.assertEqual(classify_route({"departureProvince": "广东", "destinationCountry": "日本"}), "international")


if __name__ == "__main__":
    unittest.main()
