#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
假日通全量爬虫 - Selenium扩展分类和页数
"""

import re
import json
import os
import time

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


def fetch():
    print("[假日通] 全量抓取中...")
    try:
        from selenium.webdriver.common.by import By

        driver = create_webdriver()
        all_items = []
        seen = set()

        categories = [
            ('/tourgroup/tourgroup_list_sn.aspx',
             ['粤北', '粤西', '粤东及广州周边', '广州及珠三角'],
             '省内旅游'),
            ('/tourgroup/tourgroup_list_gn.aspx',
             ['华东', '华中', '华北及东北', '华南', '西北及西南'],
             '国内旅游'),
            ('/tourgroup/tourgroup_list_cj.aspx',
             ['东南亚', '中东非', '日本及韩国', '欧洲', '澳洲及新西兰', '美国及加拿大'],
             '出境旅游'),
        ]

        simple_categories = [
            ('/tourgroup/tourgroup_list_ga.aspx', '港澳旅游'),
            ('/tourgroup/tourgroup_list_cty.aspx', '热销'),
            ('/tourgroup/tourgroup_list_zyx.aspx', '自由行'),
        ]

        BASE_URL = "http://www.jrt365.com"

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

                    # 默认抓取全部页；如需限页可通过环境变量控制
                    max_pages = int(os.environ.get("JRT365_MAX_PAGES", "0") or "0")
                    if max_pages > 0:
                        total_pages = min(total_pages, max_pages)

                    for page in range(1, total_pages + 1):
                        if page > 1:
                            try:
                                driver.execute_script(f'changepage({page})')
                                time.sleep(2)
                            except:
                                break

                        lis = driver.find_elements(By.CSS_SELECTOR, '#ctl00_ContentPlaceHolder_htmlform_id_list > ul > li')
                        for li in lis:
                            try:
                                html = li.get_attribute('outerHTML')
                                href_m = re.search(r'href=["\']([^"\']*groupno=[^"\']*)["\']', html)
                                title_m = re.search(r'>([^<]+)</a></p>', html)
                                price_m = re.search(r'<div class="t4_price[^"]*">.*?(\d+(?:\.\d+)?)<', html, re.S)
                                img_m = re.search(r'src=["\']([^"\']*HOLIDAY/[^"\']*)["\']', html)

                                if href_m and title_m:
                                    href = href_m.group(1)
                                    if not href.startswith('http'):
                                        href = BASE_URL + '/tourgroup/' + href
                                    title = title_m.group(1).strip()
                                    price = float(price_m.group(1)) if price_m else 0
                                    img_url = img_m.group(1) if img_m else ''

                                    key = title + "|" + str(price)
                                    if key in seen:
                                        continue
                                    seen.add(key)

                                    item = {
                                        "source": "假日通",
                                        "title": title,
                                        "price": price,
                                        "url": href,
                                        "days": extract_days(title),
                                    }
                                    if img_url:
                                        if img_url.startswith('http'):
                                            item["img"] = img_url
                                        else:
                                            item["img"] = BASE_URL + img_url
                                    all_items.append(item)
                            except:
                                pass
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

                max_pages = int(os.environ.get("JRT365_MAX_PAGES", "0") or "0")
                if max_pages > 0:
                    total_pages = min(total_pages, max_pages)

                for page in range(1, total_pages + 1):
                    if page > 1:
                        try:
                            driver.execute_script(f'changepage({page})')
                            time.sleep(2)
                        except:
                            break

                    lis = driver.find_elements(By.CSS_SELECTOR, '#ctl00_ContentPlaceHolder_htmlform_id_list > ul > li')
                    for li in lis:
                        try:
                            html = li.get_attribute('outerHTML')
                            href_m = re.search(r'href=["\']([^"\']*groupno=[^"\']*)["\']', html)
                            title_m = re.search(r'>([^<]+)</a></p>', html)
                            price_m = re.search(r'<div class="t4_price[^"]*">.*?(\d+(?:\.\d+)?)<', html, re.S)
                            img_m = re.search(r'src=["\']([^"\']*HOLIDAY/[^"\']*)["\']', html)

                            if href_m and title_m:
                                href = href_m.group(1)
                                if not href.startswith('http'):
                                    href = BASE_URL + '/tourgroup/' + href
                                title = title_m.group(1).strip()
                                price = float(price_m.group(1)) if price_m else 0
                                img_url = img_m.group(1) if img_m else ''

                                key = title + "|" + str(price)
                                if key in seen:
                                    continue
                                seen.add(key)

                                item = {
                                    "source": "假日通",
                                    "title": title,
                                    "price": price,
                                    "url": href,
                                    "days": extract_days(title),
                                }
                                if img_url:
                                    if img_url.startswith('http'):
                                        item["img"] = img_url
                                    else:
                                        item["img"] = BASE_URL + img_url
                                all_items.append(item)
                        except:
                            pass
            except Exception as e:
                print(f"  {name} error: {e}")

        driver.quit()
        print(f"[假日通] 抓取完成: {len(all_items)} 条")
        return all_items
    except Exception as e:
        print(f"[假日通] Selenium error: {e}")
        return []


def main():
    items = fetch()
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, "raw_jrt365_full.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {os.path.join(data_dir, 'raw_jrt365_full.json')}")


if __name__ == "__main__":
    main()
