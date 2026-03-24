"use client";

import { useState, useEffect } from "react";

/* ═══ WMO Weathercode Mapping ═══ */
interface WeatherInfo {
  icon: string;
  label: string;
  gradient: string;
}

function getWeatherInfo(code: number): WeatherInfo {
  if (code === 0) return { icon: "\u2600\uFE0F", label: "Sonnig", gradient: "from-amber-400 via-orange-400 to-yellow-300" };
  if (code <= 3) return { icon: "\u26C5", label: "Bew\u00f6lkt", gradient: "from-gray-400 via-slate-400 to-gray-300" };
  if (code >= 45 && code <= 48) return { icon: "\uD83C\uDF2B\uFE0F", label: "Nebel", gradient: "from-gray-500 via-gray-400 to-slate-300" };
  if (code >= 51 && code <= 55) return { icon: "\uD83C\uDF26\uFE0F", label: "Nieselregen", gradient: "from-blue-400 via-slate-400 to-blue-300" };
  if (code >= 56 && code <= 57) return { icon: "\u2744\uFE0F", label: "Gefrierender Nieselregen", gradient: "from-cyan-400 via-blue-300 to-slate-300" };
  if (code >= 61 && code <= 67) return { icon: "\uD83C\uDF27\uFE0F", label: "Regen", gradient: "from-blue-500 via-blue-400 to-slate-400" };
  if (code >= 71 && code <= 77) return { icon: "\u2744\uFE0F", label: "Schnee", gradient: "from-blue-200 via-white to-cyan-100" };
  if (code >= 80 && code <= 82) return { icon: "\uD83C\uDF26\uFE0F", label: "Schauer", gradient: "from-blue-500 via-gray-400 to-blue-300" };
  if (code >= 95 && code <= 99) return { icon: "\u26C8\uFE0F", label: "Gewitter", gradient: "from-purple-600 via-gray-700 to-indigo-500" };
  return { icon: "\uD83C\uDF24\uFE0F", label: "Wechselhaft", gradient: "from-gray-400 via-blue-300 to-gray-300" };
}

function getTempGradient(temp: number): string {
  if (temp <= 0) return "from-blue-600 via-cyan-500 to-blue-400";
  if (temp <= 10) return "from-blue-500 via-sky-400 to-cyan-300";
  if (temp <= 20) return "from-emerald-500 via-teal-400 to-green-300";
  if (temp <= 30) return "from-orange-500 via-amber-400 to-yellow-300";
  return "from-red-600 via-orange-500 to-amber-400";
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

interface WeatherData {
  current: {
    temperature: number;
    weathercode: number;
    windspeed: number;
  };
  daily: {
    dates: string[];
    maxTemps: number[];
    minTemps: number[];
    weathercodes: number[];
  };
  location: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      // Goch fallback
      let lat = 51.68;
      let lon = 6.16;
      let location = "Goch";

      try {
        const ipRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            lat = ipData.latitude;
            lon = ipData.longitude;
            location = ipData.city || "Dein Standort";
          }
        }
      } catch {
        // Use Goch fallback
      }

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=3`;
        const res = await fetch(weatherUrl, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error("Weather fetch failed");
        const data = await res.json();

        if (cancelled) return;

        setWeather({
          current: {
            temperature: Math.round(data.current.temperature_2m),
            weathercode: data.current.weathercode,
            windspeed: Math.round(data.current.windspeed_10m),
          },
          daily: {
            dates: data.daily.time,
            maxTemps: data.daily.temperature_2m_max.map((t: number) => Math.round(t)),
            minTemps: data.daily.temperature_2m_min.map((t: number) => Math.round(t)),
            weathercodes: data.daily.weathercode,
          },
          location,
        });
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  }, []);

  if (error) return null;

  if (loading) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-soft">
          <div className="h-36 skeleton" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const currentInfo = getWeatherInfo(weather.current.weathercode);
  const tempGrad = getTempGradient(weather.current.temperature);

  return (
    <div className="max-w-sm mx-auto animate-fade-in-up">
      <div className={`relative rounded-2xl overflow-hidden shadow-elevated bg-gradient-to-br ${tempGrad}`}>
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 noise-bg" />
        </div>

        {/* Current weather */}
        <div className="relative p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium tracking-wide uppercase flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {weather.location}
              </p>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-4xl font-extrabold text-white leading-none">{weather.current.temperature}°</span>
                <span className="text-white/60 text-sm font-medium mb-1">C</span>
              </div>
              <p className="text-white/80 text-sm font-medium mt-0.5">{currentInfo.label}</p>
            </div>
            <div className="text-right">
              <span className="text-5xl block leading-none">{currentInfo.icon}</span>
              <p className="text-white/60 text-xs mt-2 flex items-center justify-end gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                {weather.current.windspeed} km/h
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/20" />

        {/* 3-day forecast */}
        <div className="relative p-4 pt-3">
          <div className="grid grid-cols-3 gap-2">
            {weather.daily.dates.map((date, i) => {
              const d = new Date(date);
              const dayName = i === 0 ? "Heute" : WEEKDAYS[d.getDay()];
              const dayInfo = getWeatherInfo(weather.daily.weathercodes[i]);
              return (
                <div key={date} className="text-center bg-white/10 backdrop-blur-sm rounded-xl py-2 px-1">
                  <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">{dayName}</p>
                  <span className="text-xl block my-0.5">{dayInfo.icon}</span>
                  <p className="text-white text-xs font-bold">{weather.daily.maxTemps[i]}°</p>
                  <p className="text-white/50 text-[10px]">{weather.daily.minTemps[i]}°</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Powered by */}
        <div className="px-5 pb-2">
          <p className="text-white/30 text-[9px] text-right">Open-Meteo</p>
        </div>
      </div>
    </div>
  );
}
