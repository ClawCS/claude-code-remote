import "server-only";
import { loadWeeklyPublications } from "./weekly-publication";
import { selectWeeklyOfferContent } from "./weekly-offer-selection";
import type { LoadedWeeklyPublications, WeeklyOfferContent } from "./weekly-publication-types";
export { mapPublishedEditionToFlyer } from "./weekly-offer-selection";

export function createWeeklyOfferContentLoader(load: () => Promise<LoadedWeeklyPublications>) {
  return async (now = new Date()): Promise<WeeklyOfferContent> => {
    let loaded: LoadedWeeklyPublications;
    try { loaded = await load(); }
    catch { loaded = { editions: [], issues: [{ week: null, code: "week-invalid" }] }; }
    return selectWeeklyOfferContent(loaded,now);
  };
}
export const getWeeklyOfferContent = createWeeklyOfferContentLoader(loadWeeklyPublications);
