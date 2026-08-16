// One-time training job: fine-tunes a Flux LoRA on the photos in
// training-images.zip (run `npm run zip-training-images` first) and prints
// the resulting model version string to paste into .env as LORA_MODEL_VERSION.
//
// Usage: npm run train
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Replicate = require("replicate");

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const TRAINER_OWNER = "ostris";
const TRAINER_MODEL = "flux-dev-lora-trainer";
const TRAINER_VERSION = "d995297071a44dcb72244e6c19462111649ec86a9646c32df56daa7f14e5f61";

async function ensureDestinationModel(owner, name) {
  try {
    return await replicate.models.get(owner, name);
  } catch (err) {
    console.log(`Destination model ${owner}/${name} not found, creating it...`);
    return replicate.models.create(owner, name, {
      visibility: "private",
      hardware: "gpu-a100-large",
    });
  }
}

async function main() {
  const zipPath = path.join(__dirname, "..", "training-images.zip");
  if (!fs.existsSync(zipPath)) {
    console.error(
      "training-images.zip not found. Add ~20 photos to training-images/ and run `npm run zip-training-images` first."
    );
    process.exit(1);
  }

  const owner = process.env.REPLICATE_USERNAME;
  const name = process.env.LORA_MODEL_NAME || "down-memory-lane-lora";
  const triggerWord = process.env.LORA_TRIGGER_WORD || "TOK";

  if (!owner) {
    console.error("Set REPLICATE_USERNAME in .env first.");
    process.exit(1);
  }

  await ensureDestinationModel(owner, name);

  console.log(`Starting training: destination=${owner}/${name}, trigger_word=${triggerWord}`);

  const training = await replicate.trainings.create(TRAINER_OWNER, TRAINER_MODEL, TRAINER_VERSION, {
    destination: `${owner}/${name}`,
    input: {
      input_images: fs.createReadStream(zipPath),
      trigger_word: triggerWord,
      steps: 1000,
    },
  });

  console.log(`Training started: ${training.id}`);
  console.log(`Track progress at: https://replicate.com/p/${training.id}`);
  console.log("Polling until it completes (this typically takes 15-30 minutes)...");

  let status = training.status;
  let latest = training;
  while (status === "starting" || status === "processing") {
    await new Promise((r) => setTimeout(r, 15000));
    latest = await replicate.trainings.get(training.id);
    status = latest.status;
    console.log(`  status: ${status}`);
  }

  if (status !== "succeeded") {
    console.error(`Training ended with status "${status}". Check the Replicate dashboard for logs.`);
    process.exit(1);
  }

  const version = latest.output.version;
  console.log("\nTraining succeeded.");
  console.log(`Set this in .env:\nLORA_MODEL_VERSION=${version}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
