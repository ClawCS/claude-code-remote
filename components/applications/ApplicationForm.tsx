"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { APPLICATION_EMAIL } from "@/lib/application-contact";
import type { ApplicationInput, IntakeAcceptanceResponse, PublicApplicationConfig, PublicState } from "@/lib/applications-contract";
import { APPLICATION_FALLBACK, applicationOutcome, applicationRetryDelay, mayRetryApplication, readApplicationJson, selectApplicationFiles, validateApplicationAcceptance, validateApplicationConfig, validateApplicationSession, validateApplicationStatus, type ApplicationOutcome } from "@/lib/applications-client";

type Attempt = { readonly input: Readonly<ApplicationInput>; readonly files: readonly File[]; readonly key: string; readonly mode: PublicApplicationConfig["mode"]; firstAt: number; submissions: number; notBefore: number; outcome: ApplicationOutcome };
const canRetry = (attempt: Attempt, now: number) => attempt.submissions === 0 ? now >= attempt.notBefore : mayRetryApplication(attempt, now);
const empty = (): ApplicationInput => ({ name: "", email: "", job: "sales-fulltime", phone: "", message: "" });
const contact = <a href={`mailto:${APPLICATION_EMAIL}?subject=Interesse%20an%20einer%20Mitarbeit`} className="text-primary underline">{APPLICATION_EMAIL}</a>;
const unavailable = "Der Online-Upload ist zurzeit nicht verfügbar. Du kannst dich persönlich im Markt oder per E-Mail bewerben. Diese Anzeige sagt nichts über bereits angenommene Bewerbungen aus.";
const ambiguous = "Deine Bewerbung ist möglicherweise bereits angekommen. Bitte sende nur denselben Versuch erneut, sofern dies hier möglich ist, oder kontaktiere den Markt. Eine neue Bewerbung kann zu einer doppelten Bewerbung führen.";

export default function ApplicationForm({ config: _initialConfig }: { config?: PublicApplicationConfig }) {
  // Static props cannot establish readiness. Initial/no-JS rendering is always safe.
  const [config, setConfig] = useState<PublicApplicationConfig>(() => ({ ...(validateApplicationConfig(_initialConfig) ?? APPLICATION_FALLBACK), enabled: false, mode: "disabled" })), [hadForm, setHadForm] = useState(false);
  const [input, setInput] = useState<ApplicationInput>(empty), [files, setFiles] = useState<readonly File[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null), [busy, setBusy] = useState(false), [phase, setPhase] = useState("");
  const [error, setError] = useState(""), [message, setMessage] = useState(""), [acknowledged, setAcknowledged] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({}), [showErrors, setShowErrors] = useState(false);
  const [validationRun, setValidationRun] = useState(0);
  const [receipt, setReceipt] = useState<IntakeAcceptanceResponse | null>(null), [state, setState] = useState<PublicState>("processing");
  const [monitor, setMonitor] = useState(0), [monitoring, setMonitoring] = useState(false), [stoppedAt, setStoppedAt] = useState(0), [checkedAgain, setCheckedAgain] = useState(false);
  const [now, setNow] = useState(0), [configAfter, setConfigAfter] = useState(0);
  const mounted = useRef(false), lifecycle = useRef(0), operation = useRef(false), requestController = useRef<AbortController | null>(null);
  const attemptRef = useRef<Attempt | null>(null), fileInput = useRef<HTMLInputElement | null>(null);
  const nameInput = useRef<HTMLInputElement | null>(null), emailInput = useRef<HTMLInputElement | null>(null), errorSummary = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (validationRun) errorSummary.current?.focus(); }, [validationRun]);
  const request = useCallback(async (path: string, timeout: number, init: RequestInit = {}, received?: (response: Response) => void) => {
    if (requestController.current) throw new Error("APPLICATION_BUSY");
    const controller = new AbortController(); requestController.current = controller;
    const timer = window.setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(path, { ...init, credentials: "same-origin", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer", signal: controller.signal });
      received?.(response);
      if (path === "/api/bewerbung/status" && (response.status === 403 || response.status === 410)) { await response.body?.cancel(); return { response, value: null }; }
      const value = await readApplicationJson(response);
      if (controller.signal.aborted) throw new Error("APPLICATION_TIMEOUT");
      return { response, value };
    } finally { clearTimeout(timer); if (requestController.current === controller) requestController.current = null; }
  }, []);
  const refreshConfig = useCallback(async () => {
    const generation = lifecycle.current;
    setConfigAfter(performance.now() + 5000);
    try {
      const { response, value } = await request("/api/bewerbung/config", 5000);
      const valid = response.status === 200 ? validateApplicationConfig(value) : null;
      if (!mounted.current || generation !== lifecycle.current) return null;
      setConfig(valid ?? APPLICATION_FALLBACK); if (valid?.enabled) setHadForm(true);
      return valid;
    } catch { if (mounted.current && generation === lifecycle.current) setConfig(APPLICATION_FALLBACK); return null; }
  }, [request]);
  useEffect(() => {
    mounted.current = true; operation.current = true;
    const generation = ++lifecycle.current;
    void refreshConfig().finally(() => { if (generation === lifecycle.current) operation.current = false; });
    const clock = window.setInterval(() => setNow(performance.now()), 1000);
    return () => { mounted.current = false; lifecycle.current = generation + 1; clearInterval(clock); requestController.current?.abort(); requestController.current = null; attemptRef.current = null; };
  }, [refreshConfig]);

  useEffect(() => {
    if (!receipt || !monitor) return;
    let canceled = false, inFlight = false, calls = 0, timer: number | undefined;
    const started = performance.now(); let due = started + 2000;
    setMonitoring(true); setMessage("");
    const finish = (text: string) => { if (canceled) return; canceled = true; clearTimeout(timer); setMonitoring(false); setStoppedAt(performance.now()); setMessage(text); };
    const schedule = () => { clearTimeout(timer); timer = window.setTimeout(() => void poll(), Math.max(0, Math.min(due - performance.now(), started + 900000 - performance.now()))); };
    const poll = async () => {
      if (canceled || inFlight) return;
      if (performance.now() >= started + 900000 || calls >= 30) { finish("Die automatische Statusprüfung ist beendet. Dies bestätigt keine Zustellung."); return; }
      if (document.hidden) { clearTimeout(timer); timer = window.setTimeout(() => void poll(), Math.max(1, started + 900000 - performance.now())); return; }
      if (performance.now() < due) { schedule(); return; }
      inFlight = true; calls++;
      try {
        const { response, value } = await request("/api/bewerbung/status", Math.min(10000, started + 900000 - performance.now()), { headers: { Authorization: `Bearer ${receipt.statusToken}` } });
        if (canceled || !mounted.current) return;
        if (response.status === 403 || response.status === 410) { finish("Der Statusnachweis ist nicht mehr verfügbar. Bitte kontaktiere den Markt mit deiner Referenz."); return; }
        const status = response.status === 200 ? validateApplicationStatus(value) : null;
        if (status?.reference === receipt.reference) {
          setState(status.state);
          if (status.state !== "processing") { finish(""); return; }
        }
      } catch { /* A failed status check never establishes delivery. */ }
      finally {
        inFlight = false;
        if (!canceled && mounted.current) {
          if (calls >= 30 || performance.now() >= started + 900000) finish("Die automatische Statusprüfung ist beendet. Dies bestätigt keine Zustellung.");
          else { due = performance.now() + ([2000, 4000, 8000, 16000][calls] ?? 30000); schedule(); }
        }
      }
    };
    const visibility = () => { if (!document.hidden && !canceled && !inFlight) { clearTimeout(timer); void poll(); } };
    document.addEventListener("visibilitychange", visibility); schedule();
    return () => { canceled = true; clearTimeout(timer); document.removeEventListener("visibilitychange", visibility); requestController.current?.abort(); };
  }, [receipt, monitor, request]);

  const transmit = async () => {
    if (operation.current || receipt || attemptRef.current && (["conflict", "correctable"].includes(attemptRef.current.outcome) || !canRetry(attemptRef.current, performance.now()))) return;
    operation.current = true; setBusy(true); setError(""); setMessage(""); setPhase("Upload-Verfügbarkeit wird geprüft");
    let posted = false, receivedRetryDelay = 60000;
    try {
      const current = await refreshConfig();
      if (!current?.enabled || !mounted.current) { if (mounted.current) setMessage(unavailable); return; }
      let frozen = attemptRef.current;
      if (frozen && frozen.mode !== current.mode) { setMessage("Der Betriebsmodus hat sich geändert. Bitte kontaktiere den Markt; der eingefrorene Versuch wird nicht neu übertragen."); return; }
      if (!frozen) {
        frozen = { input: Object.freeze({ ...input }), files: Object.freeze([...files]), key: crypto.randomUUID(), mode: current.mode, firstAt: 0, submissions: 0, notBefore: 0, outcome: "ambiguous" };
        attemptRef.current = frozen; setAttempt(frozen);
      }
      setPhase("Sitzung wird geprüft");
      const sessionResponse = await request("/api/bewerbung/session", 5000, { method: "POST" });
      const session = sessionResponse.response.status === 200 ? validateApplicationSession(sessionResponse.value) : null;
      if (!session || !mounted.current) throw new Error("APPLICATION_SESSION_UNAVAILABLE");
      if (frozen.submissions && !mayRetryApplication(frozen, performance.now())) { setMessage("Das Wiederholungsfenster ist beendet. Bitte kontaktiere den Markt."); return; }
      const body = new FormData();
      for (const [name, value] of Object.entries(frozen.input)) if (value !== "") body.append(name, value);
      for (const file of frozen.files) body.append("files", file, file.name);
      if (!frozen.submissions) frozen.firstAt = performance.now();
      frozen.submissions++; posted = true; setPhase("Dateien werden übertragen");
      const { response, value } = await request("/api/bewerbung", 65000, { method: "POST", body, headers: { "Idempotency-Key": frozen.key, "X-Application-Form-Token": session.formToken, ...(current.mode === "pilot" ? { "X-Application-Synthetic": "1" } : {}) } }, response => { receivedRetryDelay = applicationRetryDelay(response.headers.get("retry-after")); });
      if (!mounted.current) return;
      const outcome = applicationOutcome(response.status, value);
      if (outcome === "accepted") {
        const accepted = validateApplicationAcceptance(value)!;
        attemptRef.current = null; setAttempt(null); setInput(empty()); setFiles([]); if (fileInput.current) fileInput.current.value = "";
        setReceipt(accepted); setState("processing"); setMonitor(1); setMessage(""); return;
      }
      frozen.outcome = outcome; frozen.notBefore = performance.now() + applicationRetryDelay(response.headers.get("retry-after")); setAttempt({ ...frozen });
      setMessage(outcome === "correctable" ? "Die Bewerbung wurde wegen ungültiger oder zu großer Eingaben abgewiesen. Du kannst diesen fehlgeschlagenen Versuch ausdrücklich verwerfen und korrigieren." : outcome === "conflict" ? "Dieser Versuch kann nicht sicher wiederholt werden. Bitte kontaktiere den Markt; es wird kein neuer Schlüssel erzeugt." : outcome === "session" ? "Die Sitzung konnte nicht bestätigt werden. Bitte prüfe sie durch eine bewusste Wiederholung desselben Versuchs oder kontaktiere den Markt." : ambiguous);
    } catch {
      if (mounted.current) {
        const frozen = attemptRef.current;
        if (frozen) { frozen.outcome = "ambiguous"; frozen.notBefore = performance.now() + receivedRetryDelay; setAttempt({ ...frozen }); }
        setMessage(posted ? ambiguous : "Sitzung oder Verbindung nicht verfügbar. Der unveränderte Versuch bleibt erhalten; bitte warte vor einer bewussten Wiederholung oder kontaktiere den Markt.");
      }
    } finally { operation.current = false; if (mounted.current) { setBusy(false); setPhase(""); setNow(performance.now()); } }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = { ...(!input.name.trim() ? { name: "Bitte gib deinen Namen an." } : {}), ...(!input.email || !emailInput.current?.validity.valid ? { email: "Bitte gib eine gültige E-Mail-Adresse an." } : {}) };
    setFieldErrors(invalid); setShowErrors(Object.keys(invalid).length > 0 || !!error);
    if (Object.keys(invalid).length || error) { setValidationRun(value => value + 1); return; }
    void transmit();
  };
  const chooseJob = (job: ApplicationInput["job"]) => { setInput(previous => ({ ...previous, job })); nameInput.current?.focus(); };
  const reset = (retain: boolean) => { attemptRef.current = null; setAttempt(null); setAcknowledged(false); setMessage(""); setFieldErrors({}); setShowErrors(false); setError(""); if (!retain) { setInput(empty()); setFiles([]); if (fileInput.current) fileInput.current.value = ""; } };
  const locked = busy || !!attempt;
  const fieldClass = "block w-full mt-1 rounded border border-current/30 bg-white p-3 text-gray-900 disabled:opacity-70";
  return <section aria-labelledby="application-contact-title">
    <div className="grid sm:grid-cols-2 gap-6 mb-10">
      <section className="border border-current/20 rounded-xl p-6"><h2 className="text-2xl font-bold">Verkauf Vollzeit (m/w/d)</h2><p className="mt-3">Bewirb dich für den Verkauf in Vollzeit.</p><button type="button" className="underline mt-4 disabled:opacity-60" disabled={locked || !config.enabled || !!receipt} onClick={() => chooseJob("sales-fulltime")}>Für Vollzeit bewerben</button></section>
      <section className="border border-current/20 rounded-xl p-6"><h2 className="text-2xl font-bold">Verkauf Teilzeit (m/w/d)</h2><p className="mt-3">Bis zu 150 Stunden/Monat im Verkauf.</p><button type="button" className="underline mt-4 disabled:opacity-60" disabled={locked || !config.enabled || !!receipt} onClick={() => chooseJob("sales-parttime")}>Für Teilzeit bewerben</button></section>
    </div>
    <h2 id="application-contact-title" className="text-2xl font-bold">Deine Bewerbung</h2>
    <p className="my-4">Persönlich im Markt oder per E-Mail: {contact}</p>
    {!config.enabled && <p className="my-4">{unavailable}</p>}
    {!receipt && <button type="button" className="underline mb-4 disabled:opacity-60" disabled={busy || now < configAfter} onClick={() => { if (operation.current) return; operation.current = true; setBusy(true); void refreshConfig().finally(() => { operation.current = false; if (mounted.current) setBusy(false); }); }}>Upload-Verfügbarkeit prüfen</button>}
    {config.enabled && config.mode === "pilot" && <p className="font-bold border p-4">TEST – nur synthetische Testdaten, keine echte Bewerbung.</p>}
    <p className="text-sm my-4">Nach einer Neuladung gehen die nur im Arbeitsspeicher gehaltenen Eingaben und Statusnachweise verloren. Eine bereits gesendete Bewerbung kann trotzdem angekommen sein. Bitte nicht blind erneut senden.</p>
    <div role="status" aria-live="polite" className="my-4">
      {receipt ? <><p>{state === "processing" ? "Eingang gespeichert, Prüfung läuft" : state === "delivered" ? "An das Marktpostfach übermittelt" : "Prüfung/Übermittlung nicht abgeschlossen"}</p><p>Referenz: {receipt.reference}</p><p>Übermittelt bedeutet nicht gelesen. Bei Rückfragen: {contact}</p></> : <p>{message || phase}</p>}
      {receipt && message && <p>{message}</p>}
    </div>
    {busy && phase === "Dateien werden übertragen" && <div role="progressbar" aria-label="Dateien werden übertragen">Dateien werden übertragen – danach erfolgt die Prüfung.</div>}
    {busy && <button type="button" className="underline" onClick={() => requestController.current?.abort()}>Vorgang abbrechen</button>}
    {receipt ? <div>
      {monitoring && <button type="button" className="underline" onClick={() => { setMonitor(0); setMonitoring(false); setStoppedAt(performance.now()); setMessage("Statusprüfung angehalten. Dies bestätigt keine Zustellung."); }}>Statusprüfung anhalten</button>}
      {!monitoring && state === "processing" && !checkedAgain && <button type="button" className="underline" disabled={now < stoppedAt + 30000} onClick={() => { setCheckedAgain(true); setMonitor(value => value + 1); }}>Status erneut prüfen</button>}
      <p className="text-sm my-3">Statusprüfungen senden keine neue Bewerbung. Der Nachweis gilt serverseitig höchstens sieben Tage.</p>
    </div> : (config.enabled || hadForm) && <form noValidate onSubmit={submit} aria-label={config.mode === "pilot" ? "TEST-Bewerbung" : "Bewerbungsformular"}>
      {showErrors && (fieldErrors.name || fieldErrors.email || error) && <div ref={errorSummary} tabIndex={-1} role="alert" aria-label="Bitte prüfe deine Eingaben" className="border p-4 my-4">
        <p>Bitte prüfe deine Eingaben:</p><ul>
          {fieldErrors.name && <li><a className="underline" href="#application-name" onClick={event => { event.preventDefault(); nameInput.current?.focus(); }}>Name: {fieldErrors.name}</a></li>}
          {fieldErrors.email && <li><a className="underline" href="#application-email" onClick={event => { event.preventDefault(); emailInput.current?.focus(); }}>E-Mail: {fieldErrors.email}</a></li>}
          {error && <li><a className="underline" href="#application-files" onClick={event => { event.preventDefault(); fileInput.current?.focus(); }}>Unterlagen: {error}</a></li>}
        </ul>
      </div>}
      <fieldset disabled={locked} className="space-y-4">
        <legend className="font-semibold">{config.mode === "pilot" ? "TEST – Stelle wählen *" : "Stelle wählen *"}</legend>
        {APPLICATION_FALLBACK.jobs.map(job => <label key={job.id} className="block"><input type="radio" name="job" required value={job.id} checked={input.job === job.id} onChange={() => setInput(previous => ({ ...previous, job: job.id }))} /> {job.label}</label>)}
        <div><label className="block">Name *<input id="application-name" ref={nameInput} className={fieldClass} autoComplete="name" required maxLength={120} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "application-name-error" : undefined} value={input.name} onChange={event => { setInput(previous => ({ ...previous, name: event.target.value })); setFieldErrors(previous => ({ ...previous, name: undefined })); }} /></label>{fieldErrors.name && <p id="application-name-error">{fieldErrors.name}</p>}</div>
        <div><label className="block">E-Mail *<input id="application-email" ref={emailInput} className={fieldClass} type="email" autoComplete="email" required maxLength={254} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "application-email-error" : undefined} value={input.email} onChange={event => { setInput(previous => ({ ...previous, email: event.target.value })); setFieldErrors(previous => ({ ...previous, email: undefined })); }} /></label>{fieldErrors.email && <p id="application-email-error">{fieldErrors.email}</p>}</div>
        <label className="block">Telefon (freiwillig)<input className={fieldClass} type="tel" autoComplete="tel" maxLength={40} value={input.phone} onChange={event => setInput(previous => ({ ...previous, phone: event.target.value }))} /></label>
        <label className="block">Nachricht (freiwillig)<textarea className={fieldClass} maxLength={5000} value={input.message} onChange={event => setInput(previous => ({ ...previous, message: event.target.value }))} /></label>
        <label className="block">Unterlagen / Portrait (freiwillig)<input id="application-files" ref={fileInput} className={fieldClass} type="file" aria-invalid={!!error} aria-describedby={`application-files-limits application-files-disclosure${error ? " application-files-error" : ""}`} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple onChange={event => { const selected = selectApplicationFiles(files, Array.from(event.target.files ?? [])); setError(selected.error ?? ""); if (!selected.error) setFiles(selected.files); event.target.value = ""; }} /></label>
        <ul>{files.map((file, index) => <li key={index}>{file.name} <button type="button" aria-label={`Datei ${index + 1} entfernen`} className="underline" onClick={() => setFiles(previous => previous.filter((_, position) => position !== index))}>Entfernen</button></li>)}</ul>
      </fieldset>
      <p id="application-files-limits" className="text-sm my-4">Freiwillig: höchstens 5 Dateien (PDF, JPG/JPEG, PNG), je 5 MiB, zusammen 10 MiB. Serverseitig: höchstens 20 PDF-Seiten je Datei, 40 insgesamt; Bilder höchstens 25 Megapixel und 8192 Pixel je Kante. Ausgaben höchstens 5 MiB je Datei und 10 MiB insgesamt. Auch kleine Eingangsdateien können bei der Aufbereitung diese Ausgabe- oder Ressourcenlimits überschreiten; dann kann die gesamte Bewerbung nicht vollständig aufbereitet werden. Es werden keine Seiten ausgelassen oder Originaldateien ersatzweise versandt.</p>
      <p id="application-files-disclosure" className="text-sm my-4">Zum Schutz unseres Teams werden Unterlagen als technisch aufbereitete Kopien weitergeleitet. PDFs werden vollständig zu Bild-PDF-Kopien rekonstruiert. Textsuche, Links, Interaktivität und digitale Signaturfunktionen gehen dabei verloren. Eine sichtbare Unterschrift bleibt nur als Bildpunkte erhalten. Digitale Unterschriften werden nicht verifiziert; eine sichtbare Unterschrift ist keine Echtheitsbestätigung. JPG/PNG werden ohne private Bildmetadaten neu gespeichert. Wir verändern keine Inhalte redaktionell und verwenden keine KI. Bitte bewahre deine Originale auf. Die Rekonstruktion bestätigt weder Echtheit noch allgemeine Sicherheit.</p>
      <p className="text-sm my-4"><a href="/datenschutz#bewerbungen" className="underline">Datenschutz zu Bewerbungen</a> – ein Portrait ist keine Voraussetzung.</p>
      {error && <p id="application-files-error" role="alert" className="my-4">{error}</p>}
      {!attempt && <button type="submit" disabled={busy || !config.enabled} className="bg-primary text-white rounded px-6 py-3 disabled:opacity-60">{config.mode === "pilot" ? "TEST-Bewerbung absenden" : "Bewerbung absenden"}</button>}
      {attempt && !busy && <div className="space-y-4">
        {attempt.outcome === "correctable" ? <button type="button" className="underline" onClick={() => reset(true)}>Fehlgeschlagenen Versuch verwerfen und korrigieren</button> : <>
          {attempt.outcome !== "conflict" && <><button type="button" className="underline disabled:opacity-60" disabled={!config.enabled || !canRetry(attempt, now)} onClick={() => void transmit()}>Denselben Versuch erneut senden</button><p className="text-sm">Höchstens drei bewusste Übertragungen desselben Inhalts innerhalb von 15 Minuten. Die Wartefrist wird nicht verkürzt. Ist keine Wiederholung möglich, kontaktiere bitte den Markt.</p></>}
          <label className="block"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} /> Ich verstehe, dass eine neue Bewerbung eine doppelte Bewerbung verursachen kann.</label>
          <button type="button" disabled={!acknowledged} className="underline disabled:opacity-60" onClick={() => reset(false)}>Neue Bewerbung beginnen</button>
        </>}
      </div>}
    </form>}
  </section>;
}
