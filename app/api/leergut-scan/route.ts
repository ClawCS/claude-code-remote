import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

function getGeminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

const ANALYSIS_PROMPT = `Analysiere dieses Foto von Leergut/Pfandflaschen. Zähle jede Flasche/Dose einzeln und so genau wie möglich. Kategorisiere sie in folgende Typen:

- einweg_pet: Einweg-PET-Flaschen (meist mit Pfandlogo, zerknitterbar)
- einweg_dose: Einweg-Dosen (Aluminium/Blech)
- mehrweg_bier_033: Mehrweg-Bierflaschen 0,33L (klein, Glas)
- mehrweg_bier_05: Mehrweg-Bierflaschen 0,5L (groß, Glas)
- mehrweg_wasser_pet: Mehrweg-Wasserflaschen PET (stabil, meist blau/klar)
- mehrweg_glas: Mehrweg-Glasflaschen 0,7/0,75L (Wein, Saft, Wasser)
- bierkasten_20: Bierkästen 20er
- bierkasten_24: Bierkästen 24er
- wasserkasten: Wasserkästen 12er (PET oder Glas)

Antworte NUR mit validem JSON, ohne Markdown-Formatierung, ohne Codeblöcke. Genau dieses Format:
{"einweg_pet":0,"einweg_dose":0,"mehrweg_bier_033":0,"mehrweg_bier_05":0,"mehrweg_wasser_pet":0,"mehrweg_glas":0,"bierkasten_20":0,"bierkasten_24":0,"wasserkasten":0}

Wenn du keine Flaschen/Dosen erkennst, gib alle Werte als 0 zurück.`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    let result = null;

    for (const model of MODELS) {
      const response = await fetch(getGeminiUrl(model), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: ANALYSIS_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Extract JSON from the response (handle potential markdown wrapping)
        const jsonMatch = text.match(/\{[^}]+\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
            break;
          } catch {
            console.error("Failed to parse Gemini response JSON:", text);
            continue;
          }
        }
      } else if (response.status === 429) {
        console.log(`Model ${model} rate limited, trying next...`);
        continue;
      } else {
        const errorText = await response.text();
        console.error(`Gemini API error (${model}):`, errorText);
        continue;
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "Konnte das Bild nicht analysieren. Bitte versuche es erneut." },
        { status: 500 }
      );
    }

    // Ensure all expected keys exist with defaults
    const normalized = {
      einweg_pet: Number(result.einweg_pet) || 0,
      einweg_dose: Number(result.einweg_dose) || 0,
      mehrweg_bier_033: Number(result.mehrweg_bier_033) || 0,
      mehrweg_bier_05: Number(result.mehrweg_bier_05) || 0,
      mehrweg_wasser_pet: Number(result.mehrweg_wasser_pet) || 0,
      mehrweg_glas: Number(result.mehrweg_glas) || 0,
      bierkasten_20: Number(result.bierkasten_20) || 0,
      bierkasten_24: Number(result.bierkasten_24) || 0,
      wasserkasten: Number(result.wasserkasten) || 0,
    };

    return NextResponse.json({ result: normalized });
  } catch (error) {
    console.error("Leergut scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
