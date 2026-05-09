#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
品途旅游网站 API 探测脚本
目标：找到获取产品列表数据的 AJAX/API 接口
"""

import requests
import re
import json
import sys
from urllib.parse import urljoin, parse_qs, urlparse
from bs4 import BeautifulSoup

# 基础配置
BASE_URL = "http://gz.ptotour.com"
LIST_URL = "http://gz.ptotour.com/line/list.aspx"
TIMEOUT = 30

# 各种 User-Agent
USER_AGENTS = {
    "desktop": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "mobile": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "wechat": "Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.0",
}

session = requests.Session()


def fetch(url, headers=None, method="GET", data=None, params=None, allow_redirects=True, timeout=None):
    """通用请求封装"""
    to = timeout if timeout is not None else TIMEOUT
    try:
        if method.upper() == "POST":
            resp = session.post(url, headers=headers, data=data, params=params,
                                timeout=to, allow_redirects=allow_redirects)
        else:
            resp = session.get(url, headers=headers, params=params,
                               timeout=to, allow_redirects=allow_redirects)
        return resp
    except Exception as e:
        print(f"  [ERROR] 请求失败: {e}")
        return None


def analyze_page_source(html, url):
    """分析页面源码，寻找 JS 中的 API 端点"""
    print(f"\n[1] 分析页面源码中的 JavaScript...")
    endpoints = set()

    # 1. 查找常见的 API 路径模式
    patterns = [
        r'["\']([^"\']*/api/[^"\']*)["\']',
        r'["\']([^"\']*/ajax/[^"\']*)["\']',
        r'["\']([^"\']*/data/[^"\']*)["\']',
        r'["\']([^"\']*/line/[^"\']*)["\']',
        r'["\']([^"\']*\.ashx[^"\']*)["\']',
        r'["\']([^"\']*\.asmx[^"\']*)["\']',
        r'["\']([^"\']*\.svc[^"\']*)["\']',
        r'["\']([^"\']*Handler[^"\']*)["\']',
        r'url\s*[:=]\s*["\']([^"\']+)["\']',
        r'\.get\s*\(\s*["\']([^"\']+)["\']',
        r'\.post\s*\(\s*["\']([^"\']+)["\']',
        r'fetch\s*\(\s*["\']([^"\']+)["\']',
        r'XMLHttpRequest.*?open\s*\(\s*["\'][^"\']*["\']\s*,\s*["\']([^"\']+)["\']',
        r'action\s*[:=]\s*["\']([^"\']+)["\']',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        for m in matches:
            if len(m) > 3 and not m.startswith("javascript:") and not m.startswith("#"):
                endpoints.add(m)

    # 2. 查找特定的变量赋值（如 apiUrl, baseUrl 等）
    var_patterns = [
        r'(?:var|let|const)\s+(?:api|base|ajax|data)\s*[=:]\s*["\']([^"\']+)["\']',
        r'(?:api|base|ajax|data)\s*[=:]\s*["\']([^"\']+)["\']',
    ]
    for pattern in var_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        for m in matches:
            if len(m) > 3:
                endpoints.add(m)

    # 3. 查找 JSON 数据块
    json_blocks = re.findall(r'[{\[][^\n]{50,5000}[}\]]', html)
    print(f"  发现 {len(json_blocks)} 个可能的 JSON 数据块")

    # 4. 查找 script src
    soup = BeautifulSoup(html, 'html.parser')
    scripts = soup.find_all('script', src=True)
    print(f"  发现 {len(scripts)} 个外部脚本")
    for s in scripts:
        src = s.get('src', '')
        if src:
            endpoints.add(src)

    # 5. 查找 inline script 中的关键内容
    inline_scripts = soup.find_all('script', src=False)
    print(f"  发现 {len(inline_scripts)} 个内联脚本")

    # 6. 查找 form action
    forms = soup.find_all('form')
    print(f"  发现 {len(forms)} 个表单")
    for f in forms:
        action = f.get('action', '')
        if action:
            endpoints.add(action)

    # 7. 查找 data-* 属性
    data_attrs = re.findall(r'data-[a-z-]+=["\']([^"\']+)["\']', html)
    print(f"  发现 {len(data_attrs)} 个 data-* 属性")

    # 8. 查找 __VIEWSTATE 等 ASP.NET 隐藏字段
    viewstate = re.search(r'id="__VIEWSTATE"[^>]*value="([^"]*)"', html)
    if viewstate:
        print(f"  发现 __VIEWSTATE (ASP.NET WebForms)")
        return viewstate.group(1), endpoints

    return None, endpoints


def test_post_list_page():
    """测试 POST 请求到 list.aspx"""
    print(f"\n[2] 测试 POST 请求到 list.aspx...")

    headers = {
        "User-Agent": USER_AGENTS["desktop"],
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": LIST_URL,
        "X-Requested-With": "XMLHttpRequest",
    }

    # 先 GET 获取页面和 cookies
    resp_get = fetch(LIST_URL + "?cid=guangzhou&tid=domestic&page=1", headers=headers)
    if not resp_get:
        return

    print(f"  GET 状态码: {resp_get.status_code}")
    print(f"  响应类型: {resp_get.headers.get('Content-Type', 'unknown')}")
    print(f"  响应长度: {len(resp_get.text)}")

    # 尝试 POST 相同 URL
    post_data = {
        "cid": "guangzhou",
        "tid": "domestic",
        "page": "1",
    }

    resp_post = fetch(LIST_URL, headers=headers, method="POST", data=post_data)
    if resp_post:
        print(f"  POST 状态码: {resp_post.status_code}")
        print(f"  POST 响应类型: {resp_post.headers.get('Content-Type', 'unknown')}")
        print(f"  POST 响应前200字符: {resp_post.text[:200]}")

    # 尝试 POST 带更多参数
    post_data2 = {
        "cid": "guangzhou",
        "tid": "domestic",
        "page": "1",
        "action": "getlist",
    }
    resp_post2 = fetch(LIST_URL, headers=headers, method="POST", data=post_data2)
    if resp_post2:
        print(f"  POST(action=getlist) 状态码: {resp_post2.status_code}")
        print(f"  POST(action=getlist) 响应前200字符: {resp_post2.text[:200]}")


def test_common_api_endpoints():
    """测试常见的 API 端点"""
    print(f"\n[3] 测试常见 API 端点...")

    endpoints = [
        "/api/line/list",
        "/api/line/getlist",
        "/api/product/list",
        "/ajax/line/list",
        "/ajax/getlist",
        "/data/line/list",
        "/data/getlist",
        "/handler/line.ashx",
        "/handler/list.ashx",
        "/line/handler.ashx",
        "/line/list.ashx",
        "/line/ajax.aspx",
        "/line/data.aspx",
        "/api/v1/line",
        "/api/v1/list",
        "/api/line",
        "/api/list",
        "/ajax/line",
        "/ajax/list",
        "/services/line.asmx",
        "/services/list.asmx",
        "/webservice/line.asmx",
        "/webservice/list.asmx",
        "/line/listdata",
        "/line/getdata",
        "/line/api",
        "/line/ajax",
        "/api/line/search",
        "/api/search",
        "/ajax/search",
    ]

    headers = {
        "User-Agent": USER_AGENTS["desktop"],
        "Accept": "application/json, text/javascript, */*",
        "X-Requested-With": "XMLHttpRequest",
    }

    for endpoint in endpoints:
        url = urljoin(BASE_URL, endpoint)
        resp = fetch(url, headers=headers, timeout=10)
        if resp:
            status = resp.status_code
            content_type = resp.headers.get('Content-Type', 'unknown')
            length = len(resp.text)
            if status != 404 and status != 500:
                print(f"  [FOUND] {endpoint} -> HTTP {status}, {content_type}, {length} bytes")
                print(f"          前100字符: {resp.text[:100]}")
            else:
                print(f"  [SKIP] {endpoint} -> HTTP {status}")


def test_different_user_agents():
    """测试不同 User-Agent"""
    print(f"\n[4] 测试不同 User-Agent...")

    for name, ua in USER_AGENTS.items():
        headers = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        url = LIST_URL + "?cid=guangzhou&tid=domestic&page=1"
        resp = fetch(url, headers=headers)
        if resp:
            print(f"  [{name}] HTTP {resp.status_code}, {len(resp.text)} bytes")
            # 检查是否有移动端特有的 API 或数据
            if "api" in resp.text.lower() or "ajax" in resp.text.lower():
                print(f"          页面中包含 api/ajax 关键字")


def test_pagination():
    """测试分页参数"""
    print(f"\n[5] 测试分页参数...")

    headers = {
        "User-Agent": USER_AGENTS["desktop"],
    }

    urls = [
        LIST_URL + "?cid=guangzhou&tid=domestic&page=1",
        LIST_URL + "?cid=guangzhou&tid=domestic&page=2",
        LIST_URL + "?cid=guangzhou&tid=domestic&page=3",
        LIST_URL + "?cid=guangzhou&tid=domestic",
        LIST_URL + "?cid=guangzhou&tid=domestic&p=1",
        LIST_URL + "?cid=guangzhou&tid=domestic&p=2",
        LIST_URL + "?cid=guangzhou&tid=domestic&index=1",
        LIST_URL + "?cid=guangzhou&tid=domestic&index=2",
        LIST_URL + "?cid=guangzhou&tid=domestic&start=1",
        LIST_URL + "?cid=guangzhou&tid=domestic&start=2",
        LIST_URL + "?cid=guangzhou&tid=domestic&offset=0",
        LIST_URL + "?cid=guangzhou&tid=domestic&offset=50",
        LIST_URL + "?cid=guangzhou&tid=domestic&currentpage=1",
        LIST_URL + "?cid=guangzhou&tid=domestic&currentpage=2",
        LIST_URL + "?cid=guangzhou&tid=domestic&pageindex=1",
        LIST_URL + "?cid=guangzhou&tid=domestic&pageindex=2",
    ]

    results = []
    for url in urls:
        resp = fetch(url, headers=headers)
        if resp:
            # 提取产品数量（通过查找产品链接或标题模式）
            product_count = len(re.findall(r'class="[^"]*(?:product|item|line)[^"]*"', resp.text, re.IGNORECASE))
            results.append((url, len(resp.text), product_count))
            print(f"  {url.split('?')[1]:40s} -> {len(resp.text):6d} bytes, ~{product_count} products")


def test_cookie_session():
    """检查 cookie 和 session"""
    print(f"\n[6] 检查 Cookie 和 Session...")

    headers = {
        "User-Agent": USER_AGENTS["desktop"],
    }

    resp = fetch(LIST_URL + "?cid=guangzhou&tid=domestic&page=1", headers=headers)
    if resp:
        print(f"  Cookies:")
        for cookie in session.cookies:
            print(f"    {cookie.name}={cookie.value[:50] if len(cookie.value) > 50 else cookie.value}")

        print(f"  响应头:")
        for key, value in resp.headers.items():
            if key.lower() in ['set-cookie', 'x-aspnet-version', 'x-powered-by', 'server']:
                print(f"    {key}: {value}")


def analyze_list_page_html():
    """深入分析列表页 HTML 结构"""
    print(f"\n[7] 深入分析列表页 HTML 结构...")

    headers = {
        "User-Agent": USER_AGENTS["desktop"],
    }

    resp = fetch(LIST_URL + "?cid=guangzhou&tid=domestic&page=1", headers=headers)
    if not resp:
        return

    html = resp.text
    soup = BeautifulSoup(html, 'html.parser')

    # 查找产品列表容器
    print(f"  查找产品列表容器...")
    possible_containers = [
        soup.find('div', class_=re.compile(r'product|list|item|line|tour')),
        soup.find('ul', class_=re.compile(r'product|list|item|line|tour')),
        soup.find('section', class_=re.compile(r'product|list|item|line|tour')),
    ]

    for i, container in enumerate(possible_containers):
        if container:
            print(f"  容器 {i+1}: {container.name}.{container.get('class', [])}")
            items = container.find_all(['li', 'div', 'article'], recursive=False)
            print(f"    直接子元素: {len(items)}")

    # 查找所有 a 标签中的产品链接
    product_links = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        if 'line' in href.lower() or 'detail' in href.lower() or 'product' in href.lower():
            product_links.append(href)

    print(f"  发现 {len(product_links)} 个可能的产品链接")
    if product_links:
        print(f"  示例: {product_links[:5]}")

    # 查找分页相关元素
    pagination = soup.find(['div', 'ul', 'nav'], class_=re.compile(r'page|pagination'))
    if pagination:
        print(f"  发现分页元素: {pagination.get('class', [])}")
        print(f"  分页内容: {pagination.get_text(strip=True)[:200]}")
    else:
        print(f"  未发现明显的分页元素")

    # 查找是否有加载更多按钮
    load_more = soup.find(['a', 'button', 'div'], class_=re.compile(r'load|more|ajax'))
    if load_more:
        print(f"  发现加载更多元素: {load_more.get_text(strip=True)[:100]}")

    # 查找隐藏的 input 字段
    hidden_inputs = soup.find_all('input', type='hidden')
    print(f"  发现 {len(hidden_inputs)} 个隐藏 input 字段")
    for inp in hidden_inputs[:10]:
        name = inp.get('name', '')
        value = inp.get('value', '')
        if value:
            print(f"    {name}={value[:80]}")

    return html


def test_script_files(endpoints):
    """下载并分析外部 JS 文件"""
    print(f"\n[8] 分析外部 JS 文件...")

    js_files = [e for e in endpoints if e.endswith('.js')]
    print(f"  发现 {len(js_files)} 个 JS 文件")

    for js in js_files[:10]:  # 最多分析10个
        url = urljoin(BASE_URL, js) if not js.startswith('http') else js
        resp = fetch(url, timeout=10)
        if resp and resp.status_code == 200:
            js_content = resp.text
            # 在 JS 中搜索 API 调用
            api_calls = re.findall(r'["\']([^"\']*(?:api|ajax|data|handler)[^"\']*)["\']', js_content, re.IGNORECASE)
            if api_calls:
                print(f"  JS {js} 中发现 API 引用:")
                for call in list(set(api_calls))[:5]:
                    print(f"    {call}")


def test_asp_net_postback(viewstate):
    """测试 ASP.NET PostBack 机制"""
    print(f"\n[9] 测试 ASP.NET PostBack...")

    if not viewstate:
        print("  无 __VIEWSTATE，跳过")
        return

    headers = {
        "User-Agent": USER_AGENTS["desktop"],
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": LIST_URL + "?cid=guangzhou&tid=domestic&page=1",
    }

    # ASP.NET WebForms 通常需要这些字段
    post_data = {
        "__VIEWSTATE": viewstate,
        "__EVENTTARGET": "",
        "__EVENTARGUMENT": "",
        "__VIEWSTATEGENERATOR": "",
        "__EVENTVALIDATION": "",
    }

    # 先获取完整页面以获取所有隐藏字段
    resp = fetch(LIST_URL + "?cid=guangzhou&tid=domestic&page=1", headers=headers)
    if resp:
        html = resp.text
        # 提取所有隐藏字段
        hidden_fields = re.findall(r'<input[^>]*type="hidden"[^>]*>', html)
        print(f"  发现 {len(hidden_fields)} 个隐藏字段")

        # 尝试不同的 PostBack 触发方式
        # 方式1: 模拟分页点击
        post_data["__EVENTTARGET"] = "ctl00$ContentPlaceHolder1$Pager1$btnNext"
        post_data["__EVENTARGUMENT"] = ""

        resp2 = fetch(LIST_URL + "?cid=guangzhou&tid=domestic", headers=headers, method="POST", data=post_data)
        if resp2:
            print(f"  PostBack 状态码: {resp2.status_code}")
            print(f"  响应长度: {len(resp2.text)}")


def test_jsonp_endpoints():
    """测试 JSONP 端点"""
    print(f"\n[10] 测试 JSONP 端点...")

    endpoints = [
        "/api/line/list?callback=callback",
        "/ajax/line/list?callback=callback",
        "/data/line/list?callback=callback",
        "/api/line?callback=callback",
        "/ajax/line?callback=callback",
    ]

    headers = {
        "User-Agent": USER_AGENTS["desktop"],
        "Accept": "text/javascript, application/javascript, */*",
    }

    for endpoint in endpoints:
        url = urljoin(BASE_URL, endpoint)
        resp = fetch(url, headers=headers, timeout=10)
        if resp and resp.status_code == 200:
            if 'callback(' in resp.text or 'jsonp' in resp.text.lower():
                print(f"  [JSONP FOUND] {endpoint}")
                print(f"  响应: {resp.text[:200]}")


def test_webservice_endpoints():
    """测试 WebService 端点"""
    print(f"\n[11] 测试 WebService 端点...")

    endpoints = [
        "/services/LineService.asmx",
        "/services/ProductService.asmx",
        "/services/TourService.asmx",
        "/webservice/LineService.asmx",
        "/webservice/ProductService.asmx",
        "/api/LineService.asmx",
        "/api/ProductService.asmx",
    ]

    headers = {
        "User-Agent": USER_AGENTS["desktop"],
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "\"http://tempuri.org/HelloWorld\"",
    }

    soap_body = """<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HelloWorld xmlns="http://tempuri.org/" />
  </soap:Body>
</soap:Envelope>"""

    for endpoint in endpoints:
        url = urljoin(BASE_URL, endpoint)
        resp = fetch(url, headers=headers, method="POST", data=soap_body, timeout=10)
        if resp:
            if resp.status_code != 404:
                print(f"  [FOUND] {endpoint} -> HTTP {resp.status_code}")
                print(f"  响应: {resp.text[:200]}")


def test_mobile_api():
    """测试移动端 API"""
    print(f"\n[12] 测试移动端 API...")

    # 移动端可能有不同的 API 端点
    mobile_urls = [
        "http://m.gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1",
        "http://m.gz.ptotour.com/api/line/list",
        "http://m.gz.ptotour.com/ajax/line/list",
        "http://gz.ptotour.com/m/line/list.aspx?cid=guangzhou&tid=domestic&page=1",
        "http://gz.ptotour.com/mobile/line/list.aspx?cid=guangzhou&tid=domestic&page=1",
    ]

    headers = {
        "User-Agent": USER_AGENTS["mobile"],
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    for url in mobile_urls:
        resp = fetch(url, headers=headers, timeout=10)
        if resp:
            print(f"  {url}")
            print(f"    HTTP {resp.status_code}, {len(resp.text)} bytes")
            if resp.status_code == 200:
                # 检查是否是 JSON 响应
                try:
                    json.loads(resp.text)
                    print(f"    [JSON RESPONSE]")
                except:
                    pass


def test_robots_sitemap():
    """检查 robots.txt 和 sitemap"""
    print(f"\n[13] 检查 robots.txt 和 sitemap...")

    urls = [
        "http://gz.ptotour.com/robots.txt",
        "http://gz.ptotour.com/sitemap.xml",
        "http://gz.ptotour.com/sitemap.txt",
    ]

    for url in urls:
        resp = fetch(url, timeout=10)
        if resp and resp.status_code == 200:
            print(f"  {url}")
            print(f"  {resp.text[:500]}")


def main():
    print("=" * 70)
    print("品途旅游网站 API 探测脚本")
    print("=" * 70)

    # 1. 获取首页和列表页
    print(f"\n[*] 获取首页...")
    resp_index = fetch(BASE_URL, headers={"User-Agent": USER_AGENTS["desktop"]})
    if resp_index:
        print(f"  首页状态码: {resp_index.status_code}, {len(resp_index.text)} bytes")

    print(f"\n[*] 获取列表页...")
    resp_list = fetch(LIST_URL + "?cid=guangzhou&tid=domestic&page=1",
                      headers={"User-Agent": USER_AGENTS["desktop"]})
    if resp_list:
        print(f"  列表页状态码: {resp_list.status_code}, {len(resp_list.text)} bytes")

    # 2. 分析页面源码
    viewstate, endpoints = analyze_page_source(resp_list.text if resp_list else "", LIST_URL)
    print(f"\n  发现的端点/URL ({len(endpoints)} 个):")
    for e in sorted(endpoints)[:30]:
        print(f"    {e}")

    # 3. 执行各种测试
    test_post_list_page()
    test_common_api_endpoints()
    test_different_user_agents()
    test_pagination()
    test_cookie_session()
    html = analyze_list_page_html()
    test_script_files(endpoints)
    test_asp_net_postback(viewstate)
    test_jsonp_endpoints()
    test_webservice_endpoints()
    test_mobile_api()
    test_robots_sitemap()

    print("\n" + "=" * 70)
    print("探测完成")
    print("=" * 70)


if __name__ == "__main__":
    main()
