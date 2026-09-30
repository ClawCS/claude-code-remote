import Link from "next/link";
import type { Metadata } from "next";
import { SITE_LINKS } from "@/lib/cinematic/site";
export const metadata: Metadata = {title:"Vergangene Aktionen",robots:{index:false,follow:true}};
export default function AktionenArchivPage() {
  return <div className="max-w-3xl mx-auto px-6 py-16"><Link href="/" className="text-primary underline">Zur Startseite</Link><h1 className="text-3xl font-bold text-secondary mt-6 mb-4">Vergangene Aktionen</h1><p className="text-muted mb-6">Rückblicke auf unsere Aktionen findest du in den Originalbeiträgen auf Instagram. Dort bleiben Zeitraum, Teilnahmebedingungen und Aktualisierungen nachvollziehbar. Vergangene Aktionen sind beendet.</p><a href={SITE_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex px-5 py-3 rounded-lg bg-primary text-white font-bold">Originalbeiträge auf Instagram ansehen ↗</a></div>;
}
