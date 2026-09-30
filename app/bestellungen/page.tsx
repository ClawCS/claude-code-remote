import Link from "next/link";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";
export default function InquiryInformation() {
  return <div className="max-w-3xl mx-auto px-6 py-16"><h1 className="text-3xl font-bold text-secondary mb-5">Deine Reservierungsanfragen</h1><p className="text-muted leading-relaxed">Die Website bereitet unverbindliche Nachrichten an unser Team vor. Sie speichert keine Anfragen und zeigt keine Bestellhistorie. Frühere lokal gespeicherte Entwürfe werden beim Besuch dieser Version entfernt. Maßgeblich ist die persönliche Bestätigung durch Trinkgut Jammers.</p><div className="flex flex-wrap gap-4 mt-8"><Link href="/warenkorb" className="text-primary underline">Warenkorb ansehen</Link><a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-primary underline">Per WhatsApp anfragen</a><a href={`mailto:${MARKET.email}`} className="text-primary underline">Per E-Mail anfragen</a></div></div>;
}
