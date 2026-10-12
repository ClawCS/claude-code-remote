import Image from "next/image";
import styles from "./jammers-hilft-symbol.module.css";

export default function JammersHilftSymbol({ language = "de" }: { language?: "de" | "nl" }) {
  return <span className={styles.symbol} data-jammers-hilft-symbol>
    <Image src="/images/brands/jammers-hilft-symbol.png" width={250} height={250} unoptimized
      alt={language === "nl"
        ? "Jammers helpt – hart met twee handen die elkaar vasthouden"
        : "Jammers hilft – Herz mit zwei sich reichenden Händen"} />
  </span>;
}
