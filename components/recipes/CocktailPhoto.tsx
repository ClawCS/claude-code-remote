import Image from "next/image";
import Link from "next/link";
import type { CocktailPhoto as Photo } from "@/data/cocktail-images";

function Credit({ photo }: { photo: Photo }) {
  return <p className="leading-relaxed">
    <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{photo.sourceTitle}</a>
    {" · "}{photo.creator}{" · "}
    {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{photo.license}</a> : photo.license}
    <span className="block mt-1">{photo.changes} {photo.license.startsWith("CC BY-SA") && <>Auch die Webfassung steht unter dieser Lizenz.</>}</span>
  </p>;
}

export default function CocktailPhoto({ photo, href }: { photo: Photo; href?: string }) {
  const picture = <Image src={photo.src} alt={photo.alt} fill sizes={href ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : "(max-width: 896px) 100vw, 896px"} className="object-contain" style={{ objectPosition: photo.objectPosition }} />;
  return <figure data-cocktail-photo={photo.name} className={href ? "" : "mb-8 overflow-hidden rounded-2xl border border-border/70"}>
    {href ? <Link href={href} aria-label={`${photo.name} – Foto und Rezept`} tabIndex={-1} className="block relative aspect-[4/3] bg-[#f2efea]">{picture}</Link> : <div className="relative aspect-[4/3] bg-[#f2efea]">{picture}</div>}
    <figcaption className="bg-white px-5 py-3 text-xs text-muted">
      {href ? <details><summary className="cursor-pointer w-fit hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Foto &amp; Lizenz</summary><div className="pt-2"><Credit photo={photo} /></div></details> : <Credit photo={photo} />}
    </figcaption>
  </figure>;
}
