import argparse
import hashlib
import json
import os
import pathlib
import time
import urllib.error
import urllib.request


DEFAULT_SUP_API_BASE_URL = 'https://sup.yileyuns.com'
SUP_ORDER_URI = '/openapi/customer/Goods/Buy/'
SUP_GOODS_LIST_URI = '/openapi/customer/Goods/List/'
TARGET_PRODUCTS = [
    {
        'key': '18958',
        'name': '公众号文章爱心、拇指、转发三连',
        'quantity': 3,
        'override_env': 'SUP_GOODS_18958_SN',
    },
    {
        'key': '18944',
        'name': '精选24小时公众号曲线阅读',
        'quantity': 10,
        'override_env': 'SUP_GOODS_18944_SN',
    },
]


def build_app_token(app_id, app_secret, uri, timestamp):
    value = f'{app_id}{app_secret}{uri}{timestamp}'.encode('utf-8')
    return hashlib.sha1(value).hexdigest()


def build_auth_headers(app_id, app_secret, uri, timestamp):
    return {
        'AppId': app_id,
        'AppToken': build_app_token(app_id, app_secret, uri, timestamp),
        'AppTimestamp': str(timestamp),
    }


def request_json(base_url, app_id, app_secret, uri, method='GET', body=None):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode('utf-8')
    headers = build_auth_headers(app_id, app_secret, uri, int(time.time()))
    headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(f"{base_url.rstrip('/')}{uri}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as error:
        response_body = error.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'SUP HTTP {error.code}: {response_body}') from error
    except urllib.error.URLError as error:
        raise RuntimeError(f'SUP network error: {error.reason}') from error

    if payload.get('code') != 0:
        raise RuntimeError(f"SUP API error {payload.get('code')}: {payload.get('message') or payload.get('msg') or 'unknown error'}")
    return payload


def normalize_goods_list(payload):
    if payload.get('code') != 0:
        raise RuntimeError(f"SUP goods list failed: {payload.get('message') or payload.get('msg') or 'unknown error'}")
    goods = payload.get('data')
    if isinstance(goods, dict):
        goods = goods.get('data')
    if not isinstance(goods, list):
        raise RuntimeError('SUP goods list response has no data array')
    return goods


def resolve_target_goods(goods, target, override_serial_number=''):
    if override_serial_number:
        for item in goods:
            if str(item.get('serial_number')) == override_serial_number:
                return item
        raise RuntimeError(f"{target['key']}: configured goods serial number was not found")

    matches = [item for item in goods if target['name'] in str(item.get('name') or '')]
    if len(matches) != 1:
        raise RuntimeError(f"{target['key']}: expected one goods match for {target['name']}, found {len(matches)}")
    return matches[0]


def build_order_key(article_id, product_key):
    return f'{article_id}:{product_key}'


def validate_purchase(goods, target, article_url):
    if not article_url:
        raise RuntimeError(f"{target['key']}: article URL is empty")
    if int(goods.get('is_close') or 0) == 1:
        raise RuntimeError(f"{target['key']}: goods is closed")
    minimum = int(goods.get('buy_min_limit') or 0)
    maximum = int(goods.get('buy_max_limit') or 0)
    rate = int(goods.get('buy_rate') or 0)
    if target['quantity'] < minimum or target['quantity'] > maximum:
        raise RuntimeError(f"{target['key']}: quantity {target['quantity']} is outside the allowed range")
    if rate > 1 and target['quantity'] % rate != 0:
        raise RuntimeError(f"{target['key']}: quantity {target['quantity']} is not a multiple of buy_rate")


def build_order_payload(goods, target, article_url):
    validate_purchase(goods, target, article_url)
    return {
        'goods_sn': str(goods['serial_number']),
        'buy_number': target['quantity'],
        'buy_params': {'url': article_url},
    }


def get_pending_orders(new_articles, selected_products, completed_order_keys):
    pending = []
    for article in new_articles:
        for selected in selected_products:
            target = selected['target']
            if build_order_key(article['articleId'], target['key']) not in completed_order_keys:
                pending.append({'article': article, 'target': target, 'goods': selected['goods']})
    return pending


def merge_processed_article_ids(previous_ids, completed_article_ids):
    return list(dict.fromkeys(completed_article_ids + previous_ids))[:100]


def create_orders(pending_orders, completed_order_keys, request_order):
    next_completed = set(completed_order_keys)
    orders = []
    errors = []
    for item in pending_orders:
        article = item['article']
        target = item['target']
        try:
            payload = build_order_payload(item['goods'], target, article.get('url'))
            response = request_order(payload, article, target)
            orders.append({
                'articleId': article['articleId'],
                'articleUrl': article.get('url', ''),
                'productKey': target['key'],
                'quantity': target['quantity'],
                'orderSn': response.get('data', {}).get('order_sn', ''),
            })
            next_completed.add(build_order_key(article['articleId'], target['key']))
        except Exception as error:
            errors.append({
                'articleId': article['articleId'],
                'productKey': target['key'],
                'message': str(error),
            })
    return orders, errors, next_completed


def parse_completed_order_keys(value):
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed if item]
    except json.JSONDecodeError:
        return [item.strip() for item in value.split(',') if item.strip()]
    return []


def load_env_file(path):
    for line in pathlib.Path(path).read_text(encoding='utf-8').splitlines():
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ[key] = value


def write_result(output_path, result):
    pathlib.Path(output_path).write_text(json.dumps(result, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check-result', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--execute', choices=('true', 'false'), required=True)
    parser.add_argument('--env-file', required=True)
    args = parser.parse_args()

    load_env_file(args.env_file)
    check_result = json.loads(pathlib.Path(args.check_result).read_text(encoding='utf-8'))
    previous_ids = check_result.get('previousArticleIds') or []
    new_articles = check_result.get('newArticles') or []
    completed_order_keys = set(check_result.get('completedOrderKeys') or [])

    if check_result.get('baselineInitialized'):
        write_result(args.output, {
            'status': 'baseline_initialized',
            'updateState': True,
            'processedArticleIds': check_result.get('nextProcessedArticleIds') or [],
            'completedOrderKeys': sorted(completed_order_keys),
            'orders': [],
        })
        return

    if not new_articles:
        write_result(args.output, {
            'status': 'no_new_articles',
            'updateState': False,
            'processedArticleIds': previous_ids,
            'completedOrderKeys': sorted(completed_order_keys),
            'orders': [],
        })
        return

    app_id = os.environ.get('SUP_APP_ID', '').strip()
    app_secret = os.environ.get('SUP_APP_SECRET', '').strip()
    if not app_id or not app_secret:
        raise RuntimeError('SUP_APP_ID and SUP_APP_SECRET are required when new articles are found')

    base_url = os.environ.get('SUP_API_BASE_URL', DEFAULT_SUP_API_BASE_URL)
    goods = normalize_goods_list(request_json(base_url, app_id, app_secret, SUP_GOODS_LIST_URI))
    selected_products = [
        {
            'target': target,
            'goods': resolve_target_goods(goods, target, os.environ.get(target['override_env'], '').strip()),
        }
        for target in TARGET_PRODUCTS
    ]
    pending_orders = get_pending_orders(new_articles, selected_products, completed_order_keys)
    preflight = []
    for item in pending_orders:
        payload = build_order_payload(item['goods'], item['target'], item['article'].get('url'))
        preflight.append({
            'articleId': item['article']['articleId'],
            'articleUrl': item['article'].get('url', ''),
            'productKey': item['target']['key'],
            'goodsSn': payload['goods_sn'],
            'quantity': payload['buy_number'],
        })

    if args.execute == 'false':
        write_result(args.output, {
            'status': 'preflight_only',
            'updateState': False,
            'processedArticleIds': previous_ids,
            'completedOrderKeys': sorted(completed_order_keys),
            'preflight': preflight,
            'orders': [],
        })
        return

    orders, errors, completed_order_keys = create_orders(
        pending_orders,
        completed_order_keys,
        lambda payload, _article, _target: request_json(
            base_url, app_id, app_secret, SUP_ORDER_URI, method='POST', body=payload,
        ),
    )
    completed_article_ids = [
        article['articleId']
        for article in new_articles
        if all(build_order_key(article['articleId'], target['key']) in completed_order_keys for target in TARGET_PRODUCTS)
    ]
    write_result(args.output, {
        'status': 'partial_failure' if errors else 'orders_created',
        'updateState': True,
        'processedArticleIds': merge_processed_article_ids(previous_ids, completed_article_ids),
        'completedOrderKeys': sorted(completed_order_keys)[-500:],
        'preflight': preflight,
        'orders': orders,
        'errors': errors,
    })


if __name__ == '__main__':
    main()
