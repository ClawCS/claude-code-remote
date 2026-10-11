import "server-only";
import { loadWeeklyPublications } from "./weekly-publication";
import { selectWeeklyOfferContent } from "./weekly-offer-selection";
import type { LoadedWeeklyPublications, WeeklyOfferContent } from "./weekly-publication-types";
import { loadSupplementalPublications, type LoadedSupplementalPublications } from "./supplemental-publication";
export { mapPublishedEditionToFlyer } from "./weekly-offer-selection";

export function createWeeklyOfferContentLoader(load: () => Promise<LoadedWeeklyPublications>, loadSupplemental: () => Promise<LoadedSupplementalPublications> = loadSupplementalPublications) {
  return async (now = new Date()): Promise<WeeklyOfferContent> => {
    const [weekly, supplemental] = await Promise.allSettled([Promise.resolve().then(load), Promise.resolve().then(loadSupplemental)]);
    return selectWeeklyOfferContent(
      weekly.status === "fulfilled" ? weekly.value : { editions: [], issues: [{ week: null, code: "week-invalid" }] }, now,
      supplemental.status === "fulfilled" ? supplemental.value : { editions: [], issues: [{ register:"supplemental", code:"register-invalid" }] },
    );
  };
}
export const getWeeklyOfferContent = createWeeklyOfferContentLoader(loadWeeklyPublications);
