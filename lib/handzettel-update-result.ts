export type HandzettelUpdateResult = Readonly<{
  status: "ok";
  pageCount: number;
}>;

function snapshotSuccessfulUpdate(
  data: unknown,
): HandzettelUpdateResult | null {
  try {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return null;
    }
    const prototype = Object.getPrototypeOf(data);
    if (prototype !== Object.prototype && prototype !== null) return null;

    const statusProperty = Object.getOwnPropertyDescriptor(data, "status");
    const pageCountProperty = Object.getOwnPropertyDescriptor(
      data,
      "pageCount",
    );
    if (!statusProperty || !("value" in statusProperty)) return null;
    if (!pageCountProperty || !("value" in pageCountProperty)) return null;

    const status = statusProperty.value;
    const pageCount = pageCountProperty.value;
    if (
      status !== "ok" ||
      typeof pageCount !== "number" ||
      !Number.isInteger(pageCount) ||
      pageCount < 1 ||
      pageCount > 60
    ) {
      return null;
    }
    return { status, pageCount };
  } catch {
    return null;
  }
}

export function mapHandzettelUpdateResult(data: unknown) {
  const snapshot = snapshotSuccessfulUpdate(data);
  return snapshot
    ? {
        httpStatus: 200 as const,
        body: {
          success: true,
          status: "ok",
          pageCount: snapshot.pageCount,
        } as const,
      }
    : {
        httpStatus: 502 as const,
        body: {
          success: false,
          status: "fallback",
          pageCount: 0,
        } as const,
      };
}
