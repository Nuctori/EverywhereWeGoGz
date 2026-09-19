#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""假日通(jrt365)数据源每日体检。

背景：源站会把已下架/停售的线路渲染成空壳页（HTTP 200，但标题、出发月份、
价格节点全空）。这类线路既无价值又会撑大 raw 计数。实测某轮 370 条里
276 条(74.6%)是空壳——占比可以高到七成，靠"整轮数据更新"发现不了，
因为爬虫一直把空壳记成 hasDetailContent=true。

本脚本每日探测全量详情页，算出差空壳率并写报告。空壳率超过阈值时以
退出码 3 退出，调用方（CI）据此触发单渠道重抓。阈值内的空壳属于源站
常态，不触发重抓。

用法:
  python scripts/check_jrt365_health.py                # 体检，超阈值退出码 3
  python scripts/check_jrt365_health.py --report out.json

退出码:
  0  健康（空壳率 <= 阈值）
  1  执行错误（读不到数据、探测全失败）
  3  空壳率超阈值，需要重抓
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from jrt365_hollow import BROKEN, OK, SHELL, classify_detail_html

sys.stdout.reconfigure(encoding="utf-8")

RAW_PATH = Path("src/data/raw_jrt365_full.json")

# 空壳率阈值。实测源站常态在 0% ~ 75% 之间剧烈波动（一次大范围下架就能
# 让整源一夜之间七成变空壳），因此阈值定得偏高并配合"绝对条数下限"：
# 只有空壳率达到 25% 且空壳条数 >= 20 才认为值得触发重抓，避免小样本抖动。
DEFAULT_MAX_SHELL_RATE = 0.25
MIN_SHELL_COUNT = 20

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/136.0.0.0 Safari/537.36"
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_urls(raw_path: Path) -> list[tuple[str, str]]:
    """返回 [(url, title)]。"""
    with raw_path.open("r", encoding="utf-8") as f:
        items = json.load(f)
    if not isinstance(items, list):
        raise SystemExit(f"{raw_path} 不是数组，无法体检")
    out = []
    for item in items:
        if not isinstance(item, dict):
            continue
        url = str(item.get("url") or "").strip()
        if url:
            out.append((url, str(item.get("title") or "").strip()))
    return out


def probe(url: str, timeout: float) -> dict:
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=timeout)
        resp.raise_for_status()
    except Exception as exc:  # 网络/HTTP 错误单独归类，不计入空壳
        return {
            "url": url,
            "category": "error",
            "reason": f"{type(exc).__name__}: {str(exc)[:120]}",
        }

    text = None
    for encoding in ("utf-8-sig", "utf-8", resp.encoding or "", resp.apparent_encoding or ""):
        if not encoding:
            continue
        try:
            text = resp.content.decode(encoding)
            break
        except Exception:
            continue
    if text is None:
        text = resp.text

    # 源站对已下架团号直接回这个提示，等同于空壳
    if "该团号不可在此显示" in text:
        return {"url": url, "category": SHELL, "reason": "该团号不可在此显示"}

    return {"url": url, "category": classify_detail_html(text), "reason": ""}


def main() -> int:
    parser = argparse.ArgumentParser(description="假日通数据源每日体检")
    parser.add_argument("--raw", default=str(RAW_PATH), help="raw 数据路径")
    parser.add_argument("--report", default="", help="体检报告输出路径（可选）")
    parser.add_argument("--workers", type=int, default=10, help="并发数，默认 10")
    parser.add_argument("--timeout", type=float, default=20.0, help="单请求超时秒数")
    parser.add_argument(
        "--max-shell-rate",
        type=float,
        default=DEFAULT_MAX_SHELL_RATE,
        help=f"空壳率阈值，默认 {DEFAULT_MAX_SHELL_RATE}",
    )
    parser.add_argument(
        "--min-shell-count",
        type=int,
        default=MIN_SHELL_COUNT,
        help=f"触发重抓的最少空壳条数，默认 {MIN_SHELL_COUNT}",
    )
    args = parser.parse_args()

    raw_path = Path(args.raw)
    if not raw_path.exists():
        print(f"[体检] 找不到 {raw_path}", file=sys.stderr)
        return 1

    targets = load_urls(raw_path)
    if not targets:
        print(f"[体检] {raw_path} 里没有可探测的 URL", file=sys.stderr)
        return 1

    print(f"[体检] 探测 {len(targets)} 个假日通详情页，并发 {args.workers}")

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        results = list(executor.map(lambda t: probe(t[0], args.timeout), targets))

    counts = {"shell": 0, "broken": 0, "ok": 0, "error": 0}
    for row in results:
        counts[row["category"]] = counts.get(row["category"], 0) + 1

    probeable = counts["shell"] + counts["broken"] + counts["ok"]
    shell_rate = counts["shell"] / probeable if probeable else 0.0

    print(f"[体检] 空壳 {counts['shell']} | 正文缺失 {counts['broken']} | 正常 {counts['ok']} | 探测失败 {counts['error']}")
    print(f"[体检] 空壳率 {shell_rate:.1%} (阈值 {args.max_shell_rate:.0%})")

    needs_recrawl = (
        shell_rate > args.max_shell_rate and counts["shell"] >= args.min_shell_count
    )

    report = {
        "generated_at": utc_now_iso(),
        "raw_path": str(raw_path),
        "total": len(targets),
        "counts": counts,
        "shell_rate": round(shell_rate, 4),
        "thresholds": {
            "max_shell_rate": args.max_shell_rate,
            "min_shell_count": args.min_shell_count,
        },
        "needs_recrawl": needs_recrawl,
        "shell_samples": [r["url"] for r in results if r["category"] == SHELL][:10],
    }

    if args.report:
        report_path = Path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"[体检] 报告 -> {report_path}")

    if counts["error"] and probeable == 0:
        print("[体检] 全部探测失败，疑似源站不可达或本机网络异常", file=sys.stderr)
        return 1

    if needs_recrawl:
        print(
            f"[体检] 空壳率超阈值且空壳数 >= {args.min_shell_count}，需要单渠道重抓"
        )
        return 3

    print("[体检] 健康，无需重抓")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
