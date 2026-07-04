# Nächste Schritte — was noch dich braucht

Die automatisierbare Arbeit ist erledigt (siehe CHECKLIST.md). Für den letzten Sprung auf echtes 50k-Niveau bleiben drei Dinge, die deine Entscheidung oder dein Material brauchen. Diese Anleitung ist so gehalten, dass ich (Claude) jeden Schritt mit dir gemeinsam ausführen kann, sobald du zurück bist — sag einfach, wo wir anfangen.

---

## 1. 🔴 Echte Produktfotos (größter Wertigkeits-Hebel)

**Problem:** Die Produktkarten zeigen aktuell Ausschnitte aus dem Handzettel — mit aufgedruckten Preisen und unterschiedlichen Croppings. Das ist der Hauptgrund, warum es (trotz allem anderen) noch nicht komplett nach 50k aussieht.

**Was gebraucht wird — Foto-Spezifikation:**
- **Freigestellt** auf **weißem/neutralem** Hintergrund (oder sauber freistellen lassen)
- **Quadratisch**, mind. **800 × 800 px**, gleichmäßige Ausleuchtung, kein Preisaufkleber im Bild
- Format **WebP** (oder PNG/JPG — dann konvertiere ich)
- **Ein Foto pro Produkt**, benannt nach dem Produkt-Slug

**Wie sie in die Seite kommen (zwei Wege):**
- **Einfachster Weg (kein Code-Umbau):** Die neuen Bilder unter demselben Dateinamen an dieselbe Stelle legen, die `data/products.json` schon erwartet — z. B.
  `public/handzettel/extracted/kw19/de/altenmuenster-urig-wuerzig.webp`.
  Gleiche Namen → die Seite zeigt automatisch die neuen Fotos, ohne dass ich etwas ändern muss.
- **Sauberer Weg (empfohlen, mache ich):** neuer Ordner `public/images/produkte/<slug>.webp`, und ich stelle die 107 Bildpfade in `products.json` darauf um. Dann ist die Herkunft klar getrennt.

**Realistisch:** 107 Produkte sind viel. Wir können auch **priorisiert** starten — z. B. erst die ~30 meistverkauften/Aushängeschild-Produkte fotografieren, der Rest folgt. Schon die Top-Produkte mit echten Fotos heben den Gesamteindruck massiv.

---

## 2. Hetzner-Deployment (Go-Live)

Der Code ist dafür vorbereitet: dateibasierte Persistenz funktioniert auf einem VPS, IP-Erkennung ist proxy-tauglich, der Handzettel-Cron ist auf **Sonntag 16:00** dokumentiert. Es fehlt nur das Aufsetzen. Schritt für Schritt (ich mache das mit dir, wenn du den Server hast):

### 2a. Server & Grundlagen
- Hetzner Cloud: **CX22** (2 vCPU / 4 GB) reicht locker, Ubuntu 24.04.
- SSH-Key-Login, root-Passwort-Login aus, `ufw` Firewall: nur **22 (SSH), 80, 443** offen.
- `unattended-upgrades` + `fail2ban` aktivieren.

### 2b. App installieren
```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt install -y nodejs git
# Code holen (dein GitHub-Repo)
git clone <dein-repo-url> /var/www/trinkgut && cd /var/www/trinkgut
npm ci
```

### 2c. Environment (`.env.local` — NIE committen)
```
GEMINI_API_KEY=<dein-key>          # aistudio.google.com/app/apikey
CRON_SECRET=<openssl rand -hex 32> # sicheren Token generieren
```

### 2d. Persistente Daten AUSSERHALB des Deploy-Ordners
Wichtig, damit `git pull`/Deploys Bewerbungen & Community-Daten nicht überschreiben:
```bash
sudo mkdir -p /var/lib/trinkgut/data
# data/ auf das persistente Volume verlinken (Bewerbungen, community.json, cache):
```
→ Diesen Teil richte ich passend ein (Symlinks/ENV für Schreibpfad), sobald der Server steht.

### 2e. Build & Dauerbetrieb (PM2)
```bash
npm run build
sudo npm i -g pm2
pm2 start "npm run start" --name trinkgut && pm2 save && pm2 startup
```

### 2f. Reverse-Proxy + kostenloses TLS (Caddy — am einfachsten)
```bash
sudo apt install -y caddy
# /etc/caddy/Caddyfile:
#   trinkgut-jammers.de {
#     reverse_proxy 127.0.0.1:3000
#     header X-Real-IP {remote_host}
#   }
sudo systemctl restart caddy
```
Caddy holt automatisch ein Let's-Encrypt-Zertifikat. `X-Real-IP` sorgt dafür, dass das Rate-Limiting die echte Besucher-IP sieht.

### 2g. Handzettel-Automatik (Sonntag 16:00)
```bash
# crontab -e:
0 16 * * 0 curl -fsS -X POST https://trinkgut-jammers.de/api/handzettel/cron -H "Authorization: Bearer <CRON_SECRET>"
```
(Der neue Flyer wird ohnehin beim ersten Seitenaufruf einer neuen Kalenderwoche automatisch geladen — der Cron sorgt nur dafür, dass es zuverlässig Sonntagnachmittag passiert.)

### 2h. Backups
```bash
# Tägliches Backup des Datenordners auf eine Hetzner Storage Box:
0 3 * * * tar czf /tmp/trinkgut-data.tgz /var/lib/trinkgut/data && rsync ...
```

### 2i. Bewerbungs-Benachrichtigung (empfohlen)
Aktuell landen Bewerbungen im Dateisystem, ohne dass jemand benachrichtigt wird. Ich kann eine **E-Mail an dich bei jeder neuen Bewerbung** ergänzen (SMTP oder Resend) — kleiner Zusatz, sag Bescheid.

---

## 3. Entscheidung: Mehrsprachigkeit (i18n)

Aktueller Zwischenzustand: Der DE/EN/NL-Umschalter übersetzt nur die Navigation; die Inhalte bleiben deutsch. Dazu gibt es eine separate, eigenständige `/nl`-Landingpage. Das wirkt halbfertig. **Zwei saubere Wege — such dir einen aus:**

- **A) Ehrlich reduzieren (schnell):** Umschalter DE/EN/NL entfernen, nur die dedizierte `/nl`-Seite für die niederländischen Grenzkunden behalten (die ist stark). → 1–2 Stunden, sofort konsistent.
- **B) Echtes i18n (größer):** URL-basierte Sprachen (`/en/...`, `/nl/...`), alle Inhalte übersetzt, `hreflang` sauber. → mehrere Tage, nur sinnvoll wenn EN/NL-Publikum wirklich wichtig ist.

Meine Empfehlung: **A** — für einen lokalen Getränkemarkt an der NL-Grenze reichen die deutsche Hauptseite + die starke `/nl`-Grenzkunden-Seite. Der halbe Umschalter bringt mehr Verwirrung als Nutzen.

---

## Kurzfassung
1. **Fotos** — Material besorgen (priorisiert starten ist ok), ich baue sie ein.
2. **Hetzner** — Server bestellen, dann richte ich Deployment/TLS/Cron/Backups mit dir ein.
3. **i18n** — Entscheidung A oder B, ich setze um.

Sobald du zurück bist: sag mir, womit wir anfangen.
