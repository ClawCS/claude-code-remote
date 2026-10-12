import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ContentSources from "@/components/editorial/ContentSources";
import LessonContent from "@/components/academy/LessonContent";
import { courses } from "@/data/akademie";

describe("visible, honest content-source attribution", () => {
  it("renders the actual sources and review scope without inventing an expert author", () => {
    const html = renderToStaticMarkup(<ContentSources id="recipe:negroni" />);
    expect(html).toContain("Quellen &amp; Stand");
    expect(html).toMatch(/datetime="2026-10-12"/i);
    expect(html).toContain("https://");
    expect(html).not.toMatch(/Expertenprüfung|zertifiziert|KI-generiert/);
  });
  it("does not label unknown content as reviewed", () => {
    expect(renderToStaticMarkup(<ContentSources id="recipe:not-reviewed" />)).toBe("");
  });
  it("makes a lesson source view server-readable outside the exact lesson-text region", () => {
    const course = courses.find(course => course.slug === "wein")!;
    const html = renderToStaticMarkup(<LessonContent course={course} index={0} />);
    expect(html).toContain('id="course-lesson"');
    expect(html).toContain('data-content-review="academy:wein:1"');
    expect(html.indexOf("Quellen &amp; Stand")).toBeGreaterThan(html.indexOf("</section>"));
  });
});
