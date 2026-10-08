import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Vite loads bitmaps as strings; adapt only Next's image-loading boundary.
vi.mock("next/image", async () => {
  const React = await import("react");
  return {
    default: (props: {
      src: string | { src: string }; alt: string; fill?: boolean; priority?: boolean; placeholder?: string;
    }) => {
      const imageProps = { ...props } as Record<string, unknown>;
      for (const prop of ["fill", "priority", "placeholder"]) delete imageProps[prop];
      return React.createElement("img", { ...imageProps, src: typeof props.src === "string" ? props.src : props.src.src, alt: props.alt });
    },
  };
});

import CinematicHeader from "@/components/cinematic/CinematicHeader";
import LocationFooter from "@/components/cinematic/LocationFooter";
import InstagramSection from "@/components/cinematic/InstagramSection";
import ActionsSection from "@/components/cinematic/ActionsSection";
import CurrentSection from "@/components/cinematic/CurrentSection";
import KontaktPage from "@/app/kontakt/page";
import CommunityPage from "@/app/community/page";
import GaleriePage from "@/app/galerie/page";
import KuehlschrankPage from "@/app/kuehlschrank/page";
import FlyerIndexView from "@/components/FlyerIndexView";
import NederlandsPage from "@/app/nl/page";
import InquiryInformation from "@/app/bestellungen/page";
import GeschenkideenPage from "@/app/geschenkideen/page";
import OekoTrackerPage from "@/app/oeko-tracker/page";
import GewinnspielPage from "@/app/gewinnspiel/page";
import { SocialIcon } from "@/components/SocialLink";

const whatsapp = "https://wa.me/491752492386?text=Hallo%20Trinkgut%20Jammers%2C%20ich%20habe%20eine%20Frage.";
const whatsappNl = "https://wa.me/491752492386?text=Hallo%20Trinkgut%20Jammers%2C%20ik%20heb%20een%20vraag.";
const instagram = "https://www.instagram.com/trinkgutjammers_goch/";
const emptyIndex = { status: "ok", issues: [], generatedAt: "2026-10-08T10:00:00.000Z", flyers: [], scheduled: [] } as const;

afterEach(() => vi.unstubAllEnvs());

describe("recognizable social destinations", () => {
  test("scopes the WhatsApp green treatment to its SVG symbol", () => {
    const whatsappIcon = renderToStaticMarkup(<SocialIcon platform="whatsapp" />);
    const instagramIcon = renderToStaticMarkup(<SocialIcon platform="instagram" />);
    const whatsappClass = whatsappIcon.match(/<svg\b[^>]*class="([^"]+)"/)?.[1] ?? "";
    const instagramClass = instagramIcon.match(/<svg\b[^>]*class="([^"]+)"/)?.[1] ?? "";

    expect(whatsappClass).toContain("whatsappIcon");
    expect(instagramClass).not.toContain("whatsappIcon");
  });

  test("gives each Dutch WhatsApp destination a localized accessible icon", async () => {
    const html = renderToStaticMarkup(await NederlandsPage());
    const links = [...html.matchAll(/<a\b([^>]*href="https:\/\/wa.me\/[^>]+)>([\s\S]*?)<\/a>/g)];
    expect(links).toHaveLength(2);
    for (const [, attrs, content] of links) {
      expect(attrs).toContain(`href="${whatsappNl}"`);
      expect(attrs).toMatch(/aria-label="Stuur[^\"]*WhatsApp-bericht"/);
      expect(content).toMatch(/<svg\b[^>]*aria-hidden="true"/);
      expect(content.replace(/<[^>]*>/g, "").trim()).toBe("");
    }
  });

  // Missing icons, lost accessible names, unsafe new tabs, or changed destinations must fail.
  test.each([
    ["header", () => <CinematicHeader nowIso="2026-10-08T10:00:00.000Z" hasActions />, [whatsapp]],
    ["footer", () => <LocationFooter />, [whatsapp, instagram]],
    ["Instagram section", () => <InstagramSection />, [instagram]],
    ["actions fallback", () => <ActionsSection event={null} archive={[]} nowIso="2026-10-08T10:00:00.000Z" />, [instagram]],
    ["flyer fallback", () => <CurrentSection content={{ generatedAt: "2026-10-08T10:00:00.000Z", flyer: null, event: null, archive: [], fallbackMessage: "Der nächste Handzettel wird vorbereitet." }} />, [whatsapp]],
    ["contact page", () => <KontaktPage />, ["https://wa.me/491752492386", instagram]],
    ["community", () => <CommunityPage />, [instagram]],
    ["gallery", () => <GaleriePage />, [instagram]],
    ["personal advice", () => <KuehlschrankPage />, [whatsapp]],
    ["German flyer contact", () => <FlyerIndexView index={emptyIndex} />, [whatsapp]],
    ["Dutch flyer contact", () => <FlyerIndexView index={emptyIndex} compact />, [whatsappNl]],
    ["inquiry information", () => <InquiryInformation />, [whatsapp]],
    ["gift advice", () => <GeschenkideenPage />, [whatsapp]],
    ["eco tracker contact", () => <OekoTrackerPage />, ["https://wa.me/491752492386"]],
    ["giveaway empty state", () => {
      vi.stubEnv("CINEMATIC_E2E", "1");
      vi.stubEnv("CINEMATIC_TEST_NOW", "2027-01-01T12:00:00.000Z");
      return <GewinnspielPage />;
    }, [instagram]],
  ] as const)("renders accessible icon links in %s without changing destinations", (_name, component, destinations) => {
    const html = renderToStaticMarkup(component());
    const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    for (const destination of destinations) {
      const matching = links.filter(([, attrs]) => attrs.includes(`href="${destination}"`));
      expect(matching, destination).toHaveLength(1);
      const [, attrs, content] = matching[0];
      expect(attrs).toMatch(/aria-label="[^\"]*(?:WhatsApp|Instagram)[^\"]*"/);
      expect(attrs).toContain('target="_blank"');
      expect(attrs).toContain('rel="noopener noreferrer"');
      expect(content).toMatch(/<svg\b[^>]*aria-hidden="true"/);
      expect(content).toMatch(/<svg\b[^>]*focusable="false"/);
      expect(content.replace(/<[^>]*>/g, "").trim()).toBe("");
    }
  });
});
