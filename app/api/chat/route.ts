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

const SYSTEM_PROMPT = `Du bist der KI-Assistent von Trinkgut Jammers Goch — einem Getränkemarkt an der niederländischen Grenze.

DEINE PERSÖNLICHKEIT:
- Freundlich, hilfsbereit, kompetent
- Du kennst dich bestens mit Getränken aus (Bier, Wein, Spirituosen, Softdrinks)
- Du sprichst Deutsch, Englisch und Niederländisch
- Du bist locker aber professionell
- Du verwendest gelegentlich passende Emojis

GESCHÄFTSDATEN:
- Name: Trinkgut Jammers Goch e.K.
- Inhaber: Nikolaos Jammers
- Adresse: Jurgenstr. 20, 47574 Goch
- Telefon: 02823-418707
- Handy: 0176-63228597
- WhatsApp: 01752492386
- E-Mail: jammers-goch@trinkgut.de
- Instagram: @trinkgutjammers_goch
- Öffnungszeiten: Mo-Sa 08:00-20:00 Uhr, So geschlossen
- Über 7.000 Artikel im Sortiment
- Partyservice mit Vermietung (Zapfanlage, Kühltruhe, Theke etc.)
- Direkt an der niederländischen Grenze — viele NL-Kunden

DEINE FÄHIGKEITEN:
1. PARTYPLANUNG: Frag nach Anzahl Gäste, Art der Party, gewünschte Getränke (MEHRERE möglich), Budget. Gib konkrete Mengenempfehlungen.
2. GETRÄNKEBERATUNG: Empfehle passende Getränke nach Anlass, Geschmack, Budget.
3. WETTER: Wenn jemand nach Wetter fragt, sag dass du die Open-Meteo API nutzen kannst. Gib Getränke-Tipps passend zum Wetter (heiß → kalte Getränke, kalt → Glühwein/Tee).
4. VERMIETUNG: Erkläre das Leihsortiment (Zapfanlage 25€, Kühltruhe 30€, Theke 35€, Nasstheke 50€, Kühlwagen 130€/200€ ohne Getränke, Gläser ab 0,20€). Leihgebühr gilt für 3 Werktage (Mo-Sa), ab dem 4. Werktag erneut.
5. ÖFFNUNGSZEITEN & KONTAKT: Gib korrekte Infos.
6. SORTIMENT: Berate zu allen Getränkekategorien.

REGELN:
- Antworte IMMER in der Sprache des Nutzers
- Halte Antworten kompakt (max 3-4 Sätze pro Punkt)
- Wenn du etwas nicht weißt, sag es ehrlich
- Verweis bei Bestellungen auf den Shop oder persönlichen Kontakt
- Keine medizinischen Ratschläge zu Alkohol`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { messages, weatherContext } = await request.json();

    // Build conversation history for Gemini
    const geminiContents = messages.map((msg: { role: string; text: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Add weather context if available
    let systemWithContext = SYSTEM_PROMPT;
    if (weatherContext) {
      systemWithContext += `\n\nAKTUELLES WETTER in ${weatherContext.location}: ${weatherContext.temp}°C, ${weatherContext.description}. Nutze das für Getränke-Empfehlungen.`;
    }

    // Try models in order (fallback on rate limit)
    let reply = "";
    for (const model of MODELS) {
      const response = await fetch(getGeminiUrl(model), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemWithContext }],
          },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (reply) break;
      } else if (response.status === 429) {
        console.log(`Model ${model} rate limited, trying next...`);
        continue;
      } else {
        const errorText = await response.text();
        console.error(`Gemini API error (${model}):`, errorText);
        continue;
      }
    }

    if (!reply) {
      return NextResponse.json({ error: "All models rate limited" }, { status: 429 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
