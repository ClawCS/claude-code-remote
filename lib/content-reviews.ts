import data from "@/data/editorial/content-reviews.json";
import { parseContentReviews } from "@/lib/content-review-schema";

const { reviews } = parseContentReviews(data);
export function getContentReview(id: string) { return reviews.get(id); }
