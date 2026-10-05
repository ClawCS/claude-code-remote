"use client";

import { useEffect, useRef } from "react";
import type { NavItem } from "@/lib/cinematic/site";

import styles from "./chrome.module.css";

export default function MobileNavigation({
  items,
}: {
  items: readonly NavItem[];
}): React.JSX.Element {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    const close = () => {
      details.open = false;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) {
        event.preventDefault();
        close();
        details.querySelector("summary")?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (
        details.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      className={styles.mobileDetails}
      data-mobile-navigation
    >
      <summary role="button" aria-label="Menü öffnen">
        Menü
      </summary>
      <nav className={styles.mobilePanel} aria-label="Mobile Navigation">
        <ul className={styles.mobileList}>
          {items.map((item) => (
            <li key={item.label}>
              {"children" in item ? <>
                <span className={styles.mobileGroupLabel}>{item.label}</span>
                <ul className={styles.mobileChildren}>
                  {item.children.map(child => <li key={child.href}>
                    <a href={child.href} onClick={() => { if (detailsRef.current) detailsRef.current.open = false; }}>{child.label}</a>
                  </li>)}
                </ul>
              </> :
              <a
                href={item.href}
                {...(item.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={() => {
                  if (detailsRef.current) detailsRef.current.open = false;
                }}
              >
                {item.label}
              </a>}
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
