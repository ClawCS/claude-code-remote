"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { HomepageFlyer } from "@/lib/homepage-content";
import { canRenderHomepageImage } from "@/lib/cinematic/presentation";
import { useModalA11y } from "@/lib/useModalA11y";

import styles from "./current.module.css";

const VIEWER_TIMEOUT_MS = 8_000;
const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;
const COPY = {
  de: {external:"Handzettel direkt öffnen",pdf:"Handzettel als PDF öffnen",cover:"Titelseite",noCover:"Handzettel ohne Vorschaubild",view:"Handzettel ansehen",help:"Der Handzettel kann auch direkt geöffnet werden.",closeLabel:"Handzettel schließen",close:"Schließen",viewTitle:"ansehen",frame:"Handzettel",error:"Der Handzettel konnte hier nicht geladen werden."},
  nl: {external:"Folder direct openen",pdf:"Folder als PDF openen",cover:"Voorpagina",noCover:"Folder zonder voorbeeldafbeelding",view:"Folder bekijken",help:"Je kunt de folder ook rechtstreeks openen.",closeLabel:"Folder sluiten",close:"Sluiten",viewTitle:"bekijken",frame:"folder",error:"De folder kon hier niet worden geladen."},
} as const;

type ViewerState = "loading" | "ready" | "error";

function ExternalFlyerLinks({
  flyer,
  locale = "de",
}: {
  flyer: HomepageFlyer;
  locale?: "de" | "nl";
}): React.JSX.Element {
  return (
    <div className={styles.viewerLinks} data-flyer-fallback-links>
      {flyer.viewerUrl !== flyer.pdfUrl && <a
        href={flyer.viewerUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {COPY[locale].external}
      </a>}
      <a href={flyer.pdfUrl} target="_blank" rel="noopener noreferrer">
        {COPY[locale].pdf}
      </a>
    </div>
  );
}

export default function FlyerViewer({
  flyer,
  locale = "de",
}: {
  flyer: HomepageFlyer;
  locale?: "de" | "nl";
}): React.JSX.Element {
  const copy = COPY[locale];
  // The HTML arrives before its click handler. Keep the native links usable,
  // but expose the dialog action only once React can actually open it.
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [open, setOpen] = useState(false);
  const [viewerState, setViewerState] = useState<ViewerState>("loading");
  const [viewerSession, setViewerSession] = useState(0);
  const [coverFailed, setCoverFailed] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const activeSessionRef = useRef(0);

  const clearViewerTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const closeViewer = useCallback(() => {
    activeSessionRef.current += 1;
    clearViewerTimeout();
    setOpen(false);
  }, [clearViewerTimeout]);

  const dialogRef = useModalA11y(open, closeViewer);

  useEffect(() => {
    if (!open || viewerState !== "loading") return;

    const session = viewerSession;
    clearViewerTimeout();
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      if (activeSessionRef.current === session) {
        setViewerState("error");
      }
    }, VIEWER_TIMEOUT_MS);

    return clearViewerTimeout;
  }, [clearViewerTimeout, open, viewerSession, viewerState]);

  const openViewer = () => {
    const nextSession = activeSessionRef.current + 1;
    activeSessionRef.current = nextSession;
    setViewerSession(nextSession);
    setViewerState("loading");
    setOpen(true);
  };

  const markReady = (session: number) => {
    if (activeSessionRef.current !== session) return;
    clearViewerTimeout();
    setViewerState("ready");
  };

  const markError = (session: number) => {
    if (activeSessionRef.current !== session) return;
    clearViewerTimeout();
    setViewerState("error");
  };

  const headingId = `flyer-dialog-${flyer.id}`;
  const canRenderCover =
    !coverFailed && canRenderHomepageImage(flyer.coverUrl);

  return (
    <div className={styles.viewer} data-flyer-viewer>
      <div className={`${styles.cover} ${flyer.pageCount === 1 ? styles.singlePageCover : ""}`} data-flyer-cover data-single-page={flyer.pageCount === 1 || undefined}>
        {canRenderCover ? (
          <Image
            src={flyer.coverUrl}
            alt={`${copy.cover}: ${flyer.title}`}
            {...(flyer.pageCount === 1 ? {width: 1600, height: 1200} : {fill: true})}
            sizes="(max-width: 47.999rem) 100vw, (max-width: 79.999rem) 50vw, 38rem"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <p>{copy.noCover}</p>
        )}
      </div>
      <button
        className={styles.viewerTrigger}
        type="button"
        disabled={!hydrated}
        aria-busy={!hydrated}
        onClick={openViewer}
      >
        {copy.view}
      </button>
      <p className={styles.viewerHelp}>
        {copy.help}
      </p>
      <ExternalFlyerLinks flyer={flyer} locale={locale} />

      {open ? (
        <div
          className={styles.viewerBackdrop}
          data-flyer-dialog-backdrop
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeViewer();
          }}
        >
          <div
            ref={dialogRef}
            className={styles.viewerDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            data-flyer-dialog-state={viewerState}
            tabIndex={-1}
          >
            <button
              type="button"
              aria-label={copy.closeLabel}
              onClick={closeViewer}
            >
              {copy.close}
            </button>
            <h2 id={headingId}>{flyer.title} {copy.viewTitle}</h2>
            {viewerState === "error" ? (
              <div
                className={styles.viewerError}
                role="status"
                data-flyer-state="error"
              >
                <p>{copy.error}</p>
                <ExternalFlyerLinks flyer={flyer} locale={locale} />
              </div>
            ) : (
              <>
                <iframe
                  className={styles.viewerFrame}
                  key={viewerSession}
                  src={flyer.viewerUrl}
                  title={`${flyer.title} – ${copy.frame}`}
                  onLoad={() => markReady(viewerSession)}
                  onError={() => markError(viewerSession)}
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <ExternalFlyerLinks flyer={flyer} locale={locale} />
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
