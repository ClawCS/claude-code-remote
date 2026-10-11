import { weeklyPublicationFixture, sha256 } from "./weekly-publication";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** Synthetic supplement sharing real immutable fixture assets, never production content. */
export async function supplementalPublicationFixture(validFrom = "2026-10-07", validTo = "2026-10-18", week = "2026-10-05", weeklyTo = "2026-10-10") {
  const f = await weeklyPublicationFixture(week, weeklyTo);
  const source = structuredClone(f.sources[1]);
  source.sourceUrl = "https://www.canva.com/design/SYNTHETIC/view";
  source.flyerId = "maasduinen-synthetic";
  source.identity={language:"nl",purpose:"supplemental",medium:"maasduinen"};
  source.source={kind:"canva",flyerId:source.flyerId};
  source.approvedAt=source.reviewedAt;
  source.validFrom = source.printedValidFrom = validFrom;
  source.validTo = source.printedValidTo = validTo;
  source.pages[0].offers[0].id = "maasduinen-synthetic-p1";
  const offer = { ...f.offers[2], id: source.pages[0].offers[0].id, flyerId: source.flyerId, validFrom, validTo };
  const edition = { ...structuredClone(f.editions[1]), id: source.flyerId, validFrom, validTo,
    identity: { language: "nl", purpose: "supplemental", medium: "maasduinen" } as const,
    source: { kind: "canva", flyerId: source.flyerId } as const,
    review: { ...f.editions[1].review, approvedAt: f.editions[1].review.reviewedAt, printedValidFrom: validFrom, printedValidTo: validTo },
    offerIds: [offer.id], offersSha256: sha256(JSON.stringify([offer])) };
  const flyer = { ...f.flyer, id: source.flyerId, sourceUrl: source.sourceUrl, validFrom, validTo,
    identity: edition.identity, source: edition.source, pageCount: 1,
    review: { reviewedAt: edition.review.reviewedAt, approvedAt: edition.review.approvedAt, printedValidFrom: validFrom, printedValidTo: validTo } };
  f.sources.push(source);
  f.offers.push(offer);
  const publication = { schemaVersion: 1 as const, edition };
  const save = async () => {
    await f.save();
    const originals = JSON.parse(await readFile(path.join(f.root, "data/editorial/flyers.json"), "utf8"));
    await f.write("data/editorial/flyers.json", JSON.stringify([...originals, flyer]));
    await f.write(`data/editorial/supplemental-publications/${edition.id}.json`, JSON.stringify(publication));
  };
  await save();
  return { ...f, save, supplemental: publication, supplementalSource: source, supplementalOffer: offer, supplementalFlyer: flyer };
}
