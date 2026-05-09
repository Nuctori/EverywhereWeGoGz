import asyncio
import os
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3001/EverywhereWeGoGz/"
OUTPUT_DIR = r"D:\react\app\audit_screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

issues = {
    "严重": [],
    "中等": [],
    "轻微": []
}

def add_issue(level, category, description):
    issues[level].append(f"[{category}] {description}")

async def audit():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="zh-CN"
        )
        page = await context.new_page()

        # Enable console logging
        console_messages = []
        page.on("console", lambda msg: console_messages.append((msg.type, msg.text)))
        page.on("pageerror", lambda err: console_messages.append(("pageerror", str(err))))

        print("=== 1. 首页首屏体验 ===")
        await page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_1_hero.png"), full_page=False)
        print("截图已保存: audit_1_hero.png")

        # Check hero title and search
        try:
            hero_title = await page.locator("h1").first.inner_text(timeout=3000)
            print(f"首页标题: {hero_title}")
            if not hero_title or len(hero_title.strip()) < 3:
                add_issue("中等", "首页首屏", "首页主标题缺失或过于简短")
        except Exception:
            add_issue("中等", "首页首屏", "未找到 h1 标题元素")

        try:
            search_input = page.locator("input[type='search'], input[placeholder*='搜索'], input[placeholder*='search']").first
            if await search_input.is_visible(timeout=3000):
                print("搜索框可见")
            else:
                add_issue("中等", "首页首屏", "搜索框不可见")
        except Exception:
            add_issue("中等", "首页首屏", "未找到搜索框")

        print("\n=== 2. 产品卡片检查 ===")
        # Scroll down to cards
        await page.evaluate("window.scrollBy(0, 800)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_2_cards.png"), full_page=False)
        print("截图已保存: audit_2_cards.png")

        # Check cards
        cards = await page.locator("[class*='card'], .product-card, .tour-card, [class*='item']").all()
        if len(cards) == 0:
            # Try broader selectors
            cards = await page.locator("div:has(> img)").all()
        print(f"找到约 {len(cards)} 个卡片元素")

        if len(cards) == 0:
            add_issue("严重", "产品卡片", "页面上未找到任何产品卡片")
        else:
            # Check first few cards for price
            for i in range(min(3, len(cards))):
                card_text = await cards[i].inner_text()
                has_price = any(c in card_text for c in ["¥", "元", "价格", "price", "$"])
                if not has_price:
                    add_issue("中等", "产品卡片", f"第 {i+1} 个卡片未显示价格信息")

        # Click a product to open detail
        print("\n=== 点击产品打开详情 ===")
        try:
            clickable = page.locator("a, button, [role='button'], [class*='card']").first
            await clickable.click(timeout=5000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_3_detail.png"), full_page=False)
            print("截图已保存: audit_3_detail.png")
            # Close modal if possible
            try:
                close_btn = page.locator("button[class*='close'], [aria-label*='关闭'], [aria-label*='close']").first
                await close_btn.click(timeout=2000)
            except Exception:
                await page.keyboard.press("Escape")
        except Exception as e:
            add_issue("严重", "产品详情", f"无法点击打开产品详情: {e}")
            # Try screenshot anyway
            await page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_3_detail.png"), full_page=False)

        print("\n=== 3. 筛选功能测试 ===")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)
        try:
            filter_btn = page.locator("button:has-text('筛选'), button:has-text('过滤'), [class*='filter'], [class*='筛选']").first
            await filter_btn.click(timeout=5000)
            await page.wait_for_timeout(1500)
            await page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_4_filter.png"), full_page=False)
            print("截图已保存: audit_4_filter.png")

            # Try price filter
            try:
                price_input = page.locator("input[type='number'], input[placeholder*='价格'], input[placeholder*='Price']").first
                if await price_input.is_visible(timeout=2000):
                    await price_input.fill("100")
                    await page.wait_for_timeout(500)
                    print("价格筛选输入测试完成")
            except Exception:
                add_issue("轻微", "筛选功能", "未找到价格筛选输入框")

            # Try date filter
            try:
                date_input = page.locator("input[type='date'], input[placeholder*='日期'], input[placeholder*='date']").first
                if await date_input.is_visible(timeout=2000):
                    await date_input.fill("2025-06-01")
                    await page.wait_for_timeout(500)
                    print("日期筛选输入测试完成")
            except Exception:
                add_issue("轻微", "筛选功能", "未找到日期筛选输入框")

            # Close filter panel
            try:
                await page.keyboard.press("Escape")
            except Exception:
                pass
        except Exception as e:
            add_issue("严重", "筛选功能", f"无法打开筛选面板: {e}")
            await page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_4_filter.png"), full_page=False)

        print("\n=== 4. 加载更多测试 ===")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)
        # Scroll to bottom multiple times
        for _ in range(5):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_5_loadmore.png"), full_page=False)
        print("截图已保存: audit_5_loadmore.png")

        # Check if load more button or spinner exists
        load_more = page.locator("button:has-text('加载更多'), button:has-text('Load more'), [class*='loadmore'], [class*='loading']").first
        try:
            if await load_more.is_visible(timeout=2000):
                print("加载更多按钮/状态可见")
            else:
                add_issue("轻微", "加载更多", "未检测到加载更多按钮或加载状态指示器")
        except Exception:
            add_issue("轻微", "加载更多", "未检测到加载更多按钮或加载状态指示器")

        print("\n=== 5. 移动端响应式测试 ===")
        await context.close()
        mobile_context = await browser.new_context(
            viewport={"width": 375, "height": 812},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            locale="zh-CN"
        )
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        await mobile_page.wait_for_timeout(2000)
        await mobile_page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_6_mobile.png"), full_page=False)
        print("截图已保存: audit_6_mobile.png")

        # Check mobile text readability
        try:
            small_text = await mobile_page.evaluate("""
                () => {
                    const els = document.querySelectorAll('*');
                    for (const el of els) {
                        const style = window.getComputedStyle(el);
                        const size = parseFloat(style.fontSize);
                        if (size > 0 && size < 10) return true;
                    }
                    return false;
                }
            """)
            if small_text:
                add_issue("中等", "移动端响应式", "存在小于10px的文字，可能影响可读性")
        except Exception:
            pass

        # Check horizontal overflow
        try:
            has_overflow = await mobile_page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
            if has_overflow:
                add_issue("中等", "移动端响应式", "页面存在水平滚动条，布局可能未正确适配375px宽度")
        except Exception:
            pass

        await mobile_context.close()

        print("\n=== 6. 控制台错误检查 ===")
        # Re-open desktop context to get fresh console logs
        context2 = await browser.new_context(viewport={"width": 1280, "height": 900}, locale="zh-CN")
        page2 = await context2.new_page()
        console_logs = []
        page2.on("console", lambda msg: console_logs.append((msg.type, msg.text)))
        page2.on("pageerror", lambda err: console_logs.append(("pageerror", str(err))))
        await page2.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        await page2.wait_for_timeout(3000)

        errors = [log for log in console_logs if log[0] in ("error", "pageerror")]
        warnings = [log for log in console_logs if log[0] == "warning"]
        print(f"控制台错误数: {len(errors)}")
        print(f"控制台警告数: {len(warnings)}")

        for err in errors[:10]:
            add_issue("严重" if "error" in err[0] else "中等", "控制台", f"[{err[0]}] {err[1][:200]}")
        for warn in warnings[:5]:
            add_issue("轻微", "控制台", f"[warning] {warn[1][:200]}")

        await context2.close()
        await browser.close()

        # Print summary
        print("\n" + "="*60)
        print("审计问题汇总")
        print("="*60)
        for level in ["严重", "中等", "轻微"]:
            print(f"\n【{level}】({len(issues[level])} 项)")
            for issue in issues[level]:
                print(f"  - {issue}")

        # Save report
        report_path = os.path.join(OUTPUT_DIR, "audit_report.txt")
        with open(report_path, "w", encoding="utf-8") as f:
            f.write("网站审计报告\n")
            f.write("="*60 + "\n")
            f.write(f"目标URL: {BASE_URL}\n")
            f.write("="*60 + "\n\n")
            for level in ["严重", "中等", "轻微"]:
                f.write(f"\n【{level}】({len(issues[level])} 项)\n")
                for issue in issues[level]:
                    f.write(f"  - {issue}\n")
        print(f"\n报告已保存: {report_path}")

if __name__ == "__main__":
    asyncio.run(audit())
