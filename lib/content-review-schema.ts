export type ReviewSource = { id: string; title: string; url: string; publisher: string };
export type ContentReview = { id: string; reviewedAt: string; scope: string; sources: ReviewSource[] };

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Invalid review record");
  return value as Record<string, unknown>;
}
function text(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`Missing review ${field}`);
  return value;
}

/** Public evidence only: never private account/export URLs or fabricated coverage. */
export function parseContentReviews(input: unknown): { reviews: Map<string, ContentReview> } {
  const root = record(input);
  if (root.schemaVersion !== 1 || !Array.isArray(root.sources) || !Array.isArray(root.reviews)) throw new TypeError("Invalid review schema");
  const sources = new Map<string, ReviewSource>();
  for (const entry of root.sources) {
    const value = record(entry);
    const source = { id: text(value.id, "source id"), title: text(value.title, "source title"), url: text(value.url, "source URL"), publisher: text(value.publisher, "publisher") };
    const url = new URL(source.url);
    if (url.protocol !== "https:" || url.username || url.password || [...url.searchParams.keys()].some(key => /token|secret|signature|credential|password/i.test(key))) throw new TypeError("Unsafe public source URL");
    if (sources.has(source.id)) throw new TypeError("Duplicate source id");
    sources.set(source.id, source);
  }
  const reviews = new Map<string, ContentReview>();
  for (const entry of root.reviews) {
    const value = record(entry);
    const id = text(value.id, "id");
    if (!/^(recipe:[a-z0-9-]+|academy:[a-z0-9-]+:[1-9][0-9]*)$/.test(id)) throw new TypeError("Invalid review identity");
    if (reviews.has(id)) throw new TypeError("Duplicate review id");
    const reviewedAt = text(value.reviewedAt, "date");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt) || !Number.isFinite(Date.parse(reviewedAt)) || new Date(reviewedAt).toISOString().slice(0, 10) !== reviewedAt) throw new TypeError("Invalid review date");
    if (!Array.isArray(value.sourceIds) || !value.sourceIds.length || new Set(value.sourceIds).size !== value.sourceIds.length) throw new TypeError("Invalid review sources");
    const resolved = value.sourceIds.map(sourceId => {
      const source = sources.get(text(sourceId, "source id"));
      if (!source) throw new TypeError("Unresolved review source");
      return source;
    });
    reviews.set(id, { id, reviewedAt, scope: text(value.scope, "scope"), sources: resolved });
  }
  return { reviews };
}

export function assertContentReviewCoverage(input: unknown, expectedIds: readonly string[]): number {
  const { reviews } = parseContentReviews(input);
  if (new Set(expectedIds).size !== expectedIds.length || reviews.size !== expectedIds.length || expectedIds.some(id => !reviews.has(id))) throw new TypeError("Incomplete editorial review coverage");
  return reviews.size;
}
