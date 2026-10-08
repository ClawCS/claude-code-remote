import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { SITE_LINKS } from "@/lib/cinematic/site";
export default function CommunityPage() {
  return <div className="max-w-4xl mx-auto px-6 py-16"><p className="text-primary font-semibold">Goch. Getränke. Gute Leute.</p><h1 className="text-4xl font-bold text-secondary mt-3">Unsere Community lebt im Markt.</h1><p className="text-muted text-lg leading-relaxed my-6">Teamgeschichten, Verkostungen und Aktionen: Auf unserem Instagram-Kanal bekommst du die Einblicke hinter die Kulissen. Und natürlich freuen wir uns, dich im Markt zu sehen.</p><SocialLink platform="instagram" href={SITE_LINKS.instagram} label="Instagram-Profil @trinkgutjammers_goch öffnen" className="bg-primary text-white" /><p className="text-sm text-muted mt-6">Die frühere Punktefunktion ist aktuell nicht verfügbar. Es werden hier keine neuen Profile angelegt.</p><Link href="/gewinnspiel" className="inline-block text-primary underline mt-5">Gewinnspiele &amp; Aktionen</Link></div>;
}
