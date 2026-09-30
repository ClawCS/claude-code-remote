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
  { name: "hero-team.webp", format: "webp", width: 915, height: 886, maxBytes: 110_000 },
  { name: "team-group.webp", format: "webp", width: 900, height: 875, maxBytes: 100_000 },
  { name: "team-niko.webp", format: "webp", width: 745, height: 727, maxBytes: 60_000 },
  { name: "team-jasmin.webp", format: "webp", width: 756, height: 718, maxBytes: 90_000 },
  { name: "team-gabriella.webp", format: "webp", width: 762, height: 711, maxBytes: 70_000 },
  { name: "team-sven.webp", format: "webp", width: 715, height: 685, maxBytes: 100_000 },
  { name: "team-jan-niklas.webp", format: "webp", width: 710, height: 570, maxBytes: 100_000 },
  { name: "team-tim.webp", format: "webp", width: 865, height: 705, maxBytes: 100_000 },
  { name: "team-henri.webp", format: "webp", width: 570, height: 660, maxBytes: 100_000 },
  { name: "team-hannah.webp", format: "webp", width: 720, height: 610, maxBytes: 100_000 },
  { name: "team-hanna.webp", format: "webp", width: 710, height: 650, maxBytes: 100_000 },
  { name: "team-nico.webp", format: "webp", width: 710, height: 600, maxBytes: 100_000 },
  { name: "team-nils.webp", format: "webp", width: 725, height: 650, maxBytes: 100_000 },
  { name: "poster-pralle-kirsche.webp", format: "webp", width: 1054, height: 1493, maxBytes: 230_000 },
  { name: "poster-schwarzer-teufel.webp", format: "webp", width: 1054, height: 1492, maxBytes: 230_000 },
  { name: "poster-caramello.webp", format: "webp", width: 1054, height: 1493, maxBytes: 230_000 },
  { name: "og-home.jpg", format: "jpeg", width: 1200, height: 630, maxBytes: 160_000 },
] as const;

const sources = [
  { path: "assets/source/team-photos-safe/team-henri.png", width: 1152, height: 1440, hash: "92aa019a6067445ac2258f85397dfd4364079c15c0e66881e2f00093eb5736ca" },
  { path: "assets/source/team-photos-safe/team-hannah.png", width: 1152, height: 1440, hash: "f902ca551af79913b4318b96f30600cec1c6127c99905b9d788f198c43142af8" },
  {
    path: "assets/source/team-photos-safe/team-sven-niko.png",
    width: 1350,
    height: 1688,
    hash: "cd32797376d133ca1544f3a66e1e240cffdbf6484c06888075f48c8deb6feaf6",
  },
  {
    path: "assets/source/team-photos-safe/team-gruppenfoto.png",
    width: 1350,
    height: 1688,
    hash: "6eb83b4342e9b5740a4af4faf2bff25a1fcdd5213ca13219bea7a9982e19a8bd",
  },
  {
    path: "assets/source/team-photos-safe/team-niko.png",
    width: 1080,
    height: 1350,
    hash: "ab1fb06687cd65ef5a5ff216f886da97d4cfc6aaa7aa9181e9f5d0d5d740065a",
  },
  {
    path: "assets/source/team-photos-safe/team-jasmin.png",
    width: 1080,
    height: 1350,
    hash: "56268447c25694e8b87828f76d2b24fa569aff2a15b2f8d07588e4b1a8d6f587",
  },
  {
    path: "assets/source/team-photos-safe/team-gabriella.png",
    width: 1080,
    height: 1350,
    hash: "87e1605fea8c9004dec8db3e783457c658c8c9e8617123170892886dc5d9b3e5",
  },
  {
    path: "assets/source/team-photos-safe/team-sven.png", width: 1080, height: 1350,
    hash: "130c8c8ed2e6fe7a8a12df3682f782c662ac826476982cbec70b23c517a0aa94",
  },
  {
    path: "assets/source/team-photos-safe/team-jan-niklas.png", width: 1080, height: 1350,
    hash: "9c94e27a74750c6276f244f472e9dc2ddff17d6664e330d39ae0024c0a640ff7",
  },
  {
    path: "assets/source/team-photos-safe/team-tim.png", width: 1320, height: 1632,
    hash: "a3bb401aca73f96aadee0cb4d3f7a12f6ae7bab83ac0f3611ccae770f3c847d1",
  },
  {
    path: "assets/source/team-photos-safe/team-hanna.png", width: 1080, height: 1350,
    hash: "8df63a2a2ffd77f3f0f56f47dbbe28163b63fc13b06c6851514c2cad30c042b4",
  },
  {
    path: "assets/source/team-photos-safe/team-nico.png", width: 1080, height: 1350,
    hash: "c1bd5da8269d6f082324481153bd6cec294d9cf5f1c0c8b8fe6138a0a23299a9",
  },
  {
    path: "assets/source/team-photos-safe/team-nils.png", width: 1152, height: 1440,
    hash: "35b06c77a6918a63549bbc960443410a5d0d6e833f326a6993dba572386888a5",
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
  test("publishes only metadatenfreie team source copies to the public repository", async () => {
    for (const source of sources.filter(source => source.path.includes("team-"))) {
      const metadata = await sharp(resolve(source.path)).metadata();
      expect(metadata.exif, source.path).toBeUndefined();
      expect(metadata.xmp, source.path).toBeUndefined();
      expect(metadata.iptc, source.path).toBeUndefined();
      expect(metadata.icc, source.path).toBeUndefined();
    }
  });
  test("preserves natural source colours instead of artificially darkening the team", async () => {
    const croppedSource = await sharp(resolve("assets/source/team-photos-safe/team-niko.png"))
      .rotate().extract({ left: 146, top: 220, width: 745, height: 727 })
      .toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    const source = await sharp(croppedSource.data, { raw: croppedSource.info }).stats();
    const derivative = await sharp(join(output, "team-niko.webp")).stats();
    for (let channel = 0; channel < 3; channel++) {
      expect(Math.abs(source.channels[channel].mean - derivative.channels[channel].mean)).toBeLessThan(2);
    }
  });
  test("pins the deterministic Sharp toolchain and scripts", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    expect(packageJson.dependencies.sharp).toBe("0.35.5");
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

  test("keeps original price-list scans outside the public website root and source-bound", () => {
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
  }, 20_000);

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
