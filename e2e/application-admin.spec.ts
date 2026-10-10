import { expect, test } from "./test-fixtures";
import type { Page, Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const path = "/bewerbung/verwaltung";
const time = new Date("2026-10-10T12:00:00.000Z");
const session = { authenticated: true, issuedAt: "2026-10-10T11:59:00.000Z", expiresAt: "2026-10-10T19:59:00.000Z" };
const login = { ...session, csrf: "A".repeat(43) };
const denied = { status: 401, value: { code: "AUTH_DENIED", error: "SERVER_PRIVATE_CANARY" } };
type Reply = { status?: number; value?: unknown; body?: string; contentType?: string; retry?: string; hold?: boolean; abort?: boolean };
function adminFixtureOrigin(configured: unknown): string {
  const target = typeof configured === "string" ? /^http:\/\/(?:localhost|127\.0\.0\.1):([1-9]\d{0,4})\/?$/.exec(configured) : null;
  if (!target || Number(target[1]) > 65535) throw new Error("ADMIN_TEST_EXPLICIT_HTTP_LOOPBACK_REQUIRED");
  return new URL(configured as string).origin;
}
async function service(page: Page, initial: Reply = denied) {
  const origin = adminFixtureOrigin(test.info().project.use.baseURL);
  const endpoints = new Set(["session", "login", "logout"].map(operation => `${origin}/api/bewerbungsverwaltung/${operation}`));
  const calls: { operation: string; method: string; body: string; headers: Record<string, string> }[] = [];
  const replies: Record<string, Reply[]> = { session: [initial], login: [], logout: [] };
  const pending: (() => void)[] = [];
  // Any unforeseen auth URL is aborted, never passed to a real backend.
  await page.route(url => url.pathname === "/api/bewerbungsverwaltung" || url.pathname.startsWith("/api/bewerbungsverwaltung/"), async route => { await route.abort(); expect(route.request().url(), "unallocated auth URL").toBe("never"); });
  await page.route(url => endpoints.has(url.href), async (route: Route) => {
    const request = route.request(), operation = new URL(request.url()).pathname.split("/").at(-1)!;
    calls.push({ operation, method: request.method(), body: request.postData() ?? "", headers: request.headers() });
    const result: Reply = replies[operation].shift() ?? (operation === "session" ? denied : operation === "login" ? { value: login } : { value: { loggedOut: true } });
    if (result.abort) return route.abort("failed");
    if (result.hold) await new Promise<void>(resolve => pending.push(resolve));
    await route.fulfill({ status: result.status ?? 200, contentType: result.contentType ?? "application/json", body: result.body ?? JSON.stringify(result.value), headers: result.retry ? { "Retry-After": result.retry } : {} }).catch(() => {});
  });
  return { origin, calls, replies, release() { pending.splice(0).forEach(resolve => resolve()); } };
}
async function open(page: Page) { await page.goto(path); await expect(page.getByRole("heading", { level: 1, name: "Bewerbungsverwaltung" })).toBeVisible(); }
async function draft(page: Page) {
  await page.getByLabel("Benutzername", { exact: true }).fill("synthetic-staff");
  await page.getByLabel("Passwort", { exact: true }).fill("SYNTHETIC_PASSWORD_CANARY");
  await page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true }).fill("123456");
}
test.beforeEach(async ({ page }) => { adminFixtureOrigin(test.info().project.use.baseURL); await page.clock.install({ time }); });

test("anonymous named login is deliberate, clears credentials immediately and shows only an auth session", async ({ page }) => {
  for (const invalid of [undefined, "http://remote.example.invalid:3107", "https://127.0.0.1:3107", "http://staff:password@127.0.0.1:3107", "http://127.0.0.1:3107?x=1", "http://127.0.0.1:3107#fragment", "http://127.0.0.1:3107/nested", "http://127.0.0.1", "http://127.0.0.1:0", "http://127.0.0.1:65536", "http://[::1]:3107"]) expect(() => adminFixtureOrigin(invalid)).toThrow("ADMIN_TEST_EXPLICIT_HTTP_LOOPBACK_REQUIRED");
  expect(page.url()).toBe("about:blank");
  const port = await service(page); port.replies.login.push({ value: login, hold: true });
  const messages: string[] = []; page.on("console", message => messages.push(message.text()));
  await open(page); await draft(page); expect(port.calls.map(call => call.operation)).toEqual(["session"]);
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toBeDisabled();
  port.release(); await expect(page.locator("#admin-status")).toContainText("Mitarbeitersitzung ist aktiv");
  await expect(page.locator("#admin-status")).toBeFocused();
  await expect(page.getByText("Fallbearbeitung ist in diesem Stand noch nicht verfügbar.", { exact: true })).toBeVisible();
  expect(port.calls.map(call => call.operation)).toEqual(["session", "login"]);
  expect(port.calls[1]).toMatchObject({ method: "POST", body: '{"username":"synthetic-staff","password":"SYNTHETIC_PASSWORD_CANARY","otp":"123456"}' });
  expect(port.calls[1].headers.authorization).toBeUndefined(); expect(port.calls[1].headers["x-application-admin-csrf"]).toBeUndefined();
  const persisted = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage), location.href, document.cookie, document.body.innerText, [...document.querySelectorAll("input")].map(input => input.value)]));
  expect(persisted + messages.join(" ")).not.toMatch(/SYNTHETIC_PASSWORD_CANARY|SERVER_PRIVATE_CANARY|AAAAAAA|123456|synthetic-staff/);
  await page.clock.runFor(60000); expect(port.calls).toHaveLength(2);
});

test("keyboard validation focuses associated errors, clears submitted secrets and sends no invalid login", async ({ page }) => {
  const port = await service(page); await open(page);
  const summary = page.getByRole("alert", { name: "Bitte prüfe deine Anmeldung" });
  await page.getByLabel("Benutzername", { exact: true }).fill("synthetic-staff");
  await expect(summary).toHaveCount(0);
  await page.getByLabel("Passwort", { exact: true }).fill("SYNTHETIC_PASSWORD_CANARY");
  await page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true }).fill("12ab");
  await expect(summary).toHaveCount(0);
  await expect(page.locator("#application-admin")).not.toContainText("Passwort und Code wurden geleert");
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue("SYNTHETIC_PASSWORD_CANARY");
  await expect(page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true })).toHaveValue("12ab");
  await page.getByLabel("Benutzername", { exact: true }).fill("");
  await page.getByRole("button", { name: "Anmelden", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(summary).toBeFocused(); await expect(summary.getByRole("link")).toHaveCount(2);
  await expect(summary).toContainText("Passwort und Code wurden geleert");
  await expect(page.getByLabel("Benutzername", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true })).toHaveAttribute("aria-describedby", /admin-otp-error/);
  await summary.getByRole("link", { name: /Benutzername/ }).click(); await expect(page.getByLabel("Benutzername", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue(""); await expect(page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true })).toHaveValue("");
  await page.getByLabel("Benutzername", { exact: true }).fill("synthetic-staff");
  await expect(summary.getByRole("link", { name: /Benutzername/ })).toHaveCount(0);
  await expect(summary.getByRole("link")).toHaveCount(1);
  await page.getByLabel("Passwort", { exact: true }).fill("SYNTHETIC_PASSWORD_CANARY");
  await expect(summary.getByRole("link", { name: /^Passwort:/ })).toHaveCount(0);
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue("SYNTHETIC_PASSWORD_CANARY");
  await page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true }).fill("123456");
  await expect(summary).toHaveCount(0);
  await expect(page.locator("#application-admin")).not.toContainText("Passwort und Code wurden geleert");
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue("SYNTHETIC_PASSWORD_CANARY");
  await expect(page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true })).toHaveValue("123456");
  expect(port.calls.map(call => call.operation)).toEqual(["session"]);
});

test("denied login clears secrets and exposes safe text without credential replay", async ({ page }) => {
  const port = await service(page); port.replies.login.push(denied); await open(page); await draft(page);
  await page.getByRole("button", { name: "Anmelden", exact: true }).click(); await expect(page.locator("#admin-status")).toContainText("Anmeldung nicht möglich");
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue(""); await expect(page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true })).toHaveValue("");
  await expect(page.locator("main")).not.toContainText("SERVER_PRIVATE_CANARY"); await page.clock.runFor(60000); expect(port.calls).toHaveLength(2);
});

test("fresh existing session remains locked without CSRF and explicit logout permits a new login", async ({ page }) => {
  const port = await service(page, { value: session }); await open(page);
  await expect(page.locator("#admin-status")).toContainText("vor einer neuen Anmeldung ausdrücklich beenden");
  await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toHaveCount(0); expect(port.calls).toHaveLength(1);
  await page.clock.runFor(60000); expect(port.calls).toHaveLength(1);
  await page.getByRole("button", { name: "Sitzung ausdrücklich beenden" }).click(); await expect(page.locator("#admin-status")).toContainText("Abmeldung serverseitig bestätigt");
  await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click(); await expect(page.locator("#admin-status")).toContainText("Mitarbeitersitzung ist aktiv");
  expect(port.calls.map(call => call.operation)).toEqual(["session", "logout", "login"]); expect(port.calls[1].body).toBe("{}");
});

test("a reload discards login CSRF and never claims a restored action-ready session", async ({ page }) => {
  const port = await service(page); await open(page); await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.locator("#admin-status")).toContainText("Mitarbeitersitzung ist aktiv"); port.replies.session.push({ value: session });
  await page.reload(); await expect(page.locator("#admin-status")).toContainText("vor einer neuen Anmeldung ausdrücklich beenden");
  await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toHaveCount(0); expect(port.calls.map(call => call.operation)).toEqual(["session", "login", "session"]);
});

for (const failed of [
  { status: 503, value: { code: "AUTH_LOGOUT_FAILED", error: "PRIVATE_LOGOUT_CANARY", retryAfterSeconds: 60 }, retry: "1" },
  { status: 503, body: "bad body", contentType: "text/html", retry: "3600" },
  { value: { loggedOut: "true" } }, { abort: true },
]) test(`unconfirmed logout keeps explicit revocation retry (${JSON.stringify(failed)})`, async ({ page }) => {
  const port = await service(page, { value: session }); port.replies.logout.push(failed); await open(page);
  // HTTP-only fixture: Chromium cannot seed the real Secure __Host cookie over
  // this HTTP dev origin. This ordinary fake cookie proves non-interference,
  // not production cookie provisioning or HTTPS/backend integration.
  await page.context().addCookies([{ name: "synthetic-admin-revocation", value: "SYNTHETIC_REVOCATION_HANDLE", url: port.origin, httpOnly: true, sameSite: "Strict" }]);
  await page.getByRole("button", { name: "Sitzung ausdrücklich beenden" }).click(); await expect(page.locator("#admin-status")).toContainText("Abmeldung nicht bestätigt");
  await expect(page.locator("main")).not.toContainText(session.expiresAt); await expect(page.locator("main")).not.toContainText("PRIVATE_LOGOUT_CANARY");
  await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toHaveCount(0);
  const retry = page.getByRole("button", { name: "Abmeldung erneut versuchen" });
  if (failed.status === 503) { await expect(retry).toBeDisabled(); await page.clock.runFor(61000); if (failed.retry === "3600") { await expect(retry).toBeDisabled(); await page.clock.fastForward(3541000); } }
  await expect(retry).toBeEnabled(); expect(port.calls.map(call => call.operation)).toEqual(["session", "logout"]);
  expect((await page.context().cookies()).find(cookie => cookie.name === "synthetic-admin-revocation")?.value).toBe("SYNTHETIC_REVOCATION_HANDLE");
  expect(port.calls[1].headers.cookie).toContain("synthetic-admin-revocation=SYNTHETIC_REVOCATION_HANDLE");
  await retry.click(); await expect(page.locator("#admin-status")).toContainText("Abmeldung serverseitig bestätigt"); await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toBeVisible();
  expect(port.calls.map(call => call.operation)).toEqual(["session", "logout", "logout"]);
});

for (const [index, failed] of ([{ value: { ...login, authenticated: "true" } }, { value: { ...login, csrf: "invalid" } }, { body: "x".repeat(8193) }, { abort: true }] satisfies Reply[]).entries()) test(`unknown login requires session check or logout, never replay (${index})`, async ({ page }) => {
  const port = await service(page); port.replies.login.push(failed); await open(page); await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.locator("#admin-status")).toContainText("Ausgang der Anmeldung ist unklar");
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveCount(0); await page.clock.runFor(60000); expect(port.calls).toHaveLength(2);
  port.replies.session.push({ value: session }); await page.getByRole("button", { name: "Sitzung erneut prüfen" }).click();
  await expect(page.locator("#admin-status")).toContainText("vor einer neuen Anmeldung ausdrücklich beenden");
  await page.getByRole("button", { name: "Sitzung ausdrücklich beenden" }).click(); await expect(page.locator("#admin-status")).toContainText("Abmeldung serverseitig bestätigt");
  expect(port.calls.map(call => call.operation)).toEqual(["session", "login", "session", "logout"]);
});

test("an uncertain login followed by denied session still retains the logout recovery path", async ({ page }) => {
  const port = await service(page); port.replies.login.push({ abort: true }); await open(page); await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.locator("#admin-status")).toContainText("Ausgang der Anmeldung ist unklar"); await page.getByRole("button", { name: "Sitzung erneut prüfen" }).click();
  await expect(page.locator("#admin-status")).toContainText("Keine aktive Sitzung bestätigt");
  await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Sitzung ausdrücklich beenden" }).click(); await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toBeVisible();
});

test("login and logout timeouts never establish success and dispose abort never replays", async ({ page }) => {
  const port = await service(page); port.replies.login.push({ value: login, hold: true }); await open(page); await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect.poll(() => port.calls.length).toBe(2); await page.clock.runFor(10000); await expect(page.locator("#admin-status")).toContainText("Ausgang der Anmeldung ist unklar"); port.release();
  port.replies.logout.push({ value: { loggedOut: true }, hold: true }); await page.getByRole("button", { name: "Sitzung ausdrücklich beenden" }).click(); await expect.poll(() => port.calls.length).toBe(3);
  await page.clock.runFor(10000); await expect(page.locator("#admin-status")).toContainText("Abmeldung nicht bestätigt"); port.release();
  await expect(page.getByRole("button", { name: "Abmeldung erneut versuchen" })).toBeEnabled();
  port.replies.logout.push({ value: { loggedOut: true }, hold: true }); await page.getByRole("button", { name: "Abmeldung erneut versuchen" }).click(); await expect.poll(() => port.calls.length).toBe(4);
  await page.goto("/datenschutz"); port.release(); await page.clock.runFor(60000); expect(port.calls).toHaveLength(4);
});

test("expired session removes visible session material without claiming cookie revocation", async ({ page }) => {
  const port = await service(page); port.replies.login.push({ value: { ...login, expiresAt: "2026-10-10T12:00:02.000Z" } }); await open(page); await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.locator("#admin-status")).toContainText("Mitarbeitersitzung ist aktiv"); await page.clock.runFor(2001);
  await expect(page.locator("#admin-status")).toContainText("Sitzungsanzeige abgelaufen"); await expect(page.locator("main")).not.toContainText("12:00:02");
  await expect(page.getByRole("button", { name: "Sitzung ausdrücklich beenden" })).toBeVisible(); expect(port.calls).toHaveLength(2);
});

test("session outage permits explicit recheck and malformed logout cannot permanently disable recovery", async ({ page }) => {
  const port = await service(page, { status: 503, body: "private", contentType: "text/html" }); await open(page);
  await expect(page.locator("#admin-status")).toContainText("Sitzung konnte nicht geprüft werden"); await expect(page.getByRole("button", { name: "Sitzung erneut prüfen" })).toBeDisabled();
  await page.clock.runFor(60001); await page.getByRole("button", { name: "Sitzung erneut prüfen" }).click(); await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toBeVisible(); expect(port.calls).toHaveLength(2);
});

test("login redirects are not followed and the unknown outcome offers deliberate recovery", async ({ page }) => {
  const port = await service(page); let redirected = 0;
  await page.route("https://untrusted.example.invalid/**", route => { redirected++; return route.abort(); });
  await page.route(url => url.href === `${port.origin}/api/bewerbungsverwaltung/login`, route => { port.calls.push({ operation: "login", method: route.request().method(), body: route.request().postData() ?? "", headers: route.request().headers() }); return route.fulfill({ status: 307, headers: { Location: "https://untrusted.example.invalid/private" } }); });
  await open(page); await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.locator("#admin-status")).toContainText("Ausgang der Anmeldung ist unklar"); expect(redirected).toBe(0); expect(port.calls).toHaveLength(2);
});

test("rate-limited login honors Retry-After and requires newly entered credentials for a deliberate retry", async ({ page }) => {
  const port = await service(page); port.replies.login.push({ status: 429, value: { code: "RATE_LIMITED", error: "PRIVATE", retryAfterSeconds: 60 }, retry: "120" });
  await open(page); await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click(); await expect(page.locator("#admin-status")).toContainText("Zu viele Anfragen");
  await page.clock.runFor(61000); await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toBeDisabled(); expect(port.calls).toHaveLength(2);
  await page.clock.runFor(60000); await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toBeEnabled(); await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click(); await expect(page.getByRole("alert", { name: "Bitte prüfe deine Anmeldung" })).toBeVisible(); expect(port.calls).toHaveLength(2);
  await draft(page); await page.getByRole("button", { name: "Anmelden", exact: true }).click(); await expect(page.locator("#admin-status")).toContainText("Mitarbeitersitzung ist aktiv"); expect(port.calls).toHaveLength(3);
});

for (const width of [320, 390, 1440]) test(`responsive keyboard auth surface at ${width}px has no overflow or axe violations`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await service(page); await open(page);
  const form = page.getByRole("form", { name: "Mitarbeiter-Anmeldung" }); await expect(form).toBeVisible();
  await page.getByLabel("Benutzername", { exact: true }).focus(); await page.keyboard.press("Tab"); await expect(page.getByLabel("Passwort", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByLabel("Authenticator-Code (6 Ziffern)", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: "Anmelden", exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const target of [page.getByRole("button", { name: "Anmelden", exact: true }), page.getByLabel("Passwort", { exact: true })]) { const box = await target.boundingBox(); expect(box?.height).toBeGreaterThanOrEqual(44); }
  expect((await new AxeBuilder({ page }).include("#application-admin").analyze()).violations).toEqual([]);
});
