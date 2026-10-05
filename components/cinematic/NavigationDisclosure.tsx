"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { NavLink } from "@/lib/cinematic/site";
import styles from "./chrome.module.css";

export default function NavigationDisclosure({ item }: {
  item: Readonly<{ label: string; children: readonly NavLink[] }>;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) {
        event.preventDefault();
        details.open = false;
        details.querySelector("summary")?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !details.contains(event.target)) details.open = false;
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, []);

  return <details ref={ref} className={styles.navDisclosure} data-knowledge-navigation>
    <summary>{item.label}<span aria-hidden="true">⌄</span></summary>
    <ul className={styles.knowledgePanel}>
      {item.children.map(child => <li key={child.href}>
        <Link href={child.href} prefetch={false} onClick={() => { if (ref.current) ref.current.open = false; }}>{child.label}</Link>
      </li>)}
    </ul>
  </details>;
}
