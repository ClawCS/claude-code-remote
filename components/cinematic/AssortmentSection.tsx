import Link from "next/link";
import styles from "./warm.module.css";
import MarketDiscoveries from "./MarketDiscoveries";
import AcademyEntry from "@/components/AcademyEntry";
const categories=[{title:"Bier & Fassbier",href:"/kategorie/bier",mark:"01"},{title:"Alkoholfrei",href:"/kategorie/alkoholfrei",mark:"02"},{title:"Wein & Sekt",href:"/kategorie/wein",mark:"03"},{title:"Spirituosen",href:"/kategorie/spirituosen",mark:"04"}];
export default function AssortmentSection(){return <section id="sortiment" className={styles.assortment} aria-labelledby="sortiment-title"><div><p className={styles.eyebrow}>Was darf es sein?</p><h2 id="sortiment-title">Für jeden Geschmack.</h2></div><div className={styles.categories}>{categories.map(item=><Link key={item.href} href={item.href} prefetch={false}><span className={styles.categoryMark} aria-hidden="true">{item.mark}</span><h3>{item.title}</h3><span>Entdecken <span aria-hidden="true">↗</span></span></Link>)}</div><p className={styles.rangeNote}>Eine Auswahl aus unserem Markt. Aktuelle Preise und Verfügbarkeit bestätigen wir persönlich.</p><AcademyEntry /><MarketDiscoveries /></section>;}
