import sharp from "sharp";
const source = process.argv[2];
if (!source) throw new Error("Logo-Quelldatei als Argument angeben.");
await sharp(source).rotate().resize({width: 520, withoutEnlargement: true}).webp({quality: 90}).toFile("public/images/home/brand-logo.webp");
