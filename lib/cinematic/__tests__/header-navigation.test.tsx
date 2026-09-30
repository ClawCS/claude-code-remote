import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

// Vite returns a URL for static WebP imports; adapt only that asset boundary
// to Next's image record. The header, both navigation consumers and Link stay real.
vi.mock("@/public/images/home/brand-logo.webp", () => ({
  default: { src: "/images/home/brand-logo.webp", width: 520, height: 198 },
}));

import CinematicHeader from "@/components/cinematic/CinematicHeader";

describe("public header recipe navigation", () => {
  // Removing the recipe item or pointing it at a different route must break
  // both consumers, even if a recipe link remains elsewhere in the footer.
  test.each(["Hauptnavigation", "Mobile Navigation"])(
    "%s renders one direct Cocktail-Rezepte link",
    (navigationName) => {
      const html = renderToStaticMarkup(
        <CinematicHeader nowIso="2026-09-30T12:00:00.000Z" hasActions />,
      );
      const navigation = html.match(
        new RegExp(`<nav\\b[^>]*aria-label="${navigationName}"[^>]*>([\\s\\S]*?)</nav>`),
      );
      expect(navigation, `the real ${navigationName} consumer must render`).not.toBeNull();
      const recipeLinks = [...navigation![1].matchAll(/<a\b([^>]*)>Cocktail-Rezepte<\/a>/g)];
      expect(recipeLinks).toHaveLength(1);
      expect(recipeLinks[0][1]).toContain('href="/cocktails"');
      expect(recipeLinks[0][1]).not.toContain('target="_blank"');
    },
  );
});
