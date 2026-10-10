"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/cinematic/site";
import NavigationDisclosure from "./NavigationDisclosure";

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
      if (event.key === "Escape" && !event.defaultPrevented && details.open) {
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
      <summary role="button" aria-label="Menü öffnen" className={styles.mobileToggle}>
        Menü
      </summary>
      <nav className={styles.mobilePanel} aria-label="Mobile Navigation">
        <ul className={styles.mobileList}>
          {items.map((item) => (
            <li key={item.label}>
              {"children" in item || "groups" in item ? <NavigationDisclosure item={item} onNavigate={() => { if (detailsRef.current) detailsRef.current.open = false; }} /> :
              <Link
                href={item.href}
                prefetch={false}
                {...(item.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={() => {
                  if (detailsRef.current) detailsRef.current.open = false;
                }}
              >
                {item.label}
              </Link>}
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
