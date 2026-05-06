const fs = require('fs');

const content = fs.readFileSync('src/data/tours.ts', 'utf8');
const match = content.match(/export const tours: Tour\[\] = ([\s\S]*);\s*$/);
if (!match) {
  console.error('Failed to parse tours data');
  process.exit(1);
}
const tours = eval(match[1]);

const now = new Date('2026-05-07T01:12:29+08:00');
const todayStr = now.toISOString().split('T')[0];

const requiredFields = [
  'id', 'title', 'source', 'price', 'bookingUrl', 'departureDate',
  'returnDate', 'duration', 'destination', 'rating', 'reviewCount',
  'images', 'tags', 'theme', 'difficulty', 'season', 'language',
  'groupSize', 'transportType', 'accommodationLevel', 'accommodationStars',
  'meals', 'singleSupplement', 'singleSupplementNote',
  'availableSeats', 'totalSeats', 'highlights', 'itinerary',
  'inclusions', 'exclusions', 'importantNotes', 'visaRequirements',
  'travelInsurance', 'tourGuideService', 'freeWiFi', 'childPolicy',
  'cancellationPolicy', 'refundPolicy', 'isHot', 'isNew', 'isFlashSale',
  'suitableFor', 'createdAt', 'updatedAt'
];

let report = {
  totalTours: tours.length,
  missingFields: [],
  nullOrEmpty: [],
  invalidUrls: [],
  zeroPrice: [],
  abnormalPrice: [],
  abnormalDuration: [],
  invalidDates: [],
  pastDates: [],
  invalidRatings: [],
  duplicateProducts: [],
  similarProducts: [],
  sourceStats: {},
};

const sourceNames = ['假日通', '品途', '广东中旅', '广之旅', '广州去旅行', '康辉', '暴走村'];
sourceNames.forEach(s => {
  report.sourceStats[s] = {
    count: 0,
    withImages: 0,
    withoutImages: 0,
    minPrice: Infinity,
    maxPrice: -Infinity,
    avgPrice: 0,
    totalPrice: 0,
    invalidUrls: 0,
    missingFields: 0,
    invalidDates: 0,
    pastDates: 0,
    zeroPrice: 0,
    abnormalDuration: 0,
    invalidRatings: 0,
  };
});

const priceList = [];
const durationList = [];
const titlePriceSourceMap = {};

for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  const src = t.source;
  if (report.sourceStats[src]) {
    report.sourceStats[src].count++;
    report.sourceStats[src].totalPrice += t.price;
    if (t.price < report.sourceStats[src].minPrice) report.sourceStats[src].minPrice = t.price;
    if (t.price > report.sourceStats[src].maxPrice) report.sourceStats[src].maxPrice = t.price;
  }

  // Required fields
  for (const f of requiredFields) {
    if (!(f in t) || t[f] === undefined) {
      report.missingFields.push({ index: i, id: t.id, field: f, source: src });
      if (report.sourceStats[src]) report.sourceStats[src].missingFields++;
    }
  }

  // Null or empty strings
  for (const [k, v] of Object.entries(t)) {
    if (v === null) {
      report.nullOrEmpty.push({ index: i, id: t.id, field: k, source: src, value: null });
    } else if (typeof v === 'string' && v.trim() === '') {
      report.nullOrEmpty.push({ index: i, id: t.id, field: k, source: src, value: '' });
    }
  }

  // URL check
  if (typeof t.bookingUrl !== 'string' || !t.bookingUrl.startsWith('http')) {
    report.invalidUrls.push({ index: i, id: t.id, source: src, url: t.bookingUrl });
    if (report.sourceStats[src]) report.sourceStats[src].invalidUrls++;
  }

  // Price checks
  if (t.price === 0) {
    report.zeroPrice.push({ index: i, id: t.id, source: src, price: t.price });
    if (report.sourceStats[src]) report.sourceStats[src].zeroPrice++;
  }
  priceList.push({ index: i, id: t.id, source: src, price: t.price });

  // Duration checks
  if (t.duration <= 0 || t.duration > 30) {
    report.abnormalDuration.push({ index: i, id: t.id, source: src, duration: t.duration });
    if (report.sourceStats[src]) report.sourceStats[src].abnormalDuration++;
  }
  durationList.push({ index: i, id: t.id, source: src, duration: t.duration });

  // Date checks
  const dd = t.departureDate;
  const rd = t.returnDate;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dd) || !dateRegex.test(rd)) {
    report.invalidDates.push({ index: i, id: t.id, source: src, departureDate: dd, returnDate: rd });
    if (report.sourceStats[src]) report.sourceStats[src].invalidDates++;
  } else {
    const dDate = new Date(dd);
    const rDate = new Date(rd);
    if (isNaN(dDate.getTime()) || isNaN(rDate.getTime())) {
      report.invalidDates.push({ index: i, id: t.id, source: src, departureDate: dd, returnDate: rd });
      if (report.sourceStats[src]) report.sourceStats[src].invalidDates++;
    } else {
      if (dd < todayStr) {
        report.pastDates.push({ index: i, id: t.id, source: src, departureDate: dd });
        if (report.sourceStats[src]) report.sourceStats[src].pastDates++;
      }
      // returnDate should be after departureDate + duration
      const expectedReturn = new Date(dDate);
      expectedReturn.setDate(expectedReturn.getDate() + t.duration);
      const expectedReturnStr = expectedReturn.toISOString().split('T')[0];
      if (rd !== expectedReturnStr) {
        // Not critical, just note
      }
    }
  }

  // Rating checks
  if (typeof t.rating !== 'number' || t.rating < 0 || t.rating > 5) {
    report.invalidRatings.push({ index: i, id: t.id, source: src, rating: t.rating });
    if (report.sourceStats[src]) report.sourceStats[src].invalidRatings++;
  }

  // Image coverage
  if (report.sourceStats[src]) {
    if (Array.isArray(t.images) && t.images.length > 0 && t.images.some(img => typeof img === 'string' && img.startsWith('http'))) {
      report.sourceStats[src].withImages++;
    } else {
      report.sourceStats[src].withoutImages++;
    }
  }

  // Duplicate check (title + price + source)
  const key = `${t.title}|${t.price}|${src}`;
  if (titlePriceSourceMap[key]) {
    report.duplicateProducts.push({
      first: titlePriceSourceMap[key],
      duplicate: { index: i, id: t.id },
      key: key
    });
  } else {
    titlePriceSourceMap[key] = { index: i, id: t.id };
  }
}

// Price statistics
priceList.sort((a, b) => a.price - b.price);
const minPrice = priceList[0]?.price;
const maxPrice = priceList[priceList.length - 1]?.price;
const medianPrice = priceList[Math.floor(priceList.length / 2)]?.price;
const q1 = priceList[Math.floor(priceList.length * 0.25)]?.price;
const q3 = priceList[Math.floor(priceList.length * 0.75)]?.price;
const iqr = q3 - q1;
const lowerBound = q1 - 1.5 * iqr;
const upperBound = q3 + 1.5 * iqr;

for (const p of priceList) {
  if (p.price < lowerBound || p.price > upperBound) {
    report.abnormalPrice.push(p);
  }
}

// Duration stats
durationList.sort((a, b) => a.duration - b.duration);

// Similar products (same title, different id)
const titleMap = {};
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (!titleMap[t.title]) titleMap[t.title] = [];
  titleMap[t.title].push({ index: i, id: t.id, source: t.source, price: t.price });
}
for (const [title, items] of Object.entries(titleMap)) {
  if (items.length > 1) {
    report.similarProducts.push({ title, count: items.length, items });
  }
}

// Calculate averages
for (const s of sourceNames) {
  const st = report.sourceStats[s];
  if (st.count > 0) {
    st.avgPrice = Math.round(st.totalPrice / st.count);
  } else {
    st.minPrice = 0;
    st.maxPrice = 0;
    st.avgPrice = 0;
  }
}

// Output report
console.log('='.repeat(80));
console.log('旅行团数据质量审计报告');
console.log('审计时间: 2026-05-07 01:12:29 (UTC+8)');
console.log('数据文件: src/data/tours.ts');
console.log('总记录数:', report.totalTours);
console.log('='.repeat(80));

console.log('\n## 一、数据完整性检查\n');
console.log('必填字段缺失数量:', report.missingFields.length);
if (report.missingFields.length > 0) {
  console.log('缺失字段详情（前20条）:');
  report.missingFields.slice(0, 20).forEach(m => {
    console.log(`  - [${m.source}] ${m.id}: 缺失字段 "${m.field}"`);
  });
}

console.log('\n空字符串/null值数量:', report.nullOrEmpty.length);
if (report.nullOrEmpty.length > 0) {
  console.log('空值详情（前20条）:');
  report.nullOrEmpty.slice(0, 20).forEach(m => {
    console.log(`  - [${m.source}] ${m.id}: 字段 "${m.field}" = ${JSON.stringify(m.value)}`);
  });
}

console.log('\n## 二、URL有效性检查\n');
console.log('无效URL数量:', report.invalidUrls.length);
if (report.invalidUrls.length > 0) {
  console.log('无效URL详情（前20条）:');
  report.invalidUrls.slice(0, 20).forEach(m => {
    console.log(`  - [${m.source}] ${m.id}: URL = ${JSON.stringify(m.url)}`);
  });
}

console.log('\n## 三、价格合理性检查\n');
console.log(`价格范围: ¥${minPrice} ~ ¥${maxPrice}`);
console.log(`中位数: ¥${medianPrice}, Q1: ¥${q1}, Q3: ¥${q3}`);
console.log(`IQR异常值边界: ¥${lowerBound.toFixed(2)} ~ ¥${upperBound.toFixed(2)}`);
console.log('价格为0的数量:', report.zeroPrice.length);
console.log('异常价格数量（超出IQR范围）:', report.abnormalPrice.length);
if (report.abnormalPrice.length > 0) {
  console.log('异常价格详情（前20条）:');
  report.abnormalPrice.slice(0, 20).forEach(m => {
    console.log(`  - [${m.source}] ${m.id}: ¥${m.price}`);
  });
}

console.log('\n## 四、天数合理性检查\n');
console.log('天数范围:', durationList[0].duration, '~', durationList[durationList.length - 1].duration);
console.log('异常天数数量:', report.abnormalDuration.length);
if (report.abnormalDuration.length > 0) {
  report.abnormalDuration.slice(0, 20).forEach(m => {
    console.log(`  - [${m.source}] ${m.id}: ${m.duration}天`);
  });
}

console.log('\n## 五、日期有效性检查\n');
console.log('无效日期格式数量:', report.invalidDates.length);
console.log('过去日期数量（departureDate < 今天）:', report.pastDates.length);
if (report.pastDates.length > 0) {
  console.log('过去日期详情（前20条）:');
  report.pastDates.slice(0, 20).forEach(m => {
    console.log(`  - [${m.source}] ${m.id}: departureDate = ${m.departureDate}`);
  });
}

console.log('\n## 六、评分有效性检查\n');
console.log('无效评分数量:', report.invalidRatings.length);
if (report.invalidRatings.length > 0) {
  report.invalidRatings.slice(0, 20).forEach(m => {
    console.log(`  - [${m.source}] ${m.id}: rating = ${JSON.stringify(m.rating)}`);
  });
}

console.log('\n## 七、各来源数据质量统计\n');
for (const s of sourceNames) {
  const st = report.sourceStats[s];
  console.log(`\n### ${s}`);
  console.log(`  数据量: ${st.count}`);
  console.log(`  图片覆盖率: ${st.withImages}/${st.count} (${((st.withImages / st.count) * 100).toFixed(1)}%)`);
  console.log(`  价格范围: ¥${st.minPrice} ~ ¥${st.maxPrice} (平均 ¥${st.avgPrice})`);
  console.log(`  无效URL: ${st.invalidUrls}`);
  console.log(`  缺失字段: ${st.missingFields}`);
  console.log(`  无效日期: ${st.invalidDates}`);
  console.log(`  过去日期: ${st.pastDates}`);
  console.log(`  零价格: ${st.zeroPrice}`);
  console.log(`  异常天数: ${st.abnormalDuration}`);
  console.log(`  无效评分: ${st.invalidRatings}`);
}

console.log('\n## 八、重复数据检查\n');
console.log('完全重复产品数量（相同标题+价格+来源）:', report.duplicateProducts.length);
if (report.duplicateProducts.length > 0) {
  console.log('重复详情（前20条）:');
  report.duplicateProducts.slice(0, 20).forEach(m => {
    console.log(`  - "${m.key.split('|')[0]}" [${m.key.split('|')[2]}] ¥${m.key.split('|')[1]}`);
    console.log(`    首次: ${m.first.id}, 重复: ${m.duplicate.id}`);
  });
}

console.log('\n相似产品数量（相同标题不同ID）:', report.similarProducts.length);
if (report.similarProducts.length > 0) {
  console.log('相似产品详情（前20条）:');
  report.similarProducts.slice(0, 20).forEach(m => {
    console.log(`  - "${m.title}": ${m.count}条`);
    m.items.forEach(item => {
      console.log(`      ${item.id} [${item.source}] ¥${item.price}`);
    });
  });
}

console.log('\n## 九、数据质量评分\n');
for (const s of sourceNames) {
  const st = report.sourceStats[s];
  if (st.count === 0) {
    console.log(`${s}: N/A (无数据)`);
    continue;
  }
  let score = 100;
  score -= (st.invalidUrls / st.count) * 30;
  score -= (st.missingFields / st.count) * 20;
  score -= (st.invalidDates / st.count) * 15;
  score -= (st.pastDates / st.count) * 10;
  score -= (st.zeroPrice / st.count) * 10;
  score -= (st.abnormalDuration / st.count) * 5;
  score -= (st.invalidRatings / st.count) * 5;
  score -= ((st.withoutImages / st.count) * 5);
  score = Math.max(0, Math.round(score));
  let grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  console.log(`${s}: ${score}/100 (等级: ${grade})`);
}

console.log('\n' + '='.repeat(80));
console.log('审计完成');
console.log('='.repeat(80));

// Save full report to file
fs.writeFileSync('data-audit-report.json', JSON.stringify(report, null, 2));
console.log('\n完整审计数据已保存到: data-audit-report.json');
