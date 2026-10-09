import Image from "next/image";
import styles from "./TeamPhotoPlaceholder.module.css";

export default function TeamPhotoPlaceholder({ language = "de" }: { language?: "de" | "nl" }) {
  return (
    <figure className={styles.placeholder} data-team-photo-placeholder lang={language}>
      <Image
        className={styles.logo}
        src="/images/home/brand-logo.webp"
        alt="Trinkgut Jammers"
        width={520}
        height={198}
        sizes="224px"
      />
      <p>{language === "nl" ? "Onze nieuwe teamfoto volgt" : "Unser neues Teamfoto folgt"}</p>
    </figure>
  );
}
