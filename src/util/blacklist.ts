export function getBlacklist() {
  const badwords: string[] = require("wordfilter/lib/badwords.json");

  const extras = [
    "aids",
    "asperger'?s?",
    "autis\\w+",
    "abortions?",
    "suicides?",
    "self harm\\w*",
    "self-harm\\w*",
    "scars?",
    "kill yourself",
    "kill himself",
    "kill herself",
    "kill themsel\\w+",
    "miscarriages?",
    "cancer\\w*",
    "tumou?rs?",
    "black music",
    "blind people",
    "blind person",
    "molest\\w*",
    "abus\\w+",
    "assault\\w*",
    "rape",
    "rapists?",
    "schizo",
    "injection",
    "suppositor\\w+",
    "genital\\w*",
    "penis",
    "vagina\\w*",
    "clitor\\w+",
    "testic\\w+",
    "bladder",
    "prostate",
    "sphincter",
    "prolapse",
    "rectum",
    "trichomoniasis",
    "urin\\w+",
    "UTI",
    "yeast infection",
    "pubic",
    "pube\\w*",
  ];

  // words from the badwords list might be pluralized, etc.
  const words = badwords.map((word) => `${word}\\w*`).concat(extras);

  const joined = [...new Set(words)].join("|");

  return new RegExp(`\\b(?:${joined})\\b`, "i");
}
