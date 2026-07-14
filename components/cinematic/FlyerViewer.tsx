"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { HomepageFlyer } from "@/lib/homepage-content";
import { canRenderHomepageImage } from "@/lib/cinematic/presentation";
import { useModalA11y } from "@/lib/useModalA11y";

import styles from "./current.module.css";

const VIEWER_TIMEOUT_MS = 8_000;
const VIEWER_ERROR_COPY = "Der Handzettel konnte hier nicht geladen werden.";

type ViewerState = "loading" | "ready" | "error";

function ExternalFlyerLinks({
  flyer,
}: {
  flyer: HomepageFlyer;
}): React.JSX.Element {
  return (
    <div className={styles.viewerLinks} data-flyer-fallback-links>
      <a
        href={flyer.viewerUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Handzettel extern öffnen
      </a>
      <a href={flyer.pdfUrl} target="_blank" rel="noopener noreferrer">
        Handzettel als PDF öffnen
      </a>
    </div>
  );
}

export default function FlyerViewer({
  flyer,
}: {
  flyer: HomepageFlyer;
}): React.JSX.Element {
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
      <div className={styles.cover} data-flyer-cover>
        {canRenderCover ? (
          <Image
            src={flyer.coverUrl}
            alt={`Titelseite: ${flyer.title}`}
            fill
            sizes="(max-width: 47.999rem) 100vw, (max-width: 79.999rem) 50vw, 38rem"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <p>Handzettel ohne Vorschaubild</p>
        )}
      </div>
      <button
        className={styles.viewerTrigger}
        type="button"
        onClick={openViewer}
      >
        Handzettel ansehen
      </button>
      <p className={styles.viewerHelp}>
        Der externe Handzettel kann auch direkt geöffnet werden.
      </p>
      <ExternalFlyerLinks flyer={flyer} />

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
              aria-label="Handzettel schließen"
              onClick={closeViewer}
            >
              Schließen
            </button>
            <h2 id={headingId}>{flyer.title} ansehen</h2>
            {viewerState === "error" ? (
              <div
                className={styles.viewerError}
                role="status"
                data-flyer-state="error"
              >
                <p>{VIEWER_ERROR_COPY}</p>
                <ExternalFlyerLinks flyer={flyer} />
              </div>
            ) : (
              <>
                <iframe
                  className={styles.viewerFrame}
                  key={viewerSession}
                  src={flyer.viewerUrl}
                  title={`${flyer.title} – externer Handzettel`}
                  onLoad={() => markReady(viewerSession)}
                  onError={() => markError(viewerSession)}
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <ExternalFlyerLinks flyer={flyer} />
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
