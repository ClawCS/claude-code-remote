import Link from "next/link";
import SocialLink from "@/components/SocialLink";
import { SITE_LINKS } from "@/lib/cinematic/site";
export default function KuehlschrankPage() {
  return <div className="max-w-4xl mx-auto px-6 py-16"><h1 className="text-4xl font-bold text-secondary">Was fehlt für die nächste Runde?</h1><p className="text-muted text-lg leading-relaxed my-6">Für deinen Anlass beraten wir dich persönlich. Der frühere KI-Foto-Check ist aktuell nicht verfügbar; auf dieser Seite werden keine Bilder hochgeladen oder an einen KI-Anbieter gesendet.</p><div className="flex gap-4 flex-wrap"><Link href="/partyplaner" className="bg-primary text-white px-6 py-3 rounded-lg font-bold">Getränkemengen planen</Link><SocialLink platform="whatsapp" href={SITE_LINKS.whatsapp} label="Unser Team per WhatsApp fragen" className="text-primary" /></div></div>;
}
