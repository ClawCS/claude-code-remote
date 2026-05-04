import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

function getGeminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

const SYSTEM_PROMPT = `Du bist ein humorvoller Getränke-Experte von Trinkgut Jammers Goch. Analysiere dieses Kühlschrank-Foto. Bewerte den Getränkebestand auf einer Skala von 1-10. Gib eine lustige Bewertung und empfehle konkret welche Getränke fehlen (aus unserem Sortiment: Bier wie Flensburger, Bitburger, Erdinger, Heineken; Wein wie Doppio Passo, Rioja Vega; Spirituosen wie Aperol, Jack Daniel's; Softdrinks wie San Pellegrino, Coca-Cola etc.).

Antworte AUSSCHLIESSLICH als valides JSON in diesem Format:
{"score": 7, "bewertung": "lustiger Text über den Kühlschrank", "empfehlungen": ["Produkt 1", "Produkt 2", "Produkt 3"], "roast": "witziger Spruch"}

WICHTIG:
- Score 1-3: katastrophal, fast leer oder nur Wasser
- Score 4-5: ausbaufähig, ein paar Getränke aber große Lücken
- Score 6-7: solide, aber es fehlt noch was
- Score 8-9: sehr gut bestückt
- Score 10: Perfektion, wie ein Mini-Trinkgut
- Sei witzig und frech aber nie beleidigend
- Empfehle 3-5 konkrete Produkte die fehlen
- Der Roast sollte ein kurzer, lustiger Einzeiler sein
- Antworte NUR mit dem JSON, kein anderer Text`;

export async function POST(req: NextRequest) {
  const limit = rateLimit(req, { key: "kuehlschrank", max: 10, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte einen Moment warten." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Service derzeit nicht verfügbar." }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "Kein Bild hochgeladen." }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "Bildformat nicht unterstützt (nur JPEG, PNG, WebP)." },
        { status: 400 }
      );
    }

    if (imageFile.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Datei ist zu groß (max. 8 MB)." },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type;

    // Try each model in order
    let lastError: Error | null = null;
    for (const model of MODELS) {
      try {
        const response = await fetch(getGeminiUrl(model), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: SYSTEM_PROMPT },
                  {
                    inlineData: {
                      mimeType,
                      data: base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 1024,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(`${model}: ${response.status} - ${errText}`);
          continue;
        }

        const data = await response.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Parse JSON from response (handle potential markdown wrapping)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          lastError = new Error(`${model}: No JSON in response`);
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (
          typeof parsed.score !== "number" ||
          !parsed.bewertung ||
          !Array.isArray(parsed.empfehlungen) ||
          !parsed.roast
        ) {
          lastError = new Error(`${model}: Invalid response structure`);
          continue;
        }

        // Clamp score
        parsed.score = Math.max(1, Math.min(10, Math.round(parsed.score)));

        return NextResponse.json(parsed);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    console.error("Kuehlschrank API error:", lastError);
    return NextResponse.json(
      { error: "Bildanalyse derzeit nicht möglich. Bitte später erneut versuchen." },
      { status: 503 }
    );
  } catch (err) {
    console.error("Kuehlschrank API error:", err);
    return NextResponse.json(
      { error: "Fehler bei der Verarbeitung. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}
