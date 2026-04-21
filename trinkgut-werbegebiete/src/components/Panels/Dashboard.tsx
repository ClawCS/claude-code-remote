import {
  DAILY_PUBLICATIONS,
  WEEKLY_PUBLICATIONS,
} from "../../data/publications";
import PublicationCard from "./PublicationCard";

export default function Dashboard() {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl">Wochenblätter</h2>
          <span className="text-xs uppercase tracking-wider text-ink-500">
            {WEEKLY_PUBLICATIONS.length} Titel · Gesamt{" "}
            {WEEKLY_PUBLICATIONS.reduce(
              (s, p) => s + p.circulation,
              0,
            ).toLocaleString("de-DE")}{" "}
            Auflage
          </span>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WEEKLY_PUBLICATIONS.map((p) => (
            <PublicationCard key={p.id} pub={p} />
          ))}
        </div>
      </div>

      <div>
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl">Tageszeitungen</h2>
          <span className="text-xs uppercase tracking-wider text-ink-500">
            {DAILY_PUBLICATIONS.length} Titel
          </span>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {DAILY_PUBLICATIONS.map((p) => (
            <PublicationCard key={p.id} pub={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
