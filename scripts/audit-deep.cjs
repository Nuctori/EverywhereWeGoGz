const fs = require('fs');

const content = fs.readFileSync('src/data/tours.ts', 'utf8');
const match = content.match(/export const tours: Tour\[\] = ([\s\S]*);\s*$/);
const tours = eval(match[1]);

let emptyImages = [];
let nonHttpImages = [];
let badImageUrls = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (!Array.isArray(t.images) || t.images.length === 0) {
    emptyImages.push({ id: t.id, source: t.source });
  } else {
    for (const img of t.images) {
      if (typeof img !== 'string' || img.trim() === '') {
        badImageUrls.push({ id: t.id, source: t.source, img });
      } else if (!img.startsWith('http')) {
        nonHttpImages.push({ id: t.id, source: t.source, img });
      }
    }
  }
}

let dateDurationMismatch = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  const dDate = new Date(t.departureDate);
  const rDate = new Date(t.returnDate);
  const expectedDays = Math.round((rDate - dDate) / (1000 * 60 * 60 * 24));
  if (expectedDays !== t.duration) {
    dateDurationMismatch.push({ id: t.id, source: t.source, departureDate: t.departureDate, returnDate: t.returnDate, duration: t.duration, expectedDays });
  }
}

let seatIssues = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (t.availableSeats > t.totalSeats) {
    seatIssues.push({ id: t.id, source: t.source, availableSeats: t.availableSeats, totalSeats: t.totalSeats });
  }
}

let zeroReviews = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (t.reviewCount === 0) {
    zeroReviews.push({ id: t.id, source: t.source, reviewCount: t.reviewCount });
  }
}

let veryHighPrices = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (t.price > 50000) {
    veryHighPrices.push({ id: t.id, source: t.source, title: t.title, price: t.price });
  }
}

let veryLowPrices = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (t.price < 50) {
    veryLowPrices.push({ id: t.id, source: t.source, title: t.title, price: t.price });
  }
}

let logoIssues = [];
const expectedLogos = {
  '假日通': '/icons/假日通.png',
  '品途': '/icons/品途.png',
  '广东中旅': '/icons/广东中旅.png',
  '广之旅': '/icons/广.png',
  '广州去旅行': '/icons/广州去.png',
  '康辉': '/icons/康辉.png',
  '暴走村': '/icons/暴走村.png'
};
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (expectedLogos[t.source] && t.sourceLogo !== expectedLogos[t.source]) {
    logoIssues.push({ id: t.id, source: t.source, sourceLogo: t.sourceLogo, expected: expectedLogos[t.source] });
  }
}

const validDestinations = ['三亚','云南','其他','北京','厦门','四川','广东','张家界','新疆','桂林','西安','西藏','贵州'];
let invalidDestinations = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (!validDestinations.includes(t.destination)) {
    invalidDestinations.push({ id: t.id, source: t.source, destination: t.destination });
  }
}

const validThemes = ['亲子游','冰雪世界','古镇文化','户外徒步','摄影之旅','民族风情','海岛度假','美食之旅','自然风光'];
let invalidThemes = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (!validThemes.includes(t.theme)) {
    invalidThemes.push({ id: t.id, source: t.source, theme: t.theme });
  }
}

let invalidStars = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (t.accommodationStars < 1 || t.accommodationStars > 5) {
    invalidStars.push({ id: t.id, source: t.source, stars: t.accommodationStars });
  }
}

let invalidTags = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  for (const tag of t.tags) {
    if (typeof tag !== 'string' || tag.trim() === '') {
      invalidTags.push({ id: t.id, source: t.source, tag });
    }
  }
}

let flashSaleIssues = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (t.isFlashSale && !t.flashSaleEndTime) {
    flashSaleIssues.push({ id: t.id, source: t.source });
  }
}

// Check for duplicate IDs
const idMap = {};
let duplicateIds = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (idMap[t.id]) {
    duplicateIds.push({ id: t.id, firstIndex: idMap[t.id], secondIndex: i });
  } else {
    idMap[t.id] = i;
  }
}

// Check for duplicate booking URLs
const urlMap = {};
let duplicateUrls = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (urlMap[t.bookingUrl]) {
    duplicateUrls.push({ url: t.bookingUrl, firstId: urlMap[t.bookingUrl], secondId: t.id });
  } else {
    urlMap[t.bookingUrl] = t.id;
  }
}

// Check itinerary day consistency
let itineraryIssues = [];
for (let i = 0; i < tours.length; i++) {
  const t = tours[i];
  if (!Array.isArray(t.itinerary) || t.itinerary.length === 0) {
    itineraryIssues.push({ id: t.id, source: t.source, issue: 'empty itinerary' });
  } else {
    for (let d = 0; d < t.itinerary.length; d++) {
      const day = t.itinerary[d];
      if (day.day !== d + 1) {
        itineraryIssues.push({ id: t.id, source: t.source, issue: `day mismatch: expected ${d+1}, got ${day.day}` });
      }
    }
    if (t.itinerary.length !== t.duration) {
      itineraryIssues.push({ id: t.id, source: t.source, issue: `itinerary length ${t.itinerary.length} != duration ${t.duration}` });
    }
  }
}

console.log('===== 深度审计补充报告 =====');
console.log('');
console.log('## 图片URL检查');
console.log('无图片的产品数量:', emptyImages.length);
console.log('非HTTP图片URL数量:', nonHttpImages.length);
console.log('无效图片URL数量:', badImageUrls.length);
if (emptyImages.length > 0) {
  console.log('无图片产品（前10条）:');
  emptyImages.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']'));
}
if (nonHttpImages.length > 0) {
  console.log('非HTTP图片URL（前10条）:');
  nonHttpImages.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']', m.img));
}

console.log('');
console.log('## 日期与天数一致性检查');
console.log('departureDate + duration != returnDate 的数量:', dateDurationMismatch.length);
if (dateDurationMismatch.length > 0) {
  console.log('不一致详情（前10条）:');
  dateDurationMismatch.slice(0, 10).forEach(m => {
    console.log('  -', m.id, '[', m.source, ']', m.departureDate, '~', m.returnDate, 'duration=', m.duration, 'expected=', m.expectedDays);
  });
}

console.log('');
console.log('## 座位数检查');
console.log('availableSeats > totalSeats 的数量:', seatIssues.length);
if (seatIssues.length > 0) {
  seatIssues.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']', m.availableSeats, '>', m.totalSeats));
}

console.log('');
console.log('## 评论数检查');
console.log('reviewCount = 0 的数量:', zeroReviews.length);

console.log('');
console.log('## 极端价格检查');
console.log('价格 > 50000 的数量:', veryHighPrices.length);
if (veryHighPrices.length > 0) {
  veryHighPrices.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']', m.title, '¥' + m.price));
}
console.log('价格 < 50 的数量:', veryLowPrices.length);
if (veryLowPrices.length > 0) {
  veryLowPrices.forEach(m => console.log('  -', m.id, '[', m.source, ']', m.title, '¥' + m.price));
}

console.log('');
console.log('## Logo一致性检查');
console.log('sourceLogo不匹配的数量:', logoIssues.length);
if (logoIssues.length > 0) {
  logoIssues.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']', m.sourceLogo, '!=', m.expected));
}

console.log('');
console.log('## 目的地有效性检查');
console.log('无效destination数量:', invalidDestinations.length);
if (invalidDestinations.length > 0) {
  invalidDestinations.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']', m.destination));
}

console.log('');
console.log('## 主题有效性检查');
console.log('无效theme数量:', invalidThemes.length);
if (invalidThemes.length > 0) {
  invalidThemes.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']', m.theme));
}

console.log('');
console.log('## 星级有效性检查');
console.log('无效accommodationStars数量:', invalidStars.length);
if (invalidStars.length > 0) {
  invalidStars.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']', m.stars));
}

console.log('');
console.log('## 标签有效性检查');
console.log('无效tags数量:', invalidTags.length);

console.log('');
console.log('## 闪购一致性检查');
console.log('isFlashSale=true但缺少flashSaleEndTime的数量:', flashSaleIssues.length);
if (flashSaleIssues.length > 0) {
  flashSaleIssues.slice(0, 10).forEach(m => console.log('  -', m.id, '[', m.source, ']'));
}

console.log('');
console.log('## 重复ID检查');
console.log('重复ID数量:', duplicateIds.length);
if (duplicateIds.length > 0) {
  duplicateIds.slice(0, 10).forEach(m => console.log('  -', m.id, 'at indices', m.firstIndex, 'and', m.secondIndex));
}

console.log('');
console.log('## 重复URL检查');
console.log('重复bookingUrl数量:', duplicateUrls.length);
if (duplicateUrls.length > 0) {
  duplicateUrls.slice(0, 10).forEach(m => console.log('  -', m.firstId, 'and', m.secondId, 'share', m.url.substring(0, 60) + '...'));
}

console.log('');
console.log('## 行程一致性检查');
console.log('行程问题数量:', itineraryIssues.length);
if (itineraryIssues.length > 0) {
  itineraryIssues.slice(0, 20).forEach(m => console.log('  -', m.id, '[', m.source, ']', m.issue));
}
