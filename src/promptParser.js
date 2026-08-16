const AGE_PATTERN = /(\d{1,2})[\s-]*(?:year|yr)s?[\s-]*old/i;

// Heuristic setting extraction: everything after "in"/"on"/"at" once the age
// clause has been stripped out. Good enough for the assignment's example
// phrasing ("your 5-year-old self on a beach"); falls back to the raw text
// for anything it can't parse cleanly.
function parseChildhoodPhotoRequest(rawText) {
  const text = rawText.replace(/<@[^>]+>/g, "").trim();

  const ageMatch = text.match(AGE_PATTERN);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

  const settingMatch = text.match(/\b((?:in|on|at)\s+.+)$/i);
  const setting = settingMatch ? settingMatch[1].trim().replace(/[.!?]+$/, "") : null;

  return {
    age,
    setting,
    raw: text,
  };
}

function buildGenerationPrompt({ age, setting, raw }, triggerWord) {
  if (age && setting) {
    return `A candid, realistic photo of ${triggerWord} as a ${age}-year-old child, ${setting}, natural lighting, film photography, high detail`;
  }
  // Parsing failed — pass the trigger word plus the raw request straight through
  return `A candid, realistic photo of ${triggerWord}, ${raw}, natural lighting, film photography, high detail`;
}

module.exports = { parseChildhoodPhotoRequest, buildGenerationPrompt };
