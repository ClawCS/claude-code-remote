import Link from "next/link";
import Image from "next/image";
import { PEOPLE_STORY, EDITORIAL_IMAGES } from "@/data/cinematic-editorial";
import FlyerIndexView from "@/components/FlyerIndexView";
import { getFlyerIndex } from "@/lib/flyer-index";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";

export const dynamic = "force-dynamic";

export default async function NederlandsPage() {
  const index = await getFlyerIndex(resolveHomepageNow());
  return <div className="bg-[#FFF8F2] text-[#281E1E]">
    <header className="bg-white border-b-4 border-primary">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" prefetch={false}><Image src="/images/home/brand-logo.webp" alt="Trinkgut Jammers" width={200} height={78} className="w-40 h-auto"/></Link>
        <nav aria-label="Nederlandse navigatie" className="flex flex-wrap gap-5 text-sm font-bold">
          <a href="#handzettel">Aanbiedingen</a><a href="#service">Feest & verhuur</a><a href="#contact">Contact</a><Link href="/" prefetch={false}>Deutsch</Link>
        </nav>
      </div>
    </header>
    <main>
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div><p className="text-primary uppercase tracking-wide text-sm font-bold mb-4">Trinkgut Jammers · Goch</p><h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">Goed gezelschap.<br/><span className="text-primary">Goede dranken.</span></h1><p className="text-lg leading-relaxed mb-6">Ontdek ons drankenassortiment en maak kennis met de mensen achter Jammers. Wij helpen je persoonlijk bij je keuze, je feest en het huren van feestbenodigdheden.</p><a href="#handzettel" className="inline-flex bg-primary text-white px-5 py-3 font-bold rounded">Bekijk de weekaanbiedingen</a><p className="mt-6 font-semibold">{MARKET.street} · 47574 Goch<br/>Ma–za 08:00–20:00 uur · gesloten op feestdagen</p></div>
        <figure className="m-0 border-8 border-primary bg-white"><Image src={EDITORIAL_IMAGES.hero.image} alt="Sven en Niko in onze winkel" sizes="(max-width: 768px) 100vw, 50vw" className="w-full h-auto"/><figcaption className="p-3 text-sm font-bold">Sven & Niko · Team Jammers</figcaption></figure>
      </section>
      <FlyerIndexView index={index} compact/>
      <section id="service" className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Alles voor jouw moment.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[{title:"Dranken ontdekken",text:"Bier, wijn, frisdrank en bijzondere smaken. Vraag ons team naar prijzen en beschikbaarheid.",href:"/produkte",label:"Ons assortiment"},{title:"Een feest plannen",text:"Gebruik onze partyplanner om een inschatting van de benodigde hoeveelheden te maken.",href:"/partyplaner",label:"Naar de partyplanner"},{title:"Feestbenodigdheden huren",text:"Tapinstallaties, koelwagens, glazen en meer. Wij bevestigen prijs, beschikbaarheid en voorwaarden persoonlijk.",href:"/vermietung",label:"Verhuur bekijken"}].map(item=><article key={item.title} className="bg-white border border-red-100 p-6"><h3 className="text-xl font-bold mb-3">{item.title}</h3><p className="leading-relaxed mb-5">{item.text}</p><Link href={item.href} prefetch={false} className="text-primary font-bold underline">{item.label} ↗</Link></article>)}
        </div>
        <p className="text-sm mt-6">Een aanvraag via de website is geen bestelling of bevestigde reservering. De gekoppelde product- en servicepagina’s zijn in het Duits.</p>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-red-100">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">De mensen achter Jammers.</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{PEOPLE_STORY.map(person=><figure key={person.id} className={person.id === "team-group" ? "m-0 col-span-2 md:col-span-4 max-w-4xl mx-auto" : "m-0"}><Image src={person.image} alt={person.alt} sizes={person.id === "team-group" ? "(max-width: 768px) 100vw, 900px" : "(max-width: 768px) 50vw, 25vw"} className="w-full h-auto"/><figcaption className="font-bold text-sm pt-3">{person.caption}</figcaption></figure>)}</div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-red-100">
        <h2 className="text-3xl font-bold mb-4">Ook een wereld voor verzamelaars.</h2><p className="mb-5">GrailBid is onze eigen TCG-wereld voor trading cards en verzamelaars. De externe webshop is nog in ontwikkeling.</p><a href={SITE_LINKS.grailbid} target="_blank" rel="noopener noreferrer" className="inline-flex px-5 py-3 bg-[#281E1E] text-white font-bold">Naar GrailBid.com ↗</a>
      </section>
    </main>
    <footer id="contact" className="bg-[#281E1E] text-white border-t-4 border-primary">
      <div className="max-w-6xl mx-auto px-6 py-12"><h2 className="text-3xl font-bold mb-5">Kom langs in Goch.</h2><address className="not-italic leading-relaxed">{MARKET.displayName}<br/>{MARKET.street}, 47574 Goch<br/>Ma–za 08:00–20:00 uur<br/><a href={MARKET.phoneHref}>{MARKET.phoneDisplay}</a><br/><a href={`mailto:${MARKET.email}`}>{MARKET.email}</a></address><div className="flex flex-wrap gap-6 my-6"><a href={SITE_LINKS.route} target="_blank" rel="noopener noreferrer">Route plannen ↗</a><a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a><a href={SITE_LINKS.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a></div><nav aria-label="Juridische informatie" className="flex flex-wrap gap-5 text-sm"><Link href="/impressum" prefetch={false}>Colofon</Link><Link href="/datenschutz" prefetch={false}>Privacybeleid</Link><Link href="/agb" prefetch={false}>Informatie over aanvragen</Link></nav><p className="text-sm mt-6">© {MARKET.legalName}</p></div>
    </footer>
  </div>;
}
