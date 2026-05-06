import sys
sys.stdout.reconfigure(encoding='utf-8')

from selenium import webdriver
from selenium.webdriver.edge.options import Options
import time

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Edge(options=options)

# ========== 广州去旅行 ==========
print('=== 广州去旅行 ===')
driver.get('http://gzqlx.360jlb.cn/m/events?mid=48629')
time.sleep(3)
page_text = driver.find_element('tag name', 'body').text
lines = [l for l in page_text.split('\n') if '¥' in l and len(l) > 3]
print(f'Prices found: {len(lines)}')
for l in lines[:5]:
    print(f'  {l}')

# 获取所有文本，分析结构
all_lines = [l.strip() for l in page_text.split('\n') if l.strip()]
print(f'Total lines: {len(all_lines)}')
print('First 20 lines:')
for l in all_lines[:20]:
    print(f'  {l}')

print()

# ========== 暴走村 ==========
print('=== 暴走村 ===')
driver.get('http://gftblm.360jlb.cn/m/events?mid=73252')
time.sleep(3)
page_text2 = driver.find_element('tag name', 'body').text
lines2 = [l for l in page_text2.split('\n') if '¥' in l and len(l) > 3]
print(f'Prices found: {len(lines2)}')
for l in lines2[:5]:
    print(f'  {l}')

all_lines2 = [l.strip() for l in page_text2.split('\n') if l.strip()]
print(f'Total lines: {len(all_lines2)}')
print('First 20 lines:')
for l in all_lines2[:20]:
    print(f'  {l}')

driver.quit()
