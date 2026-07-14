import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { auditCinematicCss } from "@/lib/cinematic/css-audit";

const files = [
  resolve(process.cwd(), "app/home.module.css"),
  ...readdirSync(resolve(process.cwd(), "components/cinematic"))
    .filter((name) => name.endsWith(".module.css"))
    .map((name) => resolve(process.cwd(), "components/cinematic", name)),
];

describe("cinematic CSS boundary", () => {
  test.each([
    ["hex", ".x{color:#FEE005}"],
    ["rgb", ".x{background:rgb(0 0 0)}"],
    ["duration", ".x{transition-duration:200ms}"],
    ["easing", ".x{transition-timing-function:cubic-bezier(0,0,1,1)}"],
    ["raw spacing", ".x{padding:13px}"],
    ["wrong category", ".x{padding:var(--cinematic-color-yellow)}"],
  ])("rejects %s", (_name, css) => {
    expect(auditCinematicCss(css)).not.toEqual([]);
  });

  test("accepts category-correct tokens", () => {
    expect(
      auditCinematicCss(
        ".x{color:var(--cinematic-color-white);padding:var(--cinematic-spacing-md);transition-duration:var(--cinematic-motion-duration-fast);transition-timing-function:var(--cinematic-motion-easing-standard)}",
      ),
    ).toEqual([]);
  });

  test("audits every production Cinematic CSS Module", () => {
    for (const file of files) {
      expect(auditCinematicCss(readFileSync(file, "utf8")), file).toEqual([]);
    }
  });
});
