"use client";

import { useState, useEffect } from "react";

const weatherIcon = (code: number) => {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  return "⛈️";
};

const weatherText = (code: number) => {
  if (code === 0) return "Sonnig";
  if (code <= 2) return "Leicht bewölkt";
  if (code === 3) return "Bewölkt";
  if (code <= 48) return "Nebel";
  if (code <= 55) return "Nieselregen";
  if (code <= 67) return "Regen";
  if (code <= 77) return "Schnee";
  if (code <= 82) return "Schauer";
  return "Gewitter";
};

const dayName = (d: string) => {
  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  return days[new Date(d).getDay()];
};

type WeatherData = {
  temp: number;
  code: number;
  city: string;
  wind: number;
  daily: { day: string; max: number; min: number; code: number }[];
};

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        let lat = 51.68, lon = 6.16, city = "Goch";

        // 1. Browser Geolocation (präzise, fragt User-Erlaubnis)
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 600000 })
          );
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          // Reverse Geocoding für Stadtnamen
          try {
            const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`, { signal: AbortSignal.timeout(3000) });
            if (rev.ok) {
              const r = await rev.json();
              city = r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || "Dein Standort";
            }
          } catch { city = "Dein Standort"; }
        } catch {
          // 2. Fallback: IP-basiert
          try {
            const geo = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
            if (geo.ok) {
              const g = await geo.json();
              if (g.latitude) { lat = g.latitude; lon = g.longitude; city = g.city || "Goch"; }
            }
          } catch { /* fallback Goch */ }
        }

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=3`
        );
        if (!res.ok) return;
        const w = await res.json();
        setData({
          temp: Math.round(w.current.temperature_2m),
          code: w.current.weathercode,
          wind: Math.round(w.current.windspeed_10m),
          city,
          daily: w.daily.time.map((t: string, i: number) => ({
            day: dayName(t),
            max: Math.round(w.daily.temperature_2m_max[i]),
            min: Math.round(w.daily.temperature_2m_min[i]),
            code: w.daily.weathercode[i],
          })),
        });
      } catch { /* silent */ }
    }
    load();
  }, []);

  if (!data) return null;

  return (
    <>
      {/* Compact pill — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 text-white hover:bg-black/40 transition-all cursor-pointer"
      >
        <span className="text-lg leading-none">{weatherIcon(data.code)}</span>
        <span className="text-sm font-bold">{data.temp}°</span>
        <span className="text-[10px] text-white/60 hidden sm:inline">{data.city}</span>
        <svg className={`h-3 w-3 text-white/50 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded dropdown */}
      {expanded && (
        <div className="absolute top-full right-0 mt-2 bg-black/40 backdrop-blur-xl border border-white/15 rounded-2xl p-4 min-w-[220px] text-white animate-fade-in-up shadow-2xl z-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-extrabold">{data.temp}°C</p>
              <p className="text-xs text-white/60">{weatherText(data.code)} · {data.wind} km/h</p>
            </div>
            <span className="text-4xl">{weatherIcon(data.code)}</span>
          </div>
          <p className="text-[10px] text-white/40 mb-3">📍 {data.city}</p>

          <div className="flex gap-2">
            {data.daily.map((d, i) => (
              <div key={i} className="flex-1 bg-white/10 rounded-xl p-2 text-center">
                <p className="text-[10px] font-semibold text-white/70">{i === 0 ? "Heute" : d.day}</p>
                <p className="text-lg my-0.5">{weatherIcon(d.code)}</p>
                <p className="text-xs font-bold">{d.max}°</p>
                <p className="text-[10px] text-white/50">{d.min}°</p>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-white/70">
            {data.temp > 25 ? "🍺 Perfektes Wetter für ein kühles Bier!" :
             data.temp > 15 ? "🥤 Ideal für eine erfrischende Schorle!" :
             data.temp > 5 ? "☕ Zeit für einen Glühwein!" :
             "🥃 Wärm dich auf mit einem Irish Coffee!"}
          </div>
        </div>
      )}
    </>
  );
}
