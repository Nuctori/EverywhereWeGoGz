import type { TourSummary } from "@/types/tour";

const JRT365_SOURCE = "假日通";
const JRT365_PRINT_URL =
	"http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=";

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
	// 假日通 stable tourname links FIRST when present: the groupno bookingUrl
	// rotates/expires (0c771a658 verified), and the detail modal passes the
	// resolved tour (with meta.sourceAttributes) once detail loading succeeds.
	// Map-card summaries carry no sourceAttributes, so they fall through to the
	// bookingUrl below — the real fix for 转跳都是错的 (560dfc5fb): a valid
	// detail URL must never silently degrade to a keyword search page.
	if (tour.source === JRT365_SOURCE) {
		const printUrl = readSourceAttribute(tour, "printUrl");
		if (isHttpUrl(printUrl)) return printUrl;

		const tournameno = readSourceAttribute(tour, "tournameno");
		if (tournameno)
			return `${JRT365_PRINT_URL}${encodeURIComponent(tournameno)}`;
	}
	if (isHttpUrl(fallbackUrl)) return fallbackUrl;
	if (tour.source !== JRT365_SOURCE) return fallbackUrl;

	const title = String(tour.title || "").trim();
	if (title) {
		return `http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=${encodeURIComponent(title.slice(0, 20))}`;
	}

	return fallbackUrl;
}
