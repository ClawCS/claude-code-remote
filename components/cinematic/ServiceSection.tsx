import Link from "next/link";

import {
  RENTAL_HIGHLIGHTS,
  RENTAL_SOURCES,
  SERVICE_ITEMS,
} from "@/data/cinematic-editorial";

export default function ServiceSection(): React.JSX.Element {
  return (
    <section id="service" aria-labelledby="service-title">
      <p>Feiern beginnt mit einem guten Plan.</p>
      <h2 id="service-title">Deine Party. Unser Service.</h2>
      <ol data-service-items>
        {SERVICE_ITEMS.map((service) => (
          <li key={service.number}>
            <p>{service.number}</p>
            <h3>{service.title}</h3>
            <p>{service.text}</p>
            <Link href={service.href} prefetch={false}>
              Mehr erfahren
            </Link>
          </li>
        ))}
      </ol>
      <div data-rental-highlights>
        {RENTAL_HIGHLIGHTS.map((rental) => (
          <article key={rental.name}>
            <h3>{rental.name}</h3>
            <p>
              {rental.price} · Preis laut {RENTAL_SOURCES.price.label} · Stand{" "}
              {RENTAL_SOURCES.price.asOf}
            </p>
            <p>
              {rental.stock} Stück · Bestand laut Liste · Stand{" "}
              {RENTAL_SOURCES.inventory.asOf}
            </p>
            <p>Bestand laut Liste. Reservierung erforderlich.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
