import Link from "next/link";
import OwnBrandStage from "./OwnBrandStage";
import styles from "./spotlight.module.css";

export default function SpotlightSection(): React.JSX.Element {
  return <section className={styles.section} id="eigenmarken" data-signature="cinematic" aria-labelledby="eigenmarken-title">
    <div className={styles.intro}>
      <div><p>Unsere Eigenmarken</p><h2 id="eigenmarken-title">Sechs eigene<br />Charaktere.</h2></div>
      <p className={styles.story}>Eine Familie aus Goch. Von fruchtig bis kräftig – finde deinen Favoriten und lerne die Geschichte dahinter kennen.</p>
    </div>
    <OwnBrandStage />
    <div className={styles.outro}><p>Noch unentschlossen? Frag unser Team im Markt.</p><Link href="/eigenmarke" prefetch={false} className={styles.allBrands}>Alle sechs Liköre kennenlernen <span aria-hidden="true">↗</span></Link></div>
  </section>;
}
