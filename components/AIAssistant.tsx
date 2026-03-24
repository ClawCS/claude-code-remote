"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
}

const QUICK_STARTERS = [
  "🎉 Party planen",
  "🍺 Getränk empfehlen",
  "🌤️ Wetter & Getränke",
  "⏰ Öffnungszeiten",
  "📞 Kontakt",
  "🚛 Vermietung & Preise",
];

let msgCounter = 0;
function nextId() {
  return ++msgCounter;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: "bot",
      text: "Hallo! 👋 Ich bin der Jammers Assistent — powered by KI. Frag mich alles zu Getränken, Partyplanung, Wetter oder unserem Service!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setHasInteracted(true);

    const userMsg: Message = { id: nextId(), role: "user", text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      // Build conversation history (last 10 messages for context)
      const history = newMessages.slice(-10).map((m) => ({
        role: m.role === "bot" ? "model" : "user",
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "bot", text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "bot",
          text: "Entschuldigung, da ist etwas schiefgelaufen. Versuch es bitte nochmal oder ruf uns an: 02823-418707 📞",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Floating Robot Button */}
      <div className="fixed bottom-28 left-6 z-40 group">
        {!isOpen && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white text-secondary text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            Frag mich was!
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white" />
          </div>
        )}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen
              ? "bg-secondary shadow-lg"
              : "bg-gradient-to-br from-primary via-red-500 to-red-700 shadow-[0_4px_20px_rgba(220,38,38,0.4)] hover:shadow-[0_6px_28px_rgba(220,38,38,0.5)]"
          }`}
          aria-label={isOpen ? "Chat schließen" : "Chat öffnen"}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-9 h-9 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="3" r="1.5" />
              <rect x="11.25" y="4.5" width="1.5" height="2" rx="0.5" />
              <rect x="5" y="7" width="14" height="12" rx="3" />
              <circle cx="9" cy="12" r="1.5" fill="#fff" opacity="0.9" />
              <circle cx="15" cy="12" r="1.5" fill="#fff" opacity="0.9" />
              <rect x="9.5" y="15.5" width="5" height="1.5" rx="0.75" fill="#fff" opacity="0.7" />
              <rect x="3" y="10" width="2" height="4" rx="1" />
              <rect x="19" y="10" width="2" height="4" rx="1" />
            </svg>
          )}

          {/* Notification dot */}
          {!hasInteracted && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-48 left-6 z-50 w-[calc(100vw-3rem)] max-w-[400px] animate-scale-in origin-bottom-left">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden flex flex-col" style={{ height: "min(520px, calc(100vh - 240px))" }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-red-700 px-4 py-3 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="5" y="7" width="14" height="12" rx="3" />
                    <circle cx="9" cy="12" r="1.5" fill="#fff" opacity="0.9" />
                    <circle cx="15" cy="12" r="1.5" fill="#fff" opacity="0.9" />
                    <circle cx="12" cy="3" r="1.2" />
                    <rect x="11.4" y="4.2" width="1.2" height="1.5" rx="0.4" />
                  </svg>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">Jammers KI-Assistent</h3>
                <p className="text-white/70 text-xs">Powered by Gemini AI</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-gray-100 text-secondary rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Quick starters (only show if no user messages yet) */}
              {messages.length === 1 && !isTyping && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {QUICK_STARTERS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-secondary text-xs font-medium rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-gray-100 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Schreib mir eine Nachricht..."
                className="flex-1 px-3.5 py-2 bg-gray-50 rounded-xl text-sm text-secondary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white disabled:opacity-30 hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
