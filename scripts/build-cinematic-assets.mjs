import { createHash, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const DEFAULT_OUTPUT_DIR = resolve(
  PROJECT_ROOT,
  "public/images/home/cinematic",
);
const OUTPUT_DIR = resolve(
  process.env.CINEMATIC_ASSET_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR,
);
const CHECK_MODE = process.argv.slice(2).includes("--check");

const PALETTE = Object.freeze({
  yellow: "#FEE005",
  red: "#E20F1D",
  blue: "#0086C8",
  gray: "#414045",
  black: "#000000",
  white: "#FFFFFF",
});

function deepFreeze(value) {
  for (const entry of Object.values(value)) {
    if (typeof entry === "object" && entry !== null && !Object.isFrozen(entry)) {
      deepFreeze(entry);
    }
  }
  return Object.freeze(value);
}

const JOBS = deepFreeze([
  {
    id: "hero",
    kind: "team",
    source: "public/images/gallery/team-sven-niko.jpg",
    sourceHash:
      "c00d3e0e3b4b12b3a639322acf1cbfa653a08b59f4de3b8e7617f798ade3a908",
    sourceDimensions: { width: 1350, height: 1688 },
    crop: { left: 217, top: 383, width: 915, height: 803 },
    output: {
      name: "hero-team.webp",
      format: "webp",
      width: 915,
      height: 803,
      maxBytes: 100_000,
    },
  },
  {
    id: "group",
    kind: "team",
    source: "public/images/gallery/team-gruppenfoto.jpg",
    sourceHash:
      "56b8dd3d1bb23c710f4c8ab3ff5cb25acbdc23363c49fcba7e59b0eb86c726d3",
    sourceDimensions: { width: 1350, height: 1688 },
    crop: { left: 200, top: 350, width: 950, height: 840 },
    output: {
      name: "team-group.webp",
      format: "webp",
      width: 950,
      height: 840,
      maxBytes: 100_000,
    },
  },
  {
    id: "niko",
    kind: "team",
    source: "public/images/gallery/team-niko.jpg",
    sourceHash:
      "ce5bc792792a4ea767a52cce59e1c24edea3b25307462b0fab2c82cd9c1ea889",
    sourceDimensions: { width: 1080, height: 1350 },
    crop: { left: 146, top: 220, width: 745, height: 727 },
    output: {
      name: "team-niko.webp",
      format: "webp",
      width: 745,
      height: 727,
      maxBytes: 60_000,
    },
  },
  {
    id: "jasmin",
    kind: "team",
    source: "public/images/gallery/team-jasmin.jpg",
    sourceHash:
      "f4abdade990528506045f32f35b59868e486abb236813b11ffcfc0a7beff0846",
    sourceDimensions: { width: 1080, height: 1350 },
    crop: { left: 146, top: 231, width: 756, height: 718 },
    output: {
      name: "team-jasmin.webp",
      format: "webp",
      width: 756,
      height: 718,
      maxBytes: 90_000,
    },
  },
  {
    id: "gabriella",
    kind: "team",
    source: "public/images/gallery/team-gabriella.jpg",
    sourceHash:
      "fc750f2e676888a79b426e05b35f84d20743ff5b3957411a1bf3892a6a159fdf",
    sourceDimensions: { width: 1080, height: 1350 },
    crop: { left: 145, top: 242, width: 762, height: 711 },
    output: {
      name: "team-gabriella.webp",
      format: "webp",
      width: 762,
      height: 711,
      maxBytes: 70_000,
    },
  },
  {
    id: "pralle-kirsche",
    kind: "poster",
    source: "public/images/eigenmarken/pralle-kirsche.png",
    sourceHash:
      "6b7d52284a6543a4c8a6922effa296b74e8ca8025db4549bc83c558f6904e694",
    sourceDimensions: { width: 1054, height: 1493 },
    crop: null,
    output: {
      name: "poster-pralle-kirsche.webp",
      format: "webp",
      width: 1054,
      height: 1493,
      maxBytes: 230_000,
    },
  },
  {
    id: "schwarzer-teufel",
    kind: "poster",
    source: "public/images/eigenmarken/schwarzer-teufel.png",
    sourceHash:
      "349bd8ca7c6912987857a1c76a97eb8fe45ac9093cf1fa233239687f1166dbdc",
    sourceDimensions: { width: 1054, height: 1492 },
    crop: null,
    output: {
      name: "poster-schwarzer-teufel.webp",
      format: "webp",
      width: 1054,
      height: 1492,
      maxBytes: 230_000,
    },
  },
  {
    id: "caramello",
    kind: "poster",
    source: "public/images/eigenmarken/caramello.png",
    sourceHash:
      "9a1b89a5f3156981913561f0901f1f03c65f341ea4c1047d11d0b913db7b93dd",
    sourceDimensions: { width: 1054, height: 1493 },
    crop: null,
    output: {
      name: "poster-caramello.webp",
      format: "webp",
      width: 1054,
      height: 1493,
      maxBytes: 230_000,
    },
  },
  {
    id: "og",
    kind: "og",
    source: "public/images/logo-trinkgut-jammers.png",
    sourceHash:
      "275dbc9364073ca251933729218228bc661cc5f581fbd5a2107129bc69da09fb",
    sourceDimensions: { width: 828, height: 324 },
    crop: null,
    compositionSourceId: "hero",
    output: {
      name: "og-home.jpg",
      format: "jpeg",
      width: 1200,
      height: 630,
      maxBytes: 160_000,
    },
  },
]);

const EXPECTED_OUTPUTS = Object.freeze(
  JOBS.map(({ output }) => output.name).sort(),
);

function sourcePath(job) {
  return resolve(PROJECT_ROOT, job.source);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function validateSources() {
  const validatedSources = Object.create(null);

  for (const job of JOBS) {
    if (Object.hasOwn(validatedSources, job.id)) {
      throw new Error(`Duplicate Cinematic source id: ${job.id}`);
    }

    const file = sourcePath(job);
    const bytes = await readFile(file);
    if (sha256(bytes) !== job.sourceHash) {
      throw new Error(`Source hash mismatch: ${job.source}`);
    }

    const metadata = await sharp(bytes).metadata();
    if (
      metadata.width !== job.sourceDimensions.width ||
      metadata.height !== job.sourceDimensions.height
    ) {
      throw new Error(`Source dimensions mismatch: ${job.source}`);
    }

    Object.defineProperty(validatedSources, job.id, {
      value: bytes,
      enumerable: true,
      configurable: false,
      writable: false,
    });
  }

  return Object.freeze(validatedSources);
}

function validatedSource(validatedSources, jobId) {
  if (!Object.hasOwn(validatedSources, jobId)) {
    throw new Error(`Missing validated Cinematic source: ${jobId}`);
  }
  return validatedSources[jobId];
}

async function buildTeam(job, destination, validatedSources) {
  await sharp(validatedSource(validatedSources, job.id))
    .rotate()
    .extract(job.crop)
    .toColourspace("srgb")
    .modulate({ brightness: 0.82, saturation: 0.92 })
    .webp({ quality: 82, effort: 6 })
    .toFile(destination);
}

async function buildPoster(job, destination, validatedSources) {
  await sharp(validatedSource(validatedSources, job.id))
    .rotate()
    .toColourspace("srgb")
    .webp({ quality: 82, effort: 6 })
    .toFile(destination);
}

const GLYPHS = deepFreeze({
  G: ["11111", "10000", "10000", "10111", "10001", "10001", "11111"],
  O: ["11111", "10001", "10001", "10001", "10001", "10001", "11111"],
  C: ["11111", "10000", "10000", "10000", "10000", "10000", "11111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  S: ["11111", "10000", "10000", "11111", "00001", "00001", "11111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  N: ["10001", "11001", "11001", "10101", "10011", "10011", "10001"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
});

function rectangleWord(word, x, y, unit, color) {
  const step = unit + 2;
  const characterAdvance = step * 5 + unit;
  const rectangles = [];

  for (const [characterIndex, character] of [...word].entries()) {
    const glyph = GLYPHS[character];
    if (!glyph) throw new Error(`Unsupported OG glyph: ${character}`);

    for (const [row, pixels] of glyph.entries()) {
      for (const [column, pixel] of [...pixels].entries()) {
        if (pixel === "1") {
          rectangles.push(
            `<rect x="${x + characterIndex * characterAdvance + column * step}" y="${y + row * step}" width="${unit}" height="${unit}" fill="${color}"/>`,
          );
        }
      }
    }
  }

  return rectangles.join("");
}

function ogOverlay() {
  return Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0H606L548 630H0Z" fill="${PALETTE.black}"/>
      <path d="M594 0H626L568 630H536Z" fill="${PALETTE.yellow}"/>
      <rect x="1114" y="0" width="86" height="160" fill="${PALETTE.red}"/>
      <rect x="58" y="238" width="474" height="8" fill="${PALETTE.yellow}"/>
      ${rectangleWord("GOCH", 58, 274, 12, PALETTE.yellow)}
      ${rectangleWord("SCHENKT", 58, 377, 9, PALETTE.white)}
      ${rectangleWord("EIN.", 58, 476, 12, PALETTE.white)}
      <rect x="58" y="587" width="190" height="12" fill="${PALETTE.red}"/>
      <rect x="258" y="587" width="274" height="12" fill="${PALETTE.yellow}"/>
    </svg>
  `);
}

async function buildOg(job, destination, validatedSources) {
  const heroJob = JOBS.find(({ id }) => id === job.compositionSourceId);
  if (!heroJob?.crop) throw new Error("OG composition source is invalid");

  const hero = await sharp(validatedSource(validatedSources, heroJob.id))
    .rotate()
    .extract(heroJob.crop)
    .resize({ width: 680, height: 630, fit: "cover", position: "centre" })
    .toColourspace("srgb")
    .modulate({ brightness: 0.62, saturation: 0.92 })
    .png()
    .toBuffer();

  const logo = await sharp(validatedSource(validatedSources, job.id))
    .rotate()
    .resize({ width: 410, withoutEnlargement: true })
    .toColourspace("srgb")
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: job.output.width,
      height: job.output.height,
      channels: 3,
      background: PALETTE.black,
    },
  })
    .composite([
      { input: hero, left: 520, top: 0 },
      { input: ogOverlay(), left: 0, top: 0 },
      { input: logo, left: 58, top: 48 },
    ])
    .toColourspace("srgb")
    .jpeg({ quality: 84, chromaSubsampling: "4:2:0", mozjpeg: false })
    .toFile(destination);
}

async function buildInto(stagingDirectory, validatedSources) {
  for (const job of JOBS) {
    const destination = join(stagingDirectory, job.output.name);
    if (job.kind === "team") {
      await buildTeam(job, destination, validatedSources);
    } else if (job.kind === "poster") {
      await buildPoster(job, destination, validatedSources);
    } else if (job.kind === "og") {
      await buildOg(job, destination, validatedSources);
    } else {
      throw new Error(`Unsupported Cinematic job: ${job.id}`);
    }
  }
}

async function validateOutputs(directory) {
  const names = (await readdir(directory)).sort();
  if (JSON.stringify(names) !== JSON.stringify(EXPECTED_OUTPUTS)) {
    throw new Error(`Unexpected Cinematic output allowlist: ${names.join(", ")}`);
  }

  for (const job of JOBS) {
    const file = join(directory, job.output.name);
    const bytes = await readFile(file);
    const metadata = await sharp(bytes).metadata();
    if (
      metadata.format !== job.output.format ||
      metadata.width !== job.output.width ||
      metadata.height !== job.output.height
    ) {
      throw new Error(`Output dimensions or format mismatch: ${job.output.name}`);
    }
    if (metadata.exif || metadata.xmp || metadata.icc) {
      throw new Error(`Output metadata was not stripped: ${job.output.name}`);
    }
    if (bytes.byteLength >= job.output.maxBytes) {
      throw new Error(`Output exceeds byte budget: ${job.output.name}`);
    }
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function compareWithTarget(stagingDirectory) {
  if (!(await exists(OUTPUT_DIR))) {
    throw new Error(`Cinematic output directory is missing: ${OUTPUT_DIR}`);
  }

  const targetNames = (await readdir(OUTPUT_DIR)).sort();
  if (JSON.stringify(targetNames) !== JSON.stringify(EXPECTED_OUTPUTS)) {
    throw new Error("Cinematic output allowlist drift detected");
  }

  for (const name of EXPECTED_OUTPUTS) {
    const [built, committed] = await Promise.all([
      readFile(join(stagingDirectory, name)),
      readFile(join(OUTPUT_DIR, name)),
    ]);
    if (!built.equals(committed)) {
      throw new Error(`Cinematic asset drift detected: ${name}`);
    }
  }
}

async function replaceTarget(stagingDirectory) {
  const backup = join(
    dirname(OUTPUT_DIR),
    `.${basename(OUTPUT_DIR)}.backup-${randomUUID()}`,
  );
  const hadTarget = await exists(OUTPUT_DIR);
  let installed = false;

  try {
    if (hadTarget) await rename(OUTPUT_DIR, backup);
    await rename(stagingDirectory, OUTPUT_DIR);
    installed = true;
    if (hadTarget) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (installed && (await exists(OUTPUT_DIR))) {
      await rm(OUTPUT_DIR, { recursive: true, force: true });
    }
    if (hadTarget && (await exists(backup)) && !(await exists(OUTPUT_DIR))) {
      await rename(backup, OUTPUT_DIR);
    }
    throw error;
  }
}

async function main() {
  const validatedSources = await validateSources();

  const outputParent = dirname(OUTPUT_DIR);
  await mkdir(outputParent, { recursive: true });
  const stagingDirectory = await mkdtemp(
    join(outputParent, `.${basename(OUTPUT_DIR)}.staging-`),
  );

  try {
    await buildInto(stagingDirectory, validatedSources);
    await validateOutputs(stagingDirectory);

    if (CHECK_MODE) {
      await compareWithTarget(stagingDirectory);
      console.log(`Checked ${JOBS.length} Cinematic assets in ${OUTPUT_DIR}`);
      return;
    }

    await replaceTarget(stagingDirectory);
    console.log(`Built ${JOBS.length} Cinematic assets in ${OUTPUT_DIR}`);
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}

await main();
