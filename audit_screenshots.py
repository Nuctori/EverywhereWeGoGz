"""
Playwright 截图审计脚本
对 http://localhost:3000/EverywhereWeGoGz/ 进行截图审计
"""
import os
import sys
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

BASE_URL = "http://localhost:3000/EverywhereWeGoGz/"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# 截图文件路径
HOME_SCREENSHOT = os.path.join(OUTPUT_DIR, "audit_home.png")
SCROLL_SCREENSHOT = os.path.join(OUTPUT_DIR, "audit_scroll.png")
DETAIL_SCREENSHOT = os.path.join(OUTPUT_DIR, "audit_detail.png")
FILTER_SCREENSHOT = os.path.join(OUTPUT_DIR, "audit_filter.png")

issues = []

def log_issue(msg):
    issues.append(msg)
    print(f"[ISSUE] {msg}")

def log_info(msg):
    print(f"[INFO] {msg}")

def check_images(page, context=""):
    """检查页面中是否有图片加载失败（显示占位图或 broken image）"""
    broken = page.evaluate("""
        () => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs.filter(img => {
                const rect = img.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && img.naturalWidth === 0;
            }).map(img => img.src);
        }
    """)
    if broken:
        log_issue(f"{context} 发现 {len(broken)} 张图片加载失败: {broken[:3]}")
    else:
        log_info(f"{context} 未发现图片加载失败")

def check_text_overflow(page, context=""):
    """检查文字截断或溢出"""
    overflow_elements = page.evaluate("""
        () => {
            const all = Array.from(document.querySelectorAll('*'));
            return all.filter(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return (style.overflow === 'hidden' || style.overflow === 'scroll') &&
                       el.scrollWidth > rect.width &&
                       rect.width > 0 &&
                       el.children.length === 0;
            }).map(el => el.tagName + (el.className ? '.' + el.className.split(' ').slice(0,2).join('.') : ''));
        }
    """)
    if overflow_elements:
        log_issue(f"{context} 发现可能的文字溢出元素: {overflow_elements[:5]}")
    else:
        log_info(f"{context} 未发现明显文字溢出")

def check_layout_shift(page, context=""):
    """检查布局错位（通过检测重叠元素）"""
    overlaps = page.evaluate("""
        () => {
            const elems = Array.from(document.querySelectorAll('*')).filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });
            const overlaps = [];
            for (let i = 0; i < Math.min(elems.length, 200); i++) {
                const r1 = elems[i].getBoundingClientRect();
                for (let j = i + 1; j < Math.min(elems.length, 200); j++) {
                    const r2 = elems[j].getBoundingClientRect();
                    if (r1.left < r2.right && r1.right > r2.left &&
                        r1.top < r2.bottom && r1.bottom > r2.top) {
                        // 简单重叠检测，忽略嵌套
                        if (!elems[i].contains(elems[j]) && !elems[j].contains(elems[i])) {
                            overlaps.push(elems[i].tagName + ' vs ' + elems[j].tagName);
                            if (overlaps.length >= 5) break;
                        }
                    }
                }
                if (overlaps.length >= 5) break;
            }
            return overlaps;
        }
    """)
    if overlaps:
        log_issue(f"{context} 发现可能的重叠元素: {overlaps}")
    else:
        log_info(f"{context} 未发现明显布局重叠")

def check_buttons_clickable(page, context=""):
    """检查按钮是否可点击"""
    buttons = page.query_selector_all('button, [role="button"], a')
    disabled_count = 0
    for btn in buttons:
        if btn.is_disabled():
            disabled_count += 1
    log_info(f"{context} 共 {len(buttons)} 个可交互元素，{disabled_count} 个 disabled")

def check_loading_state(page, context=""):
    """检查加载状态异常"""
    loading_indicators = page.query_selector_all('.loading, .spinner, [class*="loading"], [class*="spinner"], [class*="skeleton"]')
    log_info(f"{context} 发现 {len(loading_indicators)} 个加载指示器")
    if len(loading_indicators) > 10:
        log_issue(f"{context} 加载指示器数量异常多: {len(loading_indicators)}")

def run_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1,
        )
        page = context.new_page()

        try:
            log_info(f"正在访问 {BASE_URL}")
            page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)
        except PlaywrightTimeout:
            log_issue("页面加载超时，可能服务未启动")
            browser.close()
            return issues

        # 1. 首页整体布局截图
        log_info("步骤1: 截取首页整体布局")
        page.screenshot(path=HOME_SCREENSHOT, full_page=True)
        log_info(f"首页截图已保存: {HOME_SCREENSHOT}")
        check_images(page, "首页")
        check_text_overflow(page, "首页")
        check_layout_shift(page, "首页")
        check_buttons_clickable(page, "首页")
        check_loading_state(page, "首页")

        # 2. 滚动到底部检查加载更多
        log_info("步骤2: 滚动到底部")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)
        page.screenshot(path=SCROLL_SCREENSHOT, full_page=True)
        log_info(f"滚动截图已保存: {SCROLL_SCREENSHOT}")
        check_images(page, "滚动后")
        check_loading_state(page, "滚动后")

        # 3. 点击产品卡片查看详情弹窗
        log_info("步骤3: 点击产品卡片")
        # 尝试多种可能的选择器
        card_selectors = [
            '[data-testid="product-card"]',
            '.product-card',
            '.card',
            '.item-card',
            '[class*="card"]',
            'a[href]',
        ]
        clicked = False
        for selector in card_selectors:
            try:
                cards = page.query_selector_all(selector)
                for card in cards:
                    if card.is_visible():
                        card.click()
                        page.wait_for_timeout(1500)
                        clicked = True
                        log_info(f"成功点击元素: {selector}")
                        break
                if clicked:
                    break
            except Exception as e:
                continue
        if not clicked:
            # 尝试点击页面中第一个可见的 div 或 a
            all_clickable = page.query_selector_all('div, a, button')
            for el in all_clickable:
                try:
                    if el.is_visible() and el.bounding_box() and el.bounding_box()['width'] > 100:
                        el.click()
                        page.wait_for_timeout(1500)
                        clicked = True
                        log_info("点击了第一个较大的可见元素")
                        break
                except:
                    continue
        if not clicked:
            log_issue("未能找到可点击的产品卡片")
        page.screenshot(path=DETAIL_SCREENSHOT, full_page=True)
        log_info(f"详情弹窗截图已保存: {DETAIL_SCREENSHOT}")

        # 关闭弹窗（如果有）
        try:
            close_buttons = page.query_selector_all('[aria-label="close"], .close, [class*="close"], button:has-text("关闭"), button:has-text("×"), button:has-text("X")')
            for btn in close_buttons:
                if btn.is_visible():
                    btn.click()
                    page.wait_for_timeout(500)
                    break
        except:
            pass
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)

        # 4. 检查筛选面板展开状态
        log_info("步骤4: 检查筛选面板")
        filter_selectors = [
            'button:has-text("筛选")',
            'button:has-text("Filter")',
            'button:has-text("筛选条件")',
            '[data-testid="filter-toggle"]',
            '.filter-toggle',
            '.filter-button',
            '[class*="filter"]',
        ]
        filter_opened = False
        for selector in filter_selectors:
            try:
                btn = page.query_selector(selector)
                if btn and btn.is_visible():
                    btn.click()
                    page.wait_for_timeout(1500)
                    filter_opened = True
                    log_info(f"成功点击筛选按钮: {selector}")
                    break
            except Exception as e:
                continue
        if not filter_opened:
            log_issue("未能找到或点击筛选按钮")
        page.screenshot(path=FILTER_SCREENSHOT, full_page=True)
        log_info(f"筛选面板截图已保存: {FILTER_SCREENSHOT}")

        browser.close()
        log_info("审计完成")
        return issues

if __name__ == "__main__":
    issues_found = run_audit()
    print("\n" + "=" * 50)
    print("审计结果汇总")
    print("=" * 50)
    if issues_found:
        print(f"共发现 {len(issues_found)} 个问题:")
        for i, issue in enumerate(issues_found, 1):
            print(f"  {i}. {issue}")
    else:
        print("未发现明显问题")
    print("=" * 50)
