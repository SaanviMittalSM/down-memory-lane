const Replicate = require("replicate");

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// process.env.LORA_MODEL_VERSION is expected in "owner/model:version" form,
// printed by scripts/train-lora.js once training completes.
async function generateChildhoodPhoto(prompt) {
  const modelVersion = process.env.LORA_MODEL_VERSION;
  if (!modelVersion) {
    throw new Error(
      "LORA_MODEL_VERSION is not set — train the model first with `npm run train`, " +
        "then copy the printed version string into .env"
    );
  }

  const output = await replicate.run(modelVersion, {
    input: {
      prompt,
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "png",
      guidance_scale: 3.5,
      num_inference_steps: 28,
    },
  });

  // replicate.run() resolves to an array of output URLs (or file objects,
  // depending on SDK version) for image models
  const first = Array.isArray(output) ? output[0] : output;
  return typeof first === "string" ? first : first.url();
}

module.exports = { replicate, generateChildhoodPhoto };
