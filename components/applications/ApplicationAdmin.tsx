"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { getApplicationAdminSession, loginApplicationAdmin, logoutApplicationAdmin, type AdminFailureCode, type AdminSession } from "@/lib/applications-admin-client";

type Mode = "loading" | "anonymous" | "active" | "existing" | "recovery" | "unavailable";
type Field = "username" | "password" | "otp";
const fieldNames: Record<Field, string> = { username: "Benutzername", password: "Passwort", otp: "Authenticator-Code" };
const fieldClass = "block w-full min-h-12 mt-2 rounded-lg border border-[var(--cinematic-color-line)] bg-white px-3 py-3 text-[var(--cinematic-color-ink)] disabled:opacity-60";
const buttonClass = "min-h-12 rounded-lg px-5 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed";
const safeLoginMessages: Partial<Record<AdminFailureCode, string>> = {
  AUTH_DENIED: "Anmeldung nicht möglich. Bitte prüfe Benutzername, Passwort und den aktuellen Authenticator-Code.",
  INVALID_REQUEST: "Die Anmeldung wurde abgewiesen. Bitte prüfe deine Eingaben.",
  PAYLOAD_TOO_LARGE: "Die Anmeldung wurde abgewiesen. Bitte verwende kürzere Eingaben.",
  RATE_LIMITED: "Zu viele Anfragen. Bitte warte vor einer neuen, bewussten Anmeldung.",
};

export default function ApplicationAdmin() {
  const [mode, setMode] = useState<Mode>("loading");
  const [busy, setBusy] = useState<"session" | "login" | "logout" | null>("session");
  const [message, setMessage] = useState("Mitarbeitersitzung wird geprüft.");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [validationRun, setValidationRun] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [logoutRetry, setLogoutRetry] = useState(false);
  const username = useRef<HTMLInputElement>(null), password = useRef<HTMLInputElement>(null), otp = useRef<HTMLInputElement>(null);
  const status = useRef<HTMLDivElement>(null), errorSummary = useRef<HTMLDivElement>(null);
  const mounted = useRef(false), generation = useRef(0), pending = useRef<AbortController | null>(null);
  const csrf = useRef<string | null>(null), recoveryRequired = useRef(false), notBefore = useRef(0);

  const clearFieldError = (field: Field) => setErrors(previous => {
    if (!Object.hasOwn(previous, field)) return previous;
    const next = { ...previous }; delete next[field]; return next;
  });
  const clearSecrets = useCallback(() => {
    if (password.current) password.current.value = "";
    if (otp.current) otp.current.value = "";
  }, []);
  const clearInputs = useCallback(() => {
    clearSecrets(); if (username.current) username.current.value = "";
  }, [clearSecrets]);
  const clearPrivate = useCallback(() => {
    clearInputs(); csrf.current = null; setSession(null);
  }, [clearInputs]);
  const announce = useCallback((text: string) => { setMessage(text); status.current?.focus(); }, []);
  const delay = useCallback((milliseconds: number) => {
    if (milliseconds <= 0) return;
    notBefore.current = Math.max(notBefore.current, performance.now() + milliseconds); setWaiting(true);
  }, []);
  const begin = useCallback((operation: "session" | "login" | "logout") => {
    if (!mounted.current || pending.current || performance.now() < notBefore.current) return null;
    const controller = new AbortController(); pending.current = controller; setBusy(operation);
    return { controller, at: generation.current };
  }, []);
  const live = useCallback((at: number) => mounted.current && generation.current === at, []);
  const end = useCallback((controller: AbortController, at: number) => {
    if (live(at)) { if (pending.current === controller) pending.current = null; setBusy(null); }
  }, [live]);

  const checkSession = useCallback(async () => {
    const operation = begin("session"); if (!operation) return;
    const { controller, at } = operation;
    clearPrivate(); setErrors({}); setMode("loading"); setMessage("Mitarbeitersitzung wird geprüft.");
    try {
      const result = await getApplicationAdminSession(controller.signal); if (!live(at)) return;
      if (result.kind === "success") {
        recoveryRequired.current = true; setSession(result.data); setMode("existing");
        announce("Eine Mitarbeitersitzung besteht bereits. Der Sicherheitsnachweis ist nach einer Neuladung nicht verfügbar. Bitte die Sitzung vor einer neuen Anmeldung ausdrücklich beenden.");
      } else {
        delay(result.retryAfterMs);
        if (result.code === "AUTH_DENIED") {
          setMode(recoveryRequired.current ? "recovery" : "anonymous");
          announce(recoveryRequired.current ? "Keine aktive Sitzung bestätigt. Dies bestätigt keine Abmeldung. Bitte den verbliebenen Sitzungszugang ausdrücklich beenden, bevor du dich neu anmeldest." : "Keine aktive Mitarbeitersitzung. Bitte melde dich mit deinem benannten Zugang an.");
        } else {
          setMode("unavailable"); announce("Die Sitzung konnte nicht geprüft werden. Bitte erneut prüfen oder ausdrücklich beenden; eine neue Anmeldung ist bis dahin gesperrt.");
        }
      }
    } finally { end(controller, at); }
  }, [announce, begin, clearPrivate, delay, end, live]);

  useEffect(() => {
    mounted.current = true; const at = ++generation.current;
    // Strict Mode can dispose the first effect before replaying it. Do not
    // start a request for that disposed generation or duplicate its check.
    queueMicrotask(() => { if (mounted.current && generation.current === at) void checkSession(); });
    return () => {
      mounted.current = false; generation.current = at + 1; pending.current?.abort(); pending.current = null;
      csrf.current = null; recoveryRequired.current = false; notBefore.current = 0;
      clearInputs();
    };
  }, [checkSession, clearInputs]);
  useEffect(() => { if (validationRun) errorSummary.current?.focus(); }, [validationRun]);
  useEffect(() => {
    if (!waiting) return;
    let timer: number;
    const check = () => {
      const remaining = notBefore.current - performance.now();
      if (remaining <= 0) { notBefore.current = 0; setWaiting(false); }
      else timer = window.setTimeout(check, Math.min(remaining, 2147483647));
    };
    check(); return () => clearTimeout(timer);
  }, [waiting]);
  useEffect(() => {
    if (!session) return;
    const deadline = performance.now() + Math.max(0, Date.parse(session.expiresAt) - Date.now());
    let timer: number;
    const check = () => {
      const remaining = Math.min(deadline - performance.now(), Date.parse(session.expiresAt) - Date.now());
      if (remaining <= 0) {
        clearPrivate(); recoveryRequired.current = true; setMode("recovery");
        announce("Sitzungsanzeige abgelaufen. Dies bestätigt keine Abmeldung. Bitte Sitzung erneut prüfen oder ausdrücklich beenden.");
      } else { clearTimeout(timer); timer = window.setTimeout(check, Math.min(remaining, 2147483647)); }
    };
    const visible = () => { if (!document.hidden) check(); };
    check(); window.addEventListener("focus", check); document.addEventListener("visibilitychange", visible);
    return () => { clearTimeout(timer); window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", visible); };
  }, [announce, clearPrivate, session]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode !== "anonymous" || pending.current || performance.now() < notBefore.current) return;
    const input = { username: username.current?.value ?? "", password: password.current?.value ?? "", otp: otp.current?.value ?? "" };
    // Visible secrets clear synchronously, including local validation failures.
    clearSecrets();
    const encoder = new TextEncoder();
    const invalid: Partial<Record<Field, string>> = {};
    if (!input.username.trim() || input.username.length > 64 || encoder.encode(input.username).byteLength > 256) invalid.username = "Bitte gib deinen benannten Benutzerzugang an (höchstens 64 Zeichen).";
    if (!input.password || input.password.length > 256 || encoder.encode(input.password).byteLength > 512) invalid.password = "Bitte gib dein Passwort an (höchstens 256 Zeichen).";
    if (!/^\d{6}$/.test(input.otp)) invalid.otp = "Bitte gib genau sechs Ziffern aus deiner Authenticator-App an.";
    setErrors(invalid);
    if (Object.keys(invalid).length) { setValidationRun(value => value + 1); return; }
    const operation = begin("login"); if (!operation) return;
    const { controller, at } = operation; setMessage("Anmeldung wird geprüft.");
    try {
      const result = await loginApplicationAdmin(input, controller.signal); if (!live(at)) return;
      clearSecrets();
      if (result.kind === "success") {
        csrf.current = result.data.csrf; recoveryRequired.current = true; setLogoutRetry(false);
        setSession({ authenticated: true, issuedAt: result.data.issuedAt, expiresAt: result.data.expiresAt });
        if (username.current) username.current.value = "";
        setMode("active"); announce("Die benannte Mitarbeitersitzung ist aktiv. Dies bestätigt nur die Anmeldung, keinen Zugriff auf Bewerbungsfälle.");
      } else {
        delay(result.retryAfterMs);
        const safe = safeLoginMessages[result.code];
        if (safe) { setMode("anonymous"); announce(safe); }
        else {
          clearPrivate(); recoveryRequired.current = true; setMode("recovery");
          announce(result.code === "FORBIDDEN" ? "Anmeldung nicht erlaubt. Ein vorhandener Sitzungszugang muss ausdrücklich beendet werden. Bitte Sitzung erneut prüfen oder beenden." : "Der Ausgang der Anmeldung ist unklar. Zugangsdaten werden nicht erneut gesendet. Bitte Sitzung erneut prüfen oder ausdrücklich beenden, bevor du dich neu anmeldest.");
        }
      }
    } finally { if (live(at)) clearSecrets(); end(controller, at); }
  };
  const logout = async () => {
    const operation = begin("logout"); if (!operation) return;
    const { controller, at } = operation;
    // Do not touch the browser's cookie: it is the server revocation-retry handle.
    clearPrivate(); setErrors({}); recoveryRequired.current = true; setMode("recovery"); setMessage("Abmeldung wird serverseitig geprüft.");
    try {
      const result = await logoutApplicationAdmin(controller.signal); if (!live(at)) return;
      if (result.kind === "success") {
        recoveryRequired.current = false; setLogoutRetry(false); setMode("anonymous");
        announce("Abmeldung serverseitig bestätigt. Du kannst dich jetzt neu anmelden.");
      } else {
        delay(result.retryAfterMs); setLogoutRetry(true); setMode("recovery");
        announce("Abmeldung nicht bestätigt. Sichtbare Sitzungsdaten wurden entfernt; der Browserzugang bleibt für einen bewussten Abmeldeversuch erhalten. Bitte erneut versuchen oder den Verantwortlichen kontaktieren.");
      }
    } finally { end(controller, at); }
  };
  const locked = busy !== null || waiting;
  const recovery = mode === "existing" || mode === "recovery" || mode === "unavailable";
  const inputs = { username, password, otp };
  return <section id="application-admin" aria-label="Geschützte Mitarbeiter-Anmeldung" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16 text-[var(--cinematic-color-ink)]">
    <p className="text-sm font-bold uppercase tracking-wide text-[var(--cinematic-color-burgundy)]">Jammers · Mitarbeiterbereich</p>
    <h1 className="mt-3 text-3xl sm:text-4xl font-bold break-words">Bewerbungsverwaltung</h1>
    <p className="mt-4 max-w-prose">Nur für benannte, berechtigte Mitarbeitende. Dieser Bereich ist kein Webmail-Postfach.</p>
    <div className="mt-8 rounded-2xl border border-[var(--cinematic-color-line)] bg-[var(--cinematic-color-surface)] p-4 sm:p-8">
      <h2 className="text-2xl font-bold">{mode === "active" ? "Mitarbeitersitzung" : "Geschützte Anmeldung"}</h2>
      <div id="admin-status" ref={status} role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} className="my-5 rounded-lg bg-[var(--cinematic-color-warm)] p-4 break-words focus:outline-2 focus:outline-[var(--cinematic-color-blue)] focus:outline-offset-2">
        <p>{message}</p>
      </div>
      {waiting && <p className="my-4 text-sm">Eine serverseitige Wartefrist läuft. Danach kannst du den nächsten Schritt selbst auslösen; es erfolgt keine automatische Wiederholung.</p>}
      {mode === "anonymous" && <form noValidate autoComplete="off" onSubmit={event => void submit(event)} aria-label="Mitarbeiter-Anmeldung">
        {Object.keys(errors).length > 0 && <div ref={errorSummary} role="alert" aria-label="Bitte prüfe deine Anmeldung" tabIndex={-1} className="my-5 rounded-lg border border-[var(--cinematic-color-burgundy)] p-4">
          <p className="font-semibold">Bitte prüfe deine Anmeldung. Passwort und Code wurden geleert.</p>
          <ul className="list-disc pl-5">{(Object.keys(errors) as Field[]).map(field => <li key={field}><a className="inline-flex min-h-11 items-center underline" href={`#admin-${field}`} onClick={event => { event.preventDefault(); inputs[field].current?.focus(); }}>{fieldNames[field]}: {errors[field]}</a></li>)}</ul>
        </div>}
        <fieldset disabled={locked} className="space-y-5">
          <legend className="sr-only">Benannter Mitarbeiterzugang</legend>
          <div><label htmlFor="admin-username" className="font-semibold">Benutzername</label><input id="admin-username" name="username" ref={username} type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={64} className={fieldClass} aria-invalid={!!errors.username} aria-describedby={errors.username ? "admin-username-error" : undefined} onChange={() => clearFieldError("username")} />{errors.username && <p id="admin-username-error" className="mt-2 text-sm text-[var(--cinematic-color-burgundy)]">{errors.username}</p>}</div>
          <div><label htmlFor="admin-password" className="font-semibold">Passwort</label><input id="admin-password" name="password" ref={password} type="password" autoComplete="off" required maxLength={256} className={fieldClass} aria-invalid={!!errors.password} aria-describedby={errors.password ? "admin-password-error" : undefined} onChange={() => clearFieldError("password")} />{errors.password && <p id="admin-password-error" className="mt-2 text-sm text-[var(--cinematic-color-burgundy)]">{errors.password}</p>}</div>
          <div><label htmlFor="admin-otp" className="font-semibold">Authenticator-Code (6 Ziffern)</label><input id="admin-otp" name="otp" ref={otp} type="password" inputMode="numeric" autoComplete="off" required maxLength={6} pattern="[0-9]{6}" className={fieldClass} aria-invalid={!!errors.otp} aria-describedby={`admin-otp-help${errors.otp ? " admin-otp-error" : ""}`} onChange={() => clearFieldError("otp")} /><p id="admin-otp-help" className="mt-2 text-sm">Aktueller Code aus deiner Authenticator-App.</p>{errors.otp && <p id="admin-otp-error" className="mt-2 text-sm text-[var(--cinematic-color-burgundy)]">{errors.otp}</p>}</div>
          <button type="submit" className={`${buttonClass} w-full sm:w-auto bg-[var(--cinematic-color-burgundy)] text-white`}>Anmelden</button>
        </fieldset>
        <p className="mt-5 text-sm">Passwort und Code werden nach jedem Absenden aus den Feldern entfernt. Sicherheitsnachweise bleiben nur im Arbeitsspeicher dieser geöffneten Seite.</p>
      </form>}
      {session && <p className="my-4 text-sm">Serverseitig angegebene Ablaufzeit: <time dateTime={session.expiresAt}>{new Date(session.expiresAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })} (Berlin)</time>. Eine Anzeige verlängert die Sitzung nicht.</p>}
      {(mode === "active" || recovery) && <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-5">
        <button type="button" disabled={locked} className={`${buttonClass} bg-[var(--cinematic-color-burgundy)] text-white`} onClick={() => void logout()}>{logoutRetry ? "Abmeldung erneut versuchen" : "Sitzung ausdrücklich beenden"}</button>
        {recovery && <button type="button" disabled={locked} className={`${buttonClass} border border-[var(--cinematic-color-ink)]`} onClick={() => void checkSession()}>Sitzung erneut prüfen</button>}
      </div>}
      {mode === "anonymous" && <button type="button" disabled={locked} className={`${buttonClass} mt-5 underline text-left`} onClick={() => void logout()}>Verbliebenen Browserzugang ausdrücklich beenden</button>}
    </div>
    <aside className="mt-6 rounded-xl border border-[var(--cinematic-color-line)] p-4 sm:p-6" aria-label="Umfang dieses Bereichs">
      <p className="font-semibold">Fallbearbeitung ist in diesem Stand noch nicht verfügbar.</p>
      <p className="mt-2 text-sm">Hier werden keine Bewerbungsunterlagen angezeigt und keine Abschluss-, Lösch- oder Postfachaktionen angeboten. Auch eine aktive Anmeldung bestätigt keine Betriebsbereitschaft dieser Funktionen.</p>
    </aside>
    <noscript><p className="mt-5">Für die geschützte Anmeldung ist JavaScript erforderlich. Ohne JavaScript werden keine Zugangsdaten gesendet.</p></noscript>
  </section>;
}
