require("dotenv").config();
const { App, LogLevel } = require("@slack/bolt");
const { generateChildhoodPhoto } = require("./replicateClient");
const { parseChildhoodPhotoRequest, buildGenerationPrompt } = require("./promptParser");

const triggerWord = process.env.LORA_TRIGGER_WORD || "TOK";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  logLevel: LogLevel.INFO,
});

async function handlePhotoRequest({ text, channel, threadTs, say }) {
  const parsed = parseChildhoodPhotoRequest(text);
  const prompt = buildGenerationPrompt(parsed, triggerWord);

  await say({
    text: `Got it — generating "${parsed.raw}" now, this usually takes 15-30s...`,
    thread_ts: threadTs,
  });

  try {
    const imageUrl = await generateChildhoodPhoto(prompt);

    await app.client.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text: `Here's your photo: ${parsed.raw}`,
      blocks: [
        {
          type: "image",
          image_url: imageUrl,
          alt_text: parsed.raw,
        },
      ],
    });
  } catch (err) {
    console.error("Generation failed:", err);
    await say({
      text: `Sorry, that generation failed: ${err.message}`,
      thread_ts: threadTs,
    });
  }
}

// Mention the bot in a channel: "@DownMemoryLane your 5-year-old self on a beach"
app.event("app_mention", async ({ event, say }) => {
  await handlePhotoRequest({
    text: event.text,
    channel: event.channel,
    threadTs: event.thread_ts || event.ts,
    say,
  });
});

// DM the bot directly
app.message(async ({ message, say }) => {
  if (message.subtype || message.bot_id) return; // ignore bot/edited/etc messages
  await handlePhotoRequest({
    text: message.text,
    channel: message.channel,
    threadTs: message.thread_ts || message.ts,
    say,
  });
});

(async () => {
  await app.start();
  console.log("Down Memory Lane bot is running (Socket Mode)");
})();
