import ApplicationForm from "@/components/applications/ApplicationForm";
export const dynamic = "force-dynamic";
export default function BewerbungPage() {
  return <div className="max-w-4xl mx-auto px-6 py-16"><p className="text-primary font-semibold">Team Jammers</p><h1 className="text-4xl font-bold text-secondary mt-3">Lust auf Getränke und Menschen?</h1><p className="text-lg leading-relaxed my-6">Verstärke unser Verkaufsteam in Goch. Ein sofortiger Einstieg ist möglich.</p><ApplicationForm /></div>;
}
