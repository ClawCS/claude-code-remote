/** Focused read-only HTTP acceptance. No server clock, writes or account calls. */
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { renderedTree, walk, decode } from "../lib/rendered-html.mjs";
import { cocktails } from "../data/cocktails";
import { courses, type Lesson } from "../data/akademie";
import photos from "../data/cocktail-photo-candidates.json";
import products from "../data/products.json";

const origin = "https://trinkgut-jammers.de";
type Node = { tag: string; attrs: Record<string, string>; children: Node[]; value?: string };
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
function textOf(node: Node): string {
  if (["script", "style", "template"].includes(node.tag) || Object.hasOwn(node.attrs, "hidden") || node.attrs["aria-hidden"] === "true") return "";
  return node.tag === "#text" ? decode(node.value ?? "") : node.children.map(textOf).join("") + (["p", "section", "div", "ul", "li", "h1", "h2", "h3", "h4"].includes(node.tag) ? " " : "");
}
function nodes(html: string): Node[] {
  const result: Node[] = [];
  walk(renderedTree(html), (node: Node) => result.push(node));
  return result;
}
export function checkPage(html: string, path: string, robotsHeader: string | null): string[] {
  const all = nodes(html), errors: string[] = [];
  const canonicals = all.filter(node => node.tag === "link" && node.attrs.rel === "canonical");
  if (canonicals.length !== 1 || (path === "/" ? ![origin, origin + "/"].includes(canonicals[0].attrs.href) : canonicals[0].attrs.href !== origin + path)) errors.push("canonical is not a unique self target");
  const robots = all.filter(node => node.tag === "meta" && /^(robots|googlebot)$/.test(node.attrs.name ?? "")).map(node => node.attrs.content).join(" ");
  if (/\bnoindex\b/i.test(`${robots} ${robotsHeader ?? ""}`)) errors.push("noindex destination");
  return errors;
}
export function checkLesson(html: string, lesson: Pick<Lesson, "title" | "content">): string[] {
  const selected = nodes(html).filter(node => node.attrs.id === "course-lesson");
  if (selected.length !== 1) return ["selected lesson content missing or duplicated"];
  const actual = normalize(textOf(selected[0]));
  const expected = normalize(lesson.title + " " + lesson.content.replace(/^#{2,3} /gm, "").replace(/\*\*/g, ""));
  return actual === expected ? [] : ["selected full lesson content differs from source"];
}
export function checkRecipe(html: string, recipe: { name: string; category: string; ingredients: string[]; instructions: string; tip: string }, approvedImage: string | undefined): string[] {
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap(match => {
    const data = JSON.parse(match[1]);
    return Array.isArray(data) ? data : [data];
  }).filter(data => data["@type"] === "Recipe");
  const expected = { "@context": "https://schema.org", "@type": "Recipe", name: recipe.name, recipeCategory: recipe.category, recipeIngredient: recipe.ingredients, recipeInstructions: recipe.instructions, ...(approvedImage ? { image: origin + approvedImage } : {}) };
  const errors: string[] = [];
  if (schemas.length !== 1 || !isDeepStrictEqual(schemas[0], expected)) errors.push("recipe schema differs from approved source fields");
  const all = nodes(html), visible = normalize(textOf(renderedTree(html)));
  for (const value of [recipe.name, ...recipe.ingredients, recipe.instructions, recipe.tip]) {
    if (!visible.includes(normalize(value))) errors.push("recipe visible text missing: " + value);
  }
  if (approvedImage && !all.some(node => node.tag === "img" && [node.attrs.src, node.attrs.srcset].some(src => src && decodeURIComponent(src).includes(approvedImage)))) errors.push("approved recipe image not rendered");
  return errors;
}
const slug = (value: string) => value.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function run() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--url") throw new Error("Usage: tsx scripts/audit-search-readiness.ts --url <origin>");
  const base = new URL(args[1]);
  if (!/^https?:$/.test(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) throw new Error("Expected HTTP(S) origin without credentials/path/query/fragment");
  const errors: { path: string; error: string }[] = [];
  const record = (path: string, failures: string[]) => failures.forEach(error => errors.push({ path, error }));
  async function request(path: string) {
    const response = await fetch(base.origin + path, { redirect: "manual", signal: AbortSignal.timeout(30000) });
    return { response, html: await response.text() };
  }
  const sitemap = await request("/sitemap.xml");
  if (sitemap.response.status !== 200) throw new Error("Sitemap not 200");
  const urls = [...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
  if (new Set(urls).size !== urls.length) throw new Error("Duplicate sitemap destinations");
  const recipes = new Map(cocktails.map(recipe => ["/cocktails/" + slug(recipe.name), recipe]));
  const lessons = new Map<string, Lesson>(courses.flatMap(course => course.lessons.map((lesson, index) => [`/akademie/${course.slug}${index ? `/lektion/${index + 1}` : ""}`, lesson] as const)));
  const checked = { sitemap: 0, recipes: 0, lessons: 0, roots: 0, aliases: 0, invalid: 0, utilities: 0, protected: 0 };
  for (const url of urls) {
    if (!url.startsWith(origin + "/")) throw new Error("Unexpected sitemap origin");
    const path = new URL(url).pathname;
    const { response, html } = await request(path);
    record(path, response.status === 200 ? checkPage(html, path, response.headers.get("x-robots-tag")) : ["HTTP " + response.status]);
    checked.sitemap++;
    const recipe = recipes.get(path);
    if (recipe) { record(path, checkRecipe(html, recipe, photos.photos.find(photo => photo.status === "approved" && photo.name === recipe.name)?.src)); checked.recipes++; }
    const lesson = lessons.get(path);
    if (lesson) { record(path, checkLesson(html, lesson)); checked.lessons++; if (!path.includes("/lektion/")) checked.roots++; }
  }
  if (checked.recipes !== 65 || checked.lessons !== 180 || checked.roots !== 8) record("/sitemap.xml", ["recipe/lesson census differs from 65/180/8"]);
  for (const course of courses) {
    const path = `/akademie/${course.slug}/lektion/1`;
    const { response } = await request(path);
    if (response.status !== 308 || new URL(response.headers.get("location") ?? "", base).pathname !== `/akademie/${course.slug}`) record(path, ["lesson-one alias is not exact 308 to root"]);
    checked.aliases++;
    for (const id of ["0", "01", "-1", "1.5", "1e1", "9007199254740992", String(course.lessons.length + 1)]) {
      const invalid = `/akademie/${course.slug}/lektion/${id}`;
      if ((await request(invalid)).response.status !== 404) record(invalid, ["invalid lesson not 404"]);
      checked.invalid++;
    }
  }
  const legacy = products[0];
  const old = await request(`/produkte/${legacy.slug}`);
  if (old.response.status !== 308 || new URL(old.response.headers.get("location") ?? "", base).pathname !== `/kategorie/${legacy.categorySlug}`) record("legacy product", ["not exact 308 to assigned category"]);
  checked.aliases++;
  for (const path of ["/produkte/unknown-product", "/cocktails/unknown-recipe", "/akademie/unknown-course/lektion/2"]) {
    if ((await request(path)).response.status !== 404) record(path, ["unknown route not 404"]);
    checked.invalid++;
  }
  for (const [path, canonical, noindex] of [["/handzettel", "/angebote", false], ["/merkzettel", "/merkzettel", true], ["/gewinnspiel/archiv", "/gewinnspiel/archiv", true]] as const) {
    const { response, html } = await request(path);
    const all = nodes(html);
    if (response.status !== 200 || all.filter(node => node.tag === "link" && node.attrs.rel === "canonical").map(node => node.attrs.href).join() !== origin + canonical) record(path, ["utility status/canonical differs"]);
    const policy = all.filter(node => node.tag === "meta" && node.attrs.name === "robots").map(node => node.attrs.content).join();
    if (/\bnoindex\b/.test(policy) !== noindex || /\bnofollow\b/.test(policy)) record(path, ["utility index/follow policy differs"]);
    if (urls.includes(origin + path)) record(path, ["utility should not be in sitemap"]);
    checked.utilities++;
  }
  for (const path of ["/bewerbung", "/markt", "/mietbestellung"]) {
    const { response } = await request(path);
    if (!/noindex/.test(response.headers.get("x-robots-tag") ?? "")) record(path, ["protected noindex header missing"]);
    checked.protected++;
  }
  for (const [path, fields] of [["/api/rentals/config", { enabled: false, testMode: false, onlinePayment: false }], ["/api/bewerbung/config", { enabled: false }]] as const) {
    const { response, html } = await request(path);
    const data = JSON.parse(html);
    if (response.status !== 200 || Object.entries(fields).some(([key, value]) => data[key] !== value)) record(path, ["disabled operational configuration changed"]);
    checked.protected++;
  }
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), base: base.origin, checked, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run().catch(error => { console.error(error.message); process.exitCode = 1; });
