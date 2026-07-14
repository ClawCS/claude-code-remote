import type {
  HomepageContent,
  HomepageEvent,
  HomepageFlyer,
} from "@/lib/homepage-content";

export type CurrentView = Readonly<{
  flyer: HomepageFlyer | null;
  event: HomepageEvent | null;
  fallbackMessage: string | null;
}>;

const germanDate = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const homepageRemoteImageHosts = new Set([
  "media.trinkgut.de",
  "www.trinkgut.de",
  "werbung.trinkgut.de",
]);

const unsafeUrlCharacters = /[\s\u0000-\u001f\u007f\\]/u;
const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

function hasExplicitPort(src: string): boolean {
  const match = /^https:\/\/([^/?#]*)(?:[/?#]|$)/i.exec(src);
  if (!match) return false;
  const authorityWithoutCredentials = match[1].slice(
    match[1].lastIndexOf("@") + 1,
  );
  return authorityWithoutCredentials.includes(":");
}

function decodeToFixedPoint(
  value: string,
  decode: (input: string) => string,
): string | null {
  if (value !== value.trim() || unsafeUrlCharacters.test(value)) return null;

  let decoded = value;
  for (let depth = 0; depth < 4; depth += 1) {
    try {
      const next = decode(decoded);
      if (unsafeUrlCharacters.test(next)) return null;
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }

  try {
    if (decode(decoded) !== decoded) return null;
  } catch {
    return null;
  }

  return decoded;
}

function hasSafeUrlEncoding(src: string): boolean {
  const decodedUrl = decodeToFixedPoint(src, decodeURI);
  if (!decodedUrl) return false;

  try {
    const schemeEnd = decodedUrl.indexOf("://");
    const pathStart =
      schemeEnd < 0 ? -1 : decodedUrl.indexOf("/", schemeEnd + 3);
    const rawPathAndSuffix = pathStart < 0 ? "/" : decodedUrl.slice(pathStart);
    const pathEnd = Math.min(
      ...[rawPathAndSuffix.indexOf("?"), rawPathAndSuffix.indexOf("#")].filter(
        (index) => index >= 0,
      ),
      rawPathAndSuffix.length,
    );
    const decodedPath = decodeToFixedPoint(
      rawPathAndSuffix.slice(0, pathEnd),
      decodeURIComponent,
    );
    if (!decodedPath) return false;
    if (
      decodedPath
        .split("/")
        .some((segment) => segment === "." || segment === "..")
    ) {
      return false;
    }

    const url = new URL(decodedUrl);
    return url.href === new URL(src).href && imageExtension.test(decodedPath);
  } catch {
    return false;
  }
}

function isRenderSafeLocalImage(src: string): boolean {
  if (
    !src.startsWith("/") ||
    src.startsWith("//") ||
    src.includes("?") ||
    src.includes("#") ||
    unsafeUrlCharacters.test(src)
  ) {
    return false;
  }

  const decoded = decodeToFixedPoint(src, decodeURIComponent);
  if (!decoded) return false;

  const segments = decoded.split("/");
  return (
    decoded.startsWith("/images/") &&
    !segments.some((segment) => segment === "." || segment === "..") &&
    imageExtension.test(decoded)
  );
}

function dateOnly(value: string): {
  date: Date;
  year: string;
  month: string;
  day: string;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new TypeError(`Invalid date key: ${value}`);

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 12),
  );
  if (date.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`Invalid date key: ${value}`);
  }
  return { date, year, month, day };
}

export function formatDate(value: string): string {
  return germanDate.format(dateOnly(value).date);
}

export function formatDateRange(validFrom: string, validTo: string): string {
  const from = dateOnly(validFrom);
  const to = dateOnly(validTo);

  if (validFrom === validTo) return formatDate(validFrom);
  if (from.year === to.year && from.month === to.month) {
    return `${from.day}.–${to.day}.${to.month}.${to.year}`;
  }
  if (from.year === to.year) {
    return `${from.day}.${from.month}.–${to.day}.${to.month}.${to.year}`;
  }
  return `${formatDate(validFrom)}–${formatDate(validTo)}`;
}

export function formatPageCount(pageCount: number): string {
  return `${pageCount} ${pageCount === 1 ? "Seite" : "Seiten"}`;
}

export function canRenderHomepageImage(src: string): boolean {
  if (src.startsWith("/")) return isRenderSafeLocalImage(src);
  if (!hasSafeUrlEncoding(src)) return false;

  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !hasExplicitPort(src) &&
      homepageRemoteImageHosts.has(url.hostname)
    );
  } catch {
    return false;
  }
}

export function buildCurrentView(content: HomepageContent): CurrentView {
  return {
    flyer: content.flyer,
    event: content.event,
    fallbackMessage: content.flyer ? null : content.fallbackMessage,
  };
}
