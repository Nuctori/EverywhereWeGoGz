// Keep the intent engine outside the cold-start dependency graph.
const loadRouteMeta = () => import('@/lib/ai-recommendation');

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

export async function decideSearchAction(query: string): Promise<SearchRouteDecision> {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return { action: 'plain', reason: 'empty', hardConstraintCount: 0, destinationHintCount: 0 };
  const { getSearchRouteMeta } = await loadRouteMeta();
  return getSearchRouteMeta(normalizedQuery);
}
