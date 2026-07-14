import {
  loadApprovedCampaigns,
  loadEditorialArchive,
  type EditorialArchiveItem,
  type EditorialCampaign,
} from "@/lib/editorial-repository";
import {
  loadValidatedHandzettelCache,
  validateCatalog,
  type HandzettelCache,
} from "@/lib/handzettel-catalog";
import {
  berlinDateKey,
  isEditorialPublishable,
  type EditorialSource,
} from "@/lib/editorial-schedule";

export type HomepageFlyer = Readonly<{
  id: string;
  title: string;
  validFrom: string;
  validTo: string;
  viewerUrl: string;
  pdfUrl: string;
  pageCount: number;
  coverUrl: string;
  sourceUrl: string;
}>;

export type HomepageEvent = Readonly<{
  id: string;
  title: string;
  summary: string;
  validFrom: string;
  validTo: string;
  image: string;
  href: string;
  sourceUrl: string;
}>;

export type HomepageArchiveItem = Readonly<{
  id: string;
  title: string;
  date: string;
  image: string;
  kind: "event" | "giveaway";
}>;

export type HomepageContent = Readonly<{
  generatedAt: string;
  flyer: HomepageFlyer | null;
  event: HomepageEvent | null;
  archive: readonly HomepageArchiveItem[];
  fallbackMessage: string | null;
}>;

export type HomepageContentSources = Readonly<{
  loadValidatedHandzettelCache: (
    now: Date,
  ) => Promise<HandzettelCache | null>;
  loadApprovedCampaigns: () => Promise<readonly EditorialCampaign[]>;
  loadEditorialArchive: () => Promise<readonly EditorialArchiveItem[]>;
}>;

type AggregateHomepageContentInput = Readonly<{
  now: Date;
  flyer: HomepageFlyer | null;
  campaigns: readonly EditorialCampaign[];
  archive: readonly EditorialArchiveItem[];
}>;

const FLYER_FALLBACK = "Der nächste Handzettel wird vorbereitet.";
const SOURCE_RANK: Readonly<Record<EditorialSource, number>> = {
  "trinkgut-official": 0,
  local: 1,
  canva: 2,
  instagram: 3,
};
const UNSAFE_URL_CHARACTERS = /[\u0000-\u001f\u007f\\]/;
const IMAGE_FILE_EXTENSION = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i;

function isCalendarDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isCredentialFreeHttpsUrl(value: string): boolean {
  if (!hasSafeUrlEncoding(value) || value.startsWith("//")) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function hasSafeUrlEncoding(value: string): boolean {
  if (value !== value.trim() || UNSAFE_URL_CHARACTERS.test(value)) return false;
  try {
    return !UNSAFE_URL_CHARACTERS.test(decodeURI(value));
  } catch {
    return false;
  }
}

function isSafePublishedUrl(value: string): boolean {
  if (!hasSafeUrlEncoding(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  return isCredentialFreeHttpsUrl(value);
}

function decodeImagePath(value: string): string | null {
  const queryIndex = value.indexOf("?");
  const hashIndex = value.indexOf("#");
  const pathEnd = Math.min(
    queryIndex === -1 ? value.length : queryIndex,
    hashIndex === -1 ? value.length : hashIndex,
  );
  let decoded = value.slice(0, pathEnd);
  for (let depth = 0; depth < 4; depth += 1) {
    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return null;
    }
    if (next === decoded) break;
    decoded = next;
  }
  try {
    if (decodeURIComponent(decoded) !== decoded) return null;
  } catch {
    return null;
  }
  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("?") ||
    decoded.includes("#") ||
    UNSAFE_URL_CHARACTERS.test(decoded)
  ) {
    return null;
  }
  const segments = decoded.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }
  return `/${segments.filter(Boolean).join("/")}`.normalize("NFC");
}

function isSafeImageUrl(value: string): boolean {
  if (!value.startsWith("/")) return isCredentialFreeHttpsUrl(value);
  if (!isSafePublishedUrl(value)) return false;
  const normalizedPath = decodeImagePath(value);
  return Boolean(
    normalizedPath?.startsWith("/images/") &&
      IMAGE_FILE_EXTENSION.test(normalizedPath),
  );
}

function isCurrentFlyer(flyer: HomepageFlyer, now: Date): boolean {
  if (
    !isCalendarDateKey(flyer.validFrom) ||
    !isCalendarDateKey(flyer.validTo) ||
    flyer.validFrom > flyer.validTo ||
    !Number.isInteger(flyer.pageCount) ||
    flyer.pageCount < 1 ||
    flyer.pageCount > 60 ||
    !isCredentialFreeHttpsUrl(flyer.viewerUrl) ||
    !isCredentialFreeHttpsUrl(flyer.pdfUrl) ||
    !isCredentialFreeHttpsUrl(flyer.coverUrl) ||
    !isCredentialFreeHttpsUrl(flyer.sourceUrl)
  ) {
    return false;
  }
  const today = berlinDateKey(now);
  return flyer.validFrom <= today && today <= flyer.validTo;
}

function selectEvent(
  campaigns: readonly EditorialCampaign[],
  now: Date,
): HomepageEvent | null {
  const candidates = campaigns.filter(
    (campaign) =>
      campaign.kind === "event" &&
      Object.hasOwn(SOURCE_RANK, campaign.source) &&
      isEditorialPublishable(campaign, now) &&
      isSafePublishedUrl(campaign.href) &&
      isSafeImageUrl(campaign.image) &&
      isCredentialFreeHttpsUrl(campaign.sourceUrl),
  );
  candidates.sort((left, right) => {
    const sourceOrder = SOURCE_RANK[left.source] - SOURCE_RANK[right.source];
    if (sourceOrder !== 0) return sourceOrder;
    const validityOrder = right.validFrom.localeCompare(left.validFrom);
    if (validityOrder !== 0) return validityOrder;
    return left.id.localeCompare(right.id);
  });
  const selected = candidates[0];
  if (!selected) return null;
  return {
    id: selected.id,
    title: selected.title,
    summary: selected.summary,
    validFrom: selected.validFrom,
    validTo: selected.validTo,
    image: selected.image,
    href: selected.href,
    sourceUrl: selected.sourceUrl,
  };
}

function selectArchive(
  archive: readonly EditorialArchiveItem[],
  now: Date,
): readonly HomepageArchiveItem[] {
  const today = berlinDateKey(now);
  return archive
    .filter(
      (item) =>
        (item.rightsStatus === "official" || item.rightsStatus === "approved") &&
        isCalendarDateKey(item.date) &&
        item.date <= today &&
        isSafeImageUrl(item.image),
    )
    .sort((left, right) => {
      const dateOrder = right.date.localeCompare(left.date);
      return dateOrder !== 0 ? dateOrder : left.id.localeCompare(right.id);
    })
    .slice(0, 4)
    .map(({ id, title, date, image, kind }) => ({ id, title, date, image, kind }));
}

export function mapHandzettelCacheToFlyer(
  cache: HandzettelCache,
): HomepageFlyer {
  validateCatalog(cache, {
    validFrom: cache.validFrom,
    validTo: cache.validTo,
  });
  const cover = cache.pages[0];
  if (!cover) throw new TypeError("validated catalog has no cover page");
  return {
    id: `catalog-${cache.storeId}-${cache.kw}-${cache.year}`,
    title: "Angebote der Woche",
    validFrom: cache.validFrom,
    validTo: cache.validTo,
    viewerUrl: cache.viewerUrl,
    pdfUrl: cache.pdfUrl,
    pageCount: cache.pageCount,
    coverUrl: cover.imageUrl,
    sourceUrl: cache.viewerUrl,
  };
}

export function aggregateHomepageContent({
  now,
  flyer,
  campaigns,
  archive,
}: AggregateHomepageContentInput): HomepageContent {
  const currentFlyer = flyer && isCurrentFlyer(flyer, now) ? flyer : null;
  let event: HomepageEvent | null = null;
  let currentArchive: readonly HomepageArchiveItem[] = [];
  try {
    event = selectEvent([...campaigns], now);
  } catch {
    event = null;
  }
  try {
    currentArchive = selectArchive([...archive], now);
  } catch {
    currentArchive = [];
  }
  return {
    generatedAt: now.toISOString(),
    flyer: currentFlyer,
    event,
    archive: currentArchive,
    fallbackMessage: currentFlyer ? null : FLYER_FALLBACK,
  };
}

export function createHomepageContentLoader(
  sources: HomepageContentSources,
): (now?: Date) => Promise<HomepageContent> {
  return async (now = new Date()) => {
    const [cacheResult, campaignsResult, archiveResult] = await Promise.allSettled([
      Promise.resolve().then(() => sources.loadValidatedHandzettelCache(now)),
      Promise.resolve().then(() => sources.loadApprovedCampaigns()),
      Promise.resolve().then(() => sources.loadEditorialArchive()),
    ]);

    let flyer: HomepageFlyer | null = null;
    if (cacheResult.status === "fulfilled" && cacheResult.value) {
      try {
        flyer = mapHandzettelCacheToFlyer(cacheResult.value);
      } catch {
        flyer = null;
      }
    }

    return aggregateHomepageContent({
      now,
      flyer,
      campaigns:
        campaignsResult.status === "fulfilled" ? campaignsResult.value : [],
      archive: archiveResult.status === "fulfilled" ? archiveResult.value : [],
    });
  };
}

export const getHomepageContent = createHomepageContentLoader({
  loadValidatedHandzettelCache,
  loadApprovedCampaigns,
  loadEditorialArchive,
});
