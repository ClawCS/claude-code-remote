import Image from "next/image";
import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import TeamPhotoPlaceholder from "@/components/TeamPhotoPlaceholder";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/collection.module.css";

import { galleryItems } from "@/data/gallery";

export default function GaleriePage() {
  return (
    <div>
      <PageIntro eyebrow="Unser Markt. Unsere Menschen." title="Team Jammers" description="Persönliche Gesichter aus unserem Markt in Goch – für deine Getränke, deine Feier und deine Fragen." breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Unser Team" }]} />
      <div className={styles.body} data-collection="team">

      <section className={styles.section} aria-labelledby="team-gallery-title">
        <div className={styles.teamLead}><h2 id="team-gallery-title">Menschen hinter Jammers</h2><TeamPhotoPlaceholder /></div>
        <div className={styles.portraitGrid}>
          {galleryItems.filter((item) => item.image).map((item) => (
            <figure key={item.id} className="m-0">
              {item.image ? (
                <Image src={item.image} alt={item.alt} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="block w-full h-auto" />
              ) : null}
              <figcaption className="pt-4">
                <h3 className="font-bold text-xl">{item.title}</h3>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="gallery-instagram-title">
        <h2 id="gallery-instagram-title" className="text-2xl font-bold">Weitere Einblicke aus dem Markt</h2>
        <p className="my-4">Unsere Bilder und Geschichten auf Instagram.</p>
        <SocialLink platform="instagram" href="https://www.instagram.com/trinkgutjammers_goch/" label="Instagram-Profil @trinkgutjammers_goch öffnen" />
      </section>
      <section className={styles.section} aria-labelledby="team-jobs-title">
        <h2 id="team-jobs-title" className="text-2xl font-bold">Teil von Team Jammers werden</h2>
        <p className="my-4">Verkauf in Vollzeit oder Teilzeit bis zu 150 Stunden/Monat.</p>
        <Link href="/bewerbung" prefetch={false} className="text-primary underline">Stellen und Bewerbung</Link>
      </section>
      </div>
    </div>
  );
}
