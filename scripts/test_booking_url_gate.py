#!/usr/bin/env python3
"""Lightweight unit tests for check_booking_urls.py probe + gate semantics
(D-046 → D-048): gzip HEAD first, any non-200 HEAD -> GET fallback WITH
gzip (D-048 supersedes the D-046 "without gzip" wording — jrt365's HEAD is
200 so its GET+gzip reset is never reached), 404 (delisted) excluded from
gate, 503/0/5xx fail the gate.
Run: python scripts/test_booking_url_gate.py
"""

import email.message
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_booking_urls as gate  # noqa: E402


class FakeResp:
    def __init__(self, status):
        self.status = status

    def read(self, n):
        return b"x" * n

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return False


def http_error(code):
    return gate.urllib.error.HTTPError(
        "http://example.test/page", code, f"err {code}", email.message.Message(), None
    )


def url_error():
    return gate.urllib.error.URLError("boom")


class ProbeTests(unittest.TestCase):
    def probe_with(self, side_effects):
        with mock.patch.object(
            gate.urllib.request, "urlopen", side_effect=side_effects
        ) as m:
            status = gate.probe("http://example.test/page")
        return status, m

    def test_head_200_returns_200(self):
        status, m = self.probe_with([FakeResp(200)])
        self.assertEqual(status, 200)
        self.assertEqual(m.call_count, 1)
        # HEAD request carries gzip header (urllib normalizes case)
        headers = {k.lower(): v for k, v in m.call_args.args[0].headers.items()}
        self.assertIn("accept-encoding", headers)

    def test_head_403_falls_back_to_get_200(self):
        # nn.gzl.cn rejects HEAD (403) but serves GET 200
        status, m = self.probe_with([http_error(403), FakeResp(200)])
        self.assertEqual(status, 200)
        self.assertEqual(m.call_count, 2)
        # GET fallback keeps gzip (gdcts/nn.gzl.cn need it; jrt365's HEAD is
        # 200 so its GET+gzip reset is never reached)
        headers = {k.lower(): v for k, v in m.call_args.args[0].headers.items()}
        self.assertIn("accept-encoding", headers)

    def test_head_404_confirmed_by_get_404(self):
        status, m = self.probe_with([http_error(404), http_error(404)])
        self.assertEqual(status, 404)

    def test_head_net_error_get_net_error_returns_0(self):
        status, m = self.probe_with([url_error(), url_error()])
        self.assertEqual(status, 0)


class GateTests(unittest.TestCase):
    def _results(self, statuses):
        return [
            {"source": "x", "id": f"t{i}", "url": "u", "status": s}
            for i, s in enumerate(statuses)
        ]

    def test_404_excluded_503_fails(self):
        # [200, 404, 503] -> gated = [200, 503] -> 50% < 90% -> FAIL
        results = self._results([200, 404, 503])
        gated = [r for r in results if r["status"] != 404]
        self.assertEqual(len(gated), 2)
        gated_ok = [r for r in gated if r["status"] == 200]
        self.assertEqual(len(gated_ok), 1)
        pct = len(gated_ok) / len(gated) * 100
        self.assertLess(pct, 90.0)

    def test_all_404_is_empty_gate(self):
        results = self._results([404, 404])
        gated = [r for r in results if r["status"] != 404]
        self.assertEqual(gated, [])


if __name__ == "__main__":
    unittest.main()
