import { expect, test } from "./test-fixtures";
import type { Page } from "@playwright/test";

const active = { enabled: true, mode: "enabled", limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 }, jobs: [{ id: "sales-fulltime", label: "Verkauf Vollzeit (m/w/d)" }, { id: "sales-parttime", label: "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)" }] };
const acceptance = { reference: "TJ-" + "A".repeat(24), state: "processing", statusToken: "A".repeat(43) };
async function service(page: Page, mode: unknown = active) {
  const uploads: { key: string; body: string; headers: Record<string,string> }[] = []; let sessions = 0, statusCalls = 0;
  const replies: { status: number; value: unknown; retry?: string }[] = [];
  const statuses: { status: number; value: unknown }[] = [];
  let currentConfig = mode;
  await page.route("**/api/bewerbung**", async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path.endsWith("/config")) return route.fulfill({ json: currentConfig });
    if (path.endsWith("/session")) { sessions++; return route.fulfill({ json: { formToken: "A".repeat(80) + "." + "A".repeat(43) } }); }
    if (path.endsWith("/status")) { statusCalls++; expect(request.headers().authorization).toBe(`Bearer ${acceptance.statusToken}`); const status=statuses.shift(); return route.fulfill(status ? {status:status.status,json:status.value} : { json: { reference: acceptance.reference, state: statusCalls > 1 ? "delivered" : "processing", acceptedAt: "2026-10-10T12:00:00.000Z" } }); }
    uploads.push({ key: request.headers()["idempotency-key"], body: request.postData() ?? "", headers:request.headers() });
    const reply = replies.shift() ?? { status: 202, value: acceptance };
    return route.fulfill({ status: reply.status, json: reply.value, headers: reply.retry ? { "Retry-After": reply.retry } : {} });
  });
  return { uploads, replies, statuses, setConfig(value:unknown){currentConfig=value;}, get sessions() { return sessions; }, get statusCalls() { return statusCalls; } };
}
async function draft(page: Page) {
  await page.getByLabel("Name *", { exact: true }).fill("SYNTHETIC_NAME_CANARY");
  await page.getByLabel("E-Mail *", { exact: true }).fill("synthetic-canary@example.invalid");
}
for (const contentType of ["text/html", "application/json"]) test(`unusable 503 ${contentType} preserves one-hour Retry-After and frozen attempt`, async ({ page }) => {
  await page.clock.install(); const port = await service(page);
  await page.route("**/api/bewerbung", async route => {
    port.uploads.push({ key: route.request().headers()["idempotency-key"], body: route.request().postData() ?? "", headers: route.request().headers() });
    await route.fulfill({ status: 503, contentType, body: "not-json", headers: { "Retry-After": "3600" } });
  });
  await page.goto("/bewerbung"); await draft(page); await page.getByRole("button", { name: "Bewerbung absenden", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("möglicherweise bereits angekommen");
  await page.clock.runFor(61000); await expect(page.getByRole("button", { name: "Denselben Versuch erneut senden" })).toBeDisabled();
  await expect(page.getByLabel("Name *", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Name *", { exact: true })).toHaveValue("SYNTHETIC_NAME_CANARY");
  await page.clock.fastForward(3601000); await expect(page.getByRole("button", { name: "Denselben Versuch erneut senden" })).toBeDisabled();
  expect(port.uploads).toHaveLength(1); expect(port.uploads[0].key).toMatch(/^[0-9a-f-]{36}$/);
});
test("array-valued config stays email-only and array status cannot stop processing", async ({ page }) => {
  await page.clock.install(); const port = await service(page, { ...active, mode: ["disabled"] });
  await page.goto("/bewerbung"); await expect(page.getByLabel("Name *", { exact: true })).toHaveCount(0); expect(port.sessions).toBe(0);
  port.setConfig(active); await page.clock.runFor(6000); await page.getByRole("button", { name: "Upload-Verfügbarkeit prüfen" }).click(); await draft(page);
  port.statuses.push({ status: 200, value: { reference: acceptance.reference, state: ["processing"], acceptedAt: "2026-10-10T12:00:00.000Z" } }, { status: 200, value: { reference: acceptance.reference, state: "delivered", acceptedAt: "2026-10-10T12:00:00.000Z" } });
  await page.getByRole("button", { name: "Bewerbung absenden", exact: true }).click(); await expect(page.getByRole("status")).toContainText("Eingang gespeichert");
  await page.clock.runFor(3000); await expect.poll(() => port.statusCalls).toBe(1); await expect(page.getByRole("status")).toContainText("Eingang gespeichert");
  await expect(page.getByRole("button", { name: "Statusprüfung anhalten" })).toBeVisible();
  await page.clock.runFor(5000); await expect(page.getByRole("status")).toContainText("An das Marktpostfach übermittelt"); expect(port.uploads).toHaveLength(1);
});
test("keyboard cards focus the form and invalid submit exposes associated errors with a focusable summary", async ({ page }) => {
  const port = await service(page); await page.goto("/bewerbung");
  for (const role of ["Teilzeit", "Vollzeit"]) {
    await page.getByRole("button", { name: `Für ${role} bewerben` }).focus(); await page.keyboard.press("Enter");
    await expect(page.getByLabel("Name *", { exact: true })).toBeFocused();
    await expect(page.getByRole("radio", { name: role === "Teilzeit" ? "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)" : "Verkauf Vollzeit (m/w/d)", exact: true })).toBeChecked();
  }
  await page.getByRole("button", { name: "Bewerbung absenden", exact: true }).click();
  const summary = page.getByRole("alert", { name: "Bitte prüfe deine Eingaben" }); await expect(summary).toBeFocused();
  await expect(summary).toContainText("Name"); await expect(summary).toContainText("E-Mail");
  for (const [label, id] of [["Name *", "application-name-error"], ["E-Mail *", "application-email-error"]]) {
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute("aria-describedby", id); await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await summary.getByRole("link", { name: /Name/ }).click(); await expect(page.getByLabel("Name *", { exact: true })).toBeFocused();
  await page.getByLabel("Name *", { exact: true }).fill("synthetic"); await expect(page.getByLabel("Name *", { exact: true })).toBeFocused();
  await page.getByLabel("E-Mail *", { exact: true }).fill("invalid"); await expect(page.getByLabel("E-Mail *", { exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Bewerbung absenden", exact: true }).click(); await expect(summary).toBeFocused(); await expect(page.locator("#application-email-error")).toContainText("gültige");
  await page.getByLabel("Unterlagen / Portrait (freiwillig)").setInputFiles([{ name: "x.svg", mimeType: "image/svg+xml", buffer: Buffer.from("synthetic") }]);
  await expect(page.getByLabel("Unterlagen / Portrait (freiwillig)")).toHaveAttribute("aria-describedby", /application-files-error/);
  await expect(page.locator("#application-files-error")).toContainText("PDF"); expect(port.sessions).toBe(0); expect(port.uploads).toHaveLength(0);
});
test("selection visibly discloses technical copies, signature limits, no AI/editing and whole-package output failure", async ({ page }) => {
  await service(page); await page.goto("/bewerbung"); await expect(page.getByLabel("Name *", { exact: true })).toBeVisible();
  for (const text of ["technisch aufbereitete Kopien", "digitale Signaturfunktionen", "nur als Bildpunkte", "Digitale Unterschriften werden nicht verifiziert", "keine Echtheitsbestätigung", "keine Inhalte redaktionell", "keine KI", "bewahre deine Originale", "Auch kleine Eingangsdateien", "gesamte Bewerbung", "Ausgaben höchstens 5 MiB je Datei und 10 MiB insgesamt"]) await expect(page.getByText(text, { exact: false })).toBeVisible();
});
test("disabled runtime stays email-only and never bootstraps a session", async ({ page }) => {
  const port = await service(page, { ...active, enabled: false, mode: "disabled" });
  await page.goto("/bewerbung");
  await expect(page.getByText("Der Online-Upload ist zurzeit nicht verfügbar.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Name *", { exact: true })).toHaveCount(0);
  expect(port.sessions).toBe(0); expect(port.uploads).toEqual([]);
});

test("existing authorized pilot is clearly TEST and uses only the reviewed synthetic marker",async({page})=>{
  const port=await service(page,{...active,mode:"pilot"});await page.goto("/bewerbung");await draft(page);
  await expect(page.getByRole("form",{name:"TEST-Bewerbung"})).toBeVisible();
  await expect(page.getByText("TEST – nur synthetische Testdaten, keine echte Bewerbung.")).toBeVisible();
  await page.getByRole("button",{name:"TEST-Bewerbung absenden",exact:true}).click();await expect(page.getByRole("status")).toContainText("Eingang gespeichert");
  expect(port.uploads[0].headers["x-application-synthetic"]).toBe("1");
});
test("403 requires deliberate same-key retry with a fresh session, never automatic refresh upload",async({page})=>{
  await page.clock.install();const port=await service(page);port.replies.push({status:403,value:{code:"FORBIDDEN",error:"PRIVATE"},retry:"1"});
  await page.context().addCookies([{name:"synthetic-anonymous",value:"same-identity",url:"http://127.0.0.1:3000",httpOnly:true,sameSite:"Strict"}]);
  await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();await expect(page.getByRole("status")).toContainText("Sitzung konnte nicht bestätigt werden");
  expect(port.sessions).toBe(1);await page.clock.runFor(2000);expect(port.uploads).toHaveLength(1);
  await page.getByRole("button",{name:"Denselben Versuch erneut senden"}).click();await expect(page.getByRole("status")).toContainText("Eingang gespeichert");
  expect(port.sessions).toBe(2);expect(port.uploads[0].key).toBe(port.uploads[1].key);
  expect(port.uploads.every(upload=>upload.headers.cookie?.includes("synthetic-anonymous=same-identity"))).toBe(true);
});
test("a hidden monitor retains its elapsed fifteen-minute deadline and makes no catch-up request",async({page})=>{
  await page.clock.install();const port=await service(page);await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();await expect(page.getByRole("status")).toContainText("Eingang gespeichert");
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));});
  await page.clock.fastForward(900001);await expect(page.getByRole("status")).toContainText("Statusprüfung ist beendet");
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:false});document.dispatchEvent(new Event("visibilitychange"));});
  expect(port.statusCalls).toBe(0);expect(port.uploads).toHaveLength(1);
});
test("status requests never overlap, and unmount/reload never resends the accepted application",async({page})=>{
  await page.clock.install();const port=await service(page);let checks=0,release:()=>void=()=>{};
  await page.route("**/api/bewerbung/status",async route=>{checks++;await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({json:{reference:acceptance.reference,state:"processing",acceptedAt:"2026-10-10T12:00:00.000Z"}}).catch(()=>{});});
  await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();await expect(page.getByRole("status")).toContainText("Eingang gespeichert");
  await page.clock.runFor(2000);await expect.poll(()=>checks).toBe(1);await page.clock.runFor(8000);expect(checks).toBe(1);
  release();await page.reload();await expect(page.getByLabel("Name *",{exact:true})).toHaveValue("");await expect(page.getByRole("status")).not.toContainText(acceptance.reference);
  await page.clock.runFor(60000);expect(port.uploads).toHaveLength(1);expect(port.sessions).toBe(1);
});

test("invalid runtime configuration remains fallback, and fresh readiness loss preserves draft without transmission",async({page})=>{
  const port=await service(page,{...active,secret:"PRIVATE_CONFIG_CANARY"});await page.goto("/bewerbung");
  await expect(page.getByLabel("Name *",{exact:true})).toHaveCount(0);expect(port.sessions).toBe(0);
  port.setConfig(active);await page.getByRole("button",{name:"Upload-Verfügbarkeit prüfen"}).click();await draft(page);
  port.setConfig({...active,enabled:false});await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();
  await expect(page.getByLabel("Name *",{exact:true})).toHaveValue("SYNTHETIC_NAME_CANARY");
  await expect(page.getByRole("button",{name:"Bewerbung absenden",exact:true})).toBeDisabled();expect(port.uploads).toEqual([]);expect(port.sessions).toBe(0);
});
test("upload redirect is not followed and remains ambiguous, never a stored receipt",async({page})=>{
  await service(page);let redirected=0;
  await page.route("**/api/redirect-private",route=>{redirected++;return route.fulfill({status:202,json:acceptance});});
  await page.route("**/api/bewerbung",route=>route.fulfill({status:307,headers:{Location:"/api/redirect-private"}}));
  await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("möglicherweise bereits angekommen");
  await expect(page.getByRole("status")).not.toContainText("Eingang gespeichert");expect(redirected).toBe(0);
});
test("manual retries honor long delays and stop after three identical attempts, never auto-send",async({page})=>{
  await page.clock.install();const port=await service(page);
  port.replies.push(...Array.from({length:3},()=>({status:429,value:{code:"RATE_LIMITED",error:"PRIVATE"},retry:"60"})));
  await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("möglicherweise");
  for(let count=1;count<3;count++){await page.clock.runFor(61000);expect(port.uploads).toHaveLength(count);await page.getByRole("button",{name:"Denselben Versuch erneut senden"}).click();await expect.poll(()=>port.uploads.length).toBe(count+1);await expect(page.getByRole("status")).toContainText("möglicherweise");}
  await page.clock.runFor(900000);await expect(page.getByRole("button",{name:"Denselben Versuch erneut senden"})).toBeDisabled();
  expect(new Set(port.uploads.map(item=>item.key)).size).toBe(1);expect(port.uploads).toHaveLength(3);
});
test("malformed status cannot imply delivery and authorization loss stops polling",async({page})=>{
  await page.clock.install();const port=await service(page);
  port.statuses.push({status:200,value:{reference:acceptance.reference,state:"delivered",acceptedAt:"2026-10-10T12:00:00.000Z",private:"CANARY"}},{status:403,value:{error:"PRIVATE"}});
  await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();await expect(page.getByRole("status")).toContainText("Eingang gespeichert");
  await page.clock.runFor(2000);await expect.poll(()=>port.statusCalls).toBe(1);await expect(page.getByRole("status")).not.toContainText("An das Marktpostfach übermittelt");
  await page.clock.runFor(4000);await expect(page.getByRole("status")).toContainText("Statusnachweis ist nicht mehr verfügbar");
  await page.clock.runFor(900000);expect(port.statusCalls).toBe(2);expect(port.uploads).toHaveLength(1);
});
test("polling pauses while hidden without a catch-up burst, and explicit stop/check-again is bounded",async({page})=>{
  await page.clock.install();const port=await service(page);port.statuses.push(...Array.from({length:35},()=>({status:200,value:{reference:acceptance.reference,state:"processing",acceptedAt:"2026-10-10T12:00:00.000Z"}})));
  await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();await expect(page.getByRole("status")).toContainText("Eingang gespeichert");
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));});
  await page.clock.runFor(100000);expect(port.statusCalls).toBe(0);
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:false});document.dispatchEvent(new Event("visibilitychange"));});
  await expect.poll(()=>port.statusCalls).toBe(1);expect(port.statusCalls).toBe(1);
  await page.getByRole("button",{name:"Statusprüfung anhalten"}).click();await expect(page.getByRole("button",{name:"Status erneut prüfen"})).toBeDisabled();
  await page.clock.runFor(31000);expect(port.statusCalls).toBe(1);await page.getByRole("button",{name:"Status erneut prüfen"}).click();
  for(let call=2;call<=31;call++){await page.clock.runFor(1000+(call===2?2000:call===3?4000:call===4?8000:call===5?16000:30000));await expect.poll(()=>port.statusCalls).toBe(call);}
  await page.clock.runFor(30000);await expect(page.getByRole("button",{name:"Statusprüfung anhalten"})).toHaveCount(0);await expect(page.getByRole("button",{name:"Status erneut prüfen"})).toHaveCount(0);
  expect(port.statusCalls).toBe(31);expect(port.uploads).toHaveLength(1);
});
test("enables only validated runtime config and exposes optional bounded files with individual removal", async ({ page }) => {
  await service(page); await page.goto("/bewerbung");
  await draft(page);
  await page.getByRole("button",{name:"Für Teilzeit bewerben"}).click();
  await expect(page.getByRole("radio",{name:"Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)"})).toBeChecked();
  await expect(page.getByLabel("Unterlagen / Portrait (freiwillig)")).not.toHaveAttribute("required");
  await page.getByLabel("Unterlagen / Portrait (freiwillig)").setInputFiles([{ name: "synthetic.pdf", mimeType: "application/pdf", buffer: Buffer.from("synthetic") }]);
  await expect(page.getByRole("button", { name: "Datei 1 entfernen" })).toBeVisible();
  await page.getByRole("button", { name: "Datei 1 entfernen" }).click();
  await expect(page.getByRole("button", { name: "Datei 1 entfernen" })).toHaveCount(0);
  await expect(page.getByText(/Textsuche.*Links.*digitale Signaturfunktionen/)).toBeVisible();
  await page.getByLabel("Unterlagen / Portrait (freiwillig)").setInputFiles([{ name: "synthetic.svg", mimeType: "image/svg+xml", buffer: Buffer.from("synthetic") }]);
  await expect(page.locator("main").getByRole("alert")).toContainText("PDF");
});

test("65-second upload timeout and deliberate cancellation retain the same ambiguous attempt",async({page})=>{
  await page.clock.install();await service(page);
  let release:()=>void=()=>{},uploads=0;
  await page.route("**/api/bewerbung",async route=>{uploads++;await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({status:202,json:acceptance}).catch(()=>{});});
  await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();
  await expect(page.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  await expect(page.getByRole("progressbar")).toContainText("Dateien werden übertragen");
  await page.clock.runFor(65000);await expect(page.getByRole("status")).toContainText("möglicherweise bereits angekommen");release();
  await expect(page.getByLabel("Name *",{exact:true})).toBeDisabled();
  await page.clock.runFor(61000);await page.getByRole("button",{name:"Denselben Versuch erneut senden"}).click();await expect(page.getByRole("progressbar")).toBeVisible();
  await page.getByRole("button",{name:"Vorgang abbrechen"}).click();await expect(page.getByRole("status")).toContainText("möglicherweise bereits angekommen");release();
  expect(uploads).toBe(2);await expect(page.getByRole("status")).not.toContainText("Eingang gespeichert");
});
test("Retry-After beyond the absolute retry horizon disables repeat rather than shortening the wait",async({page})=>{
  await page.clock.install();const port=await service(page);port.replies.push({status:409,value:{code:"UPLOAD_IN_PROGRESS",error:"PRIVATE"},retry:"3600"});
  await page.goto("/bewerbung");await draft(page);await page.getByRole("button",{name:"Bewerbung absenden",exact:true}).click();await expect(page.getByRole("status")).toContainText("möglicherweise");
  await page.clock.fastForward(3601000);await expect(page.getByRole("button",{name:"Denselben Versuch erneut senden"})).toBeDisabled();expect(port.uploads).toHaveLength(1);
});
test("ambiguous response retains immutable same-key manual retry then releases content after actual acceptance", async ({ page }) => {
  await page.clock.install(); const port = await service(page);
  port.replies.push({ status: 503, value: { error: "SERVER_PRIVATE_CANARY", code: "WORKER_UNAVAILABLE" }, retry: "60" });
  const messages: string[] = []; page.on("console", message => messages.push(message.text()));
  await page.goto("/bewerbung"); await draft(page);
  await page.getByRole("button", { name: "Bewerbung absenden", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("möglicherweise bereits angekommen");
  await expect(page.getByLabel("Name *", { exact: true })).toHaveValue("SYNTHETIC_NAME_CANARY");
  await expect(page.getByLabel("Name *", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Denselben Versuch erneut senden" })).toBeDisabled();
  await page.clock.runFor(61000);
  await page.getByRole("button", { name: "Denselben Versuch erneut senden" }).click();
  await expect(page.getByRole("status")).toContainText("Eingang gespeichert, Prüfung läuft");
  expect(port.uploads).toHaveLength(2); expect(port.uploads[0].key).toBe(port.uploads[1].key);
  expect(port.uploads[0].body).toContain("SYNTHETIC_NAME_CANARY"); expect(port.uploads[1].body).toContain("SYNTHETIC_NAME_CANARY");
  await expect(page.getByLabel("Name *", { exact: true })).toHaveCount(0);
  await page.clock.runFor(2000); await expect.poll(() => port.statusCalls).toBe(1);
  await page.clock.runFor(4000); await expect(page.getByRole("status")).toContainText("An das Marktpostfach übermittelt");
  const storage = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage), location.href]));
  expect(storage).not.toMatch(/SYNTHETIC_NAME|synthetic-canary|TJ-AAAA|AAAAAAA/);
  expect(messages.join(" ")).not.toMatch(/SYNTHETIC_NAME|synthetic-canary|SERVER_PRIVATE|AAAAAAA/);
});
test("definite validation rejection requires explicit failed-attempt discard and preserves the draft", async ({ page }) => {
  const port = await service(page); port.replies.push({ status: 400, value: { error: "PRIVATE", code: "INVALID_REQUEST" } });
  await page.goto("/bewerbung"); await draft(page); await page.getByRole("button", { name: "Bewerbung absenden", exact: true }).click();
  await page.getByRole("button", { name: "Fehlgeschlagenen Versuch verwerfen und korrigieren" }).click();
  await expect(page.getByLabel("Name *", { exact: true })).toHaveValue("SYNTHETIC_NAME_CANARY");
  await expect(page.getByLabel("Name *", { exact: true })).toBeEnabled();
  expect(port.uploads).toHaveLength(1);
});
test("a conflict never rotates the key or offers blind retry and a new ambiguous application needs duplicate-risk acknowledgment", async ({ page }) => {
  const port = await service(page); port.replies.push({ status: 409, value: { error: "PRIVATE", code: "IDEMPOTENCY_CONFLICT" } });
  await page.goto("/bewerbung"); await draft(page); await page.getByRole("button", { name: "Bewerbung absenden", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Markt");
  await expect(page.getByRole("button", { name: "Denselben Versuch erneut senden" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Neue Bewerbung beginnen" })).toBeDisabled();
  await page.getByLabel("Ich verstehe, dass eine neue Bewerbung eine doppelte Bewerbung verursachen kann.").check();
  await page.getByRole("button", { name: "Neue Bewerbung beginnen" }).click();
  await expect(page.getByLabel("Name *", { exact: true })).toHaveValue("");
  expect(port.uploads).toHaveLength(1);
});
