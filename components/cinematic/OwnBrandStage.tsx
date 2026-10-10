"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { eigenmarken } from "@/data/eigenmarken";
import { EIGENMARKEN_BOTTLES } from "@/data/eigenmarken-bottles";
import styles from "./own-brand-stage.module.css";

/** Decorative selection is optional; all destinations and names are usable without JS. */
export default function OwnBrandStage() {
  const [activeSlug, setActiveSlug] = useState(eigenmarken[0].slug);
  const active = eigenmarken.find(brand => brand.slug === activeSlug)!;
  return <div className={styles.stage} data-own-brand-stage data-active-brand={active.slug} style={{ "--cinematic-color-stage-accent":active.accentColor } as CSSProperties}>
    <div className={styles.backdrop} data-brand-backdrop aria-hidden="true">{active.name}</div>
    <ul className={styles.lineup}>
      {eigenmarken.map(brand => {
        const bottle = EIGENMARKEN_BOTTLES[brand.slug as keyof typeof EIGENMARKEN_BOTTLES];
        return <li key={brand.slug}>
          <a className={styles.flavor} href={`/eigenmarke#${brand.slug}`} data-active={active.slug === brand.slug}
            onPointerEnter={() => setActiveSlug(brand.slug)} onFocus={() => setActiveSlug(brand.slug)} onPointerDown={() => setActiveSlug(brand.slug)}>
            <span className={styles.bottle}><Image {...bottle} alt={`${brand.name} – vollständige Originalflasche`} sizes="(max-width: 767px) 15vw, 10vw" className={styles.image} /></span>
            <span className={styles.name}>{brand.name}</span>
            <span className={styles.flavorNote}>{brand.flavor}</span>
            <span className={styles.discover}>Entdecken <span aria-hidden="true">↗</span></span>
          </a>
        </li>;
      })}
    </ul>
  </div>;
}
