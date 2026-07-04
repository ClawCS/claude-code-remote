import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BEWERBUNGEN_DIR = path.join(process.cwd(), "data", "bewerbungen");
const INDEX_FILE = path.join(BEWERBUNGEN_DIR, "_index.json");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB pro Datei
const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30 MB total
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const FILE_FIELDS = ["lebenslauf", "foto", "bewerbung", "zeugnisse"] as const;
type FileField = (typeof FILE_FIELDS)[number];

type StoredBewerbung = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  telefon: string;
  position: string;
  nachricht: string;
  files: { field: FileField; originalName: string; storedName: string; size: number; mimeType: string }[];
};

function generateId(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

async function loadIndex(): Promise<StoredBewerbung[]> {
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf-8");
    return JSON.parse(raw) as StoredBewerbung[];
  } catch {
    return [];
  }
}

async function saveIndex(list: StoredBewerbung[]): Promise<void> {
  await fs.mkdir(BEWERBUNGEN_DIR, { recursive: true });
  await fs.writeFile(INDEX_FILE, JSON.stringify(list, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  // Rate-Limit: max. 5 Bewerbungen pro 15 Min. pro IP (verhindert Disk-Fill/DoS)
  const limit = rateLimit(request, { key: "bewerbung", max: 5, windowMs: 15 * 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Bewerbungen in kurzer Zeit. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // Content-Length VOR dem Buffern prüfen (formData() lädt sonst den ganzen Body in den Speicher)
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength && contentLength > MAX_TOTAL_SIZE + 1024 * 1024) {
    return NextResponse.json(
      { error: "Gesamtgröße aller Anhänge überschreitet 30 MB." },
      { status: 413 }
    );
  }

  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const telefon = String(formData.get("telefon") || "").trim();
    const position = String(formData.get("position") || "").trim();
    const nachricht = String(formData.get("nachricht") || "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name fehlt oder zu kurz." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ungueltige E-Mail-Adresse." }, { status: 400 });
    }
    if (!position) {
      return NextResponse.json({ error: "Bitte Position auswaehlen." }, { status: 400 });
    }

    // Dateien sammeln (Lebenslauf & Bewerbungsschreiben einzeln, Zeugnisse mehrfach möglich)
    const collected: { field: FileField; file: File }[] = [];
    let totalSize = 0;

    for (const field of FILE_FIELDS) {
      const entries = formData.getAll(field);
      for (const entry of entries) {
        if (!(entry instanceof File) || entry.size === 0) continue;

        if (entry.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Datei "${entry.name}" ist zu groß (max. 10 MB).` },
            { status: 413 }
          );
        }
        // MIME-Typ MUSS gesetzt und erlaubt sein (leerer Content-Type darf die
        // Allowlist nicht umgehen). Zusätzlich die Dateiendung als zweite Hürde prüfen.
        const ext = (entry.name.split(".").pop() || "").toLowerCase();
        const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif", "doc", "docx"]);
        if (!entry.type || !ALLOWED_TYPES.has(entry.type) || !ALLOWED_EXT.has(ext)) {
          return NextResponse.json(
            { error: `Dateityp von "${entry.name}" nicht erlaubt. Nur PDF, JPG, PNG, DOC/DOCX.` },
            { status: 415 }
          );
        }
        totalSize += entry.size;
        collected.push({ field, file: entry });
      }
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Gesamtgröße aller Anhänge überschreitet 30 MB." },
        { status: 413 }
      );
    }

    // Speichern
    const id = generateId();
    const targetDir = path.join(BEWERBUNGEN_DIR, id);
    await fs.mkdir(targetDir, { recursive: true });

    const fileMeta: StoredBewerbung["files"] = [];
    for (const { field, file } of collected) {
      const safeName = sanitizeFilename(file.name || `${field}.bin`);
      const storedName = `${field}-${Date.now()}-${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(targetDir, storedName), buffer);
      fileMeta.push({
        field,
        originalName: file.name,
        storedName,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      });
    }

    const record: StoredBewerbung = {
      id,
      createdAt: new Date().toISOString(),
      name,
      email,
      telefon,
      position,
      nachricht,
      files: fileMeta,
    };

    // Bewerbungsdaten als JSON in den Ordner legen
    await fs.writeFile(
      path.join(targetDir, "_meta.json"),
      JSON.stringify(record, null, 2),
      "utf-8"
    );

    // Zentralen Index aktualisieren
    const index = await loadIndex();
    index.unshift(record);
    await saveIndex(index);

    return NextResponse.json({
      success: true,
      id,
      filesStored: fileMeta.length,
      message: "Bewerbung erfolgreich eingegangen.",
    });
  } catch (error) {
    console.error("Bewerbung upload error:", error);
    return NextResponse.json(
      { error: "Bewerbung konnte nicht verarbeitet werden. Bitte spaeter erneut versuchen." },
      { status: 500 }
    );
  }
}
