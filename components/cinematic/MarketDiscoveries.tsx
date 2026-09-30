import Image from "next/image";
import Link from "next/link";
import { MARKET_DISCOVERIES } from "@/data/market-photos";
import styles from "./warm.module.css";

export default function MarketDiscoveries() {
  return <div className={styles.discoveries} data-market-discoveries>
    {MARKET_DISCOVERIES.map(item => <article key={item.id}>
      <figure>
        <Image {...{ src: item.photo.src, width: item.photo.width, height: item.photo.height, alt: item.photo.alt }} sizes={`(max-width: 640px) min(100vw, ${item.photo.width}px), 320px`} className={styles.discoveryImage} />
        <figcaption>{item.photo.caption}</figcaption>
      </figure>
      <h3>{item.title}</h3><p>{item.text}</p>
      <Link href={item.href} prefetch={false}>Mehr entdecken <span aria-hidden="true">↗</span></Link>
    </article>)}
  </div>;
}
