import { lessonHref } from "@/lib/academy-routes";

/** Recorded content/review dates only. A new build never makes old content newer. */
export function buildContentLastModified(
  recorded: Readonly<Record<string, string>>,
  reviews: readonly { id: string; reviewedAt: string }[],
  jobs: readonly { slug: string; publishedAt: string }[],
) {
  const dates = new Map<string, string>();
  const add = (route: string, date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new TypeError("Invalid content modification date");
    if (!dates.has(route) || dates.get(route)! < date) dates.set(route, date);
  };
  for (const [route, date] of Object.entries(recorded)) add(route, date);
  for (const review of reviews) {
    if (review.id.startsWith("recipe:")) {
      add(`/cocktails/${review.id.slice(7)}`, review.reviewedAt);
      add("/cocktails", review.reviewedAt);
    } else {
      const [, slug, lesson] = review.id.split(":");
      add(lessonHref(slug, Number(lesson) - 1), review.reviewedAt);
      add(`/akademie/${slug}`, review.reviewedAt);
      add("/akademie", review.reviewedAt);
    }
  }
  for (const job of jobs) {
    add(`/karriere/${job.slug}`, job.publishedAt);
    add("/karriere", job.publishedAt);
  }
  return (path: string) => dates.get(path);
}
