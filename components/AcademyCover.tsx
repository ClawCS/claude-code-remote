import Image from "next/image";
import styles from "@/components/editorial/learning.module.css";

const subjects: Record<string,string> = {
  bier: "Helles, bernsteinfarbenes und dunkles Bier im Glas",
  whiskey: "Zwei Whisky-Verkostungsgläser mit unterschiedlichen Bernsteinfarben",
  mineralwasser: "Stilles und sprudelndes Wasser in Gläsern",
  saft: "Apfel-, Orangen- und Traubensaft mit den passenden Früchten",
  wein: "Weißwein, Rotwein und Rosé zur Verkostung",
  schaumwein: "Zwei Gläser Schaumwein mit feiner Perlage",
  likoere: "Kirsch-, Kräuter- und Sahnelikör in Verkostungsgläsern",
  rum: "Heller und gereifter Rum neben Zuckerrohr und Eichenholz",
};

export default function AcademyCover({slug}: {slug:string}) {
  if (!subjects[slug]) return null;
  return <Image src={`/images/akademie/${slug}-editorial.webp`} alt={`${subjects[slug]} · Themenbild`} width={1200} height={800} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={`${styles.cover} object-contain`} />;
}
