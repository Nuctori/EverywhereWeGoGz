# -*- coding: utf-8 -*-
"""Canonical place matching used by the data merge and geo quality audit."""

import re


PLACE_ROWS = [
    ("广州", "中国", "广东", 23.1291, 113.2644, ("广州", "广州市", "南沙")),
    ("东莞", "中国", "广东", 23.0207, 113.7518, ("东莞", "东莞市", "桥头")),
    ("中山", "中国", "广东", 22.5176, 113.3926, ("中山", "中山市", "神湾")),
    ("梅州", "中国", "广东", 24.2886, 116.122, ("梅州", "梅州市", "五华热矿泥")),
    ("深圳", "中国", "广东", 22.5431, 114.0579, ("深圳", "深圳市")),
    ("珠海", "中国", "广东", 22.271, 113.5767, ("珠海", "珠海市", "海泉湾", "东澳岛", "桂山岛", "外伶仃岛")),
    ("惠州", "中国", "广东", 23.1115, 114.4152, ("惠州", "惠州市", "巽寮湾", "双月湾", "罗浮山")),
    ("清远", "中国", "广东", 23.6818, 113.056, ("清远", "清远市", "美林湖", "古龙峡", "清泉湾")),
    ("韶关", "中国", "广东", 24.8104, 113.5972, ("韶关", "韶关市", "南华寺", "丹霞山")),
    ("肇庆", "中国", "广东", 23.0472, 112.4651, ("肇庆", "肇庆市", "蓝钟", "七星岩", "紫云谷")),
    ("佛山", "中国", "广东", 23.0218, 113.1219, ("佛山", "佛山市")),
    ("江门", "中国", "广东", 22.5787, 113.0815, ("江门", "江门市")),
    ("阳江", "中国", "广东", 21.8579, 111.9822, ("阳江", "阳江市", "海陵岛", "闸坡", "北洛秘境", "大角湾", "瓦晒湾")),
    ("汕头", "中国", "广东", 23.3541, 116.6819, ("汕头", "汕头市", "南澳岛", "青澳湾", "贝沙湾")),
    ("汕尾", "中国", "广东", 22.7869, 115.3753, ("汕尾", "汕尾市", "红海湾")),
    ("潮州", "中国", "广东", 23.6567, 116.6226, ("潮州", "潮州市")),
    ("湛江", "中国", "广东", 21.2707, 110.3594, ("湛江", "湛江市")),
    ("茂名", "中国", "广东", 21.6627, 110.9255, ("茂名", "茂名市")),
    ("贺州", "中国", "广西", 24.4036, 111.5668, ("贺州", "贺州市", "姑婆山", "西溪")),
    ("龙门", "中国", "广东", 23.723, 114.25, ("龙门", "龙门县", "南昆山", "云顶", "地派", "竹溪山境", "美泉谷", "玥泉庄", "逸泉庄", "尚天然", "林丰", "温泉大观园", "庄上庄", "颐和温泉", "康桥温泉", "南昆山居")),
    ("河源", "中国", "广东", 23.7463, 114.7007, ("河源", "河源市", "万绿湖", "叶园温泉")),
    ("连平", "中国", "广东", 24.3696, 114.4887, ("连平", "连平县", "鹰嘴桃")),
    ("德庆", "中国", "广东", 23.1456, 111.7859, ("德庆", "德庆县", "悦城龙母祖庙")),
    ("翁源", "中国", "广东", 24.3506, 114.1301, ("翁源", "翁源县", "翁山源温泉", "龙泰翁山源温泉")),
    ("开平", "中国", "广东", 22.376, 112.6985, ("开平", "开平市", "赤坎古镇")),
    ("鹤山", "中国", "广东", 22.7659, 112.9643, ("鹤山", "鹤山市")),
    ("三水", "中国", "广东", 23.1557, 112.8966, ("三水", "三水区", "三水温泉")),
    ("阳西", "中国", "广东", 21.7529, 111.6177, ("阳西", "阳西县", "沙扒湾", "咸水矿温泉")),
    ("新丰", "中国", "广东", 24.0592, 114.207, ("新丰", "新丰县", "雅致酒店", "云天海", "江源温泉", "温德姆花园酒店")),
    ("英德", "中国", "广东", 24.1861, 113.401, ("英德", "英德市", "海螺国际大酒店")),
    ("安远", "中国", "江西", 25.1346, 115.3939, ("安远", "安远县", "三百山", "热泉河")),
    ("阳山", "中国", "广东", 24.4706, 112.641, ("阳山", "阳山县", "阳山第一峰")),
    ("新兴", "中国", "广东", 22.695, 112.225, ("新兴", "新兴县", "象窝", "龙山温泉", "禅域小镇", "悦天下", "三页温泉", "天露山")),
    ("台山", "中国", "广东", 22.2514, 112.7938, ("台山", "台山市", "泽汇温泉", "金水台", "富丽湾")),
    ("恩平", "中国", "广东", 22.1833, 112.3051, ("恩平", "恩平市", "山泉湾", "喜运来温泉", "温泉国际酒店")),
    ("佛冈", "中国", "广东", 23.879, 113.532, ("佛冈", "佛冈县", "聚龙湾", "森波拉")),
    ("增城", "中国", "广东", 23.2904, 113.8108, ("增城", "增城区", "三英温泉", "高滩温泉", "合汇温泉")),
    ("从化", "中国", "广东", 23.5483, 113.5867, ("从化", "从化区", "圣托利温泉庄园", "壹泉湾", "卓思道", "望谷温泉", "大丰门", "流溪河国家森林公园")),
    ("新会", "中国", "广东", 22.4583, 113.034, ("新会", "新会区", "古兜温泉")),
    ("连州", "中国", "广东", 24.7814, 112.377, ("连州", "连州市", "地下河", "水晶梨")),
    ("玉林", "中国", "广西", 22.6364, 110.1648, ("玉林", "玉林市", "璟象九龙温泉")),
    ("郴州", "中国", "湖南", 25.7705, 113.0149, ("郴州", "郴州市", "莽山")),
    ("龙南", "中国", "江西", 24.8647, 114.789, ("龙南", "龙南县", "汉仙温泉")),
    ("汝城", "中国", "湖南", 25.5327, 113.6858, ("汝城", "汝城县", "官溪温泉", "热水河")),
    ("泉州", "中国", "福建", 24.8741, 118.6757, ("泉州", "泉州市", "洛伽寺", "蟳蜅渔村")),
    ("平潭", "中国", "福建", 25.5037, 119.791, ("平潭", "平潭县", "猴研岛", "长江澳")),
    ("漳州", "中国", "福建", 24.5129, 117.6471, ("漳州", "漳州市", "土楼")),
    ("永定", "中国", "福建", 24.723, 116.732, ("永定", "永定土楼")),
    ("六盘水", "中国", "贵州", 26.5846, 104.8485, ("六盘水", "六盘水市")),
    ("霞浦", "中国", "福建", 26.8854, 120.005, ("霞浦", "霞浦县")),
    ("北海", "中国", "广西", 21.4733, 109.1193, ("北海", "北海市", "涠洲岛")),
    ("柳州", "中国", "广西", 24.3255, 109.4155, ("柳州", "柳州市")),
    ("崇左", "中国", "广西", 22.3771, 107.3647, ("崇左", "崇左市", "德天瀑布")),
    ("三门海", "中国", "广西", 24.1095, 107.539, ("三门海",)),
    ("大理", "中国", "云南", 25.6065, 100.2676, ("大理", "大理市", "洱海")),
    ("普者黑", "中国", "云南", 24.1227, 104.195, ("普者黑",)),
    ("丽江", "中国", "云南", 26.8721, 100.233, ("丽江", "丽江市", "玉龙雪山")),
    ("西双版纳", "中国", "云南", 22.0074, 100.7979, ("西双版纳", "版纳")),
    ("长沙", "中国", "湖南", 28.2282, 112.9388, ("长沙", "长沙市")),
    ("恩施", "中国", "湖北", 30.2722, 109.4882, ("恩施", "恩施市")),
    ("神农架", "中国", "湖北", 31.7449, 110.6759, ("神农架",)),
    ("庐山", "中国", "江西", 29.5602, 115.992, ("庐山",)),
    ("三清山", "中国", "江西", 28.8955, 118.0645, ("三清山",)),
    ("婺源", "中国", "江西", 29.2481, 117.8622, ("婺源",)),
    ("景德镇", "中国", "江西", 29.2687, 117.1784, ("景德镇",)),
    ("赣州", "中国", "江西", 25.8311, 114.935, ("赣州", "赣州市")),
    ("温州", "中国", "浙江", 27.9949, 120.6994, ("温州", "温州市")),
    ("杭州", "中国", "浙江", 30.2741, 120.1551, ("杭州", "杭州市", "西湖")),
    ("黄山", "中国", "安徽", 29.7147, 118.3376, ("黄山", "黄山市")),
    ("大连", "中国", "辽宁", 38.914, 121.6147, ("大连", "大连市")),
    ("西宁", "中国", "青海", 36.6171, 101.7782, ("西宁", "西宁市")),
    ("兰州", "中国", "甘肃", 36.0611, 103.8343, ("兰州", "兰州市")),
    ("敦煌", "中国", "甘肃", 40.1421, 94.6619, ("敦煌", "敦煌市", "莫高窟")),
    ("张掖", "中国", "甘肃", 38.9259, 100.4498, ("张掖", "张掖市")),
    ("嘉峪关", "中国", "甘肃", 39.7731, 98.2882, ("嘉峪关", "嘉峪关市")),
    ("海拉尔", "中国", "内蒙古", 49.2116, 119.7657, ("海拉尔",)),
    ("满洲里", "中国", "内蒙古", 49.5978, 117.3787, ("满洲里", "满洲里市")),
    ("呼伦贝尔", "中国", "内蒙古", 49.2116, 119.7657, ("呼伦贝尔", "呼伦湖")),
    ("马拉喀什", "摩洛哥", None, 31.6295, -7.9811, ("马拉喀什",)),
    ("喀什", "中国", "新疆", 39.4677, 75.9938, ("喀什", "喀什市")),
    ("伊犁", "中国", "新疆", 43.9168, 81.3241, ("伊犁",)),
    ("喀纳斯", "中国", "新疆", 48.819, 87.038, ("喀纳斯", "喀纳斯湖")),
    ("贵阳", "中国", "贵州", 26.647, 106.6302, ("贵阳", "贵阳市")),
    ("黄果树", "中国", "贵州", 25.99, 105.666, ("黄果树", "黄果树瀑布")),
    ("荔波", "中国", "贵州", 25.4122, 107.8838, ("荔波", "荔波县")),
    ("西江", "中国", "贵州", 26.4956, 108.176, ("西江", "西江千户苗寨")),
    ("桂林", "中国", "广西", 25.2736, 110.2902, ("桂林", "桂林市")),
    ("南宁", "中国", "广西", 22.817, 108.3665, ("南宁", "南宁市")),
    ("张家界", "中国", "湖南", 29.1171, 110.4792, ("张家界", "张家界市")),
    ("厦门", "中国", "福建", 24.4798, 118.0894, ("厦门", "厦门市")),
    ("三亚", "中国", "海南", 18.2528, 109.5119, ("三亚", "三亚市")),
    ("昆明", "中国", "云南", 25.0389, 102.7183, ("昆明", "昆明市")),
    ("成都", "中国", "四川", 30.5728, 104.0668, ("成都", "成都市")),
    ("重庆", "中国", "重庆", 29.563, 106.5516, ("重庆", "重庆市", "武隆", "仙女山")),
    ("北京", "中国", "北京", 39.9042, 116.4074, ("北京", "北京市")),
    ("上海", "中国", "上海", 31.2304, 121.4737, ("上海", "上海市")),
    ("西安", "中国", "陕西", 34.3416, 108.9398, ("西安", "西安市")),
    ("乌鲁木齐", "中国", "新疆", 43.8256, 87.6168, ("乌鲁木齐", "乌鲁木齐市")),
    ("拉萨", "中国", "西藏", 29.652, 91.1721, ("拉萨", "拉萨市")),
    ("呼和浩特", "中国", "内蒙古", 40.8414, 111.7519, ("呼和浩特", "呼和浩特市")),
    ("哈尔滨", "中国", "黑龙江", 45.8038, 126.5349, ("哈尔滨", "哈尔滨市")),
    ("河内", "越南", None, 21.0285, 105.8542, ("河内", "河内市")),
    ("曼谷", "泰国", None, 13.7563, 100.5018, ("曼谷", "曼谷市")),
    ("清迈", "泰国", None, 18.7883, 98.9853, ("清迈",)),
    ("普吉岛", "泰国", None, 7.8804, 98.3923, ("普吉岛", "普吉")),
    ("胡志明市", "越南", None, 10.8231, 106.6297, ("胡志明", "胡志明市")),
    ("芽庄", "越南", None, 12.2388, 109.1967, ("芽庄",)),
    ("东京", "日本", None, 35.6762, 139.6503, ("东京", "东京市")),
    ("大阪", "日本", None, 34.6937, 135.5023, ("大阪", "大阪市")),
    ("京都", "日本", None, 35.0116, 135.7681, ("京都", "京都市")),
    ("首尔", "韩国", None, 37.5665, 126.978, ("首尔", "首尔市")),
    ("新加坡", "新加坡", None, 1.3521, 103.8198, ("新加坡",)),
    ("吉隆坡", "马来西亚", None, 3.139, 101.6869, ("吉隆坡", "吉隆坡市")),
    ("仙本那", "马来西亚", None, 4.4818, 118.6112, ("仙本那", "斗湖")),
    ("巴厘岛", "印度尼西亚", None, -8.4095, 115.1889, ("巴厘岛", "巴厘")),
    ("奥克兰", "新西兰", None, -36.8509, 174.7645, ("奥克兰",)),
    ("基督城", "新西兰", None, -43.5321, 172.6362, ("基督城",)),
    ("皇后镇", "新西兰", None, -45.0312, 168.6626, ("皇后镇",)),
    ("悉尼", "澳大利亚", None, -33.8688, 151.2093, ("悉尼", "悉尼市")),
    ("墨尔本", "澳大利亚", None, -37.8136, 144.9631, ("墨尔本",)),
    ("布里斯班", "澳大利亚", None, -27.4698, 153.0251, ("布里斯班",)),
    ("凯恩斯", "澳大利亚", None, -16.9186, 145.7781, ("凯恩斯", "大堡礁")),
    ("马尔代夫", "马尔代夫", None, 4.1755, 73.5093, ("马尔代夫",)),
    ("莫斯科", "俄罗斯", None, 55.7558, 37.6173, ("莫斯科",)),
    ("圣彼得堡", "俄罗斯", None, 59.9343, 30.3351, ("圣彼得堡",)),
    ("巴黎", "法国", None, 48.8566, 2.3522, ("巴黎", "巴黎市")),
    ("伦敦", "英国", None, 51.5074, -0.1278, ("伦敦", "伦敦市")),
    ("香港", "中国", "港澳", 22.3193, 114.1694, ("香港", "香港特别行政区")),
    ("香港迪士尼", "中国", "港澳", 22.3129, 114.0413, ("香港迪士尼", "香港迪士尼乐园")),
    ("澳门", "中国", "港澳", 22.1987, 113.5439, ("澳门", "澳门特别行政区")),
    ("乌镇", "中国", "浙江", 30.7539, 120.6522, ("乌镇",)),
    ("周庄", "中国", "江苏", 31.1179, 120.9168, ("周庄",)),
    ("南浔", "中国", "浙江", 30.8675, 120.4328, ("南浔",)),
    ("拈花湾", "中国", "江苏", 31.495, 120.162, ("拈花湾",)),
    ("牛首山", "中国", "江苏", 31.843, 118.72, ("牛首山",)),
    ("盐洲岛", "中国", "广东", 22.648, 114.94, ("盐洲岛",)),
    ("亚婆角", "中国", "广东", 22.63, 114.68, ("亚婆角",)),
    ("东山岛", "中国", "福建", 23.7, 117.43, ("东山岛",)),
    ("南门湾", "中国", "福建", 23.7, 117.43, ("南门湾",)),
    ("九寨沟", "中国", "四川", 33.26, 103.92, ("九寨沟",)),
    ("黄龙", "中国", "四川", 32.75, 103.82, ("黄龙",)),
    ("都江堰", "中国", "四川", 31.005, 103.619, ("都江堰",)),
    ("西岭雪山", "中国", "四川", 30.58, 103.18, ("西岭雪山",)),
    ("稻城亚丁", "中国", "四川", 28.43, 100.34, ("稻城亚丁",)),
    ("海螺沟", "中国", "四川", 29.58, 102.0, ("海螺沟",)),
    ("四姑娘山", "中国", "四川", 31.1, 102.95, ("四姑娘山",)),
    ("峨眉山", "中国", "四川", 29.52, 103.33, ("峨眉山",)),
    ("乐山", "中国", "四川", 29.55, 103.77, ("乐山", "乐山市")),
    ("泸沽湖", "中国", "云南", 27.7, 100.78, ("泸沽湖",)),
    ("香格里拉", "中国", "云南", 27.83, 99.7, ("香格里拉",)),
    ("腾冲", "中国", "云南", 25.02, 98.5, ("腾冲", "腾冲市")),
    ("芒市", "中国", "云南", 24.43, 98.58, ("芒市", "芒市市")),
    ("瑞丽", "中国", "云南", 24.01, 97.85, ("瑞丽", "瑞丽市")),
    ("普洱", "中国", "云南", 22.78, 100.97, ("普洱", "普洱市")),
    ("弥勒", "中国", "云南", 24.41, 103.44, ("弥勒", "弥勒市")),
    ("吐鲁番", "中国", "新疆", 42.95, 89.19, ("吐鲁番", "吐鲁番市")),
    ("禾木村", "中国", "新疆", 48.57, 87.01, ("禾木村", "禾木")),
    ("赛里木湖", "中国", "新疆", 44.6, 81.17, ("赛里木湖",)),
    ("那拉提", "中国", "新疆", 43.31, 83.73, ("那拉提", "那拉提草原")),
    ("独库公路", "中国", "新疆", 43.1, 84.9, ("独库公路",)),
    ("青海湖", "中国", "青海", 36.7, 100.5, ("青海湖",)),
    ("茶卡盐湖", "中国", "青海", 36.79, 99.08, ("茶卡盐湖", "茶卡")),
    ("林芝", "中国", "西藏", 29.65, 94.36, ("林芝", "林芝市")),
    ("宜昌", "中国", "湖北", 30.69, 111.28, ("宜昌", "宜昌市")),
    ("南昌", "中国", "江西", 28.68, 115.86, ("南昌", "南昌市")),
    ("洛阳", "中国", "河南", 34.62, 112.45, ("洛阳", "洛阳市")),
    ("开封", "中国", "河南", 34.8, 114.31, ("开封", "开封市")),
    ("青岛", "中国", "山东", 36.067, 120.382, ("青岛", "青岛市")),
    ("威海", "中国", "山东", 37.51, 122.12, ("威海", "威海市")),
    ("烟台", "中国", "山东", 37.46, 121.45, ("烟台", "烟台市")),
    ("泰山", "中国", "山东", 36.25, 117.1, ("泰山",)),
    ("福州", "中国", "福建", 26.07, 119.3, ("福州", "福州市")),
    ("宁波", "中国", "浙江", 29.87, 121.55, ("宁波", "宁波市")),
    ("苏州", "中国", "江苏", 31.3, 120.58, ("苏州", "苏州市")),
    ("无锡", "中国", "江苏", 31.49, 120.31, ("无锡", "无锡市")),
    ("南京", "中国", "江苏", 32.06, 118.8, ("南京", "南京市")),
    ("台州", "中国", "浙江", 28.66, 121.42, ("台州", "台州市")),
    ("海口", "中国", "海南", 20.02, 110.35, ("海口", "海口市")),
    ("武夷山", "中国", "福建", 27.75, 118.04, ("武夷山",)),
    ("济州岛", "韩国", None, 33.36, 126.53, ("济州岛", "济州")),
    ("沙巴", "马来西亚", None, 5.98, 116.07, ("沙巴",)),
    ("芭提雅", "泰国", None, 12.92, 100.88, ("芭提雅", "芭堤雅")),
    ("清莱", "泰国", None, 19.91, 99.83, ("清莱",)),
    ("下龙湾", "越南", None, 20.95, 107.08, ("下龙湾",)),
    ("美奈", "越南", None, 10.93, 108.1, ("美奈",)),
    ("岘港", "越南", None, 16.05, 108.2, ("岘港",)),
    ("迪拜", "阿联酋", None, 25.2048, 55.2708, ("迪拜",)),
    ("阿布扎比", "阿联酋", None, 24.4539, 54.3773, ("阿布扎比",)),
    ("棉花堡", "土耳其", None, 37.92, 29.12, ("棉花堡",)),
    ("伊斯坦布尔", "土耳其", None, 41.0082, 28.9784, ("伊斯坦布尔",)),
    ("卡帕多奇亚", "土耳其", None, 38.64, 34.83, ("卡帕多奇亚",)),
    ("费特希耶", "土耳其", None, 36.62, 29.12, ("费特希耶",)),
    ("加德满都", "尼泊尔", None, 27.7172, 85.324, ("加德满都",)),
    ("万象", "老挝", None, 17.9757, 102.633, ("万象",)),
    ("万荣", "老挝", None, 18.923, 102.45, ("万荣",)),
    ("琅勃拉邦", "老挝", None, 19.88, 102.135, ("琅勃拉邦",)),
    ("金边", "柬埔寨", None, 11.5564, 104.9282, ("金边",)),
    ("吴哥窟", "柬埔寨", None, 13.4125, 103.867, ("吴哥窟", "吴哥")),
    ("纽约", "美国", None, 40.7128, -74.006, ("纽约", "纽约市")),
]

PLACES = [
    {
        "name": name,
        "country": country,
        "province": province,
        "latitude": latitude,
        "longitude": longitude,
        "aliases": aliases,
    }
    for name, country, province, latitude, longitude, aliases in PLACE_ROWS
]
KNOWN_PROVINCE_PREFIXES = {place["province"] for place in PLACES if place.get("province")}
REGION_ROWS = [
    ("中国", None, ("中国",)),
    ("北京", "北京", ("北京",)), ("天津", "天津", ("天津",)),
    ("河北", "河北", ("河北",)), ("山西", "山西", ("山西",)),
    ("内蒙古", "内蒙古", ("内蒙古", "内蒙")), ("辽宁", "辽宁", ("辽宁",)),
    ("吉林", "吉林", ("吉林",)), ("黑龙江", "黑龙江", ("黑龙江",)),
    ("上海", "上海", ("上海",)), ("江苏", "江苏", ("江苏",)),
    ("浙江", "浙江", ("浙江",)), ("安徽", "安徽", ("安徽",)),
    ("福建", "福建", ("福建",)), ("江西", "江西", ("江西",)),
    ("山东", "山东", ("山东",)), ("河南", "河南", ("河南",)),
    ("湖北", "湖北", ("湖北",)), ("湖南", "湖南", ("湖南",)),
    ("广东", "广东", ("广东",)), ("广西", "广西", ("广西",)),
    ("海南", "海南", ("海南",)), ("重庆", "重庆", ("重庆",)),
    ("四川", "四川", ("四川",)), ("贵州", "贵州", ("贵州",)),
    ("云南", "云南", ("云南",)), ("西藏", "西藏", ("西藏",)),
    ("陕西", "陕西", ("陕西",)), ("甘肃", "甘肃", ("甘肃",)),
    ("青海", "青海", ("青海",)), ("宁夏", "宁夏", ("宁夏",)),
    ("新疆", "新疆", ("新疆",)),
    ("越南", None, ("越南",)), ("泰国", None, ("泰国",)),
    ("日本", None, ("日本",)), ("韩国", None, ("韩国",)),
    ("新加坡", None, ("新加坡",)), ("马来西亚", None, ("马来西亚",)),
    ("印度尼西亚", None, ("印度尼西亚", "印尼")), ("澳大利亚", None, ("澳大利亚",)),
    ("法国", None, ("法国",)), ("英国", None, ("英国",)), ("美国", None, ("美国",)),
]
REGIONS = [
    {"name": name, "country": "中国" if province else name, "province": province, "aliases": aliases}
    for name, province, aliases in REGION_ROWS
]
ALIAS_ROWS = sorted(
    ((alias, place) for place in PLACES for alias in place["aliases"]),
    key=lambda item: len(item[0]),
    reverse=True,
)
ALIAS_PARENT_COUNTS = {
    alias: len({place["name"] for candidate_alias, place in ALIAS_ROWS if candidate_alias == alias})
    for alias, _ in ALIAS_ROWS
}
REGION_ALIAS_ROWS = sorted(
    ((alias, region) for region in REGIONS for alias in region["aliases"]),
    key=lambda item: len(item[0]),
    reverse=True,
)
NEARBY_PROVINCES_BY_DEPARTURE = {
    "广东": {"广西", "湖南", "江西", "福建", "海南"},
    "北京": {"天津", "河北", "山西", "山东"},
    "上海": {"江苏", "浙江", "安徽"},
    "浙江": {"上海", "江苏", "福建", "安徽"},
    "江苏": {"上海", "浙江", "安徽", "山东"},
}
DEPARTURE_PATTERNS = (
    re.compile(r"(?:从|由|自|在|于)(广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)出发"),
    re.compile(r"(广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)(?:往返|集合|起程|出发|直通车|高铁|动车|飞机)"),
    re.compile(r"(广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)(?:[/／](?:广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)){0,2}(?:[A-Za-z]{0,4})(?:起止|起程|出发|直飞(?:往返)?|往返|联运)"),
    re.compile(r"(广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)[-—至到]"),
)
DEPARTURE_MARKERS = re.compile(r"(?:起止|起程|出发|往返|直飞|直航|直达|集合|起飞|返程|回程|联运|双飞)")
DEPARTURE_CITY_NAMES = (
    "广州", "深圳", "珠海", "佛山", "东莞", "惠州", "清远", "江门", "中山", "肇庆", "汕头", "北京", "上海",
)
DEPARTURE_CITY_PATTERN = "|".join(map(re.escape, DEPARTURE_CITY_NAMES))
AIRLINE_CODES = "AK|TK|CZ|MS|KQ|EK|SV|CA|HU|MU|MF|HO|9C|3U|FM|ZH|春秋|吉祥"
AIRLINE_NAMES = "南航|南方航空|国航|海航|东航|厦航|深航|川航|春秋|吉祥|海南航空|中国南方航空|埃及航空|斯航"
PLACE_LABEL_SUFFIXES = re.compile(
    "|".join(sorted(("海泉湾", "红海湾", "云顶", "森林公园", "度假区", "古镇", "古村", "庄园", "乐园", "景区", "酒店", "温泉", "草原", "湾", "岛", "湖"), key=len, reverse=True))
)
TITLE_POI_SUFFIXES = ("温泉", "酒店", "度假村", "度假区", "景区", "风景区", "古镇", "古村", "庄园", "乐园", "森林公园")
TITLE_POI_GENERIC_PARTS = ("当地", "参考", "豪华", "特色", "品牌", "网评", "标准", "升级", "五钻", "四钻", "三钻")
DETAIL_POI_SUFFIXES = TITLE_POI_SUFFIXES + ("观景台", "摄影点", "服务区", "博物馆", "纪念馆", "城堡", "海岛")
DETAIL_POI_GENERIC_PARTS = TITLE_POI_GENERIC_PARTS + (
    "自由活动", "指定时间", "当地美食", "自费项目", "赠送宵夜", "同级", "标间", "住宿",
    "飞机上", "航班上", "宿机上", "温馨的家", "早餐", "午餐", "晚餐", "安排为",
)
ADMINISTRATIVE_ALIAS_SUFFIXES = ("省", "市", "县", "区", "旗")
EXPLICIT_POI_NAMES = {
    "仙本那", "普者黑", "三门海", "喀纳斯", "黄果树", "神农架", "庐山", "三清山", "婺源",
    "普吉岛", "巴厘岛",
    "古龙峡", "清泉湾", "望谷温泉", "大丰门", "流溪河国家森林公园", "北洛秘境", "大角湾", "瓦晒湾",
    "七星岩", "紫云谷",
    "盐洲岛", "亚婆角", "香港迪士尼", "乌镇", "周庄", "南浔", "拈花湾", "牛首山", "东山岛", "南门湾",
    "九寨沟", "黄龙", "都江堰", "西岭雪山", "稻城亚丁", "海螺沟", "四姑娘山", "峨眉山",
    "泸沽湖", "禾木村", "赛里木湖", "那拉提", "独库公路", "青海湖", "茶卡盐湖", "泰山", "武夷山",
    "济州岛", "沙巴", "下龙湾", "美奈", "棉花堡", "卡帕多奇亚", "费特希耶", "吴哥窟",
}
EXPLICIT_NAMED_ALIASES = {"海陵岛", "闸坡", "南昆山"}
EXPLICIT_TITLE_DESTINATION_NAMES = EXPLICIT_POI_NAMES | {
    "马拉喀什", "巴黎", "伦敦", "纽约", "悉尼", "墨尔本", "布里斯班", "凯恩斯", "奥克兰", "基督城", "皇后镇",
    "清迈", "胡志明市", "芽庄", "马尔代夫", "莫斯科", "圣彼得堡", "香格里拉", "腾冲", "芒市", "瑞丽", "普洱", "弥勒", "吐鲁番", "林芝",
    "芭提雅", "清莱", "岘港", "迪拜", "阿布扎比", "伊斯坦布尔", "加德满都", "万象", "万荣", "琅勃拉邦", "金边",
}

# Public place centroids curated from OpenStreetMap/Nominatim results. These
# overrides keep a named destination from inheriting the parent city's center.
NAMED_PLACE_COORDINATES = {
    "惠州双月湾": {"latitude": 22.6002691, "longitude": 114.9023659, "level": "poi", "locality": "平海镇", "coordinateSource": "catalog"},
    "惠州巽寮湾": {"latitude": 22.6919016, "longitude": 114.7432732, "level": "poi", "locality": "平海镇", "coordinateSource": "catalog"},
    "汕头南澳岛": {"latitude": 23.4401058, "longitude": 117.0762086, "level": "poi", "locality": "南澳县", "coordinateSource": "catalog"},
    "阳江海陵岛": {"latitude": 21.572282, "longitude": 111.831507, "level": "poi", "locality": "闸坡镇", "coordinateSource": "catalog"},
    "阳江闸坡": {"latitude": 21.572282, "longitude": 111.831507, "level": "town", "locality": "闸坡镇", "coordinateSource": "catalog"},
    "阳江大角湾": {"latitude": 21.5703427, "longitude": 111.8379394, "level": "poi", "locality": "闸坡镇", "coordinateSource": "catalog"},
    "阳西沙扒湾": {"latitude": 21.5094051, "longitude": 111.4606822, "level": "poi", "locality": "沙扒镇", "coordinateSource": "catalog"},
    "北海涠洲岛": {"latitude": 21.0402578, "longitude": 109.1104199, "level": "poi", "locality": "涠洲镇", "coordinateSource": "catalog"},
    "龙门南昆山": {"latitude": 23.6656177, "longitude": 113.8759987, "level": "poi", "locality": "南昆山生态旅游区", "coordinateSource": "catalog"},
    "龙门云顶": {"latitude": 23.577073, "longitude": 113.9987374, "level": "poi", "locality": "永汉镇", "coordinateSource": "catalog"},
    "龙门云顶温泉": {"latitude": 23.577073, "longitude": 113.9987374, "level": "poi", "locality": "永汉镇", "coordinateSource": "catalog"},
    "惠州罗浮山": {"latitude": 23.197315, "longitude": 114.0648348, "level": "poi", "locality": "长宁镇", "coordinateSource": "catalog"},
    "清远美林湖温泉": {"latitude": 23.5016559, "longitude": 113.0446176, "level": "poi", "locality": "石角镇", "coordinateSource": "catalog"},
    "清远古龙峡": {"latitude": 23.7826343, "longitude": 112.953104, "level": "poi", "locality": "笔架林场", "coordinateSource": "catalog"},
    "清远清泉湾": {"latitude": 23.7826343, "longitude": 112.953104, "level": "poi", "locality": "笔架林场", "coordinateSource": "catalog"},
    "新兴禅域小镇": {"latitude": 22.6457588, "longitude": 112.2243061, "level": "poi", "locality": "太平镇", "coordinateSource": "catalog"},
    "从化望谷温泉": {"latitude": 23.6317048, "longitude": 113.6354098, "level": "poi", "locality": "温泉镇", "coordinateSource": "catalog"},
    "平潭猴研岛": {"latitude": 25.4599309, "longitude": 119.8545787, "level": "poi", "locality": "海坛街道", "coordinateSource": "catalog"},
    "韶关丹霞山": {"latitude": 24.9577249, "longitude": 113.7999644, "level": "poi", "locality": "周田镇", "coordinateSource": "catalog"},
    "开平赤坎古镇": {"latitude": 22.3270909, "longitude": 112.5866131, "level": "poi", "locality": "赤坎镇", "coordinateSource": "catalog"},
    "大理洱海": {"latitude": 25.7830826, "longitude": 100.181115, "level": "poi", "locality": "大理市", "coordinateSource": "catalog"},
    "敦煌莫高窟": {"latitude": 40.0373163, "longitude": 94.8042114, "level": "poi", "locality": "敦煌市", "coordinateSource": "catalog"},
    "珠海海泉湾": {"latitude": 22.0722469, "longitude": 113.1109757, "level": "poi", "locality": "平沙镇", "coordinateSource": "catalog"},
    "珠海东澳岛": {"latitude": 22.0217607, "longitude": 113.7014202, "level": "poi", "locality": "东澳岛", "coordinateSource": "catalog"},
    "珠海桂山岛": {"latitude": 22.1373976, "longitude": 113.824204, "level": "poi", "locality": "桂山岛", "coordinateSource": "catalog"},
    "珠海外伶仃岛": {"latitude": 22.1010538, "longitude": 114.0365034, "level": "poi", "locality": "外伶仃岛", "coordinateSource": "catalog"},
    "汕尾红海湾": {"latitude": 22.6895253, "longitude": 115.1885302, "level": "poi", "locality": "遮浪街道", "coordinateSource": "catalog"},
}
TEXT_SEPARATORS = "|｜丨/／+&＆()（）[]【】,，。；;、"


def _is_named_alias(alias, canonical_name):
    """Treat catalog aliases as POIs unless they are administrative spellings."""
    return bool(alias) and alias != canonical_name and not alias.endswith(ADMINISTRATIVE_ALIAS_SUFFIXES)


def _is_inline_named_alias(text, mention):
    alias = mention["alias"]
    canonical_name = mention["place"]["name"]
    if not _is_named_alias(alias, canonical_name):
        return False
    if PLACE_LABEL_SUFFIXES.search(alias):
        return True
    if alias in EXPLICIT_NAMED_ALIASES:
        return True
    # Unique aliases remain useful destination evidence even when a source
    # inserts a city nickname, county, or marketing text before the alias.
    if ALIAS_PARENT_COUNTS.get(alias) == 1:
        return True
    prefix = str(text or "")[:mention["start"]].rstrip()
    # A catalog alias appearing after its canonical city is a named place,
    # even when the source inserts an unregistered county or town in between.
    return canonical_name in prefix


def _materialize_named_place(place, label):
    geometry = NAMED_PLACE_COORDINATES.get(label)
    if geometry:
        return {**place, **geometry}
    if label != place["name"]:
        # A named alias is more specific than its catalog parent. Until a
        # trusted geometry is available, keep the semantic place but do not
        # inherit the parent's city-centre coordinate.
        return {**place, "latitude": None, "longitude": None, "coordinateSource": "inferred"}
    return place


def _destination_level(place, label):
    if place.get("country") == place.get("name"):
        return "country"
    if place.get("level"):
        return place["level"]
    return "poi" if label != place["name"] or place["name"] in EXPLICIT_POI_NAMES else "city"


def _destination_coordinate_source(place, label):
    if place.get("coordinateSource"):
        return place["coordinateSource"]
    if place.get("latitude") is not None and place.get("longitude") is not None:
        return "catalog"
    return "inferred"


def _destination_coordinate_precision(place, label):
    if _destination_coordinate_source(place, label) == "inferred":
        return ""
    return _destination_level(place, label)


def find_place(text):
    value = str(text or "").strip()
    for alias, place in ALIAS_ROWS:
        if alias and alias in value:
            return place
    return None


def find_region(text):
    value = str(text or "").strip()
    for alias, region in REGION_ALIAS_ROWS:
        if alias and alias in value:
            return region
    return None


def _find_direct_place_match(text):
    value = str(text or "").strip()
    exact_matches = [(alias, place) for alias, place in ALIAS_ROWS if alias == value]
    if exact_matches:
        alias, place = exact_matches[0]
        if alias == place["name"] or not _is_named_alias(alias, place["name"]):
            return place, place["name"]
    named_matches = [
        (alias, place)
        for alias, place in ALIAS_ROWS
        if _is_named_alias(alias, place["name"]) and alias in value
    ]
    if named_matches:
        alias, place = max(named_matches, key=lambda item: len(item[0]))
        label = alias if alias.startswith(place["name"]) else f"{place['name']}{alias}"
        return place, label
    place = find_place(value)
    return (place, place["name"]) if place else (None, "")


def _iter_place_mentions(text):
    value = str(text or "")
    matches = []
    for alias, place in ALIAS_ROWS:
        start = 0
        while alias:
            index = value.find(alias, start)
            if index < 0:
                break
            item = {
                "place": place,
                "alias": alias,
                "start": index,
                "end": index + len(alias),
            }
            if not _is_embedded_short_city_alias(value, item) and not _is_foreign_marketing_nickname(value, item):
                matches.append(item)
            start = index + 1
    matches.sort(key=lambda item: (item["start"], -len(item["alias"])))
    selected = []
    occupied_until = -1
    seen_mentions = set()
    for item in matches:
        if item["start"] < occupied_until:
            continue
        name = item["place"]["name"]
        mention_key = (name, item["alias"])
        if mention_key in seen_mentions:
            continue
        seen_mentions.add(mention_key)
        selected.append(item)
        occupied_until = item["end"]
    return selected


def _is_embedded_short_city_alias(text, mention):
    """Reject city names embedded in unrelated Chinese words such as 五台山/巴黎人."""
    alias = mention["alias"]
    place = mention["place"]
    if alias != place["name"] or len(alias) > 2:
        return False
    start = mention["start"]
    if start <= 0:
        return False
    before = text[:start]
    previous = before[-1]
    if not "\u4e00" <= previous <= "\u9fff":
        return False
    # A short city after a routing verb is a normal place mention. Everywhere
    # else, adjacent Chinese text is a stronger indication that this is part
    # of a longer noun, not an administrative destination.
    if before.endswith(("从", "由", "到", "至", "去", "赴", "游", "入", "住", "经", "往返", "起止", "起程", "出发")):
        return False
    preceding_region = find_region(before)
    if preceding_region:
        # "广东台山" is a normal province + city expression, whereas the
        # "台山" inside "山西…五台山" must not inherit a different province.
        return preceding_region.get("province") != place.get("province")
    if any(before.endswith(province) for province in KNOWN_PROVINCE_PREFIXES):
        return False
    return True


def _is_foreign_marketing_nickname(text, mention):
    """Do not treat phrases such as 中国仙本那 as an overseas destination."""
    if mention["place"]["country"] == "中国":
        return False
    return text[:mention["start"]].endswith("中国")


def _is_title_specific_label(place, label):
    """A city-prefixed hotel/scenic name is useful even before it has coordinates."""
    canonical_name = place["name"]
    if not label.startswith(canonical_name) or label == canonical_name:
        return False
    tail = label[len(canonical_name):]
    if len(tail) < 3 or not tail.endswith(TITLE_POI_SUFFIXES):
        return False
    return not any(part in tail for part in TITLE_POI_GENERIC_PARTS)


def _is_departure_mention(text, mention):
    value = str(text or "")
    start = mention["start"]
    end = mention["end"]
    after = value[end:min(len(value), end + 16)]
    after_text = after.lstrip()
    if after_text.startswith("往返") and mention["place"]["country"] != "中国":
        return False
    before_text = value[max(0, start - 16):start].rstrip()
    if re.search(rf"(?:{DEPARTURE_CITY_PATTERN})$", before_text) and re.match(
        r"(?:往返|起止|起程|出发|直飞|直航|直达)", after_text,
    ):
        return False
    if DEPARTURE_MARKERS.match(after_text) or re.match(
        r"[A-Za-z0-9]{0,8}(?:起止|起程|出发|往返|直飞|直航|直达|集合|起飞|返程|回程|联运|双飞)",
        after_text,
    ):
        return True
    if re.match(r"(?:站|机场|港口)?(?:往返|起止|起程|出发)", after_text):
        return True
    if re.match(r"(?:市区|市内|机场|码头|车站|高铁站)(?:往返|接送|接驳|交通)", after_text):
        return True
    if mention["alias"].endswith("市") and re.match(r"(?:区|内)(?:往返|接送|接驳|交通)", after_text):
        return True
    if re.match(r"(?:南|北|东|西)?(?:起止|往返|起程|出发)", after_text):
        return True
    if re.match(
        rf"(?:{AIRLINE_CODES})(?=\s*(?:直飞|直航|往返|联运|航班|双飞|[()（）\[\]【】]|$))",
        after_text,
        re.IGNORECASE,
    ):
        return True
    if mention["place"]["name"] in DEPARTURE_CITY_NAMES and re.match(
        rf"(?:{AIRLINE_CODES})(?:{AIRLINE_NAMES})?(?:直飞|直航|往返|联运|航班|双飞)",
        after_text,
        re.IGNORECASE,
    ):
        return True
    if mention["place"]["name"] in DEPARTURE_CITY_NAMES and re.match(rf"(?:{AIRLINE_NAMES})(?:直飞|联运|航班|往返)?", after_text):
        return True
    if re.match(
        rf"(?:[/／或和及、,，]?\s*(?:{DEPARTURE_CITY_PATTERN}))+\s*(?:多地)?(?:起止|起程|出发|往返|直飞|联运|双飞)",
        after_text,
    ):
        return True
    if re.search(rf"(?:{DEPARTURE_CITY_PATTERN})\s*[/／或和及、,，]\s*$", before_text) and re.match(
        r"(?:起止|起程|出发|往返|直飞|联运|双飞)", after_text,
    ):
        return True
    if mention["place"]["name"] in DEPARTURE_CITY_NAMES and re.search(rf"(?:{AIRLINE_NAMES}|{AIRLINE_CODES})[^\u4e00-\u9fff]{{0,12}}$", before_text, re.IGNORECASE):
        return True
    if mention["place"]["name"] in DEPARTURE_CITY_NAMES and re.search(rf"(?:{AIRLINE_NAMES}|{AIRLINE_CODES})\s*$", before_text, re.IGNORECASE) and re.match(
        r"(?:[-—－]?\s*(?:大兴|浦东|白云|萧山|马德里|法兰克福|赫尔辛基|直飞|直航|双直航))", after_text,
    ):
        return True
    if mention["place"]["name"] in DEPARTURE_CITY_NAMES and re.match(r"(?:飞|航班|机场)", after_text) and re.search(
        r"(?:起止|起程|出发|往返|直飞|直航|联运)\s*$", before_text,
    ):
        return True
    if re.match(r"(?:阪东|东阪|多地)", after_text):
        return True
    if re.match(r"(?:[-—－]\s*)", after) and re.search(
        rf"(?:{AIRLINE_CODES})\s*$", before_text, re.IGNORECASE,
    ):
        return True
    next_catalog_mention = next(
        (
            candidate for candidate in _iter_place_mentions(value)
            if candidate["start"] >= end and candidate["start"] - end <= 8
            and candidate["place"]["name"] != mention["place"]["name"]
        ),
        None,
    )
    next_catalog_gap = value[end:next_catalog_mention["start"]] if next_catalog_mention else ""
    if (
        mention["place"]["name"] in DEPARTURE_CITY_NAMES
        and next_catalog_mention
        and re.fullmatch(r"\s*(?:[-—－/／或和及、,，]\s*)+", next_catalog_gap)
        and not re.match(r"(?:塔|广场|花城|南沙)", after_text)
    ):
        return True
    if re.match(r"[【\[]", after_text):
        return True
    if re.search(rf"(?:{AIRLINE_CODES})\s*[-—－]\s*$", before_text, re.IGNORECASE):
        return True
    dash_match = re.match(r"\s*[-—－]\s*", after)
    if dash_match:
        dash_tail = after[dash_match.end():]
        immediate_match = re.match(r"[\u4e00-\u9fff]+", dash_tail)
        immediate = immediate_match.group(0) if immediate_match else ""
        inline_alias = mention["alias"] != mention["place"]["name"] and value[:start].rstrip().endswith(mention["place"]["name"])
        if mention["place"]["name"] in DEPARTURE_CITY_NAMES and (
            any(alias and immediate.startswith(alias) for alias, _ in ALIAS_ROWS) or inline_alias
        ):
            return True
        if mention["place"]["name"] in DEPARTURE_CITY_NAMES and find_region(dash_tail):
            return True
    before = value[max(0, start - 8):start]
    if re.search(r"(?:从|由|自|在|于)\s*$", before):
        return True
    return False


def _place_label(text, mention):
    value = str(text or "")
    alias = mention["alias"]
    canonical_name = mention["place"]["name"]
    if _is_named_alias(alias, canonical_name):
        prefix = f"{canonical_name}{alias}" if not alias.startswith(canonical_name) else alias
        tail_match = re.match(r"[\u4e00-\u9fff]{0,18}", value[mention["end"]:])
        tail = tail_match.group(0) if tail_match else ""
        suffix_matches = list(PLACE_LABEL_SUFFIXES.finditer(tail))
        if suffix_matches and suffix_matches[0].start() == 0:
            return f"{prefix}{tail[:suffix_matches[0].end()]}".strip()
        return prefix
    end = mention["end"]
    tail_match = re.match(r"[\u4e00-\u9fff]{0,18}", value[end:])
    tail = tail_match.group(0) if tail_match else ""
    suffix_matches = list(PLACE_LABEL_SUFFIXES.finditer(tail))
    suffix_match = suffix_matches[-1] if suffix_matches else None
    if tail.startswith(("回", "返", "去", "住", "入住", "返回")):
        return mention["place"]["name"]
    if suffix_match:
        return f"{canonical_name}{tail[:suffix_match.end()]}".strip()
    return canonical_name


def _detail_poi_label(texts):
    """Return a clearly named POI from itinerary evidence, never a free-form route phrase."""
    candidates = []
    for text_index, text in enumerate(texts):
        value = str(text or "")
        for match in re.finditer(r"[【《]([^】》]{2,32})[】》]", value):
            label = re.sub(r"\s+", "", match.group(1)).strip("：:，,。.;；")
            if (
                len(label) >= 3
                and label.endswith(DETAIL_POI_SUFFIXES)
                and not any(part in label for part in DETAIL_POI_GENERIC_PARTS)
            ):
                candidates.append((text_index, match.start(), label))
        for match in re.finditer(r"(?:入住|下榻)[：:\s]*([\u4e00-\u9fffA-Za-z·]{3,32}?(?:酒店|宾馆|客栈|度假村))", value):
            label = match.group(1).strip()
            if not any(part in label for part in DETAIL_POI_GENERIC_PARTS):
                candidates.append((text_index, match.start(), label))
    if not candidates:
        return ""
    candidates.sort(key=lambda item: (item[0], item[1], -len(item[2])))
    return candidates[0][2]


def mine_destination_place(raw, title, destination, detail=None):
    """Extract a named destination from title/detail text without treating departure as destination."""
    destination_text = str(destination or "").strip()
    title_departure_names = {
        mention["place"]["name"]
        for mention in _iter_place_mentions(title)
        if _is_departure_mention(title, mention)
    }
    direct_place, direct_label = _find_direct_place_match(destination_text)

    texts = [str(title or "")]
    detail = detail if isinstance(detail, dict) else {}
    for day in detail.get("itinerary") or []:
        if not isinstance(day, dict):
            continue
        texts.extend(str(day.get(key) or "") for key in ("title", "description"))
        texts.extend(str(value or "") for value in day.get("activities") or [])
        accommodation = str(day.get("accommodation") or "").strip()
        if accommodation:
            # Accommodation is structured by the scraper; prefix it with the
            # itinerary verb so only its first named lodging entity is mined.
            texts.append(f"入住：{accommodation}")
    texts.extend(str(value or "") for value in detail.get("highlights") or [])
    texts.extend(str(value or "") for value in detail.get("importantNotes") or [])
    detail_label = _detail_poi_label(texts[1:])
    if direct_place and direct_place["name"] not in title_departure_names:
        if direct_label != direct_place["name"] or not detail_label:
            return _materialize_named_place(direct_place, direct_label), direct_label, "medium", "local-place-catalog"

    candidates = []
    for text_index, text in enumerate(texts):
        for mention in _iter_place_mentions(text):
            if mention["place"]["name"] in title_departure_names:
                continue
            if _is_departure_mention(text, mention):
                continue
            label = _place_label(text, mention)
            is_named_place = _is_inline_named_alias(text, mention) or _is_title_specific_label(mention["place"], label) or (
                mention["alias"] == mention["place"]["name"]
                and mention["place"]["name"] in EXPLICIT_TITLE_DESTINATION_NAMES
            )
            candidates.append((
                text_index,
                mention["start"],
                mention["place"],
                label,
                is_named_place,
            ))

    title_candidates = [item for item in candidates if item[0] == 0]
    if not title_candidates:
        candidates = [item for item in candidates if item[4]]
    if not candidates:
        if detail_label:
            # This POI still needs a local-index or geocoder match before it
            # becomes a point. Do not invent a parent-city coordinate.
            return None, detail_label, "medium", "detail-poi-miner"
        return None, "", "low", "unknown"
    region = find_region(destination_text)
    if region and region.get("province"):
        in_region = [
            item for item in candidates
            if item[2].get("province") == region["province"]
            and item[2].get("country") == region.get("country")
        ]
        named_in_region = [item for item in in_region if item[4]]
        named_anywhere = [item for item in candidates if item[4]]
        if named_in_region:
            candidates = in_region
        elif named_anywhere:
            # Source destination fields often contain the departure province;
            # an explicit named POI in the title is stronger evidence.
            candidates = named_anywhere
        elif in_region:
            first_candidate = min(candidates, key=lambda item: (item[0], item[1]))
            candidates = in_region if first_candidate in in_region else []
        else:
            # Some feeds copy the departure province into destination. When
            # no same-region candidate survives departure filtering, the first
            # remaining catalog place is the strongest title-level signal.
            pass
    named_candidates = [item for item in candidates if item[4]]
    if named_candidates:
        candidates = named_candidates
    elif detail_label:
        # A city or province in the title is useful context, but an explicitly
        # named hotel or attraction in the itinerary is the more precise stop.
        return None, detail_label, "medium", "detail-poi-miner"
    elif not candidates and destination_text not in {"", "其他", "全国"}:
        return None, "", "low", "unknown"
    candidates.sort(key=lambda item: (item[0], item[1]))
    _, _, place, label, _ = candidates[0]
    final_label = label if named_candidates else place["name"]
    return _materialize_named_place(place, final_label), final_label, "low", "title-place-miner"


def _raw_departure(raw):
    for key in ("departureCity", "departureProvince", "departureCountry"):
        if str(raw.get(key) or "").strip():
            return {key: str(raw[key]).strip() for key in ("departureCity", "departureProvince", "departureCountry") if str(raw.get(key) or "").strip()}, "source"
    nested = raw.get("departure") if isinstance(raw.get("departure"), dict) else {}
    if nested:
        values = {key: str(nested.get(key) or "").strip() for key in ("city", "province", "country") if str(nested.get(key) or "").strip()}
        if values:
            return {"departureCity": values.get("city", ""), "departureProvince": values.get("province", ""), "departureCountry": values.get("country", "")}, "source"
    return {}, "unknown"


def normalize_tour_geo(raw, title, destination, detail=None):
    departure, departure_source = _raw_departure(raw)
    departure_place = None
    if not departure:
        for mention in _iter_place_mentions(title):
            if _is_departure_mention(title, mention):
                departure_place = mention["place"]
                departure = {
                    "departureCity": departure_place["name"],
                    "departureProvince": departure_place.get("province") or "",
                    "departureCountry": departure_place["country"],
                }
                departure_source = "inferred"
                break
    if not departure:
        for pattern in DEPARTURE_PATTERNS:
            match = pattern.search(str(title or ""))
            if match:
                departure_place = find_place(match.group(1))
                if departure_place:
                    departure = {
                        "departureCity": departure_place["name"],
                        "departureProvince": departure_place.get("province") or "",
                        "departureCountry": departure_place["country"],
                    }
                    departure_source = "inferred"
                    break
    if not departure_place and departure.get("departureCity"):
        departure_place = find_place(departure["departureCity"])
    if departure_place:
        departure.setdefault("departureProvince", departure_place.get("province") or "")
        departure.setdefault("departureCountry", departure_place["country"])

    destination_text = str(destination or "").strip()
    destination_place, destination_label, destination_confidence, destination_geo_source = mine_destination_place(
        raw,
        title,
        destination_text,
        detail,
    )
    destination_region = find_region(destination_text)
    destination_country = destination_place["country"] if destination_place else (destination_region["country"] if destination_region else "")
    destination_province = (destination_place.get("province") or "") if destination_place else (destination_region.get("province") or "") if destination_region else ""
    destination_source = "source" if str(raw.get("destination") or "").strip() else "inferred"
    fields = {
        **departure,
        "destinationCity": destination_place["name"] if destination_place else "",
        "destinationPlaceName": destination_label,
        "destinationProvince": (destination_place.get("province") or "") if destination_place else destination_province,
        "destinationCountry": destination_country,
        "destinationLatitude": destination_place["latitude"] if destination_place else None,
        "destinationLongitude": destination_place["longitude"] if destination_place else None,
        "destinationGeoLevel": _destination_level(destination_place, destination_label) if destination_place else "",
        "destinationCoordinatePrecision": _destination_coordinate_precision(destination_place, destination_label) if destination_place else "",
        "destinationLocality": destination_place.get("locality", "") if destination_place else "",
        "destinationCoordinateSource": _destination_coordinate_source(destination_place, destination_label) if destination_place else "unknown",
        "geoStatus": "complete" if departure_place and destination_place else ("destination_only" if destination_place or destination_label or destination_region else "unmapped"),
        "geoConfidence": destination_confidence if destination_label else "low",
        "geoSource": destination_geo_source if destination_label else ("local-region-catalog" if destination_region else "unknown"),
    }
    if departure_place:
        fields.update({
            "departureLatitude": departure_place["latitude"],
            "departureLongitude": departure_place["longitude"],
            "departureGeoLevel": "city",
            "departureLocality": "",
            "departureCoordinateSource": "catalog",
        })
    return fields, {
        "departureCity": departure_source if departure.get("departureCity") else "unknown",
        "departureProvince": departure_source if departure.get("departureProvince") else "unknown",
        "departureCountry": departure_source if departure.get("departureCountry") else "unknown",
        "destinationCity": destination_source if destination_place else "unknown",
        "destinationPlaceName": "inferred" if destination_label else "unknown",
        "destinationProvince": "inferred" if destination_place or destination_region else "unknown",
        "destinationCountry": "inferred" if destination_place or destination_region else "unknown",
        "destinationLatitude": "inferred" if destination_place else "unknown",
        "destinationLongitude": "inferred" if destination_place else "unknown",
        "geoStatus": "inferred",
        "geoConfidence": "inferred",
        "geoSource": "inferred" if destination_label else "unknown",
        "routeRegion": "inferred",
    }


def classify_route(fields):
    country = fields.get("destinationCountry")
    departure_province = fields.get("departureProvince")
    destination_province = fields.get("destinationProvince")
    if not country or not departure_province:
        return "unknown"
    if country != "中国":
        return "international"
    if departure_province == destination_province:
        return "local"
    nearby_provinces = NEARBY_PROVINCES_BY_DEPARTURE.get(departure_province, set())
    if destination_province in nearby_provinces:
        return "nearby-province"
    return "national"
