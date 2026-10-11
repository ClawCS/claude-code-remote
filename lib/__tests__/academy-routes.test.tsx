import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { courses } from "@/data/akademie";
import { lessonHref, parseLessonIndex } from "@/lib/academy-routes";
import LessonPage, { generateMetadata, generateStaticParams } from "@/app/akademie/[slug]/lektion/[lesson]/page";
import CourseLayout from "@/app/akademie/[slug]/layout";
import sitemap from "@/app/sitemap";

describe("academy lesson routing", () => {
  it.each([[0, "/akademie/bier"], [1, "/akademie/bier/lektion/2"], [19, "/akademie/bier/lektion/20"]] as const)("uses the canonical destination for index %s", (index, href) => {
    expect(lessonHref("bier", index)).toBe(href);
  });

  it.each(["", "0", "-1", "01", "02", "2.0", "2foo", " 2", "+2", "21", "9007199254740993"])("rejects noncanonical or out-of-range ID %s", async lesson => {
    expect(parseLessonIndex(lesson, 20)).toBeUndefined();
    await expect(LessonPage({ params: Promise.resolve({ slug: "mineralwasser", lesson }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("keeps lesson-one aliases generated but out of the sitemap", async () => {
    const params = generateStaticParams({ params: { slug: "mineralwasser" } });
    expect(params).toHaveLength(20);
    expect(params[0]).toEqual({ lesson: "1" });
    expect(params.at(-1)).toEqual({ lesson: "20" });
    const error = await LessonPage({ params: Promise.resolve({ slug: "mineralwasser", lesson: "1" }) }).catch(error => error);
    expect(error.digest).toBe("NEXT_REDIRECT;replace;/akademie/mineralwasser;308;");
    const urls = sitemap().map(entry => entry.url);
    for (const course of courses) {
      for (let index = 1; index < course.lessons.length; index++) {
        expect(urls.filter(url => url === `https://trinkgut-jammers.de/akademie/${course.slug}/lektion/${index + 1}`)).toHaveLength(1);
      }
      expect(urls).not.toContain(`https://trinkgut-jammers.de/akademie/${course.slug}/lektion/1`);
    }
  });

  it("does not serialize lesson content or irrelevant catalogue fields into the client shell", async () => {
    const layout = await CourseLayout({ params: Promise.resolve({ slug: "mineralwasser" }), children: <p>Selected server content</p> });
    expect(Object.keys(layout.props.course).sort()).toEqual(["description", "difficulty", "duration", "finalExam", "lessons", "slug", "title"]);
    for (const lesson of layout.props.course.lessons) expect(Object.keys(lesson).sort()).toEqual(["quiz", "title"]);
  });

  it.each(courses.map(course => [course.slug, course.lessons.length] as const))("renders the final lesson of %s and its own metadata", async (slug, count) => {
    const params = Promise.resolve({ slug, lesson: String(count) });
    const html = renderToStaticMarkup(await LessonPage({ params }));
    expect(html).toContain('id="course-lesson"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    const metadata = await generateMetadata({ params });
    expect(metadata.alternates?.canonical).toBe(`https://trinkgut-jammers.de/akademie/${slug}/lektion/${count}`);
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    expect(metadata.description).toContain(`Lektion ${count} von ${count}`);
    expect(html).not.toMatch(/datePublished|dateModified|reviewedBy/);
  });
});
