import assert from "node:assert/strict";
import { resolveSourceDetailUrl } from "../src/lib/source-detail-url.ts";

const productUrl = "http://www.jrt365.com/tourgroup/tourgroup_ziliao.aspx?groupno=OLD";

// 假日通：有可用 bookingUrl 时应直达产品页（带预订 CTA），而非合同打印页
assert.equal(
  resolveSourceDetailUrl({
    source: "假日通",
    title: "金水台温泉2天（含晚）",
    bookingUrl: productUrl,
    meta: {
      sourceAttributes: {
        printUrl: "http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=233M958001",
      },
    },
  }),
  productUrl,
  "JRT365 with valid bookingUrl should stay on product page, not jump to contract print page",
);

// bookingUrl 失效时才降级到合同/搜索兜底
assert.equal(
  resolveSourceDetailUrl({
    source: "假日通",
    title: "金水台温泉2天（含晚）",
    bookingUrl: "javascript:alert(1)",
    meta: { sourceAttributes: { tournameno: "233M958001" } },
  }),
  "http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=233M958001",
  "JRT365 with invalid bookingUrl should fall back to print contract page derived from tournameno",
);

assert.equal(
  resolveSourceDetailUrl({
    source: "假日通",
    title: "金水台温泉2天（含晚）",
    bookingUrl: productUrl,
    meta: {
      sourceAttributes: { printUrl: "javascript:alert(1)", tournameno: "" },
    },
  }),
  productUrl,
  "invalid stable URLs fall through to the valid bookingUrl detail page",
);

assert.equal(
  resolveSourceDetailUrl({
    source: "假日通",
    title: "金水台温泉2天（含晚）",
    bookingUrl: "javascript:alert(1)",
  }),
  "http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=%E9%87%91%E6%B0%B4%E5%8F%B0%E6%B8%A9%E6%B3%892%E5%A4%A9%EF%BC%88%E5%90%AB%E6%99%9A%EF%BC%89",
  "keyword title search remains the last resort when no valid detail URL exists",
);

const otherSourceUrl = "https://example.com/tour";
assert.equal(
  resolveSourceDetailUrl({
    source: "康辉",
    title: "测试线路",
    bookingUrl: otherSourceUrl,
  }),
  otherSourceUrl,
  "other sources should keep their existing booking URL behavior",
);

assert.equal(
  resolveSourceDetailUrl({
    source: "假日通",
    title: "旧线路",
    bookingUrl: productUrl,
  }),
  productUrl,
  "map-card summaries without source metadata must open the bookingUrl detail page",
);

console.log("Source detail URL tests passed.");
