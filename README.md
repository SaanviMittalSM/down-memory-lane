# Down Memory Lane

A Slack bot that generates realistic childhood photos of a specific person on
request — e.g. "your 5-year-old self on a beach" — using a personal Flux LoRA
model trained on Replicate.

## How it works

1. **Train once**: fine-tune a Flux LoRA model on ~20 personal reference photos.
2. **Ask in Slack**: mention the bot or DM it with a description ("your 2-year-old
   self in your house's backyard").
3. **Generate**: the bot builds a prompt around the trained identity and runs it
   against the trained LoRA model on Replicate.
4. **Reply in-thread**: the generated image is posted back to the same Slack
   thread.

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Create a Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch.
2. **Socket Mode**: enable it (Settings → Socket Mode), generate an app-level
   token with the `connections:write` scope → this is `SLACK_APP_TOKEN`.
3. **OAuth & Permissions**: add bot scopes `chat:write`, `im:history`,
   `channels:history`, `app_mentions:read`, `files:write`. Install the app to
   your workspace → copy the Bot User OAuth Token → this is `SLACK_BOT_TOKEN`.
4. **Event Subscriptions**: enable, and subscribe to bot events `app_mention`
   and `message.im`.
5. **Basic Information**: copy the Signing Secret → `SLACK_SIGNING_SECRET`.
6. Invite the bot to a channel (`/invite @Down Memory Lane`), or just DM it.

### 3. Set up Replicate

1. Create an account at [replicate.com](https://replicate.com) and grab an API
   token from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens).
2. Copy `.env.example` to `.env` and fill in `REPLICATE_API_TOKEN` and
   `REPLICATE_USERNAME`.

### 4. Train the LoRA model

1. Drop ~20 photos of yourself (alone, varied settings/angles/lighting) into
   `training-images/`.
2. `npm run zip-training-images`
3. `npm run train` — this kicks off a Flux LoRA training job on Replicate
   (typically 15-30 min) and prints a version string when done.
4. Paste that version string into `.env` as `LORA_MODEL_VERSION`.

### 5. Run the bot

```
npm start
```

Then in Slack: `@Down Memory Lane your 10-year-old self in a classroom`

## Project structure

```
src/
  app.js              Slack Bolt app (Socket Mode) — event listeners, thread replies
  replicateClient.js   Wraps the Replicate prediction call against the trained LoRA
  promptParser.js       Extracts age/setting from free text, builds the generation prompt
scripts/
  train-lora.js         One-time Flux LoRA training job
  zip-training-images.js Zips training-images/ for the training job
docs/
  architecture.md       Bot flow, architecture, and data flow write-up
```

## Notes

- This is a prototype: prompt parsing is a simple heuristic (age + setting from
  free text), not a full NLU layer.
- Training photos are never committed to this repo (see `.gitignore`) — they're
  personal biometric data.
