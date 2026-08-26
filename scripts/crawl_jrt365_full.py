#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
假日通全量爬虫 - Selenium扩展分类和页数
"""

import re
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

GROUPNO_RE = re.compile(r'groupno=([^&"\']+)', re.IGNORECASE)
TOURNAME_RE = re.compile(r'is_tournameno\s*=\s*"([^"]*)"', re.IGNORECASE)
GROUPNO_JS_RE = re.compile(r'is_groupno\s*=\s*"([^"]*)"', re.IGNORECASE)

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "X-Requested-With": "XMLHttpRequest",
}
BASE_URL = "http://www.jrt365.com"


def env_int(name, default, minimum=0, maximum=None):
    try:
        value = int(os.environ.get(name, str(default)) or default)
    except (TypeError, ValueError):
        value = default
    value = max(minimum, value)
    if maximum is not None:
        value = min(maximum, value)
    return value


def assert_min_raw_items(items, output_path):
    min_items = env_int("JRT365_MIN_RAW_ITEMS", 1, minimum=0)
    item_count = len(items) if isinstance(items, list) else 0
    if item_count >= min_items:
        return

    try:
        relative_output = os.path.relpath(output_path, os.getcwd())
    except ValueError:
        relative_output = output_path
    raise SystemExit(
        "[假日通] ERROR: crawl produced "
        f"{item_count} items, below JRT365_MIN_RAW_ITEMS={min_items}; "
        f"refusing to overwrite {relative_output}"
    )


def create_webdriver():
    from selenium import webdriver

    for options_cls, builder in (
        (webdriver.EdgeOptions, webdriver.Edge),
        (webdriver.ChromeOptions, webdriver.Chrome),
    ):
        options = options_cls()
        options.add_argument('--headless=new')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1440,2400')
        try:
            return builder(options=options)
        except Exception:
            continue
    raise RuntimeError("Unable to create webdriver")


def extract_days(title):
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    return 0


def extract_groupno(url):
    if not url:
        return ''
    match = GROUPNO_RE.search(url)
    return match.group(1).strip() if match else ''


def decode_response_text(response):
    for encoding in ('utf-8-sig', 'utf-8', response.encoding or '', response.apparent_encoding or ''):
        if not encoding:
            continue
        try:
            return response.content.decode(encoding)
        except Exception:
            continue
    return response.text


def parse_flashcalendar_dates(markup, year, month):
    soup = BeautifulSoup(markup, 'lxml')
    result = soup.select_one('#result')
    if not result or result.get_text(' ', strip=True).lower() != 'true':
        return []

    allday = soup.select_one('#allday')
    if not allday:
        return []

    dates = []
    for node in allday.find_all(['a', 'li', 'div']):
        text = node.get_text(' ', strip=True)
        match = re.search(r'(\d{1,2})\s*日', text)
        if not match:
            continue
        day = int(match.group(1))
        iso = f"{int(year):04d}-{int(month):02d}-{day:02d}"
        if iso not in dates:
            dates.append(iso)
    return dates


def build_month_windows():
    current_year = time.localtime().tm_year
    current_month = time.localtime().tm_mon
    month_limit = env_int("JRT365_CALENDAR_MONTHS", 6, minimum=1, maximum=12)
    windows = []
    for offset in range(month_limit):
        month_index = current_month - 1 + offset
        year = current_year + (month_index // 12)
        month = (month_index % 12) + 1
        windows.append((year, month))
    return windows
def fetch_detail_snapshot(item):
    url = str(item.get('url') or '').strip()
    if not url:
        return {}

    try:
        detail_resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
        detail_resp.raise_for_status()
    except Exception:
        return {}

    detail_text = decode_response_text(detail_resp)
    if '该团号不可在此显示' in detail_text:
        return {}

    soup = BeautifulSoup(detail_text, 'lxml')
    title = ''
    for selector in (
        '#ctl00_ContentPlaceHolder_htmlform_id_tourname',
        '#ctl00_ContentPlaceHolder_htmlform_id_tourname_1',
    ):
        node = soup.select_one(selector)
        title = node.get_text(' ', strip=True) if node else ''
        if title:
            break

    tournameno_match = TOURNAME_RE.search(detail_text)
    groupno_match = GROUPNO_JS_RE.search(detail_text)
    tournameno = tournameno_match.group(1).strip() if tournameno_match else ''
    groupno = groupno_match.group(1).strip() if groupno_match else extract_groupno(url)
    print_link = soup.select_one('#ctl00_ContentPlaceHolder_htmlform_id_print_xc')
    print_url = urljoin(detail_resp.url, print_link.get('href', '').strip()) if print_link and print_link.get('href') else ''

    departure_dates = []
    if tournameno and groupno:
        current_year = time.localtime().tm_year
        current_month = time.localtime().tm_mon
        month_windows = []
        for offset in range(0, 12):
            month_index = current_month - 1 + offset
            year = current_year + (month_index // 12)
            month = (month_index % 12) + 1
            month_windows.append((year, month))

        for year, month in month_windows:
                try:
                    calendar_resp = requests.get(
                        f'{BASE_URL}/tourgroup/tourgroup_ziliao_flashcalendar.aspx',
                        params={
                            'tournameno': tournameno,
                            'yyyy': str(year),
                            'mm': f'{month:02d}',
                            'groupno': groupno,
                        },
                        headers={**HEADERS, 'Referer': detail_resp.url},
                        timeout=20,
                    )
                    calendar_resp.raise_for_status()
                except Exception:
                    continue
                calendar_text = decode_response_text(calendar_resp)
                for date in parse_flashcalendar_dates(calendar_text, year, month):
                    if date not in departure_dates:
                        departure_dates.append(date)

    return {
        'sourceId': groupno,
        'groupno': groupno,
        'tournameno': tournameno,
        'departureDates': departure_dates,
        'departureDate': departure_dates[0] if departure_dates else '',
        'printUrl': print_url,
        'detailTitle': title,
        'hasDetailContent': bool(title),
    }



def parse_listing_html(html, seen):
    href_m = re.search(r'href=["\']([^"\']*groupno=[^"\']*)["\']', html)
    title_m = re.search(r'>([^<]+)</a></p>', html)
    price_m = re.search(r'<div class="t4_price[^"]*">.*?(\d+(?:\.\d+)?)<', html, re.S)
    img_m = re.search(r'src=["\']([^"\']*HOLIDAY/[^"\']*)["\']', html)
    if not (href_m and title_m):
        return None

    href = href_m.group(1)
    if not href.startswith('http'):
        href = BASE_URL + '/tourgroup/' + href

    title = title_m.group(1).strip()
    price = float(price_m.group(1)) if price_m else 0
    img_url = img_m.group(1) if img_m else ''
    groupno = extract_groupno(href)

    key = title + '|' + str(price)
    if key in seen:
        return None
    seen.add(key)

    item = {
        'source': '假日通',
        'title': title,
        'price': price,
        'url': href,
        'days': extract_days(title),
        'groupno': groupno,
        'sourceId': groupno,
    }
    if img_url:
        item['img'] = img_url if img_url.startswith('http') else BASE_URL + img_url
    return item


def enrich_items_with_details(items):
    total = len(items)
    if total == 0:
        return items

    workers = env_int('JRT365_DETAIL_WORKERS', 12, minimum=1, maximum=24)
    print(f"[假日通] 详情补全开始: {total} 条, workers={workers}, months={len(build_month_windows())}")
    enriched = [None] * total
    started = time.perf_counter()

    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_map = {
            executor.submit(fetch_detail_snapshot, dict(item)): index
            for index, item in enumerate(items)
        }
        for completed, future in enumerate(as_completed(future_map), start=1):
            index = future_map[future]
            merged = dict(items[index])
            try:
                merged.update(future.result() or {})
            except Exception:
                pass
            enriched[index] = merged
            if completed % 20 == 0 or completed == total:
                elapsed = time.perf_counter() - started
                print(f"[假日通] 详情补全 {completed}/{total} ({elapsed:.1f}s)")

    return enriched


def extract_items_from_current_page(driver, By, seen, all_items):
    lis = driver.find_elements(By.CSS_SELECTOR, '#ctl00_ContentPlaceHolder_htmlform_id_list > ul > li')
    added = 0
    for li in lis:
        try:
            item = parse_listing_html(li.get_attribute('outerHTML'), seen)
            if item is None:
                continue
            all_items.append(item)
            added += 1
        except Exception:
            pass
    return added
def fetch():
    print("[假日通] 全量抓取中...")
    try:
        from selenium.webdriver.common.by import By

        driver = create_webdriver()
        all_items = []
        seen = set()

        categories = []
        simple_categories = [
            ('/tourgroup/tourgroup_list.aspx', 'all tours'),
        ]

        for path, mudidi_list, cat_name in categories:
            for mudidi in mudidi_list:
                try:
                    driver.get(BASE_URL + path)
                    time.sleep(2)
                    driver.execute_script(f'document.getElementById("id_mudidi").value = "{mudidi}";')
                    driver.execute_script('document.getElementById("id_tjform").submit();')
                    time.sleep(3)

                    total_pages = 1
                    try:
                        elems = driver.find_elements(By.XPATH, "//*[contains(text(), '共：')]")
                        for elem in elems:
                            text = elem.text
                            m = re.search(r'共：\s*(\d+)\s*页', text)
                            if m:
                                total_pages = int(m.group(1))
                                break
                    except:
                        pass

                    max_pages = env_int("JRT365_MAX_PAGES", 0, minimum=0, maximum=total_pages)
                    if max_pages > 0:
                        total_pages = min(total_pages, max_pages)

                    print(f"[假日通] {cat_name}/{mudidi} pages={total_pages}")

                    for page in range(1, total_pages + 1):
                        if page > 1:
                            try:
                                driver.execute_script(f'changepage({page})')
                                time.sleep(2)
                            except:
                                break
                        added = extract_items_from_current_page(driver, By, seen, all_items)
                        if page % 10 == 0 or page == total_pages:
                            print(f"[假日通] {cat_name}/{mudidi} page {page}/{total_pages}, added={added}, total={len(all_items)}")
                except Exception as e:
                    print(f"  {cat_name}/{mudidi} error: {e}")

        for path, name in simple_categories:
            try:
                driver.get(BASE_URL + path)
                time.sleep(2)

                total_pages = 1
                try:
                    elems = driver.find_elements(By.XPATH, "//*[contains(text(), '共：')]")
                    for elem in elems:
                        text = elem.text
                        m = re.search(r'共：\s*(\d+)\s*页', text)
                        if m:
                            total_pages = int(m.group(1))
                            break
                except:
                    pass

                max_pages = env_int("JRT365_MAX_PAGES", 0, minimum=0, maximum=total_pages)
                if max_pages > 0:
                    total_pages = min(total_pages, max_pages)

                print(f"[假日通] {name} pages={total_pages}")

                for page in range(1, total_pages + 1):
                    if page > 1:
                        try:
                            driver.execute_script(f'changepage({page})')
                            time.sleep(2)
                        except:
                            break

                    added = extract_items_from_current_page(driver, By, seen, all_items)
                    if page % 10 == 0 or page == total_pages:
                        print(f"[假日通] {name} page {page}/{total_pages}, added={added}, total={len(all_items)}")
            except Exception as e:
                print(f"  {name} error: {e}")

        driver.quit()
        print(f"[假日通] 列表采集完成: {len(all_items)} 条")
        all_items = enrich_items_with_details(all_items)
        print(f"[假日通] 抓取完成: {len(all_items)} 条")
        return all_items
    except Exception as e:
        print(f"[假日通] Selenium error: {e}")
        return []


def refresh_existing():
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    input_path = os.path.join(data_dir, "raw_jrt365_full.json")
    if not os.path.exists(input_path):
        raise FileNotFoundError(input_path)

    with open(input_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    workers = max(4, min(16, int(os.environ.get("JRT365_REFRESH_WORKERS", "8") or "8")))
    refreshed = [None] * len(items)
    total = len(items)

    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_map = {
            executor.submit(fetch_detail_snapshot, dict(item)): index
            for index, item in enumerate(items)
        }
        for completed, future in enumerate(as_completed(future_map), start=1):
            index = future_map[future]
            merged = dict(items[index])
            try:
                merged.update(future.result() or {})
            except Exception:
                pass
            refreshed[index] = merged
            if completed % 20 == 0 or completed == total:
                print(f"[假日通] 已刷新 {completed}/{total} 条")

    return refreshed


def main():
    refresh_mode = os.environ.get("JRT365_REFRESH_EXISTING", "").strip().lower() in {"1", "true", "yes", "on"}
    items = refresh_existing() if refresh_mode else fetch()
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    output_path = os.path.join(data_dir, "raw_jrt365_full.json")
    if isinstance(items, list) and len(items) == 0 and os.path.exists(output_path):
        print(f"[jrt365] 0 items -- keeping existing {output_path}")
        return
    assert_min_raw_items(items, output_path)
    os.makedirs(data_dir, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {output_path}")


if __name__ == "__main__":
    main()





