import Link from "next/link";
import Image from "next/image";
import SocialLink from "@/components/SocialLink";
import TeamPhotoPlaceholder from "@/components/TeamPhotoPlaceholder";
import { PEOPLE_STORY, EDITORIAL_IMAGES } from "@/data/cinematic-editorial";
import FlyerIndexView from "@/components/FlyerIndexView";
import { getFlyerIndex } from "@/lib/flyer-index";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";
import styles from "./nl.module.css";

export const dynamic = "force-dynamic";

const services = [
  { number: "01", title: "Iets lekkers voor thuis.", text: "Bier, wijn, sterke drank of frisdrank? Vertel ons wat je zoekt. We helpen je persoonlijk bij je keuze.", href: "#contact", label: "Vraag het ons team" },
  { number: "02", title: "Een feest op de planning?", text: "Een verjaardag, een barbecue of een gezellige avond: onze partyplanner helpt je inschatten hoeveel drank je nodig hebt.", href: "/partyplaner", label: "Open de partyplanner", german: true },
  { number: "03", title: "Meer dan alleen dranken.", text: "Van een tapinstallatie en koelwagen tot tafels en glazen. Bekijk onze verhuur en vraag naar de mogelijkheden voor jouw datum.", href: "/vermietung", label: "Bekijk de verhuur", german: true },
] as const;

export default async function NederlandsPage() {
  const index = await getFlyerIndex(resolveHomepageNow());
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>Naar de inhoud</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" prefetch={false} aria-label="Trinkgut Jammers – Duitse startpagina" className={styles.logo}>
            <Image src="/images/home/brand-logo.webp" alt="Trinkgut Jammers" width={200} height={78} priority />
          </Link>
          <nav aria-label="Nederlandse navigatie" className={styles.nav}>
            <a href="#handzettel">Aanbiedingen</a>
            <a href="#bezoek">Je bezoek</a>
            <a href="#service">Feest & verhuur</a>
          </nav>
          <Link href="/" hrefLang="de" lang="de" prefetch={false} className={styles.language}>Deutsch <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="nl-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span aria-hidden="true">🇳🇱</span> Welkom bij Trinkgut Jammers</p>
            <h1 id="nl-title">Jouw drankenadres <span>in Goch.</span></h1>
            <p className={styles.lead}>Een dagje Duitsland? Kom langs bij Jammers. Ontdek jouw favoriete dranken, bekijk onze actuele aanbiedingen en maak kennis met de mensen achter de winkel.</p>
            <div className={styles.actions}>
              <a href="#handzettel" className={styles.primaryButton}>Bekijk de aanbiedingen <span aria-hidden="true">↓</span></a>
              <SocialLink platform="maps" href={SITE_LINKS.route} label="Plan je route naar Trinkgut Jammers in Google Maps" />
            </div>
            <p className={styles.heroAddress}>{MARKET.street} · {MARKET.postalCode} {MARKET.city}<br /><strong>Ma–za 08:00–20:00 uur</strong><br /><span>Gesloten op zon- en feestdagen in Noordrijn-Westfalen.</span></p>
          </div>
          <figure className={styles.heroPhoto}>
            <Image src={EDITORIAL_IMAGES.hero.image} alt="Sven en Niko bij de drankkratten in de winkel van Trinkgut Jammers" sizes="(max-width: 760px) 100vw, 50vw" priority />
            <figcaption><strong>Sven & Niko</strong></figcaption>
          </figure>
        </section>

        <div className={styles.flyerBand}>
          <FlyerIndexView index={index} compact />
        </div>

        <section id="bezoek" className={styles.visit} aria-labelledby="bezoek-title">
          <div>
            <p className={styles.eyebrow}>Maak er een bezoekje van</p>
            <h2 id="bezoek-title">Even naar Goch.<br />Even naar Jammers.</h2>
            <p>Combineer je bezoek aan Goch met een stop bij ons in de winkel. Of je nu iets zoekt voor het weekend, voor bij het eten of voor een feest: we denken graag met je mee.</p>
            <SocialLink platform="maps" href={SITE_LINKS.route} label="Plan je route naar Trinkgut Jammers in Google Maps" />
          </div>
          <dl className={styles.visitFacts}>
            <div><dt>Hier vind je ons</dt><dd>{MARKET.displayName}<br />{MARKET.street}<br />{MARKET.postalCode} {MARKET.city}, Duitsland</dd></div>
            <div><dt>Wanneer kom je langs?</dt><dd>Maandag t/m zaterdag<br /><strong>08:00–20:00 uur</strong><br /><span>Zon- en feestdagen in Noordrijn-Westfalen gesloten.</span></dd></div>
            <div><dt>Goed om te weten</dt><dd>Let bij aanbiedingen op de geldigheidsperiode, verpakkingsgrootte, het statiegeld en eventuele actievoorwaarden. Vraag ons vooraf naar de beschikbaarheid.</dd></div>
          </dl>
        </section>

        <section id="service" className={styles.services} aria-labelledby="service-title">
          <p className={styles.eyebrow}>Voor jouw moment</p>
          <h2 id="service-title">Goed gezelschap.<br />De rest regelen we samen.</h2>
          <div className={styles.serviceGrid}>{services.map((service) => (
            <article key={service.number}>
              <span className={styles.serviceNumber} aria-hidden="true">{service.number}</span>
              <h3>{service.title}</h3><p>{service.text}</p>
              <Link href={service.href} prefetch={false} className={styles.textLink}>{service.label} <span aria-hidden="true">↗</span></Link>
              {"german" in service && <small>Deze pagina is in het Duits.</small>}
            </article>
          ))}</div>
          <p className={styles.fineprint}>Een aanvraag is nog geen bevestigde reservering. Beschikbaarheid en voorwaarden stemmen we persoonlijk met je af.</p>
        </section>

        <section id="contact" className={styles.contact} aria-labelledby="contact-title">
          <div><p className={styles.eyebrow}>Vragen? We zijn er voor je.</p><h2 id="contact-title">Tot ziens in Goch.</h2><p>Wil je iets weten over een product of de beschikbaarheid? Bel ons of stuur een WhatsApp-bericht voordat je langskomt.</p></div>
          <div className={styles.contactLinks}>
            <a href={MARKET.phoneHref}>+49 2823 418707 <span aria-hidden="true">↗</span></a>
            <SocialLink platform="whatsapp" href={SITE_LINKS.whatsappNl} label="Stuur een WhatsApp-bericht" className={styles.socialContact} />
            <a href={"mailto:" + MARKET.email}>{MARKET.email} <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className={styles.people} aria-label="Ons team">
          <details>
            <summary>Maak kennis met ons team <span aria-hidden="true">+</span></summary>
            <div className={styles.peopleGrid}>
              <TeamPhotoPlaceholder language="nl" />
              {PEOPLE_STORY.map((person) => (
              <figure key={person.id}>
                <Image src={person.image} alt={person.caption + " van Trinkgut Jammers"} sizes="(max-width: 760px) 50vw, 25vw" />
                {person.caption && <figcaption>{person.caption}</figcaption>}
              </figure>
            ))}</div>
          </details>
        </section>
        <aside className={styles.grailbid} aria-label="Trading cards bij GrailBid">
          <p><strong>Ook iets voor verzamelaars.</strong> Ontdek GrailBid, onze TCG-wereld voor trading cards. De externe webshop is nog in ontwikkeling.</p>
          <a href={SITE_LINKS.grailbid} target="_blank" rel="noopener noreferrer" className={styles.textLink}>GrailBid.com <span aria-hidden="true">↗</span></a>
        </aside>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p><strong>{MARKET.displayName}</strong><br />{MARKET.street} · {MARKET.postalCode} {MARKET.city}<br />{MARKET.legalName}</p>
          <nav aria-label="Juridische informatie">
            <Link href="/impressum" prefetch={false}>Colofon</Link>
            <Link href="/datenschutz" prefetch={false}>Privacybeleid</Link>
            <Link href="/agb" prefetch={false}>Informatie over aanvragen</Link>
            <Link href="/" prefetch={false} hrefLang="de" lang="de">Deutsche Website</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
