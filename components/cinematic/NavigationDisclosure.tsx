"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { NavDisclosure, NavLink } from "@/lib/cinematic/site";
import styles from "./chrome.module.css";

export default function NavigationDisclosure({ item, onNavigate }: {
  item: NavDisclosure;
  onNavigate?: () => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && details.open && details.contains(document.activeElement)) {
        event.preventDefault();
        details.open = false;
        details.querySelector("summary")?.focus();
      }
    };
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !details.contains(event.target)) details.open = false;
    };
    details.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    // Keyboard-activated links dispatch click without pointerdown. They must
    // dismiss other panels too when the shared header survives a route change.
    document.addEventListener("click", closeOutside);
    return () => {
      details.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("click", closeOutside);
    };
  }, []);

  const close = () => {
    if (ref.current) ref.current.open = false;
    onNavigate?.();
  };
  const links = (children: readonly NavLink[]) => <ul className={styles.submenuLinks}>
    {children.map(child => <li key={child.href}><Link href={child.href} prefetch={false} onClick={close}
      {...(child.href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >{child.label}</Link></li>)}
  </ul>;
  return <div className={styles.navItem}>
    {item.href && <Link href={item.href} prefetch={false} onClick={close}>{item.label}</Link>}
    <details ref={ref} className={styles.navDisclosure} data-navigation-disclosure>
      <summary aria-label={item.href ? `${item.label} – Untermenü öffnen` : undefined}>
        {!item.href && item.label}<span aria-hidden="true">⌄</span>
      </summary>
      <div className={"groups" in item ? styles.discoverPanel : styles.knowledgePanel}>
        {"groups" in item ? item.groups.map(group => <section key={group.label} className={styles.discoverGroup} aria-label={group.label}>
          <h2>{group.label}</h2>{links(group.children)}
        </section>) : links(item.children)}
      </div>
    </details>
  </div>;
}
