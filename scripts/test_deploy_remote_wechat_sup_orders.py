import pathlib
import sys


sys.path.insert(0, str(pathlib.Path(__file__).parent))
from deploy_remote_wechat_sup_orders import (  # noqa: E402
    build_remote_command,
    build_remote_cleanup_command,
    build_remote_env,
)


secret = 'secret-value'
command = build_remote_command('/tmp/sup-orders', '/tmp/sup-orders/run.py', '/tmp/sup-orders/check.json', '/tmp/sup-orders/result.json', '/tmp/sup-orders/sup.env', 'true')
assert secret not in command
assert '--env-file' in command
cleanup = build_remote_cleanup_command('/tmp/sup-orders/run.py', '/tmp/sup-orders/check.json', '/tmp/sup-orders/result.json', '/tmp/sup-orders/sup.env')
assert '/tmp/sup-orders/sup.env' in cleanup
assert build_remote_env('app', secret, 'https://sup.yileyuns.com') == (
    b'SUP_APP_ID=app\nSUP_APP_SECRET=secret-value\nSUP_API_BASE_URL=https://sup.yileyuns.com\n'
)
print('deploy_remote_wechat_sup_orders tests passed')
