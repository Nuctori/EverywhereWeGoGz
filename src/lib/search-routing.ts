import { getSearchRouteMeta } from '@/lib/ai-recommendation';

export type SearchAction = 'plain' | 'ai';

export interface SearchRouteDecision {
  action: SearchAction;
  reason: 'empty' | 'plain' | 'destination_only' | 'hard_constraints';
  hardConstraintCount: number;
  destinationHintCount: number;
}

function normalizeQuery(query: string) {
  return query.replace(/\s+/g, '').trim();
}

export function decideSearchAction(query: string): SearchRouteDecision {
  const normalizedQuery = normalizeQuery(query);
  return getSearchRouteMeta(normalizedQuery);
}

export function getPrimarySearchAction(query: string): SearchAction {
  return decideSearchAction(query).action;
}
