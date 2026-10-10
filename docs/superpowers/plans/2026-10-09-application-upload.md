# Bewerbungsupload und kontrollierte Postfachlöschung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bewerbungen für die beiden bestätigten Verkaufsstellen sicher annehmen, geprüft an `info@trinkgut-jammers.de` zustellen und eindeutig zugeordnete neue Portalbewerbungen nach dokumentiertem Abschluss fristgerecht entfernen.

**Architecture:** Die bestehende Next-Website erhält Formular und geschützte Verwaltungsoberfläche. Ein isolierter Annahmedienst verarbeitet begrenzte Uploads; ein eigener Worker besitzt die transaktionale Datenbank, private Verarbeitungskopien, Scanner- und Postfachanbindung. Nur der Worker darf Zustellung bestätigen, Fristen verwalten und exakt verifizierte Postfachkopien löschen; das übrige Website-System erhält keine Mail-Zugangsdaten.

**Tech Stack:** Bestehendes Next 16/React 19/TypeScript/Vitest/Playwright; Node mindestens 22.13.0, Linux-Build mit der geprüften Hostversion; SQLite über `better-sqlite3@13.0.3`, Streaming-Multipart über `busboy@1.6.0`, `imapflow@2.3.0`, `mailparser@3.9.37`, `otpauth@9.5.2`, vorhandenes Nodemailer, Sharp und pdf-lib; lokales ClamAV; Caddy/systemd. Neue Paketversionen wurden am 09.10.2026 nur über Registry-Metadaten geprüft, noch nicht installiert oder sicherheitsgeprüft.

**Spec:** [Freigegebene technische Spezifikation](../specs/2026-10-09-application-upload-design.md). Betreiberfreigabe des schriftlichen Entwurfs am 09.10.2026: „ja passt so“. Anschließend bestätigt Niko den Plan und wählt mit „empfohlene“ die subagentengestützte Umsetzung mit separater Gegenprüfung. Die Umsetzung beginnt; keine Produktivaktivierung durch diese Freigabe allein.

## Global Constraints

**Gezielter Nachtrag, 09.10.2026:** Die schriftliche Dokument-Ergänzung ist bestätigt. Der [Plan für bereinigte PDF-/JPG-/PNG-Kopien](2026-10-09-application-document-reconstruction.md) ersetzt nach seiner Durchsicht ausschließlich die unten noch historisch beschriebenen Originalanhang-/50-Seiten-Verträge und ergänzt die betroffenen Tasks 3/5/7/11/13/14/15 sowie Inhaltsfixtures in 6/10. Tasks 1/2 werden nicht neu ausgeführt; notwendige Speicher-/Migrationsanpassungen sind im Nachtrag abgegrenzt. Ausführungsmethode bleibt gewählt; PDF-Produktivsperre und separate echte Testfreigaben bestehen fort.

- Arbeitsverzeichnis `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`, Branch `codex/cinematic-production`; vorhandene isolierte Worktree wiederverwenden, vor Änderungen synchronisieren. Fremde Screenshots/Prüfberichte nicht übernehmen oder verwerfen.
- Pflicht: Name, E-Mail, Stelle. Telefon, Nachricht und sämtliche Unterlagen einschließlich Portrait freiwillig. Stellen: Verkauf Vollzeit und Teilzeit bis zu 150 Stunden/Monat, jeweils m/w/d, sofortiger Einstieg möglich.
- Höchstens fünf Dateien, 5 MiB je Datei, 10 MiB insgesamt; ausschließlich geprüfte PDF/JPEG/PNG. Höchstens zwei parallele Uploads, ein Scan, 20 wartende Vorgänge und 250 MiB Eingangsdaten. Scanner-Signaturen höchstens 24 Stunden alt.
- Empfang/Absender fest `info@trinkgut-jammers.de`; keine Bewerber-Bestätigungsmail in Version 1. Nicht mit allgemeinem Kontakt/Mietanfragen `jammers-goch@trinkgut.de` vermischen.
- Dienstidentitäten, Speicher und Geheimnisse trennen. Keine Dateien in `public`, Releases, Git, Logs oder externen Scan-/KI-Diensten; keine LocalStorage-Formulardaten. Neue private Inodes vor Scan/Versand, kein bloßes Umbenennen der Eingangskopie.
- Öffentlicher Statusnachweis sieben Tage. Erfolgreich übermittelte Verarbeitungskopien und ungültige/abgebrochene Uploads binnen 24 Stunden entfernen. Bei Zustellstörung: Störfall nach einer Stunde, manuelle Klärung nach 24 Stunden, Dokumente höchstens sieben Tage, notwendiger Rückmeldekontakt höchstens 30 Tage ab Annahme; niemals still auf „erfolgreich“ setzen.
- Abgelehnte Bewerbungen: sechs **Kalendermonate** nach bestätigtem Berliner Abschlussdatum, Monatsende begrenzen, Löschung ab Folgetag. Servertimer täglich 03:30 Europe/Berlin mit Nachholung. Keine automatisch erfundenen Abschlussdaten.
- Nur neue registrierte Portalbewerbungen ab Aktivierung. Postfachinhalt muss Signatur **und** tatsächlich neu berechneten MIME-Inhaltsfingerabdruck erfüllen. Keine fremde Nachricht oder fremde Löschmarkierung verändern; niemals globales EXPUNGE, CLOSE oder Papierkorbleeren.
- Alle bestehenden Info-Postfachberechtigten dürfen Bewerbungen lesen; Verwaltungsrechte separat namentlich vergeben, initial nur Niko. Passwort plus zweiter Faktor, erneute Authentifizierung sensibler Aktionen.
- `RENTAL_MODE=disabled`, Newsletter, Zahlungen, DNS, Canva/Instagram, Teamfotos und übriges Design unverändert. Jobs-Zugang über Team und Footer, keine neue Hauptnavigationsstruktur.
- Tests zunächst ausschließlich lokal/synthetisch. Echte Testmails und deren gezielte Testlöschung benötigen vorher den konkret bestätigten Testumfang; Passwörter nie im Chat. Keine kostenpflichtige Aufrüstung ohne Kostenfreigabe.
- Separater Linux-Release gemäß Deployment-Runbook. Kein Editieren in `current`; kein Produktionsbetrieb mit Testuhr. Push/localhost gelten nicht als Live-Nachweis.

## Review Focus

1. Ein Handy wiederholt nach Verbindungsabbruch dieselbe Bewerbung: eine Referenz, kein doppelter Versand; gleicher Schlüssel bei geändertem Inhalt ist ein Konflikt. Tests in Task 1/4/7.
2. Der Annahmeprozess verändert über einen bereits offenen Dateideskriptor eine übergebene Datei: unveränderte Worker-Kopie ist alleinige Scan-/Versandquelle. Test `custody-open-fd` in Task 2.
3. Fremde Mail trägt kopierte gültige Portalheader, aber andere Anhänge: niemals als eigene Bewerbung lesen/bestätigen/löschen; nur der begrenzte Zuordnungsversuch darf den Kandidateninhalt prüfen. Tests in Task 5/6/10.
4. Ablehnung am Monatsende, Sommerzeitwechsel oder Wiedereröffnung im Löschzeitfenster: korrekte Kalenderfrist und kein veralteter Löschauftrag. Tests in Task 9/10.
5. Ein Postfachordner ist gesperrt oder eine Kopie wird während der Prüfung verschoben: Teilergebnis bleibt offen, keine pauschale Löschbestätigung; fremde `\\Deleted`-Nachrichten überleben. Protokolltests in Task 6/10.

---

## Dateigrenzen und gemeinsame Entscheidungen

| Bereich | Dateien/Verantwortung |
| --- | --- |
| Öffentlicher Vertrag | `lib/applications-contract.ts`: Stellen, Limits, Zustands-/Antworttypen ohne Node-/Geheimnisimporte |
| Worker-Kern | `services/applications/src/`: je eine Datei für Konfiguration, Repository, Kryptografie, Übergabe, Dateivalidierung, Scanner, MIME, SMTP, IMAP, Versand, Authentifizierung, Fristen, Löschung und Aufbewahrung |
| Prozesse | `intake-main.ts`/`intake-http.ts` und `worker-main.ts`/`worker-rpc.ts`/`admin-http.ts`; importierbare Serverfabriken getrennt von Prozessstart |
| Tests | `services/applications/tests/` mit synthetischen Fixtures; bestehende Next-Regressionsprüfungen gezielt ergänzen |
| Oberfläche | `components/applications/`, `/bewerbung`, `/bewerbung/verwaltung`; Footer/Team-Einstieg und Datenschutzhinweise |
| Betrieb | `deploy/hetzner/applications/`, `docs/APPLICATIONS-RUNBOOK.md`, separate lokale Integrationstestkonfiguration; keine produktiven Geheimnisse |

Backend-Dateien unten ohne Präfix liegen in `services/applications/src/`; `tests/…` bezeichnet `services/applications/tests/…`. Bereits mit `lib/`, `app/`, `components/`, `services/`, `scripts/`, `deploy/`, `docs/` oder `e2e/` beginnende Pfade sind relativ zur Repositorywurzel. Diese Kurzschreibweise definiert exakte Pfade. Jeder Task committet ausschließlich seine ausdrücklich aufgeführten eigenen Dateien; niemals pauschal `git add -A`. Neue gemeinsame Typen gehören nach `types.ts`, öffentliche Typen ausschließlich nach `lib/applications-contract.ts`.

Schnittstellenentscheidungen:

- `ApplicationId`, `StaffId`, `DateOnly`, `Digest` sind validierte String-Typen; `Instant` ist eine UTC-ISO-Zeichenfolge. `Clock.now(): Date` ist injizierbar; eine Testuhr darf nur ein lokaler Testprozess akzeptieren.
- Öffentliche Zustände: `processing | delivered | needs_attention`; Annahmefehler sind HTTP-Fehler, kein gespeicherter Erfolg. `PublicStatus = { reference: string; state: PublicState; acceptedAt: Instant }`, niemals Name/E-Mail/Dateien.
- `PublicApplicationConfig = { enabled: boolean; mode: 'disabled' | 'pilot' | 'enabled'; limits: { maxFiles: 5; maxFileBytes: 5242880; maxTotalBytes: 10485760 }; jobs: JobOption[] }`; `JobOption = { id: 'sales-fulltime' | 'sales-parttime'; label: string }`. Im nicht authentifizierten Pilotmodus ist `enabled:false`. Ein dienstinterner Fehler darf nicht als aktivierte Annahme erscheinen.
- `ApplicationInput = { name; email; job: 'sales-fulltime' | 'sales-parttime'; phone?; message? }`; Strings mit Obergrenzen 120/254/40/5000 Zeichen. `PrivateSnapshot` besitzt ID, Eingabe, unveränderbare private Dateien mit SHA-256 und vollständigen Request-Fingerabdruck. Der Fingerabdruck berücksichtigt Formularwerte und alle Dateibytes, Typen und bereinigten Namen.
- `DeliveryState = queued | scanning | ready | sending | smtp_accepted | uncertain | delivered | needs_attention`; `CaseState = open | reviewing | rejected_closed | manual_case`. Fachlicher Abschluss und technischer Versand sind getrennt.
- Datenbank ausschließlich Worker, WAL/Transaktionen/Fremdschlüssel, Migration versioniert. Minimaler Vorgang enthält Referenz, verschlüsselten Namen, Stelle, Eingangszeit, Status, Version, Fristen und Audit; Kontaktdaten/Text/Dokumente in verschlüsselten, befristeten Verarbeitungspayloads. Name im reduzierten Register ist nicht „anonym“. Alle verwendeten DTO-/Port-Typen im zuständigen Task ausdrücklich exportieren; keine `any`-Schnittstellen.
- Öffentliche APIs am Intake: `POST /api/bewerbung`, `GET /api/bewerbung/config`, `POST /api/bewerbung/session`, `GET /api/bewerbung/status`. Private Admin-API: `/api/bewerbungsverwaltung/*`; UI `/bewerbung/verwaltung`. Keine Dokument-Downloadroute.
- Intake hört nur `127.0.0.1:3105`, Admin-HTTP des Workers nur `127.0.0.1:3106`; Worker-RPC über Unixsocket mit eigenem zugelassenem Betriebssystem-Gruppenzugriff. RPC erlaubt nur begrenzte Aufnahme-/Statusmethoden, keine freien SQL-/Datei-/Postfachoperationen.
- Produktivmodi `disabled | pilot | enabled`; `pilot` verlangt zusätzlich einen sicheren, befristeten Testzugang und akzeptiert nur markierte synthetische Vorgänge. Der normale Besucher sieht im Pilotmodus weiterhin den E-Mail-Kontakt. Keine produktive Uhrmanipulation für Löschtests.
- Backend mit eigenem `services/applications/tsconfig.json`: `rootDir` Repositorywurzel, `outDir .build/applications`, ES2022/Node16, kein `noEmit`, keine Next-Aliase in Backend-Imports. Laufzeit-JS liegt unter `.build/applications/services/applications/src/`; Shared-Contract unter `.build/applications/lib/`. Kein produktiver `tsx`-Bedarf. `.build/` ignorieren.

## Task 1: Transaktionale Annahme, Kapazität und Idempotenz

**Files:** Create `lib/applications-contract.ts`, `types.ts`, `config.ts`, `repository.ts`, `schema.sql`, `tests/repository.test.ts`, `tests/config.test.ts`, `services/applications/tsconfig.json`; Modify `package.json`, `package-lock.json`, `.gitignore`.

**Interfaces:** Produces `readConfig(env: NodeJS.ProcessEnv): ApplicationConfig`, `openRepository(path: string): ApplicationRepository`. Repository: `reserve(input: ReservationInput): Reservation`, `commitIntake(input: IntakeCommit): Acceptance`, `claimNext(owner: string, now: Instant): ClaimedCase | null`, `getPublicStatus(proofHash: Digest, now: Instant): PublicStatus | null`, `withCaseLock<T>(id: ApplicationId, action: (row: CaseRecord) => Promise<T>): Promise<T>`. `ReservationInput` enthält serverseitige Browsersitzung, Idempotenzschlüssel und reserviertes Budget; `IntakeCommit` enthält finalen Inhaltsfingerabdruck, verschlüsselten Eingangspfad und Ist-Größe; `Acceptance` enthält Referenz und neu ausgegebenen Statusnachweis. Eine stabile Referenz ist kein Authentifizierungsnachweis.

- [ ] Tests zuerst anlegen. `repository-idempotency`: zwei identische Commits ergeben `expect(second.reference).toBe(first.reference)` und eine Queuezeile; geänderter Digest ergibt `IDEMPOTENCY_CONFLICT`. `repository-capacity`: die 21. offene Bewerbung, der dritte parallele Upload und >250 MiB ergeben `CAPACITY_EXCEEDED`; abgebrochene Reservierung gibt Budget frei. Zwei Worker erhalten niemals denselben Claim.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/repository.test.ts services/applications/tests/config.test.ts` ausführen; zunächst fehlende Implementierung als roten Test belegen.
- [ ] Pakete exakt wie oben installieren, Typdefinitionen passend prüfen/locken; keine Sammelupdates. Repository mit Unique-Constraints, transaktionalen Budgets, Prozess-/Crash-Recovery und versionierten Claims implementieren. `withCaseLock` serialisiert Mutationen für die gesamte Aktion; zweite Workerinstanz wird durch einen exklusiven Prozesslock ausgeschlossen, DB-CAS schützt veraltete Versionen. SQL-Migration aus definiertem Releasepfad laden, nicht zufälligem CWD.
- [ ] `config.ts` lehnt fehlende echte Origin, unsichere Pfade und Testuhr in Produktion ab. Secrets nur im Worker-Konfigurationstyp; öffentliche Konfiguration liefert Mode/Dateilimits/Stellen ohne interne Pfade. Script `applications:build` kompiliert Backend und kopiert `schema.sql` an den definierten Runtimepfad; Tests vom Runtimebuild ausschließen.
- [ ] Obige Tests, `npm run applications:build` und `npx tsc --noEmit` grün prüfen. Danach nur Taskdateien committen: `feat: add private application registry and admission limits`.

## Task 2: Verschlüsselter Eingang und stabile Worker-Übernahme

**Files:** Create `crypto.ts`, `custody.ts`, `worker-rpc.ts`, `tests/custody.test.ts`, `tests/worker-rpc.test.ts`.

**Interfaces:** Consumes Repository aus Task 1. Produces `sealIncoming(source: AsyncIterable<Uint8Array>, target: IncomingTarget, publicKey: KeyObject): Promise<SealedFile>`, `takePrivateSnapshot(record: CommittedIntake, keys: WorkerKeys): Promise<PrivateSnapshot>`, `createWorkerRpc(repo: ApplicationRepository, config: RpcConfig): Server`. `IncomingTarget` wird serverseitig erstellt; keine Clientpfade. RPC-Clientvertrag `reserve`, `commitIntake`, `getPublicStatus` übernimmt Task-1-Typen, keine generische Methode.

- [ ] Tests `custody-open-fd`, `custody-tamper`, `custody-symlink`, `rpc-no-admin`: `expect(workerDigestAfterIngressMutation).toBe(workerDigestBeforeMutation)`, geändertes GCM-Tag wird abgelehnt, Symlink/Traversal wird abgelehnt, RPC-Methode `delete` erhält `METHOD_NOT_ALLOWED`.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/custody.test.ts services/applications/tests/worker-rpc.test.ts` zuerst rot ausführen.
- [ ] Native `node:crypto`: frischer AES-256-GCM-Datenschlüssel je Objekt, mit Worker-RSA-OAEP-SHA256-Schlüssel umhüllt; Intake besitzt ausschließlich den öffentlichen Schlüssel. Metadaten ebenfalls verschlüsseln. Fsync vor Commit, exklusive zufällige Dateien, `O_NOFOLLOW`, Eigentümer-/Dateitypprüfung; keine usergesteuerten Dateinamen als Pfade.
- [ ] Worker kopiert/dechiffriert auf **neue** private Inodes, validiert Authentizität und Fingerabdruck, speichert private Nutzdaten erneut verschlüsselt. Klartext nur in begrenztem privatem `/run`-Arbeitsbereich, nach Bearbeitung entfernen. Fehler nach Übernahme nicht als erfolgreiche Zustellung deklarieren. RPC auf Betriebssystem-Socketberechtigung und feste Requestschemata begrenzen.
- [ ] Tests grün einschließlich Crash vor/nach fsync/DB-Commit; verwaiste Dateien werden zur befristeten Bereinigung markiert. Commit: `feat: isolate encrypted application intake from worker custody`.

## Task 3: Echte Dateiidentität und lokaler Scan

**Files:** Create `file-validation.ts`, `scanner.ts`, `tests/file-validation.test.ts`, `tests/scanner.test.ts`, `tests/fixtures/README.md`; ausschließlich synthetische Testdateien unter `tests/fixtures/`.

**Interfaces:** Consumes `PrivateSnapshot`. Produces `validateFile(file: SnapshotFile): Promise<ValidatedFile>`, `scanSnapshot(snapshot: PrivateSnapshot, scanner: ScannerPort): Promise<ScanResult>`. `ScanResult = { kind: 'clean'; scannedDigests: Digest[] } | { kind: 'blocked'; reason: ScanFailure }`; `ScannerPort` liefert Signaturzeit und vollständiges Resultat, nie allein einen erfolgreichen Exitcode.

- [ ] Tabellengetriebene Tests für PDF/JPEG/PNG sowie gefälschte MIME/Endung, SVG/HTML/ZIP/Office, korrupte und verschlüsselte PDFs, JavaScript/OpenAction/AA/Launch/EmbeddedFile/XFA, übergroße Bilder, zu viele PDF-Seiten und rekursive PDF-Objekte. `expect(activePdfResult).toEqual({ kind: 'blocked', reason: 'ACTIVE_PDF' })`; 24h+1ms alte Signaturen, Timeout und unvollständige Scans ergeben niemals `clean`.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/file-validation.test.ts services/applications/tests/scanner.test.ts` zunächst rot.
- [ ] Byte-Signaturen plus vollständigen begrenzten Parser verwenden, keine Regex-PDF-Sicherheitsbehauptung. Maximal 50 PDF-Seiten, 25 Megapixel pro Bild, Parser/Scan einzeln höchstens 30 Sekunden in isolierbarem Kindprozess; unbekannte/mehrdeutige Konstrukte ablehnen. Keine stille Dokumentkonvertierung. Hash vor und nach Prüfung muss dem Snapshot entsprechen.
- [ ] ClamAV nur über lokalen Unixsocket, aktuelle Signaturen, definierte Größenlimits ohne „übersprungen=sauber“. EICAR ausschließlich im isolierten Testprozess; keine echten Schadprogramme. Kein Fail-open bei fehlendem Scanner. Ein Scan gleichzeitig.
- [ ] Tests grün, lokale reale ClamAV-Integration erst nach verfügbarer Testinstallation; im Ergebnis Stub- und echte Scannerprüfung getrennt angeben. Commit: `feat: validate and scan application documents fail closed`.

## Task 4: Begrenzte öffentliche Annahme und Status

**Files:** Create `intake-http.ts`, `intake-main.ts`, `intake-client.ts`, `tests/intake-http.test.ts`; Modify `lib/applications-contract.ts` nur für festgelegte Antworttypen.

**Interfaces:** Consumes Worker-RPC und `sealIncoming`. Produces `createIntakeServer(config: IntakeConfig, worker: IntakeWorkerPort): Server`. `IntakeWorkerPort` enthält ausschließlich die drei RPC-Methoden aus Task 2. JSON-Fehler `{ error: string; code: ErrorCode; retryAfterSeconds?: number }`; Annahme `202` mit `{ reference; state: 'processing'; statusToken }` erst nach dauerhaftem Commit.

- [ ] HTTP-Tests mit echten lokalen Streams: `expect(crossOrigin.status).toBe(403)`, >5 Dateien/>5 MiB pro Datei/>10 MiB Summe `413`, falsche/duplizierte Formfelder `400`, erschöpfte Kapazität `429`, fehlende Bereitschaft `503`. Abbruch ohne Content-Length hinterlässt keinen erfolgreichen Vorgang. Identischer Retry ein Vorgang; geänderte Datei mit altem Schlüssel `409`. Status mit falschem/abgelaufenem Token zeigt keine Daten.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts` zuerst rot.
- [ ] Busboy mit Streaminglimits einsetzen: maximal 5 Dateien, 8 Felder, 13 Teile, 16 KiB Feldbudget, 11 MiB Gesamtrequest einschließlich Multipart-Overhead, 60s Gesamtdauer. Grenzen kumulativ vor Persistieren erzwingen; Multipartfehler/Disconnect propagieren und Reservierungen freigeben.
- [ ] Exakte HTTPS-Origin, Fetch-Metadata, CSRF-Doppelnachweis mit signierter HttpOnly-Sitzung und kurzlebigem Formtoken prüfen. Statusbearer ausschließlich im Authorization-Header; Browser nur im Arbeitsspeicher, nach Reload Kontakt/Referenz anbieten, keine geheime URL. Status erneut nur mit gültigem Nachweis. Gleiches Request-Idempotenzmerkmal in derselben Sitzung, nicht fremde Sessions zusammenlegen.
- [ ] Proxy-IP nur auf Loopback vom festgelegten Caddy, nach Überschreiben von Clientheadern. HMAC-pseudonymisierte Zähler maximal 24 Stunden; sechs Annahmeversuche/Stunde/Sitzung und 30/IP, zusätzlich globale Task-1-Grenzen. `Retry-After`, private/no-store/no-referrer/nosniff; keine kompletten Requests loggen. `disabled/pilot` ohne Zugang immer Kontaktfallback.
- [ ] Tests grün, parallele Streams + Worker-Ausfall + Bodyabbruch separat prüfen. Commit: `feat: add bounded application upload and private status endpoint`.

## Task 5: Signiertes, inhaltsgebundenes Mailpaket

**Files:** Create `mail-manifest.ts`, `smtp.ts`, `tests/mail-manifest.test.ts`, `tests/smtp.test.ts`.

**Interfaces:** Produces `buildMail(snapshot: PrivateSnapshot, identity: DeliveryIdentity, signingKey: KeyObject): PreparedMail`, `fingerprintMime(raw: AsyncIterable<Uint8Array>, limits: MimeLimits): Promise<MailFingerprint>`, `verifyMail(raw: AsyncIterable<Uint8Array>, expected: RegisteredMail, keys: VerificationKeys): Promise<VerificationResult>`, `sendMail(mail: PreparedMail, transport: SmtpPort): Promise<SendOutcome>`. `SendOutcome = {kind: 'accepted'} | {kind: 'definitely_failed'; retryable: boolean} | {kind: 'uncertain'}`. `RegisteredMail` enthält ID, Message-ID, Key-ID, signierten Inhaltsfingerabdruck und erlaubte MIME-Struktur, keine dauerhafte Dokumentkopie.

- [ ] Tests: fester To/From, nur einzelne gültige Reply-To, Headerinjektion abgewiesen; `expect(verifyChangedAttachment.kind).toBe('mismatch')`, kopierter Herkunftsheader reicht nicht. Doppelte Identitätsheader, zusätzliche MIME-Teile, andere Texte/Namen/Typen blockieren. Änderungen ausschließlich an Transport-Received-Headern lassen gültige Nachricht zu. SMTP-Abbruch nach DATA ergibt `uncertain`.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/mail-manifest.test.ts services/applications/tests/smtp.test.ts` zuerst rot.
- [ ] Einfache Textmail ohne Tracking/Remote-Bestandteile erzeugen; SHA-256 über kanonische stabile Header, normalisierten UTF-8-Text und geordnete dekodierte Anhänge (Bytes, Name, Typ). Kanonisierung versionieren. HMAC-SHA256 über ID/Message-ID/Fingerprint mit Key-ID; Vergleich konstantzeitlich, alte Prüfschlüssel bis Ablauf zugehöriger Fristen sicher erhalten.
- [ ] Nodemailer ausschließlich Worker, `smtp.ionos.de:587`, `requireTLS`, Zertifikatsprüfung, fester Envelope/Empfänger, keine Remoteanhänge. Message-ID und geplanten Versand vor Aufruf dauerhaft registrieren. MIME-Lesegrenze 16 MiB, maximal 12 Teile/5 Anhänge, begrenzte Verschachtelung; Mailparser als Stream mit Limits, nicht unbegrenzt `simpleParser`.
- [ ] Tests grün mit lokalem SMTP-Stub; keine echte Mail. Commit: `feat: bind application mail identity to verified document content`.

## Task 6: Begrenztes IMAP-Lesen und ausschließlich gezielte Löschprimitive

**Files:** Create `imap.ts`, `tests/imap-protocol.test.ts`, `tests/helpers/imap-server.ts`.

**Interfaces:** Consumes `verifyMail`. Produces `createMailbox(config: ImapConfig): MailboxPort` mit `findVerified(mail: RegisteredMail): Promise<MailboxSearch>`, `deleteVerified(copy: VerifiedCopy, mail: RegisteredMail): Promise<DeleteResult>`, `disconnect(): Promise<void>`. `VerifiedCopy = { mailbox: string; uidValidity: string; uid: number; fingerprint: Digest }`. `MailboxSearch = { copies: VerifiedCopy[]; complete: boolean; issues: MailboxIssue[] }`; keine frei zugängliche Funktion für globales Expunge.

- [ ] Protokolltestserver zeichnet Befehle/Flags auf. `expect(commands).not.toContain('EXPUNGE')`, kein `CLOSE`; nur `UID EXPUNGE <verifizierte UID>`. Fremde vorgemerkte Mail bleibt erhalten. Fehlendes UIDPLUS löst `UNSAFE_DELETE_CAPABILITY` aus, bevor Flags geändert werden. Fehlendes Leserecht ergibt `complete:false`; Headerkopie mit geändertem Inhalt wird nicht gelöscht. `BODY.PEEK` setzt keine fremden Seen-Flags.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/imap-protocol.test.ts` zunächst rot.
- [ ] Aktuelle installierte ImapFlow-API/Quellcode vor Implementierung prüfen; Libraryoperation mit nachgewiesenem UIDPLUS-Verhalten verwenden und über Protokolltest absichern. Headerbasierte Suche ausschließlich registrierter IDs, maximal 20 Kandidaten/Vorgang/Lauf, Kandidaten-BODY erst nach Headerprüfung. Fremde Inhalte nie allgemein herunterladen.
- [ ] Alle auswählbaren Ordner einschließlich Sent/Trash/Archive berücksichtigen; Kandidat vor jedem Delete erneut gegen Inhalt, Ordner und UIDVALIDITY prüfen. UID-Wechsel verwirft alte Identität. Sichere nichtlöschende Ordnerwechsel/Logout beweisen; kein Library-Fallback auf globalen EXPUNGE/CLOSE. TLS `imap.ionos.de:993` mit Zertifikatsprüfung.
- [ ] Protokolltests grün einschließlich Server ohne Fähigkeiten, Verbindungsabbruch und gleichzeitig fremder Deleted-Mail. Commit: `feat: constrain mailbox processing to verified portal messages`.

## Task 7: Wiederanlaufbarer Scan-/Versandworker

**Files:** Create `dispatch.ts`, `worker-main.ts`, `tests/dispatch.test.ts`; Modify `repository.ts`, `schema.sql` für nötige Zustandsübergänge.

**Interfaces:** Consumes Tasks 1–6. Produces `runDispatchOnce(deps: DispatchDependencies): Promise<DispatchResult>`; Dependencies sind Repository, Clock, Custody-, Scanner-, SMTP- und Mailbox-Ports. Produces repository `transitionDelivery(id: ApplicationId, expectedVersion: number, next: DeliveryTransition): CaseRecord`; unzulässige Zustandsübergänge werfen, keine überschreibenden freien Statussetter.

- [ ] Tests für Prozessausfall vor/nach Commit, Scan, SMTP-DATA und Empfangsbestätigung. `expect(sendCallsAfterUncertainRestart).toBe(1)`; nach IMAP-Match Status `delivered`, bei fehlendem Match `uncertain/needs_attention`, nicht neuer Send. Gleichzeitig gleiche Bewerbung niemals zweifach beansprucht; veränderte Snapshotbytes stoppen Versand.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/dispatch.test.ts` zuerst rot.
- [ ] Stabile eigene Kopie prüfen → scannen → Manifest/Versuch persistieren → senden → IMAP-Match bestätigen. Eindeutig temporäre Vorannahmefehler erlauben nach dem ersten Versuch höchstens zwei Wiederholungen (nach 5 und 30 Minuten); unklarer Ausgang nur abgegrenzte Empfangssuche, danach manuelle Klärung. Wiederholte IMAP-Prüfung erzeugt keine erneute Mail. IDs/Versionen atomar, Claims bei Neustart konservativ auswerten.
- [ ] Prozessbeendigung drainen; neu annehmen stoppen, bereits dauerhaft angenommene Vorgänge erhalten. Worker-/Scannerbereitschaft beeinflusst Intakeconfig; Bereitschaft nicht aus `systemctl active` ableiten. Logs nur interne Zufallsreferenz und feste Fehlercodes.
- [ ] Tests grün; einen vollständigen lokalen Vorgang von Upload bis fingiertem Postfacheingang mit korrekten Anhängen prüfen. Commit: `feat: make application processing restart safe and delivery aware`.

## Task 8: Namentliche Verwaltungsauthentifizierung

**Files:** Create `auth.ts`, `staff-cli.ts`, `tests/auth.test.ts`; Modify `repository.ts`, `schema.sql` für Benutzer/Sitzungen/Nonce.

**Interfaces:** Produces `authenticate(input: LoginInput, deps: AuthDependencies): Promise<LoginResult>`, `authorizeSession(token: string, now: Instant): StaffSession | null`, `authorizeSensitiveAction(session: StaffSession, proof: ReauthProof, action: SensitiveAction): Promise<ActionGrant>`. `ActionGrant` bindet Akteur, eine Aktion/Vorgang, Version, Ablauf und Einmalnonce. Keine bereits vorhandene Miet-Adminauth wiederverwenden.

- [ ] Tests: richtiges Passwort ohne TOTP unzureichend, falscher/erneut verwendeter OTP abgewiesen, ausgelaufene/widerrufene Sitzung abgewiesen; Reauthgrant kann nicht bei anderem Vorgang oder zweimal verwendet werden. `expect(ordinaryMailboxReaderHasAdmin).toBe(false)`; keine öffentliche Registrierung.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/auth.test.ts` zunächst rot.
- [ ] Passwörter mit `crypto.scrypt` (eigener Salt pro Benutzer, dokumentierte Parameter) hashen; OTPAuth-TOTP mit engem Zeitfenster und Replaykontrolle. Secrets verschlüsselt; einmalige Recoverycodes gehasht. CLI initialisiert ausschließlich bestätigten Niko-Zugang über interaktive sichere Eingabe, nie CLI-Argument/Log/Chat. Kein Autoimport von Mailboxbenutzern.
- [ ] Zufällige serverseitig widerrufbare Sessions: 30 Minuten inaktiv/8 Stunden absolut; Secure/HttpOnly/SameSite=Strict/Host-only, CSRF bei Mutationen. Loginversuche fünf/15 Minuten pro Benutzer plus IP, generische Fehlermeldung; sensitive Reauth maximal fünf Minuten gültig. Logout widerruft serverseitig.
- [ ] Tests grün inklusive Origin-/CSRF-/Brute-Force-Abwehr und Rekey/Recovery ohne Passwortecho. Commit: `feat: protect application administration with named two factor access`.

## Task 9: Abschluss, Kalenderfristen und begründete Sperren

**Files:** Create `lifecycle.ts`, `tests/lifecycle.test.ts`; Modify `repository.ts`, `schema.sql`.

**Interfaces:** Produces `retentionDates(closedOn: DateOnly): { deadline: DateOnly; deleteFrom: DateOnly }`, `applyCaseAction(id: ApplicationId, action: CaseAction, grant: ActionGrant, deps: LifecycleDependencies): Promise<CaseRecord>`, `deletionEligibility(row: CaseRecord, todayBerlin: DateOnly): Eligibility`. `CaseAction` ist eine Union für review/reject/reopen/correct-date/hold/release-hold/manual-case/confirm-external-copies; mutierende Aktionen versionsgebunden, begründet und auditiert.

- [ ] `expect(retentionDates('2026-08-31')).toEqual({deadline:'2027-02-28',deleteFrom:'2027-03-01'})`; Schaltjahr: 31.08.2023 → 29.02.2024/01.03.2024. Berliner Tagesgrenzen/DST, Eingangsdatum ≤ Abschluss ≤ heute. Wiedereröffnung entzieht Löschfähigkeit; abgelaufener Hold-Prüftermin allein hebt Hold nicht auf.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/lifecycle.test.ts` zuerst rot.
- [ ] Date-only-Kalenderarithmetik, kein 180-Tage-Offset. Datumskorrektur zeigt alte/neue Frist und Grund; Hold braucht Akteur/Grund/Prüftag innerhalb von 30 Tagen. Abweisung fehlender/freier Fristeneingaben. Sieben-Tage-Vorwarnung, 30-Tage-Erinnerung für offene Vorgänge. Hired/withdrawn/Betroffenenfälle werden `manual_case`, nicht automatisch `rejected_closed`.
- [ ] Alle Mutationen unter identischem Vorgangslock wie Löschung, mit Audit ohne Dokumente und unabhängigem Nachweis externer Kopienbehandlung. Kein E-Mail-GET darf schließen oder löschen. Reminder nur im Verwaltungsbereich, keine neue automatische E-Mail-Funktion.
- [ ] Tests grün inklusive konkurrierender Aktionen mit veralteter Version. Commit: `feat: track application closure and calendar based retention`.

## Task 10: Fristgerechte gezielte Postfachlöschung

**Files:** Create `deletion.ts`, `tests/deletion.test.ts`; Modify `repository.ts`, `schema.sql` für getrennte Lösch-/Organisationsnachweise.

**Interfaces:** Produces `runDeletionOnce(deps: DeletionDependencies): Promise<DeletionReport>`. Nutzt `withCaseLock`, `deletionEligibility`, `MailboxPort` und den `DeletionLedgerPort` aus Task 11 (dessen Vertrag bereits hier in `types.ts` anlegen, im Test nur einen In-Memory-Adapter einsetzen). Report enthält pro ID `not_due | held | mailbox_cleared | partial | blocked`, nie frei behauptetes „alles gelöscht“. Kopiennachweis bleibt getrennt vom technischen Postfachstatus.

- [ ] Tests: gleiche Betreffzeile/falsche Signatur/falscher Inhalt nie löschen; Kopien in mehreren Ordnern alle verifizieren. `expect(unrelatedDeletedMailStillExists).toBe(true)`; unerreichbarer Ordner ergibt `partial`. Nachrichtenverschiebung/UIDVALIDITY-Wechsel maximal drei vollständige Suchrunden, danach offener Fehler. Zweiter Worker/laufendes Reopen führt nicht zu veralteter Löschung.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/deletion.test.ts services/applications/tests/imap-protocol.test.ts` zunächst rot.
- [ ] Unter Vorgangslock unmittelbar vor Netzwerkaktion aktuellen Zustand/Frist/Hold prüfen und die unabhängige Löschvormerkung dauerhaft quittieren lassen; Registry nur Portalvorgänge ab Aktivierung. Ohne Ledger-Adapter/Quittung keine Löschung. Verifizierte Einzelkopien entfernen, sämtliche auswählbaren Ordner erneut prüfen. Jeder Teilfehler behält differenzierten Nachweis. Wiederholter Lauf nach Absturz setzt nur sichere fehlende Schritte fort.
- [ ] Organisatorische Kopienbestätigung nicht als Vorbedingung für rechtzeitig mögliche Postfachlöschung verwenden; bei fehlender Bestätigung bleibt Gesamtvorgang offen. Unbekannte/weitergeleitete Mail nie durch Namenssuche erfassen. Löschprotokoll ohne Inhalte/Adressen, keine Deletion-Schaltfläche für beliebige UID.
- [ ] Tests grün, Protokolltrace bestätigt keine fremde Flagänderung/kein globales Löschen. Commit: `feat: delete only due and verified application mailbox copies`.

## Task 11: Kurzfristige Bereinigung und Wiederherstellungsschutz

**Files:** Create `retention.ts`, `restore.ts`, `tests/retention.test.ts`, `tests/restore.test.ts`; Modify `repository.ts`, `schema.sql`.

**Interfaces:** Produces `runRetentionOnce(deps: RetentionDependencies): Promise<RetentionReport>`, `reconcileRestore(checkpoint: RestoreCheckpoint, ledger: DeletionLedgerPort, repo: ApplicationRepository): Promise<RestoreResult>`. `DeletionLedgerPort.append(entry: Tombstone): Promise<DurableReceipt>` und `readSince(checkpoint: string): AsyncIterable<Tombstone>`; unabhängiger, gesicherter Ledger ist zwingendes Betriebs-Gate, kein stiller Fallback auf denselben VM-Snapshot.

- [ ] Tests mit lokalen Fakeuhren: bestätigte Zustellung/ungültiger Upload nach 24 Stunden; Zustellstörung nach einer Stunde/24 Stunden/sieben Tagen/30 Tagen; frühere manuelle Erledigung. `expect(afterDay7.internalState).toBe('needs_attention')`: Dokumente weg, notwendiger Rückmeldekontakt begrenzt erhalten, nach Tag 30 kein identifizierender Kontakt. Öffentlicher Status ist nach sieben Tagen mangels gültigem Token nicht mehr abrufbar. Wiederhergestellter gelöschter Vorgang darf weder neu senden noch erneut öffentlich angenommen werden.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/retention.test.ts services/applications/tests/restore.test.ts` zunächst rot.
- [ ] Verarbeitungspayload, öffentliche Token, Abusezähler und nichtidentifizierende Fehler nach den Global Constraints bereinigen. Zustellstörung mit Kontaktstatus/vereinbartem Übermittlungsweg im Markt bearbeitbar halten; Ablauf niemals als Erfolg markieren. Auch temp-/Crash-/WAL-Restdaten berücksichtigen, SQLite `secure_delete`, abgesicherte Checkpoints/Vacuum; keine physische Überschreibungsgarantie für SSD-/Anbieterbackups behaupten.
- [ ] Löschvormerkung im unabhängigen Ledger **vor** irreversibler Löschung dauerhaft quittieren; ohne Quittung blockieren. Nach vollständigem technischen/organisatorischem Abschluss nur minimales Tombstone ohne Namen/Mails/Dokumente. Ledgeraufbewahrung: belegter maximaler Restorezeitraum plus 30 Tage; Metadaten-Minimierung gilt auch für das Ledger.
- [ ] Restore startet gesperrt, holt unabhängigen aktuellen Stand, bereinigt wiederauferstandene Fälle und erlaubt erst nach erfolgreichem Abgleich Betriebsstart. Unbekannter Backuphorizont, altes/unzugängliches Ledger oder fehlende Signatur blockiert Start. Dienstneustart einer nicht zurückgesetzten DB verlangt gültigen zuletzt geprüften Checkpoint, keine allgemeine automatische Freigabe.
- [ ] Tests grün einschließlich unterbrochener Löschung/Restore sowie injizierter Klarnamen in Logfixtures (kein Leak). Commit: `feat: enforce application data expiry and restore deletion ledger`.

## Task 12: Authentifizierte Verwaltungs-API und Oberfläche

**Files:** Create `admin-http.ts`, `tests/admin-http.test.ts`, `components/applications/ApplicationAdmin.tsx`, `app/bewerbung/verwaltung/page.tsx`, `lib/__tests__/application-admin-ui.test.ts`; Modify `worker-main.ts`, `lib/applications-contract.ts` für minimales Admin-DTO.

**Interfaces:** Consumes Tasks 8/9/10/11; produces `createAdminServer(deps: AdminDependencies): Server`. Unter `/api/bewerbungsverwaltung/`: POST `login`, `logout`, `reauth`; GET `session`, `cases`; POST `cases/:id/action`. Keine öffentlichen Dokumente oder beliebigen Postfachoperationen. DTO zeigt Referenz, Name, Stelle, Eingang, Fach-/Versandstatus, Frist, Hold, Hinweise und getrennte Kopienprüfung. Rückmeldekontakt bei Zustellstörung nur berechtigt und während erlaubter Frist.

- [ ] API-Tests: anonym/fehlender zweiter Faktor → 401; falsche Origin/fehlende Reauth → 403; mutierendes GET → 405; alte Version → 409; gültige Aktion → 200. Zwei Benutzer dürfen ohne Recht keine Rollen erzeugen. UI-Tests zeigen `Postfachbereinigung offen` bei Teilfehler, nie `alles gelöscht`.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/admin-http.test.ts lib/__tests__/application-admin-ui.test.ts` zuerst rot.
- [ ] Kleines responsives Arbeitsboard statt Webmail implementieren: offen/in Bearbeitung, Annahmeprobleme, anstehende Fristen, Holds und manuelle Sonderfälle. Datum/Begründung ausdrücklich bestätigen; wiederholte Formsubmission mit Einmalgrant sicher abweisen. Keine vorangekreuzte Kopienbestätigung, keine echten Unterlagen im Board.
- [ ] API no-store/noindex/no-referrer; UI per Tastatur, Fokusführung und Textstatus zugänglich. Sitzung beenden/erneut anmelden verständlich; keine Session oder Daten in LocalStorage. Named-user CLI nicht im öffentlichen Web anbieten.
- [ ] API-Tests grün; Verwaltungs-UI zunächst mit isolierten HTTP-Fixtures prüfen und in Task 14 zusätzlich in den vollständigen lokalen Ablauf aufnehmen. Commit: `feat: add protected application processing and retention dashboard`.

## Task 13: Bewerbungsseite, Navigation, Datenschutz und Auditvertrag

**Files:** Create `components/applications/ApplicationForm.tsx`, `lib/__tests__/application-ui-contract.test.ts`; Modify `app/bewerbung/page.tsx`, `app/bewerbung/layout.tsx`, `components/cinematic/LocationFooter.tsx`, `app/galerie/page.tsx`, `app/datenschutz/page.tsx`, `next.config.ts`, `scripts/audit-public-site.mjs`, `lib/__tests__/safe-public-functions.test.ts`, `lib/__tests__/public-site-http-audit.test.ts`, `e2e/relaunch-integrity.spec.ts`. Create fallback `app/api/bewerbung/config/route.ts`; bestehendes `app/api/bewerbung/route.ts` bleibt 503.

**Interfaces:** Consumes HTTP-Vertrag aus Tasks 1/4. `ApplicationForm({ config }: { config: PublicApplicationConfig })` lädt Sessiontoken erst bei aktivem Dienst; disabled/timeout zeigt tatsächlichen E-Mail-Kontakt. Next-Fallbackconfig explizit `enabled:false`; Caddy ersetzt nur im eingerichteten Betrieb den Pfad.

- [ ] Tests: richtige zwei Stellen, Info-Empfänger, Pflichtfelder/freiwilliges Portrait, 5-Dateien-/5-MiB-/10-MiB-Hinweis, sichere Fallbackansicht. API-Audit unterscheidet `disabled` (POST 503) und `enabled` (unauthentifizierter leerer POST 403); Konfigwiderspruch muss fehlschlagen, kein Akzeptieren beliebiger 2xx/4xx. Übrige pausierte APIs weiter 503, Mietkonfiguration weiter disabled.
- [ ] `NODE_ENV=test npx vitest run lib/__tests__/application-ui-contract.test.ts lib/__tests__/safe-public-functions.test.ts lib/__tests__/public-site-http-audit.test.ts` zuerst rot.
- [ ] Zwei Stellenkarten mit Text und Stellenwahl bauen; bestehende Poster nicht mit überholter Empfängeradresse als Bewerbungskontakt veröffentlichen. Dateien einzeln entfernen, Fortschritt, Inlinefehler, `aria-live` und referenzierter Kontakt. Exakte Erfolgsstufen aus Spec 3, Statuspoll begrenzt mit Backoff; Tababbruch erzeugt keinen Neuversand. Kein Reset sämtlicher Eingaben nach behandelbarem Fehler.
- [ ] Jobs im aktiven `LocationFooter` und auf der Teamseite verlinken, Hauptheader/CINEMATIC_NAV und Fotos unverändert. Neue sensible Routen/API mit Cache-/Referrer-/Robots-Schutz; Verwaltungsseite nicht in Sitemap. Keine Bewerberdaten an vorhandene Analytics/Fehlerberichte senden.
- [ ] Nur den Bewerbungsabschnitt der Datenschutzhinweise an den tatsächlich eingerichteten Modus binden: Anbieter/Empfänger/Zweck, kein Portraitzwang, Fristen/Backup- und Kopiengrenzen/Rechte; keine pauschale Einwilligungspflicht. Beim deaktivierten Modus nicht behaupten, dass ein Upload bereits Daten annimmt. Bestehende Newsletter-/Mietaussagen unverändert.
- [ ] Tests grün; lokaler Devserver + `/bewerbung`-HTMLprüfung gemäß AGENTS. Öffentliche Auditrequests enthalten keinerlei Bewerberdaten/Testmail; produktive API-Probe bleibt nur ablehnender Sicherheitscheck. Commit: `feat: add accessible application form and truthful operating states`.

## Task 14: Vollständiger lokaler Testbetrieb und Linux-Betriebspaket

**Files:** Create `scripts/applications-local-harness.mjs`, `playwright.applications.config.ts`, `e2e/applications.local.spec.ts`, `deploy/hetzner/applications/intake.service`, `deploy/hetzner/applications/worker.service`, `deploy/hetzner/applications/maintenance.service`, `deploy/hetzner/applications/maintenance.timer`, `deploy/hetzner/applications/README.md`, `services/applications/src/maintenance-cli.ts`, `docs/APPLICATIONS-RUNBOOK.md`, `services/applications/tests/deployment-contract.test.ts`; Modify `deploy/hetzner/Caddyfile`, `docs/DEPLOYMENT-RUNBOOK.md`, `package.json`, `.gitignore`.

**Interfaces:** Harness startet nur expliziten lokalen Testmodus mit eigener temporärer DB, SMTP-/IMAP-/Scannerstubs und drei lokalen Appdiensten; `npm run applications:test:e2e` darf keine fremde/öffentliche Base-URL akzeptieren. `maintenance-cli.ts` spricht einen gesonderten nur Worker-eigenen Wartungssocket an; Intake-RPC erhält keine Wartungsrechte. Serverseitiger Timer ruft einmalig die Worker-Wartung auf, kein zweiter DB-Workerprozess. Kurzfristige Bereinigung wird zusätzlich im Worker anhand dauerhafter Ablaufzeiten ausgeführt, mit stündlicher Kontrollrunde: 24-Stunden-Kopien bereits ab Stunde 23 einplanen, weitere harte Speichergrenzen mit entsprechendem Kontrollpuffer; Status-/Authnachweise sofort bei ihrem exakten Ablauf ablehnen. Nach Ausfall vor Wiederaufnahme der Annahme überfällige Daten bereinigen und verpasste Fristen als Vorfall melden.

- [ ] Deploymenttests zuerst: Next-Dienst weiterhin ohne Mailsecrets, `RENTAL_MODE=disabled`; nur Uploadroute 11 MiB/60s, andere Routen 1 MB. Neue Listenports nur Loopback, private Verzeichnisse außerhalb Release, Workerzugang zu SMTP/IMAP, Intake ohne privaten Schlüssel/Registry. `expect(timer).toContain('03:30:00 Europe/Berlin')`, `Persistent=true`; keine Mac-Automation. `services/applications` und neue Testconfig im Release-Positivfilter, kompiliertes Backend bleibt nach `npm prune --omit=dev` ausführbar.
- [ ] `NODE_ENV=test npx vitest run services/applications/tests/deployment-contract.test.ts` zunächst rot. Lokale E2E zuerst für fehlendes Formular/Workflow rot belegen, ausschließlich Loopback.
- [ ] Systemdbenutzer `jammers-app-intake`/`jammers-app-worker`, getrennte private `/var/lib/trinkgut-jammers-applications/{incoming,worker}` und `/run`-Bereiche; `NoNewPrivileges`, restriktive Umask, ReadWritePaths, Corelimits 0, Prozesslimits. Root-eigene `LoadCredential`-Dateien außerhalb Git/Releases; nie Geheimnisse im Unitcontent. ClamAV-Socket nur für Worker, weder öffentlich noch TCP. Ressourcenlimits durch Lasttest belegen, keine 4-GB-Reserve erfinden.
- [ ] Caddysegment mit `handle`-getrennten Matchergrenzen und korrekter Reihenfolge; bestehender 1-MB-Globalfilter darf Upload nicht weiter abschneiden. Bewerbungsrouten an 3105, Verwaltung an 3106, übrige Website an 3000. X-Real-IP neu setzen, Forwarded-Headern nicht vertrauen. Validator/adapt-Ausgabe beweist effektive Grenzen. Keine weiteren Ports-/DNS-Änderungen.
- [ ] Runbook mit sicherer Bereitstellung, unabhängigem Ledger/Restore, Rechte-/Backupinventur, TOTP-Recovery, rotierenden Prüfschlüsseln, Störungen, fachlicher Fristenpflege und Rollback. Bei Rollback Annahme stoppen, Daten/Registry/Workerzustand nicht zurückrollen oder erneut versenden; migrationskompatible Versionen belegen. Offene externe Kopien ausdrücklich behandeln.
- [ ] `npm run applications:build`, `npm run applications:test:e2e`, komplette Unit-Tests, lint, TypeScript, Next-Produktionsbuild; Browserbreiten 320/390/1440, Tastatur, Axe, Fehler-/Upload-/Statusfälle und Adminsession. Getrennte Betriebssystemrechte/FD-Angriff und echtes ClamAV später unter Linux zusätzlich prüfen. Commit: `feat: package and test isolated application services`.

## Task 15: Betriebsfreigaben, Pilot, Release und öffentliche Abnahme

**Files:** Create `docs/audits/2026-10-09-application-upload-release.md`; Update `docs/APPLICATIONS-RUNBOOK.md`, `docs/DEPLOYMENT-RUNBOOK.md`, `AGENTS.md` und aktuellen Datenschutzteil erst mit tatsächlichen Nachweisen. Datum des Berichts bei späterer Durchführung auf den echten Ausführungstag setzen, nicht rückdatieren.

**Interfaces:** Consumes vollständig geprüfte Tasks 1–14. Produces evidenzbasierten Bericht mit Commit, Linuxrelease, tatsächlichen Betriebsparametern, eigener Test-Mailzuordnung, Scan-/Zustell-/Lösch-/Restorebelegen, Restpunkten und Rollbackziel. Keine Kennwörter, TOTP-Seeds, echten Bewerberdaten oder vollständigen Mailboxtraces in Git.

- [ ] Vor Infrastrukturarbeit aktuelle Server-/Mailbox-/Backupfähigkeiten lesen: ClamAV mit aktuellen Signaturen, verfügbare RAM-/Diskreserve unter gleichzeitigem Websitebetrieb, IONOS-Authentifizierung/TLS/UIDPLUS/Ordnerrechte, maximale Mailgröße, Anbieterbackupzyklen. Fehlenden belegten Restorehorizont und unabhängig aktuellen Ledger-Speicher festlegen/testen. Keine unsichere Ersatzlösung; notwendige Kosten konkret zur Freigabe vorlegen.
- [ ] Betreiber provisioniert Mailboxgeheimnisse und Niko-Login über sicheren lokalen/Adminweg. Kein Passwortreset aus diesem Plan. **Der begrenzte Testumfang ist inzwischen ausdrücklich bestätigt** (siehe AGENTS.md): erst nach bestandenen Sicherheitsprüfungen genau drei eindeutig als TEST markierte synthetische Bewerbungen ausschließlich an info@trinkgut-jammers.de, davon eine kontrollierte Kopie in einem eigens dafür angelegten Testordner; anschließend ausschließlich diese drei Testnachrichten samt Testkopie gezielt löschen. Diese Testumfang-Freigabe nicht erneut abfragen. Sie ersetzt weder sichere Bereitstellung noch Linux-/Scanner-/Mail-/Restore-Gates. Bestehende Nachrichten bleiben unberührt; keine echten Bewerbungen, Altmail oder manuelle Providerlöschung als scheinbarer Automatiktest.
- [ ] Frischen Linuxrelease aus geprüftem Gitcommit erstellen; `NODE_ENV=test npm test`, lint/typegen/tsc, `npm run applications:build`, Angeboteprüfung und `NODE_ENV=production npm run build`. Testmodus darf nicht aus Mac-Fixtures übernommen werden. Kein Build im laufenden Release. Paketabhängigkeiten auf bekannte Probleme prüfen und Blocker beheben, nicht `audit fix --force`.
- [ ] Pilotmodus hinter befristetem Testzugang aktivieren. Echte HTTPS-Annahme → Scan → SMTP → IMAP mit korrekten Empfängern/Anhängen nachweisen. EICAR nur als privates lokales Scantestfixture, nicht per Produktivpostfach. Löschprimitive mit synthetisch registrierten Testfällen in gesondertem Testregister prüfen; keine gefälschte Produktivzeit/kein künstlich sechs Monate altes echtes Verfahren. Zusätzlichen Testordner danach nur entfernen, wenn nachweislich leer und nur für den Test angelegt.
- [ ] Restoreprobe mit gesonderter synthetischer DB/Sicherungswiederherstellung und unabhängigen aktuellen Tombstones; Mailboxschreibzugriff dabei gesperrt. Testfall bleibt gelöscht, Versand/Upload bleiben bis Abgleich gesperrt. Tatsächlichen Backuphorizont plus 30 Tage als begrenzte Ledgerfrist setzen; Prozessanweisung für Anbieterrestore von Mails belegen.
- [ ] Unabhängiges Sicherheits-/Gesamtreview mit allen Regressionstests; keine kritischen offenen Befunde. Niko einweisen: Abschlussdatum setzen, Ausnahme begründen, Downloads/Antwortkopien prüfen, Rückmelde-Störfälle klären. Datenschutztext an reale Betriebsnachweise anpassen; keine juristische Zertifizierung behaupten.
- [ ] Erst nach allen Gates `enabled`, regulären 03:30-Timer aktivieren und Websitebereitstellung prüfen. `npm run content:check -- --url https://trinkgut-jammers.de` und `npm run audit:public -- --url https://trinkgut-jammers.de`; `/bewerbung` mobil/Desktop und konfigurationsrichtige Sperrprobe öffentlich. Handzettel/Sortiment/Mietanfragen weiter korrekt. Bei Bereitschafts-/Datenschutz-/Zustellfehler Annahme wieder sperren und Release gemäß Runbook zurückrollen, angenommene Vorgänge nicht verlieren.
- [ ] Bereinigten Bericht und nur eigene geprüfte Dateien committen/pushen. Lokalen Commit gegen origin prüfen; `vorbereitet`, `getestet`, `live` getrennt melden. Offene Infrastruktur-/Testfreigabe konkret benennen statt funktionierende Uploads zu behaupten.

## Abhängigkeiten und Ausführung

Task 1 → Task 2 → Tasks 3/4; Task 5 kann nach den Typen aus 1/2 unabhängig vorbereitet werden; Task 6 benötigt 5; Task 7 benötigt 2–6. Auth 8 baut auf 1, Fristen 9 auf 8, Löschung 10 auf 6/9, Aufbewahrung 11 auf 7/10. Verwaltung 12 benötigt 8–11; öffentliche UI 13 benötigt 1/4; Betriebspaket/E2E 14 benötigt alle Codebausteine; Aktivierung 15 kommt zuletzt. Keine parallelen Änderungen an `repository.ts`, `schema.sql`, `package*.json` oder gemeinsamen Typen; Schnittstellenänderungen zuerst koordinieren. Lokale Unitprüfungen sind ohne Produktivzugang möglich.

## Planprüfung durch Hauptagent – vor Übergabe

Diese Prüfung bewertet den **Plan**, nicht eine vorhandene Implementierung:

- Spec 1–3: Task 13 (Stellen/Formular/Navigation), Tasks 4/7 (wahrheitsgetreuer Status), Global Constraints (Umfang).
- Spec 4–5: Tasks 1–4 (Prozessgrenzen, Inodes, Speicher/Multipart/Scan) und Task 14 (OS/Proxy).
- Spec 6: Tasks 5–7 (Inhaltsbindung, SMTP-Unsicherheit, begrenzte IMAP-Lesezugriffe).
- Spec 7–8: Tasks 8–10/12 (Identität, Abschluss, Kalender, Holds, gezielte Postfachlöschung und getrennte Kopienbestätigung).
- Spec 9: Tasks 11/13/15 (kurze Inhaltsfristen, Störungen, unabhängiger Restoreabgleich, tatsächlicher Datenschutz).
- Spec 10: Tasks 14–15 (synthetische Tests, Ressourcen-/Zugangs-/Kosten-Gates, echte Linux-/HTTPS-Abnahme).
- Alle fünf Review-Focus-Fälle sind konkreten Regressionstests zugeordnet. Schnittstellenbezeichnungen und öffentliche/private Daten sind konsistent festgelegt; keine freie Delete-/DB-Methode für Intake.
- Betriebsabhängige Größen/Providerfähigkeiten bleiben ausdrücklich Aktivierungsgates, keine erfundenen Fakten. Geheimnisse, reale Mails, Infrastrukturinstallation und Liveschaltung sind durch die Planerstellung **nicht durchgeführt**.

**Ausführung gewählt:** Subagentengestützte Umsetzung mit separatem Review jeder sicherheitsrelevanten Einheit, bestätigt am 09.10.2026. Fortschritt wird während der Umsetzung im planbezogenen SDD-Ledger und danach im bereinigten Prüfbericht festgehalten. Weitere Design-/Methodenbestätigungen sind nicht nötig; konkrete Test-, Geheimnis- und gegebenenfalls Kostenfreigaben aus Task 15 bleiben erforderlich.
