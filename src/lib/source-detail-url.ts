import type { TourSummary } from '@/types/tour';

const JRT365_SOURCE = '假日通';
const JRT365_PRINT_URL = 'http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno=';

function readSourceAttribute(tour: Pick<TourSummary, 'meta'>, key: string) {
  const value = tour.meta?.sourceAttributes?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveSourceDetailUrl(
  tour: Pick<TourSummary, 'source' | 'title' | 'bookingUrl' | 'meta'>,
) {
  const fallbackUrl = String(tour.bookingUrl || '').trim();
  if (tour.source !== JRT365_SOURCE) return fallbackUrl;

  const printUrl = readSourceAttribute(tour, 'printUrl');
  if (isHttpUrl(printUrl)) return printUrl;

  const tournameno = readSourceAttribute(tour, 'tournameno');
  if (tournameno) return `${JRT365_PRINT_URL}${encodeURIComponent(tournameno)}`;

  const title = String(tour.title || '').trim();
  if (title) {
    return `http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword=${encodeURIComponent(title.slice(0, 20))}`;
  }

  return fallbackUrl;
}
