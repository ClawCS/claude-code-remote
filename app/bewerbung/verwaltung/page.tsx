import type { Metadata } from "next";
import ApplicationAdmin from "@/components/applications/ApplicationAdmin";

export const metadata: Metadata = {
  title: "Bewerbungsverwaltung — Jammers Mitarbeiterbereich",
  description: "Geschützte Anmeldung für benannte, berechtigte Mitarbeitende.",
};
export const dynamic = "force-dynamic";

export default function ApplicationAdminPage() {
  return <ApplicationAdmin />;
}
