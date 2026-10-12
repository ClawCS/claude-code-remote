"use client";

import ArrowUpRight from "@/components/ArrowUpRight";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { eigenmarken } from "@/data/eigenmarken";
import { EIGENMARKEN_BOTTLES } from "@/data/eigenmarken-bottles";
import styles from "./own-brand-stage.module.css";

const flavorScenes: Record<string, string> = {
  "pralle-kirsche": "/images/eigenmarken-scenes/cherry-b26593bf6dc6.webp",
  "dicke-nuesse": "/images/eigenmarken-scenes/v2-hazelnut.webp",
  "suesse-suende": "/images/eigenmarken-scenes/v2-vanilla.webp",
  "caramello": "/images/eigenmarken-scenes/v2-caramel.webp",
  "schwarzer-teufel": "/images/eigenmarken-scenes/v2-licorice.webp",
  "weisser-engel": "/images/eigenmarken-scenes/v2-anise.webp",
};

/** Decorative selection is optional; all destinations and names are usable without JS. */
export default function OwnBrandStage() {
  const [activeSlug, setActiveSlug] = useState(eigenmarken[0].slug);
  const active = eigenmarken.find(brand => brand.slug === activeSlug)!;
  return <div className={styles.stage} data-own-brand-stage data-active-brand={active.slug} style={{ "--cinematic-color-stage-accent":active.accentColor, "--brand-scene": `url("${flavorScenes[active.slug]}")` } as CSSProperties}>
    <div className={styles.backdrop} data-brand-backdrop aria-hidden="true">{active.name}</div>
    <ul className={styles.lineup}>
      {eigenmarken.map(brand => {
        const bottle = EIGENMARKEN_BOTTLES[brand.slug as keyof typeof EIGENMARKEN_BOTTLES];
        return <li key={brand.slug}>
          <a className={styles.flavor} href={`/eigenmarke#${brand.slug}`} data-active={active.slug === brand.slug}
            onPointerEnter={() => setActiveSlug(brand.slug)} onFocus={() => setActiveSlug(brand.slug)} onPointerDown={() => setActiveSlug(brand.slug)}>
            <span className={styles.bottle}><Image {...bottle} alt={`${brand.name} – vollständige Originalflasche`} sizes="(max-width: 767px) 25vw, 12vw" className={styles.image} /></span>
            <span className={styles.name}>{brand.name}</span>
            <span className={styles.flavorNote}>{brand.flavor}</span>
            <span className={styles.discover}>Entdecken <ArrowUpRight /></span>
          </a>
        </li>;
      })}
    </ul>
  </div>;
}
