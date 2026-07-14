import { createHandzettelCronHandler } from "@/lib/handzettel-cron-handler";
import { refreshHandzettelCache } from "@/lib/handzettel-catalog";

const handler = createHandzettelCronHandler(() => refreshHandzettelCache());

export const GET = handler;
export const POST = handler;
