import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./editorial.module.css";

export type PageIntroProps = Readonly<{
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: readonly Readonly<{ label: string; href?: string }>[];
  children?: ReactNode;
  className?: string;
  id?: string;
}>;

/** Pure presentation: safe to compose in either a server or client page. */
export default function PageIntro({ eyebrow, title, description, breadcrumbs, children, className, id }: PageIntroProps) {
  return <header id={id} data-editorial-intro className={styles.intro}>
    <div className={[styles.container, className].filter(Boolean).join(" ")}>
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
  </header>;
}
