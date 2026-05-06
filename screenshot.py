import http.server
import socketserver
import threading
import time
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By

# Start HTTP server on port 8765
PORT = 8765
class MyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="dist", **kwargs)

httpd = socketserver.TCPServer(("", PORT), MyHandler)
server_thread = threading.Thread(target=httpd.serve_forever)
server_thread.daemon = True
server_thread.start()
print(f"Server started on port {PORT}")

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=1400,900')

driver = webdriver.Edge(options=options)

driver.get(f'http://localhost:{PORT}/')
time.sleep(5)  # 增加等待时间让图片加载
driver.save_screenshot('screenshot-home.png')
print('Home screenshot saved')

# Scroll to tour list
driver.execute_script("document.getElementById('tour-list').scrollIntoView()")
time.sleep(3)  # 等待图片加载
driver.save_screenshot('screenshot-tours.png')
print('Tours screenshot saved')

# Click admin button
admin_btn = driver.find_element(By.CSS_SELECTOR, 'button[title="爬虫管理"]')
admin_btn.click()
time.sleep(1)
driver.save_screenshot('screenshot-admin.png')
print('Admin screenshot saved')

driver.quit()
httpd.shutdown()
print('Done')
