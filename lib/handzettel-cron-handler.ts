import { isAuthorizedBearer } from "@/lib/cron-auth";
import { mapHandzettelUpdateResult } from "@/lib/handzettel-update-result";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export function createHandzettelCronHandler(
  refresh: () => unknown | Promise<unknown>,
) {
  return async function handler(request: Request): Promise<Response> {
    if (request.method !== "GET" && request.method !== "POST") {
      return new Response(null, {
        status: 405,
        headers: { ...NO_STORE_HEADERS, Allow: "GET, POST" },
      });
    }
    if (!process.env.CRON_SECRET) {
      return Response.json(
        { success: false, error: "Cron is not configured" },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }
    if (!isAuthorizedBearer(request)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    try {
      const mapped = mapHandzettelUpdateResult(await refresh());
      return Response.json(mapped.body, {
        status: mapped.httpStatus,
        headers: NO_STORE_HEADERS,
      });
    } catch {
      const mapped = mapHandzettelUpdateResult(undefined);
      return Response.json(mapped.body, {
        status: mapped.httpStatus,
        headers: NO_STORE_HEADERS,
      });
    }
  };
}
