# Down Memory Lane — Solution Overview

Content for the Google Doc/Slides deliverable. Written in presenter-note style —
each `##` is a slide, bullets are the on-slide content, and the paragraph below
each is speaker notes for the video walkthrough.

---

## 1. The problem

InspireWorks wants a Slack-native way for users to generate realistic photos of
their own childhood — for storytelling, memory sharing, and creative/educational
use — from a simple text description.

Speaker notes: frame this as a narrow, well-scoped feature — not a general image
generator, but one that reliably reproduces *the same person's* likeness at
different ages/settings on request.

## 2. Bot flow overview

1. User mentions the bot (or DMs it) in Slack with a description: *"your
   5-year-old self on a beach."*
2. Bot acknowledges in-thread and parses the request into an age + setting.
3. Bot builds a generation prompt that includes the user's trained identity
   token plus the requested age/setting, and calls the trained model.
4. Bot posts the resulting image back into the same thread as a reply.

Speaker notes: emphasize the "same thread" requirement — every reply is
threaded off the original request so multiple requests in a channel don't get
their outputs crossed.

## 3. High-level architecture & integrations

- **Slack** (Bolt SDK, Socket Mode) — event ingestion (`app_mention`,
  `message.im`) and output delivery (`chat.postMessage` with an image block).
  Socket Mode avoids needing a public endpoint for a prototype.
- **Replicate** — hosts both the one-time LoRA training job and the
  inference call for each generation request.
  - *Training*: `ostris/flux-dev-lora-trainer` fine-tunes Flux on ~20
    reference photos, producing a private model version tied to a trigger
    word.
  - *Inference*: each Slack request runs a prediction against that trained
    version.
- **Bot process** (Node.js) — the glue: receives Slack events, shapes prompts,
  calls Replicate, relays the result back.

Speaker notes: call out that training and inference are decoupled — training
happens once (offline, ahead of time), inference happens per-request. That
separation is why the bot can respond in ~15-30s instead of tens of minutes.

## 4. Data flow and processing logic

```
Slack message                     Bot process                         Replicate
──────────────                    ───────────                         ─────────
"your 5-year-old   ──event──▶     parse age + setting
 self on a beach"                 build prompt:
                                   "A candid, realistic
                                    photo of TOK as a
                                    5-year-old child, on
                                    a beach, ..."           ──predict──▶  run trained
                                                                          LoRA version
                                   receive image URL        ◀──result──  return image
              ◀──chat.postMessage──
 image posted in same thread
```

Processing logic detail:

1. **Parsing** — a lightweight heuristic pulls an age (`\d+ year(s) old`
   pattern) and a setting (text after "in"/"on"/"at") out of the free-text
   request. If parsing fails, the raw text is passed through as-is rather than
   blocking the request.
2. **Prompt construction** — every generated prompt includes the LoRA's
   trigger word (e.g. `TOK`), since that's what invokes the fine-tuned identity
   rather than a generic face.
3. **Generation** — a single synchronous Replicate prediction call against the
   trained model version; the bot posts a "generating..." placeholder
   immediately so the thread doesn't look stalled during the ~15-30s wait.
4. **Delivery** — the resulting image URL is posted back via an `image` block
   in a threaded reply, keeping multi-request channels legible.

Speaker notes: this is the part to walk through slowly on camera — show an
actual Slack thread with a request, the "generating..." placeholder, and the
final image landing in-thread.

## 5. What's out of scope for this prototype

- Robust NLU (multi-clause requests, negation, style modifiers) — current
  parsing is a simple heuristic.
- Moderation/rate limiting on generation requests.
- Multi-tenant support (one trained LoRA per user would require per-user model
  namespacing and access control).

Speaker notes: naming these explicitly shows scoping judgment — useful for
executive presence in the walkthrough.
