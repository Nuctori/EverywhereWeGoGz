
import json
import re
import sys

def filter_products(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    weight_pattern = re.compile(r'\d+\s*(g|ml|斤|kg|L|盒|袋|罐|瓶|包|箱)')
    
    def is_product(t):
        title = t['title']
        price = t['price']
        
        has_weight = bool(weight_pattern.search(title))
        has_tour_kw = any(kw in title for kw in ['天', '日', '游', '团', '行程', '酒店', '景点', '门票', '飞机', '高铁', '出发'])
        is_cheap_item = price < 50 and len(title) < 25
        
        return (has_weight and not has_tour_kw) or (is_cheap_item and not has_tour_kw)
    
    filtered = [t for t in data if not is_product(t)]
    removed = [t for t in data if is_product(t)]
    
    print(f'原始数据: {len(data)} 条')
    print(f'移除卖货产品: {len(removed)} 条')
    print(f'保留旅行团: {len(filtered)} 条')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)
    
    return filtered, removed

if __name__ == '__main__':
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'public/data/tours.json'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'public/data/tours.json'
    filter_products(input_file, output_file)
