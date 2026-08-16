// Zips everything in training-images/ into training-images.zip so it can be
// handed to the Replicate training job as a single input_images file.
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const sourceDir = path.join(__dirname, "..", "training-images");
const outputPath = path.join(__dirname, "..", "training-images.zip");

const imageFiles = fs
  .readdirSync(sourceDir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

if (imageFiles.length < 10) {
  console.warn(
    `Warning: only found ${imageFiles.length} images in training-images/. ` +
      "The assignment recommends ~20 photos of yourself, alone, in varied settings."
  );
}

const output = fs.createWriteStream(outputPath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`Wrote ${outputPath} (${archive.pointer()} bytes, ${imageFiles.length} images)`);
});
archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);
for (const file of imageFiles) {
  archive.file(path.join(sourceDir, file), { name: file });
}
archive.finalize();
