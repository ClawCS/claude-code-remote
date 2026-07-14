"use client";

import { useEffect, useRef } from "react";

export type NavItem = Readonly<{
  label: string;
  href: string;
}>;

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
    <details ref={detailsRef} data-mobile-navigation>
      <summary aria-label="Menü öffnen">Menü</summary>
      <nav aria-label="Mobile Navigation">
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => {
                if (detailsRef.current) detailsRef.current.open = false;
              }}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
