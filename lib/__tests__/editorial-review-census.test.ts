import { describe, expect, it } from "vitest";
import { courses } from "@/data/akademie";
import { cocktailCatalog } from "@/lib/cocktail-routes";
import reviews from "@/data/editorial/content-reviews.json";
import { parseContentReviews } from "@/lib/content-review-schema";

describe("complete editorial review census", () => {
  it("has resolving review evidence for every actual lesson and recipe, without phantom entries", () => {
    const expected = [
      ...courses.flatMap(course => course.lessons.map((_, index) => `academy:${course.slug}:${index + 1}`)),
      ...cocktailCatalog.recipes.map(recipe => `recipe:${recipe.slug}`),
    ].sort();
    const parsed = parseContentReviews(reviews);
    expect(expected).toHaveLength(245);
    expect([...parsed.reviews.keys()].sort()).toEqual(expected);
  });
});
