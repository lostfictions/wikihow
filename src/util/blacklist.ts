export function getBlacklist() {
  const badwords: string[] = require("wordfilter/lib/badwords.json");

  const extras = [
    "aids",
    "austis\\w+",
    "abortions?",
    "suicides?",
    "kill yourself",
    "kill himself",
    "kill herself",
    "kill themsel\\w+",
    "miscarriages?",
    "cancers?",
    "tumou?rs?",
    "black music",
    "blind people",
    "blind person"
  ];

  // words from the badwords list might be pluralized, etc.
  const words = badwords.map(word => `${word}\\w*`).concat(extras);

  const joined = [...new Set(words)].join("|");

  return new RegExp(`\\b(?:${joined})\\b`, "i");
}
