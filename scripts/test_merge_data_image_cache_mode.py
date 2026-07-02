#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(__file__))

from merge_data import normalize_image_path


def assert_no_download_in_skip_mode():
    cases = [
        ("https://www.outdoors.com.cn/uploads/a.jpg", "天涯户外"),
        ("http://jrttp.jrt365.com:8066/images/a.png", "假日通"),
        ("https://img.saihuitong.com/a.webp", "广州去旅行"),
    ]
    with patch.dict(os.environ, {"IMAGE_CACHE_MODE": "skip"}):
        with patch("merge_data.requests.get", side_effect=AssertionError("unexpected image download")):
            for url, source in cases:
                assert normalize_image_path(url, source) == url


def assert_no_download_in_off_mode():
    url = "https://www.outdoors.com.cn/uploads/a.jpg"
    with patch.dict(os.environ, {"IMAGE_CACHE_MODE": "off"}):
        with patch("merge_data.requests.get", side_effect=AssertionError("unexpected image download")):
            assert normalize_image_path(url, "天涯户外") == url


if __name__ == "__main__":
    assert_no_download_in_skip_mode()
    assert_no_download_in_off_mode()
    print("merge_data image cache mode tests passed")
