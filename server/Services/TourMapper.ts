import type { RawCrawlerItem, Tour } from '../Contracts/Tour';
import { resolveSourceIcon } from './SourceIconResolver';

function formatDate(dateValue?: string): string {
  if (dateValue && dateValue.length >= 10) {
    return dateValue.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

export function mapRawItemsToTours(rawItems: RawCrawlerItem[]): Tour[] {
  return rawItems.map((item, index) => {
    const basePrice = Math.max(0, Number(item.price ?? 0));
    const duration = Math.max(2, Number(item.days ?? 2));
    const source = item.source?.trim() || 'Unknown Source';
    const destination = item.destination?.trim() || item.category?.trim() || 'Unknown Destination';
    const departureDate = formatDate(item.date_range);
    const returnDate = formatDate(item.date_range);
    const nowIso = new Date().toISOString();

    return {
      id: `tour_${index + 1}`,
      title: item.title?.trim() || `${destination} ${duration}D Tour`,
      source,
      sourceLogo: `/icons/${resolveSourceIcon(source)}`,
      destination,
      duration,
      price: basePrice,
      originalPrice: item.originalPrice,
      priceUnit: 'person',
      departureDate,
      returnDate,
      transportType: item.traffic?.trim() || 'Round Trip Bus',
      accommodationLevel: 'Comfort',
      accommodationStars: 3,
      meals: 'Breakfast Included',
      singleSupplement: Math.floor(basePrice * 0.25),
      singleSupplementNote:
        'Single travelers may need a room supplement. Final amount depends on real-time booking result.',
      availableSeats: Math.floor(Math.random() * 20) + 5,
      totalSeats: 30,
      highlights: [item.title?.trim() || 'Highlights available after crawl normalization'],
      itinerary: [],
      inclusions: ['Guide Service', 'Travel Insurance'],
      exclusions: ['Personal Expenses', 'Single Room Supplement'],
      importantNotes: ['Bring valid identification documents.', 'Schedules may change due to weather.'],
      visaRequirements: 'No visa required for domestic routes',
      travelInsurance: true,
      tourGuideService: true,
      freeWiFi: false,
      childPolicy: 'Children pricing depends on seat and bed occupancy.',
      cancellationPolicy: 'Free cancellation before departure threshold.',
      refundPolicy: 'Unused items are settled based on actual usage.',
      rating: Number((4 + Math.random()).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 300) + 10,
      bookingUrl: item.url?.trim() || '#',
      images: [],
      tags: [item.category?.trim() || 'group-tour', source],
      isHot: Math.random() > 0.6,
      isNew: Math.random() > 0.7,
      isFlashSale: Math.random() > 0.85,
      flashSaleEndTime: undefined,
      discountRate: undefined,
      groupSize: '30 people standard group',
      theme: item.category?.trim() || 'Nature',
      suitableFor: ['Family', 'Couple'],
      difficulty: 'Relaxed',
      season: 'All season',
      language: 'Chinese',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });
}
