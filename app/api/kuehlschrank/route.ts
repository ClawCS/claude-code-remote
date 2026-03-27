import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Kein Bild hochgeladen" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

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

    return NextResponse.json(
      { error: `Alle Modelle fehlgeschlagen: ${lastError?.message}` },
      { status: 500 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: `Fehler bei der Verarbeitung: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
