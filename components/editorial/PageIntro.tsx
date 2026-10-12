import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { AtmosphereTheme } from "@/lib/cinematic/atmosphere";
import styles from "./editorial.module.css";

export type PageIntroProps = Readonly<{
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: readonly Readonly<{ label: string; href?: string }>[];
  children?: ReactNode;
  className?: string;
  mediaClassName?: string;
  id?: string;
  theme?: AtmosphereTheme;
  mediaFit?: "cover" | "contain";
  mediaCaption?: ReactNode;
  media?: Readonly<{ src: string; alt: string; width: number; height: number; position?: string }>;
}>;

/** Pure presentation: safe to compose in either a server or client page. */
export default function PageIntro({ eyebrow, title, description, breadcrumbs, children, className, mediaClassName, id, theme, media, mediaFit = "cover", mediaCaption }: PageIntroProps) {
  return <header id={id} data-editorial-intro data-atmosphere={theme} data-has-media={media ? true : undefined} data-media-fit={mediaFit} className={[styles.intro, mediaClassName].filter(Boolean).join(" ")}>
    {media && <figure className={styles.introMedia} data-intro-media>
      <Image src={media.src} alt={media.alt} width={media.width} height={media.height}
        sizes="(min-width: 64rem) 66vw, 100vw"
        style={{ objectPosition: media.position, objectFit: mediaFit }} />
      {mediaCaption && <figcaption>{mediaCaption}</figcaption>}
    </figure>}
    <div className={styles.introLight} data-intro-light aria-hidden="true" />
    <div className={[styles.container, styles.introLayout, className].filter(Boolean).join(" ")}>
      <div className={styles.introCopy}>
        {breadcrumbs?.length ? <nav aria-label="Brotkrumennavigation" className={styles.breadcrumbs}>
          <ol>{breadcrumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>
            {crumb.href ? <Link href={crumb.href} prefetch={false}>{crumb.label}</Link> : <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{crumb.label}</span>}
          </li>)}</ol>
        </nav> : null}
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <div className={styles.description}>{description}</div>}
        {children && <div className={styles.introActions}>{children}</div>}
      </div>
    </div>
  </header>;
}
