import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import sharp from "sharp";
import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";

const output = resolve(process.cwd(), "public/images/home/cinematic");
const expected = [
  { name: "hero-team.webp", format: "webp", width: 915, height: 803, maxBytes: 100_000 },
  { name: "team-group.webp", format: "webp", width: 950, height: 840, maxBytes: 100_000 },
  { name: "team-niko.webp", format: "webp", width: 745, height: 727, maxBytes: 60_000 },
  { name: "team-jasmin.webp", format: "webp", width: 756, height: 718, maxBytes: 90_000 },
  { name: "team-gabriella.webp", format: "webp", width: 762, height: 711, maxBytes: 70_000 },
  { name: "poster-pralle-kirsche.webp", format: "webp", width: 1054, height: 1493, maxBytes: 230_000 },
  { name: "poster-schwarzer-teufel.webp", format: "webp", width: 1054, height: 1492, maxBytes: 230_000 },
  { name: "poster-caramello.webp", format: "webp", width: 1054, height: 1493, maxBytes: 230_000 },
  { name: "og-home.jpg", format: "jpeg", width: 1200, height: 630, maxBytes: 160_000 },
] as const;

const sources = [
  {
    path: "public/images/gallery/team-sven-niko.jpg",
    width: 1350,
    height: 1688,
    hash: "c00d3e0e3b4b12b3a639322acf1cbfa653a08b59f4de3b8e7617f798ade3a908",
  },
  {
    path: "public/images/gallery/team-gruppenfoto.jpg",
    width: 1350,
    height: 1688,
    hash: "56b8dd3d1bb23c710f4c8ab3ff5cb25acbdc23363c49fcba7e59b0eb86c726d3",
  },
  {
    path: "public/images/gallery/team-niko.jpg",
    width: 1080,
    height: 1350,
    hash: "ce5bc792792a4ea767a52cce59e1c24edea3b25307462b0fab2c82cd9c1ea889",
  },
  {
    path: "public/images/gallery/team-jasmin.jpg",
    width: 1080,
    height: 1350,
    hash: "f4abdade990528506045f32f35b59868e486abb236813b11ffcfc0a7beff0846",
  },
  {
    path: "public/images/gallery/team-gabriella.jpg",
    width: 1080,
    height: 1350,
    hash: "fc750f2e676888a79b426e05b35f84d20743ff5b3957411a1bf3892a6a159fdf",
  },
  {
    path: "public/images/eigenmarken/pralle-kirsche.png",
    width: 1054,
    height: 1493,
    hash: "6b7d52284a6543a4c8a6922effa296b74e8ca8025db4549bc83c558f6904e694",
  },
  {
    path: "public/images/eigenmarken/schwarzer-teufel.png",
    width: 1054,
    height: 1492,
    hash: "349bd8ca7c6912987857a1c76a97eb8fe45ac9093cf1fa233239687f1166dbdc",
  },
  {
    path: "public/images/eigenmarken/caramello.png",
    width: 1054,
    height: 1493,
    hash: "9a1b89a5f3156981913561f0901f1f03c65f341ea4c1047d11d0b913db7b93dd",
  },
  {
    path: "public/images/logo-trinkgut-jammers.png",
    width: 828,
    height: 324,
    hash: "275dbc9364073ca251933729218228bc661cc5f581fbd5a2107129bc69da09fb",
  },
] as const;

const sha256 = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");

async function waitForStagingDirectory(
  fixture: string,
  child: ChildProcess,
  stderr: () => string,
): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (
      readdirSync(fixture).some((name) =>
        name.startsWith(".output.staging-"),
      )
    ) {
      return;
    }
    if (child.exitCode !== null) {
      throw new Error(
        `Fixture build exited before staging (${child.exitCode}): ${stderr()}`,
      );
    }
    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2));
  }
  throw new Error("Timed out waiting for post-validation staging");
}

describe("cinematic image pipeline", () => {
  test("pins the deterministic Sharp toolchain and scripts", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    expect(packageJson.dependencies.sharp).toBe("0.34.5");
    expect(packageJson.scripts["assets:cinematic"]).toBe(
      "node scripts/build-cinematic-assets.mjs",
    );
    expect(packageJson.scripts["assets:cinematic:check"]).toBe(
      "node scripts/build-cinematic-assets.mjs --check",
    );
  });

  test.each(sources)("locks approved source $path", async ({ path, width, height, hash }) => {
    const file = resolve(path);
    expect(existsSync(file)).toBe(true);
    expect(sha256(file)).toBe(hash);
    expect(await sharp(file).metadata()).toMatchObject({ width, height });
  });

  test.each(expected)(
    "creates exact, stripped $name",
    async ({ name, format, width, height, maxBytes }) => {
      const file = resolve(output, name);
      expect(existsSync(file)).toBe(true);
      const metadata = await sharp(file).metadata();
      expect(metadata).toMatchObject({ format, width, height });
      expect(metadata.exif).toBeUndefined();
      expect(metadata.xmp).toBeUndefined();
      expect(metadata.icc).toBeUndefined();
      expect(readFileSync(file).byteLength).toBeLessThan(maxBytes);
    },
  );

  test("contains only the exact output allowlist", () => {
    expect(readdirSync(output).sort()).toEqual(
      expected.map(({ name }) => name).sort(),
    );
  });

  test("uses a valid ordered Next 16 candidate partition", () => {
    expect(nextConfig.images?.formats).toEqual(["image/avif", "image/webp"]);
    expect(nextConfig.images?.deviceSizes).toEqual([
      640, 768, 1024, 1280, 1440, 1920, 2560,
    ]);
    expect(nextConfig.images?.imageSizes).toEqual([
      32, 48, 64, 96, 128, 256, 360, 390, 512,
    ]);
    expect(Math.max(...nextConfig.images!.imageSizes!)).toBeLessThan(
      Math.min(...nextConfig.images!.deviceSizes!),
    );
  });

  test("keeps Canva evidence private and source-bound", () => {
    expect(existsSync(resolve("public/images/Preislisten"))).toBe(false);
    expect(readdirSync(resolve("assets/source/preislisten")).sort()).toEqual([
      "1.png",
      "2.png",
      "3.png",
      "4.png",
    ]);
    expect(sha256(resolve("assets/source/preislisten/1.png"))).toBe(
      "e75ce8cc5df983417bc8953226ff6a13de7b8f5e311d6e1295480327c2199336",
    );
    expect(sha256(resolve("assets/source/preislisten/2.png"))).toBe(
      "6e14d9f95450550e1fb69861bccf4ba96d66f04d54c8ed3f14f04145ca944bee",
    );
    expect(sha256(resolve("assets/source/preislisten/3.png"))).toBe(
      "c623c88575d0e4f0c5fd11740e33967632720bc80ab1e9655629ed47dce10ffb",
    );
    expect(sha256(resolve("assets/source/preislisten/4.png"))).toBe(
      "9311dcdaba18705460faf12f43144fb5b2a55b3b2e079167cb4a912aa40cfdf2",
    );
  });

  test("rebuilds byte-identically in a clean temp target and removes stale output", () => {
    const temp = mkdtempSync(join(tmpdir(), "jammers-cinematic-"));
    try {
      writeFileSync(join(temp, "stale.txt"), "must disappear");
      const env = { ...process.env, CINEMATIC_ASSET_OUTPUT_DIR: temp };
      execFileSync(process.execPath, ["scripts/build-cinematic-assets.mjs"], {
        env,
      });
      const first = Object.fromEntries(
        readdirSync(temp)
          .sort()
          .map((name) => [name, sha256(join(temp, name))]),
      );
      execFileSync(process.execPath, ["scripts/build-cinematic-assets.mjs"], {
        env,
      });
      const second = Object.fromEntries(
        readdirSync(temp)
          .sort()
          .map((name) => [name, sha256(join(temp, name))]),
      );
      expect(Object.keys(first)).toEqual(
        expected.map(({ name }) => name).sort(),
      );
      expect(second).toEqual(first);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  test(
    "builds exclusively from the immutable bytes that passed validation",
    async () => {
      const fixture = mkdtempSync(
        join(process.cwd(), ".cinematic-toctou-"),
      );
      let child: ChildProcess | undefined;

      try {
        for (const source of sources) {
          const destination = join(fixture, source.path);
          mkdirSync(dirname(destination), { recursive: true });
          copyFileSync(resolve(source.path), destination);
        }

        const fixtureScript = join(
          fixture,
          "scripts/build-cinematic-assets.mjs",
        );
        mkdirSync(dirname(fixtureScript), { recursive: true });
        copyFileSync(
          resolve("scripts/build-cinematic-assets.mjs"),
          fixtureScript,
        );

        const swappedLogo = await sharp({
          create: {
            width: 828,
            height: 324,
            channels: 3,
            background: "#000000",
          },
        })
          .png()
          .toBuffer();
        const swapPath = join(fixture, "public/images/logo-swap.png");
        writeFileSync(swapPath, swappedLogo);

        let stderr = "";
        child = spawn(process.execPath, [fixtureScript], {
          env: {
            ...process.env,
            CINEMATIC_ASSET_OUTPUT_DIR: join(fixture, "output"),
          },
          stdio: ["ignore", "ignore", "pipe"],
        });
        child.stderr?.on("data", (chunk) => {
          stderr += String(chunk);
        });
        const completion = new Promise<number | null>((resolveCompletion) => {
          child?.once("close", resolveCompletion);
        });

        await waitForStagingDirectory(fixture, child, () => stderr);
        renameSync(
          swapPath,
          join(fixture, "public/images/logo-trinkgut-jammers.png"),
        );

        const exitCode = await completion;
        if (exitCode !== 0) {
          throw new Error(`Fixture build failed (${exitCode}): ${stderr}`);
        }

        expect(sha256(join(fixture, "output/og-home.jpg"))).toBe(
          sha256(join(output, "og-home.jpg")),
        );
      } finally {
        if (child?.exitCode === null) child.kill();
        rmSync(fixture, { recursive: true, force: true });
      }
    },
    15_000,
  );
});
