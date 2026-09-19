#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""康辉 cct.cn 爬虫的 python 包装，供 crawl_unified_sources.py 统一调度。

真正实现在 scripts/crawl_kanghui_cct.mjs (Node/Playwright，cct.cn 列表页 JS 渲染)。
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    node = "node"
    script = str(ROOT / "scripts" / "crawl_kanghui_cct.mjs")
    max_products = ""
    if len(sys.argv) > 1:
        max_products = sys.argv[1]
    cmd = [node, script] + ([max_products] if max_products else [])
    print(f"[kanghui-cct] run: {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=str(ROOT))


if __name__ == "__main__":
    raise SystemExit(main())
