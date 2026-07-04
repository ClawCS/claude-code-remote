"use client";

import { useEffect, useRef } from "react";

// Modulweiter Zähler, damit sich mehrere gleichzeitig offene Dialoge den
// Body-Scroll-Lock korrekt teilen (erst der letzte gibt ihn wieder frei).
let lockCount = 0;
let savedOverflow = "";
function lockScroll() {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}
function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
  }
}

/**
 * Macht ein Overlay zu einem echten Dialog:
 * - Body-Scroll-Lock, solange offen
 * - ESC schließt
 * - Fokus wandert beim Öffnen in den Dialog und wird per Tab darin gefangen
 * - Fokus kehrt beim Schließen zum auslösenden Element zurück
 *
 * Gibt einen ref zurück, der auf das Dialog-Panel (role="dialog") gesetzt wird.
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    const prevFocus = document.activeElement as HTMLElement | null;

    lockScroll();

    const focusable = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null)
        : [];

    // Initialen Fokus setzen (erstes fokussierbares Element, sonst das Panel selbst)
    const els = focusable();
    (els[0] ?? panel)?.focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const list = focusable();
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}
