"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import styles from "./hero-film.module.css";

type DataConnection = EventTarget & { saveData?: boolean };
const subscribe = () => () => {};

/** Server-rendered copy stays outside the client module graph via this slot. */
export default function HeroFilm({ children, className, copyClassName }: {
  children?: ReactNode;
  className?: string;
  copyClassName?: string;
}) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const descriptionId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ toggle(): void } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [finale, setFinale] = useState(false);
  const [copyFocused, setCopyFocused] = useState(false);

  useEffect(() => {
    const media = video.current!;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 48rem)");
    const connection = (navigator as Navigator & { connection?: DataConnection }).connection;
    let visible = false;
    let manualPaused = false;
    let manualPlayback = false;
    let blocked = false;
    let disposed = false;
    let isPlaying = false;
    let isPending = false;
    let request = 0;
    const eligible = () => !motion.matches && !connection?.saveData;
    const pause = () => { request += 1; isPlaying = false; isPending = false; media.pause(); setPlaying(false); setPending(false); };
    const detach = () => { pause(); media.removeAttribute("src"); media.load(); setFinale(false); };
    const fallback = () => { blocked = true; manualPlayback = false; detach(); setFailed(true); };
    const start = () => {
      if (disposed || document.hidden || !visible || isPlaying || isPending) return;
      if (!media.hasAttribute("src")) {
        media.src = wide.matches ? "/videos/jammers-hero-desktop.mp4" : "/videos/jammers-hero-mobile.mp4";
        media.load();
      }
      const attempt = ++request;
      isPending = true;
      setPending(true);
      setFailed(false);
      void media.play().catch(() => { if (!disposed && attempt === request) fallback(); });
    };
    const reconcile = () => {
      if (document.hidden || !visible) { pause(); return; }
      if (!manualPaused && !blocked && (manualPlayback || eligible())) start();
    };
    const preferenceChanged = () => {
      // A changed preference ends even explicit playback; a new click may override it again.
      if (!eligible()) { manualPlayback = false; detach(); }
      else reconcile();
    };
    const widthChanged = () => { setDesktop(wide.matches); };
    const onPlaying = () => {
      if (disposed || document.hidden || !visible || manualPaused || !media.hasAttribute("src") || (!manualPlayback && !eligible())) { pause(); return; }
      isPlaying = true;
      isPending = false;
      setPending(false);
      setPlaying(true);
    };
    const onPause = () => { isPlaying = false; setPlaying(false); };
    const onTime = () => setFinale(media.currentTime >= 11 && media.hasAttribute("src"));
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.15);
      reconcile();
    }, { threshold: [0, 0.15] });
    controls.current = { toggle() {
      if (isPlaying || isPending) { manualPaused = true; manualPlayback = false; pause(); }
      else { manualPaused = false; manualPlayback = true; blocked = false; start(); }
    } };
    widthChanged();
    motion.addEventListener("change", preferenceChanged);
    wide.addEventListener("change", widthChanged);
    connection?.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", reconcile);
    media.addEventListener("playing", onPlaying);
    media.addEventListener("pause", onPause);
    media.addEventListener("timeupdate", onTime);
    media.addEventListener("error", fallback);
    if (observer) observer.observe(media);
    else { visible = true; reconcile(); }
    return () => {
      disposed = true;
      request += 1;
      controls.current = null;
      observer?.disconnect();
      motion.removeEventListener("change", preferenceChanged);
      wide.removeEventListener("change", widthChanged);
      connection?.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", reconcile);
      media.removeEventListener("playing", onPlaying);
      media.removeEventListener("pause", onPause);
      media.removeEventListener("timeupdate", onTime);
      media.removeEventListener("error", fallback);
      media.pause();
      media.removeAttribute("src");
      media.load();
    };
  }, []);

  const hideCopy = desktop && finale && !copyFocused && !failed;
  return (
    <div ref={wrapper} className={[styles.film, className].filter(Boolean).join(" ")} data-film-finale={hideCopy} data-film-playing={playing}>
      {children && <div data-film-copy className={[styles.copy, copyClassName].filter(Boolean).join(" ")} inert={hideCopy}
        onFocusCapture={() => setCopyFocused(true)}
        onBlurCapture={(event) => setCopyFocused(event.currentTarget.contains(event.relatedTarget as Node | null))}>
        {children}
      </div>}
      <div className={styles.media}>
        <video ref={video} className={styles.video} width="1920" height="1080" muted playsInline loop preload="none"
          poster="/images/home/jammers-film-poster.webp" aria-label="Jammers: fünfzehnsekündiger KI-Werbefilm ohne Ton" aria-describedby={descriptionId}>
          Dein Browser kann diesen Film nicht abspielen. Das Schlussmotiv zeigt sechs Jammers-Liköre mit passenden Gläsern.
        </video>
        <button className={styles.control} type="button" disabled={!hydrated} onClick={() => controls.current?.toggle()} aria-describedby={descriptionId}>
          {pending ? "Wiedergabe abbrechen" : playing ? "Film pausieren" : "Film abspielen"}
        </button>
      </div>
      <div className={styles.caption}>
        <p id={descriptionId}>KI-Werbefilm · beispielhafte Partyszene<span className={styles.description}> · 15 Sekunden ohne Ton: Getränke und Partyservice, zum Schluss sechs Jammers-Liköre mit passenden Gläsern. Generierte Werbung, keine dokumentarische Markt- oder pixelidentische Produktaufnahme.</span></p>
        <p role="status" aria-live="polite">{failed ? "Der Film ist gerade nicht verfügbar. Das Standbild bleibt sichtbar; du kannst die Wiedergabe erneut versuchen." : ""}</p>
      </div>
    </div>
  );
}
