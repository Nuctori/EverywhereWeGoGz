/**
 * 旅行团数据修复脚本
 * 功能:
 * 1. 修复 isFlashSale=true 但缺少 flashSaleEndTime 的记录
 * 2. 为无图片产品添加默认占位图片
 * 3. 从标题中提取目的地，减少 "其他" 占比
 * 4. 为过于简短的标题补充基础描述
 */

const fs = require('fs');

const content = fs.readFileSync('src/data/tours.ts', 'utf8');
const match = content.match(/export const tours: Tour\[\] = ([\s\S]*);\s*$/);
const tours = eval(match[1]);

let fixCount = {
  flashSale: 0,
  images: 0,
  destination: 0,
  title: 0,
};

// 1. 修复闪购标记
for (const t of tours) {
  if (t.isFlashSale && !t.flashSaleEndTime) {
    t.isFlashSale = false;
    fixCount.flashSale++;
  }
}

// 2. 为无图片产品添加默认图片
const defaultImages = {
  '假日通': 'http://www.jrt365.com/images/logo.png',
  '品途': 'https://www.pintour.com/static/images/logo.png',
  '广东中旅': 'http://www.gdcts.com/images/logo.png',
  '广之旅': 'https://www.gzl.com.cn/images/logo.png',
  '广州去旅行': 'https://www.qulvxing.com/images/logo.png',
  '康辉': 'https://www.kanghuitravel.com/images/logo.png',
  '暴走村': 'https://www.baozoucun.com/images/logo.png',
};

for (const t of tours) {
  if (!Array.isArray(t.images) || t.images.length === 0 || t.images.every(img => !img || img.trim() === '')) {
    t.images = [defaultImages[t.source] || 'https://via.placeholder.com/800x600?text=No+Image'];
    fixCount.images++;
  }
}

// 3. 从标题提取目的地
const destinationKeywords = {
  '北京': '北京',
  '故宫': '北京',
  '环球影城': '北京',
  '京城': '北京',
  '云南': '云南',
  '丽江': '云南',
  '大理': '云南',
  '版纳': '云南',
  '香格里拉': '云南',
  '泸沽湖': '云南',
  '昆大丽': '云南',
  '三亚': '三亚',
  '海南': '三亚',
  '桂林': '桂林',
  '漓江': '桂林',
  '阳朔': '桂林',
  '龙脊': '桂林',
  '四川': '四川',
  '成都': '四川',
  '九寨': '四川',
  '黄龙': '四川',
  '峨眉': '四川',
  '乐山': '四川',
  '贵州': '贵州',
  '黄果树': '贵州',
  '西江': '贵州',
  '新疆': '新疆',
  '张家界': '张家界',
  '西藏': '西藏',
  '拉萨': '西藏',
  '厦门': '厦门',
  '鼓浪屿': '厦门',
  '西安': '西安',
  '兵马俑': '西安',
  '广东': '广东',
  '广州': '广东',
  '深圳': '广东',
  '珠海': '广东',
  '惠州': '广东',
  '韶关': '广东',
  '清远': '广东',
  '阳江': '广东',
  '江门': '广东',
  '佛山': '广东',
  '东莞': '广东',
  '中山': '广东',
  '肇庆': '广东',
  '潮汕': '广东',
  '梅州': '广东',
  '河源': '广东',
  '湛江': '广东',
  '汕尾': '广东',
  '茂名': '广东',
  '台山': '广东',
  '新丰': '广东',
  '英德': '广东',
  '佛冈': '广东',
  '新兴': '广东',
  '恩平': '广东',
  '增城': '广东',
  '从化': '广东',
  '龙门': '广东',
  '巽寮湾': '广东',
  '海陵岛': '广东',
  '沙扒湾': '广东',
  '闸坡': '广东',
  '温泉': '广东',
  '丹霞山': '广东',
};

for (const t of tours) {
  if (t.destination === '其他') {
    let found = false;
    for (const [keyword, dest] of Object.entries(destinationKeywords)) {
      if (t.title.includes(keyword)) {
        t.destination = dest;
        fixCount.destination++;
        found = true;
        break;
      }
    }
    // 检查 itinerary 中的 title
    if (!found && t.itinerary) {
      for (const day of t.itinerary) {
        for (const [keyword, dest] of Object.entries(destinationKeywords)) {
          if (day.title && day.title.includes(keyword)) {
            t.destination = dest;
            fixCount.destination++;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
  }
}

// 4. 为过于简短的标题补充描述（仅当标题长度<5时）
for (const t of tours) {
  if (t.title.length < 5) {
    t.title = t.title + ' ' + t.destination + t.duration + '天游';
    fixCount.title++;
  }
}

// 生成修复后的文件
const toursJson = JSON.stringify(tours, null, 2);
const newContent = content.replace(/export const tours: Tour\[\] = ([\s\S]*);\s*$/, `export const tours: Tour[] = ${toursJson};\n`);

fs.writeFileSync('src/data/tours.ts', newContent);

console.log('数据修复完成!');
console.log('');
console.log('修复统计:');
console.log('  - 修复闪购标记:', fixCount.flashSale, '条');
console.log('  - 补充默认图片:', fixCount.images, '条');
console.log('  - 修正目的地分类:', fixCount.destination, '条');
console.log('  - 补充标题描述:', fixCount.title, '条');
console.log('');
console.log('修复后的文件已保存到: src/data/tours.ts');
console.log('');
console.log('注意: 建议在提交前进行 git diff 检查修改内容');
