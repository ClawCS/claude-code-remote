import { DAILIES, WEEKLIES } from "../../data/publications";
import { PublicationCard } from "./PublicationCard";

export function PublicationDashboard(): JSX.Element {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Wochenblaetter</h2>
          <span className="text-xs text-ink-500">
            {WEEKLIES.length} Titel · Gesamt-Auflage{" "}
            {WEEKLIES.reduce((a, p) => a + p.circulation, 0).toLocaleString("de-DE")}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WEEKLIES.map((pub) => (
            <PublicationCard key={pub.id} pub={pub} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Tageszeitungen</h2>
          <span className="text-xs text-ink-500">
            {DAILIES.length} Titel · Gesamt-Auflage{" "}
            {DAILIES.reduce((a, p) => a + p.circulation, 0).toLocaleString("de-DE")}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAILIES.map((pub) => (
            <PublicationCard key={pub.id} pub={pub} />
          ))}
        </div>
      </section>
    </div>
  );
}
