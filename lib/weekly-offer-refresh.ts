import type { WeeklyOfferContent } from "./weekly-publication-types";
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Invalid weekly content");
  return value as Record<string, unknown>;
}
function keys(value: Record<string,unknown>, required:string[], optional:string[]=[]): void {
  if (required.some(key=>!Object.hasOwn(value,key)) || Object.keys(value).some(key=>![...required,...optional].includes(key))) throw new TypeError("Invalid weekly fields");
}
const date = (value:unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
const hash = (value:unknown) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const text = (value:unknown) => typeof value === "string" && value.trim().length>0;
const pdf = (value:unknown) => typeof value === "string" && /^\/handzettel\/[a-zA-Z0-9/_-]+\.pdf$/.test(value) && !value.includes("//");
const image = (value:unknown,folder:string) => typeof value === "string" && new RegExp(`^/images/${folder}/[a-zA-Z0-9/_-]+\\.(?:webp|avif|png|jpe?g)$`).test(value) && !value.includes("//");
export function parseWeeklyOfferContent(value: unknown): WeeklyOfferContent {
  const item=record(value); keys(item,["status","issues","generatedAt","flyers","offers"]);
  if (!["ok","degraded"].includes(item.status as string) || !Array.isArray(item.issues) || !item.issues.every(text)
    || typeof item.generatedAt!=="string" || !Number.isFinite(Date.parse(item.generatedAt)) || !Array.isArray(item.flyers) || !Array.isArray(item.offers)) throw new TypeError("Invalid weekly content");
  for (const raw of item.flyers) {
    const f=record(raw); keys(f,["id","title","language","validFrom","validTo","viewerUrl","pdfUrl","sourceUrl","coverUrl","pageCount","pdfSha256"]);
    if (!text(f.id)||!text(f.title)||!["de","nl"].includes(f.language as string)||!date(f.validFrom)||!date(f.validTo)||!pdf(f.pdfUrl)
      ||(f.validFrom as string)>(f.validTo as string)||f.viewerUrl!==f.pdfUrl||f.sourceUrl!==f.pdfUrl||!image(f.coverUrl,"content")||!hash(f.pdfSha256)||!Number.isInteger(f.pageCount)||(f.pageCount as number)<1||(f.pageCount as number)>60) throw new TypeError("Invalid flyer");
  }
  for (const raw of item.offers) {
    const o=record(raw); keys(o,["id","name","categorySlug","language","flyerId","validFrom","validTo","image","sourcePage","rect","pdfSha256","sourceUrl","conditions"],["sourceWarning"]);
    if (!text(o.id)||!text(o.name)||!text(o.categorySlug)||!text(o.flyerId)||!["de","nl"].includes(o.language as string)||!date(o.validFrom)||!date(o.validTo)
      ||!image(o.image,"offers")||!pdf(o.sourceUrl)||!hash(o.pdfSha256)||typeof o.conditions!=="string"||(o.sourceWarning!==undefined&&typeof o.sourceWarning!=="string")
      ||!Number.isInteger(o.sourcePage)||(o.sourcePage as number)<1||!Array.isArray(o.rect)||o.rect.length!==4||!o.rect.every(Number.isSafeInteger)||o.rect[0]<0||o.rect[1]<0||o.rect[2]<1||o.rect[3]<1) throw new TypeError("Invalid offer");
    if (!item.flyers.some(f=>f.id===o.flyerId&&f.language===o.language&&f.pdfSha256===o.pdfSha256&&f.pdfUrl===o.sourceUrl&&f.validFrom===o.validFrom&&f.validTo===o.validTo&&f.pageCount>=(o.sourcePage as number))) throw new TypeError("Unbound offer");
  }
  if (new Set(item.flyers.map(f=>f.id)).size!==item.flyers.length||new Set(item.offers.map(o=>o.id)).size!==item.offers.length) throw new TypeError("Duplicate content");
  return value as WeeklyOfferContent;
}
export function createOfferRefresh(request: (signal: AbortSignal)=>Promise<unknown>,publish: (value:WeeklyOfferContent|null)=>void) {
  let sequence=0; let controller:AbortController|undefined; let disposed=false;
  return {run:async()=>{
    if (disposed) return;
    const current=++sequence; controller?.abort(); controller=new AbortController();
    try { const next=parseWeeklyOfferContent(await request(controller.signal)); if (!disposed&&current===sequence) publish(next); }
    catch { if (!disposed&&current===sequence) publish(null); }
  }, dispose:()=>{disposed=true;++sequence;controller?.abort();}};
}
