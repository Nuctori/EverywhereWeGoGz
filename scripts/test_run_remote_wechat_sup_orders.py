import pathlib
import sys


sys.path.insert(0, str(pathlib.Path(__file__).parent))
from run_remote_wechat_sup_orders import (  # noqa: E402
    TARGET_PRODUCTS,
    build_app_token,
    build_order_payload,
    create_orders,
    merge_processed_article_ids,
    normalize_goods_list,
    resolve_target_goods,
)


assert build_app_token('app', 'secret', '/openapi/customer/Goods/Buy/', 1656057600) == '19c08869c0953a92f1550e7d5b1f3b611510d9ac'
goods = normalize_goods_list({
    'code': 0,
    'data': {
        'data': [
            {'serial_number': 'goods-18958', 'name': TARGET_PRODUCTS[0]['name'], 'buy_min_limit': 1, 'buy_max_limit': 400, 'buy_rate': 1, 'is_close': 2},
            {'serial_number': 'goods-18944', 'name': TARGET_PRODUCTS[1]['name'], 'buy_min_limit': 10, 'buy_max_limit': 2000, 'buy_rate': 10, 'is_close': 2},
        ],
    },
})
first = resolve_target_goods(goods, TARGET_PRODUCTS[0])
assert build_order_payload(first, TARGET_PRODUCTS[0], 'https://mp.weixin.qq.com/s/article-3') == {
    'goods_sn': 'goods-18958',
    'buy_number': 3,
    'buy_params': {'url': 'https://mp.weixin.qq.com/s/article-3'},
}
assert resolve_target_goods(goods, TARGET_PRODUCTS[1])['serial_number'] == 'goods-18944'

result = create_orders(
    [
        {'article': {'articleId': 'article-1', 'url': 'https://example.com/1'}, 'target': {'key': '18958', 'quantity': 3}, 'goods': goods[0]},
        {'article': {'articleId': 'article-1', 'url': 'https://example.com/1'}, 'target': {'key': '18944', 'quantity': 10}, 'goods': goods[1]},
    ],
    set(),
    lambda payload, _article, _target: ({'data': {'order_sn': 'order-1'}} if payload['goods_sn'] == 'goods-18958' else (_ for _ in ()).throw(RuntimeError('simulated SUP failure'))),
)
assert [order['orderSn'] for order in result[0]] == ['order-1']
assert [error['productKey'] for error in result[1]] == ['18944']
assert 'article-1:18958' in result[2]
assert 'article-1:18944' not in result[2]
previous_ids = [f'old-{index}' for index in range(100)]
assert merge_processed_article_ids(previous_ids, ['new-article']) == ['new-article', *previous_ids[:99]]
print('run_remote_wechat_sup_orders tests passed')
