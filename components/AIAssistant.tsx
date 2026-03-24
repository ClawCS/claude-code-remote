"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ═══ Types ═══ */
interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
  quickReplies?: string[];
}

type FlowState =
  | { type: "idle" }
  | { type: "party"; step: "guests" | "drinks" | "budget" }
  | { type: "recommend"; step: "occasion" | "taste" }
  | { type: "event-weather" };

/* ═══ Data ═══ */
const OPENING_HOURS = [
  "Mo - Sa: 08:00 - 20:00 Uhr",
  "So: geschlossen",
];

const CONTACT_INFO = {
  phone: "02823-418707",
  whatsapp: "https://wa.me/491752492386",
  email: "jammers-goch@trinkgut.de",
  address: "Jurgenstr. 20, 47574 Goch",
};

const DRINK_RECOMMENDATIONS: Record<string, Record<string, string[]>> = {
  party: {
    bier: ["Flensburger Kasten (12,99\u20ac)", "Bitburger Pils Kasten (11,99\u20ac)", "Schl\u00f6sser Alt Kasten (9,99\u20ac)"],
    wein: ["Casa Vinicola Sartori Pinot Grigio (4,99\u20ac)", "Freixenet Mia (4,99\u20ac)"],
    softdrinks: ["Coca-Cola Kasten (14,99\u20ac)", "Gerolsteiner Sp./Nat. (4,79\u20ac)"],
    mixed: ["Salitos Tequila (1,29\u20ac/Fl.)", "Bacardi Rum (12,99\u20ac)"],
  },
  geburtstag: {
    sekt: ["Freixenet Mia (4,99\u20ac)", "Henkell Trocken"],
    bier: ["Flensburger Kasten (12,99\u20ac)", "Warsteiner Kasten"],
    softdrinks: ["Coca-Cola Kasten (14,99\u20ac)", "S\u00e4fte"],
  },
  grillabend: {
    bier: ["Bitburger Pils Kasten (11,99\u20ac)", "Flensburger (12,99\u20ac)"],
    wasser: ["Gerolsteiner (4,79\u20ac)", "Apollinaris"],
    softdrinks: ["Coca-Cola Kasten (14,99\u20ac)", "Sprite/Fanta"],
  },
  romantisch: {
    wein: ["Casa Vinicola Sartori Pinot Grigio (4,99\u20ac)", "Freixenet Mia Ros\u00e9"],
    sekt: ["Freixenet Mia (4,99\u20ac)"],
  },
};

const TASTE_RECOMMENDATIONS: Record<string, string[]> = {
  herb: ["Bitburger Pils (11,99\u20ac)", "Flensburger Pilsener (12,99\u20ac)", "Warsteiner Pils"],
  s\u00fc\u00df: ["Paulaner Spezi (11,99\u20ac)", "Coca-Cola (14,99\u20ac)", "Freixenet Mia (4,99\u20ac)"],
  fruchtig: ["Granini S\u00e4fte", "Salitos Tequila (1,29\u20ac)", "Freixenet Mia Sangria (4,99\u20ac)"],
  spritzig: ["Gerolsteiner Sprudel (4,79\u20ac)", "Apollinaris", "Schweppes Tonic"],
  mild: ["Schl\u00f6sser Alt (9,99\u20ac)", "Paulaner Spezi (11,99\u20ac)", "Weine"],
};

const HOT_WEATHER_DRINKS = [
  "Gerolsteiner Wasser (4,79\u20ac)",
  "Coca-Cola Kasten (14,99\u20ac)",
  "Flensburger Pils, eiskalt (12,99\u20ac)",
  "Salitos Tequila Beer (1,29\u20ac)",
];

const COLD_WEATHER_DRINKS = [
  "Gl\u00fchwein-Tipp: Fragen Sie im Markt!",
  "Freixenet Mia Sangria (4,99\u20ac)",
  "Warme Getr\u00e4nke im Sortiment",
  "Hei\u00dfer Kakao mit Baileys",
];

/* ═══ Helper ═══ */
let msgId = 0;
function createMsg(role: "bot" | "user", text: string, quickReplies?: string[]): Message {
  return { id: ++msgId, role, text, quickReplies };
}

/* ═══ Component ═══ */
export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [flow, setFlow] = useState<FlowState>({ type: "idle" });
  const [partyData, setPartyData] = useState<{ guests?: string; drinks?: string; budget?: string }>({});
  const [recommendData, setRecommendData] = useState<{ occasion?: string }>({});
  const [pulse, setPulse] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Stop pulse after first open
  useEffect(() => {
    if (isOpen) setPulse(false);
  }, [isOpen]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        createMsg(
          "bot",
          "Hallo! Ich bin der Jammers Assistent. Wie kann ich dir helfen?",
          ["Party planen", "Getr\u00e4nk empfehlen", "Event-Wetter", "\u00d6ffnungszeiten", "Kontakt"]
        ),
      ]);
    }
  }, [isOpen, messages.length]);

  const addBotReply = useCallback((text: string, quickReplies?: string[]) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, createMsg("bot", text, quickReplies)]);
    }, 600 + Math.random() * 600);
  }, []);

  const handleUserMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, createMsg("user", trimmed)]);
      setInput("");

      const lower = trimmed.toLowerCase();

      // ── Flow-based handling ──
      if (flow.type === "party") {
        if (flow.step === "guests") {
          setPartyData((p) => ({ ...p, guests: trimmed }));
          setFlow({ type: "party", step: "drinks" });
          addBotReply("Welche Getr\u00e4nke sollen dabei sein?", ["Bier", "Wein", "Softdrinks", "Mixed / Alles"]);
          return;
        }
        if (flow.step === "drinks") {
          setPartyData((p) => ({ ...p, drinks: trimmed }));
          setFlow({ type: "party", step: "budget" });
          addBotReply("Und welches Budget hast du ungef\u00e4hr? (z.B. 50\u20ac, 100\u20ac, 200\u20ac)");
          return;
        }
        if (flow.step === "budget") {
          setPartyData((p) => ({ ...p, budget: trimmed }));
          setFlow({ type: "idle" });

          const drinkType = (partyData.drinks || "mixed").toLowerCase();
          const key = drinkType.includes("bier") ? "bier" : drinkType.includes("wein") ? "wein" : drinkType.includes("soft") ? "softdrinks" : "mixed";
          const recs = DRINK_RECOMMENDATIONS.party[key] || DRINK_RECOMMENDATIONS.party.mixed;

          addBotReply(
            `Super! F\u00fcr ${partyData.guests || "deine"} G\u00e4ste mit Budget ${trimmed} empfehle ich:\n\n${recs.map((r) => `\u2022 ${r}`).join("\n")}\n\nKomm vorbei oder ruf uns an \u2013 wir stellen dir alles zusammen!`,
            ["Noch eine Frage", "\u00d6ffnungszeiten", "Kontakt"]
          );
          setPartyData({});
          return;
        }
      }

      if (flow.type === "recommend") {
        if (flow.step === "occasion") {
          setRecommendData({ occasion: trimmed });
          setFlow({ type: "recommend", step: "taste" });
          addBotReply("Und welchen Geschmack bevorzugst du?", ["Herb", "S\u00fc\u00df", "Fruchtig", "Spritzig", "Mild"]);
          return;
        }
        if (flow.step === "taste") {
          setFlow({ type: "idle" });
          const tasteKey = lower.includes("herb") ? "herb" : lower.includes("s\u00fc\u00df") || lower.includes("suess") ? "s\u00fc\u00df" : lower.includes("fruchtig") ? "fruchtig" : lower.includes("spritzig") ? "spritzig" : "mild";
          const recs = TASTE_RECOMMENDATIONS[tasteKey] || TASTE_RECOMMENDATIONS.mild;

          const occasion = recommendData.occasion?.toLowerCase() || "";
          const occasionKey = occasion.includes("party") ? "party" : occasion.includes("geburtstag") ? "geburtstag" : occasion.includes("grill") ? "grillabend" : occasion.includes("romantisch") || occasion.includes("date") ? "romantisch" : "";
          const occasionRecs = occasionKey ? DRINK_RECOMMENDATIONS[occasionKey] : null;

          let reply = `F\u00fcr den Geschmack "${tasteKey}" empfehle ich:\n\n${recs.map((r) => `\u2022 ${r}`).join("\n")}`;
          if (occasionRecs) {
            const allOccasion = Object.values(occasionRecs).flat().slice(0, 3);
            reply += `\n\nPassend zu "${recommendData.occasion}":\n${allOccasion.map((r) => `\u2022 ${r}`).join("\n")}`;
          }
          reply += "\n\nSchau bei uns im Markt vorbei f\u00fcr noch mehr Auswahl!";

          addBotReply(reply, ["Noch eine Frage", "Party planen", "Kontakt"]);
          setRecommendData({});
          return;
        }
      }

      // ── Topic detection (idle) ──
      if (lower.includes("party") || lower === "party planen") {
        setFlow({ type: "party", step: "guests" });
        addBotReply("Klar, ich helfe dir bei der Partyplanung! Wie viele G\u00e4ste erwartest du?", ["5-10", "10-25", "25-50", "50+"]);
        return;
      }

      if (lower.includes("empfehl") || lower.includes("getr\u00e4nk") || lower === "getr\u00e4nk empfehlen") {
        setFlow({ type: "recommend", step: "occasion" });
        addBotReply("Gerne! F\u00fcr welchen Anlass suchst du etwas?", ["Party", "Geburtstag", "Grillabend", "Romantischer Abend", "Einfach so"]);
        return;
      }

      if (lower.includes("wetter") || lower === "event-wetter") {
        addBotReply(
          "Schau dir das Wetter-Widget oben auf der Startseite an! \u2600\uFE0F\n\nAls Faustregel:\n\u2022 Bei Hitze (25\u00b0+): " +
          HOT_WEATHER_DRINKS.slice(0, 2).join(", ") +
          "\n\u2022 Bei K\u00e4lte (unter 10\u00b0): " +
          COLD_WEATHER_DRINKS.slice(0, 2).join(", ") +
          "\n\nKomm vorbei und wir beraten dich pers\u00f6nlich!",
          ["Party planen", "Getr\u00e4nk empfehlen", "\u00d6ffnungszeiten"]
        );
        return;
      }

      if (lower.includes("\u00f6ffnung") || lower.includes("offen") || lower.includes("zeiten") || lower === "\u00f6ffnungszeiten") {
        addBotReply(
          `Unsere \u00d6ffnungszeiten:\n\n${OPENING_HOURS.map((h) => `\u2022 ${h}`).join("\n")}\n\nWir freuen uns auf deinen Besuch!`,
          ["Route planen", "Kontakt", "Noch eine Frage"]
        );
        return;
      }

      if (lower.includes("kontakt") || lower.includes("telefon") || lower.includes("mail") || lower.includes("adresse")) {
        addBotReply(
          `So erreichst du uns:\n\n\u260E\uFE0F ${CONTACT_INFO.phone}\n\uD83D\uDCF1 WhatsApp: wa.me/491752492386\n\u2709\uFE0F ${CONTACT_INFO.email}\n\uD83D\uDCCD ${CONTACT_INFO.address}`,
          ["\u00d6ffnungszeiten", "Route planen", "Noch eine Frage"]
        );
        return;
      }

      if (lower.includes("route") || lower.includes("anfahrt") || lower.includes("navi")) {
        addBotReply(
          `Unsere Adresse:\n\uD83D\uDCCD ${CONTACT_INFO.address}\n\nKlicke auf den blauen Pin-Button rechts unten f\u00fcr Google Maps Navigation!`,
          ["\u00d6ffnungszeiten", "Kontakt", "Noch eine Frage"]
        );
        return;
      }

      if (lower.includes("noch eine frage") || lower.includes("zur\u00fcck") || lower.includes("start") || lower.includes("men\u00fc")) {
        addBotReply("Klar! Wie kann ich dir weiterhelfen?", ["Party planen", "Getr\u00e4nk empfehlen", "Event-Wetter", "\u00d6ffnungszeiten", "Kontakt"]);
        return;
      }

      // Default
      addBotReply(
        "Das habe ich leider nicht verstanden. W\u00e4hle eine der Optionen oder ruf uns direkt an: " + CONTACT_INFO.phone,
        ["Party planen", "Getr\u00e4nk empfehlen", "\u00d6ffnungszeiten", "Kontakt"]
      );
    },
    [flow, partyData, recommendData, addBotReply]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserMessage(input);
  };

  return (
    <>
      {/* ── Floating Chat-Bubble Button ── */}
      <div className="fixed bottom-12 left-6 z-40 group">
        {/* Tooltip label */}
        {!isOpen && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white text-secondary text-xs font-semibold px-3 py-1.5 rounded-lg shadow-elevated whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            Frag mich was!
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white" />
          </div>
        )}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen
              ? "bg-secondary shadow-lg rotate-0"
              : "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 shadow-[0_4px_20px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_28px_rgba(139,92,246,0.5)]"
          }`}
          aria-label={isOpen ? "Chat schließen" : "Chat öffnen"}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-white transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          ) : (
            <div className="relative">
              {/* Robot face icon */}
              <svg className="w-9 h-9 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                {/* Head */}
                <rect x="3" y="4" width="18" height="14" rx="3" ry="3" />
                {/* Antenna */}
                <line x1="12" y1="4" x2="12" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="0.5" r="1.2" />
                {/* Left eye */}
                <circle cx="8.5" cy="10" r="2" fill="#a78bfa" />
                <circle cx="8.5" cy="10" r="1" fill="white" />
                {/* Right eye */}
                <circle cx="15.5" cy="10" r="2" fill="#a78bfa" />
                <circle cx="15.5" cy="10" r="1" fill="white" />
                {/* Smile */}
                <path d="M8 15c1.5 1.5 6.5 1.5 8 0" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          )}

          {/* Pulse ring */}
          {pulse && !isOpen && (
            <>
              <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" style={{ animationDuration: "2s" }} />
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" style={{ animationDuration: "1.5s" }} />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-green-400 border-2 border-white items-center justify-center">
                  <span className="text-[8px] font-bold text-white">1</span>
                </span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[calc(100vw-3rem)] max-w-[380px] animate-scale-in origin-bottom-left">
          <div className="rounded-2xl overflow-hidden shadow-elevated border border-white/20 bg-white/80 backdrop-blur-xl flex flex-col" style={{ height: "min(520px, calc(100vh - 140px))" }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-red-600 to-accent p-4 flex items-center gap-3 shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 5.58 2 10c0 2.24 1.12 4.26 2.94 5.7L4 20l4.45-2.04C9.58 18.3 10.76 18.5 12 18.5c5.52 0 10-3.58 10-8S17.52 2 12 2z"/>
                  </svg>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary ring-2 ring-green-400/30" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">Jammers Assistent</h3>
                <p className="text-green-200 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Online</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors p-1"
                aria-label="Chat schlie\u00dfen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollBehavior: "smooth" }}>
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-gray-100 text-secondary rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                  {/* Quick replies */}
                  {msg.quickReplies && msg.id === messages[messages.length - 1]?.id && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          onClick={() => handleUserMessage(qr)}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all font-medium"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border/50 shrink-0 bg-white/60 backdrop-blur">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Schreib eine Nachricht..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-primary/30 focus:bg-white outline-none text-sm text-secondary placeholder:text-muted transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shrink-0"
                  aria-label="Senden"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
