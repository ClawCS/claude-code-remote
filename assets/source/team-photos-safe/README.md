# Approved team image sources

These lossless PNG copies contain the same decoded, naturally coloured sRGB pixels as the approved team exports. EXIF, XMP, IPTC and ICC metadata have been removed for use in this public repository. No account identities, signed URLs or private Canva documents are included.

The connected Canva pool was checked visually on 30 September 2026. Niko approved its use for the Jammers website. Thirteen motifs were matched: eleven individual portraits, one group image and the Sven/Niko duo. Henri and Hannah were additionally confirmed by Niko as belonging to the current team; Hanna and Hannah are separate people. Excluded former employees are not used in website content. The private original-export hashes and source identities remain in a local, ignored evidence archive.

`scripts/build-cinematic-assets.mjs` pins each published source hash, original dimensions and exact crop. `npm run assets:cinematic:check` regenerates all seventeen web derivatives and checks byte equality. Switching the inputs to these stripped, lossless copies leaves every existing web derivative byte-identical.

The portraits serve the team rubric, the group introduces the team and the duo introduces the market. The gallery does not infer a current employee count or further roles from image counts or decorative slogans.
