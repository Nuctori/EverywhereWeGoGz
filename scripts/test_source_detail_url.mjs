import assert from "node:assert/strict";
import { resolveSourceDetailUrl } from "../src/lib/source-detail-url.ts";

const staleGroupUrl =
	"http://www.jrt365.com/tourgroup/tourgroup_ziliao.aspx?groupno=OLD";

assert.equal(
	resolveSourceDetailUrl({
		source: "假日通",
		title: "金水台温泉2天（含晚）",
		bookingUrl: staleGroupUrl,
		meta: {
			sourceAttributes: {
				printUrl:
					"http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=233M958001",
			},
		},
	}),
	"http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=233M958001",
	"JRT365 should prefer the stable print URL over a rotating group URL",
);

assert.equal(
	resolveSourceDetailUrl({
		source: "假日通",
		title: "金水台温泉2天（含晚）",
		bookingUrl: staleGroupUrl,
		meta: { sourceAttributes: { tournameno: "233M958001" } },
	}),
	"http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=233M958001",
	"JRT365 should derive the stable print URL from tournameno",
);

assert.equal(
	resolveSourceDetailUrl({
		source: "假日通",
		title: "金水台温泉2天（含晚）",
		bookingUrl: staleGroupUrl,
		meta: {
			sourceAttributes: { printUrl: "javascript:alert(1)", tournameno: "" },
		},
	}),
	staleGroupUrl,
	"invalid stable URLs fall through to the valid bookingUrl detail page (never a keyword search while a detail URL exists)",
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
		bookingUrl: staleGroupUrl,
	}),
	staleGroupUrl,
	"map-card summaries without source metadata must open the bookingUrl detail page, not a keyword search (560dfc5fb 转跳根因)",
);

console.log("Source detail URL tests passed.");
