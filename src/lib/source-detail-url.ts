import type { TourSummary } from "@/types/tour";

const JRT365_SOURCE = "假日通";

function readSourceAttribute(tour: Pick<TourSummary, "meta">, key: string) {
const value = tour.meta?.sourceAttributes?.[key];
return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string) {
try {
const protocol = new URL(value).protocol;
return protocol === "http:" || protocol === "https:";
} catch {
return false;
}
}

export function resolveSourceDetailUrl(
tour: Pick<TourSummary, "source" | "title" | "bookingUrl" | "meta">,
) {
const fallbackUrl = String(tour.bookingUrl || "").trim();
// 康辉 (cctpage.com) migrated to cct.cn — the old gz.cctpage.com host has an
// invalid certificate AND returns 404 (verified 2026-08: 0/25 reachable).
// prodcodes cannot be mapped to cct.cn product ids, so fall back to the new
// site's keyword search (www.cct.cn/search?keyword=… is reachable).
if (
tour.source === "康辉" &&
(fallbackUrl.includes("cctpage.com") || !isHttpUrl(fallbackUrl)) &&
String(tour.title || "").trim()
) {
return `https://www.cct.cn/search?keyword=${encodeURIComponent(
String(tour.title).trim().slice(0, 20),
)}`;
}
// 假日通：用户要的是“产品页”而非“合同页”。
// 实测：tourname_ziliao_print.aspx 是合同/条款打印模板（无预订 CTA），
// tourgroup_ziliao.aspx?groupno= 才是带“立即预订/出发日期/行程/价格”的产品页。
// 之前为稳定链接优先用 printUrl，反而把用户送去了合同页。
// 现改为：优先可用 bookingUrl（产品页），无效时再降级到 printUrl/tournameno，最后才搜索。
if (tour.source === JRT365_SOURCE) {
if (isHttpUrl(fallbackUrl)) return fallbackUrl;
const printUrl = readSourceAttribute(tour, "printUrl");
if (isHttpUrl(printUrl)) return printUrl;
const tournameno = readSourceAttribute(tour, "tournameno");
if (tournameno)
return `http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=${encodeURIComponent(tournameno)}`;
const title2 = String(tour.title || "").trim();
if (title2) return `http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=${encodeURIComponent(title2.slice(0, 20))}`;
return "";
}
if (isHttpUrl(fallbackUrl)) return fallbackUrl;
if (tour.source !== JRT365_SOURCE) return "";

const title = String(tour.title || "").trim();
if (title) {
return `http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=${encodeURIComponent(title.slice(0, 20))}`;
}

return "";
}
