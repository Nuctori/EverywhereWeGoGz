
import json
import re
import sys

try:
    from tour_blacklist import is_blacklisted_title
except ImportError:
    from scripts.tour_blacklist import is_blacklisted_title

def filter_products(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    weight_pattern = re.compile(r'\d+\s*(g|ml|斤|kg|L|盒|袋|罐|瓶|包|箱)', re.I)
    def is_product(t):
        title = str(t.get('title', ''))
        price = float(t.get('price', 0) or 0)
        compact = re.sub(r'\s+', '', title)
        
        has_weight = bool(weight_pattern.search(compact))
        has_tour_kw = any(kw in compact for kw in ['天', '日游', '游', '团', '行程', '酒店', '景点', '门票', '飞机', '高铁', '出发'])
        is_cheap_item = price < 50 and len(compact) < 25
        
        return is_blacklisted_title(compact) or (has_weight and not has_tour_kw) or (is_cheap_item and not has_tour_kw)
    
    filtered = [t for t in data if not is_product(t)]
    removed = [t for t in data if is_product(t)]
    
    print(f'原始数据: {len(data)} 条')
    print(f'移除卖货/非旅游: {len(removed)} 条')
    print(f'保留结果: {len(filtered)} 条')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)
    
    return filtered, removed

if __name__ == '__main__':
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'public/data/tours.json'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'public/data/tours.json'
    filter_products(input_file, output_file)
