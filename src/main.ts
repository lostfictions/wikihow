import { tmpdir } from "os";
import { join } from "path";
import { createWriteStream } from "fs";
import { setTimeout } from "timers/promises";
import { twoot } from "twoot";
import { captureException } from "@sentry/node";

import { makeStatus } from "./generate";

import {
  MASTODON_SERVER,
  MASTODON_SERVER_ORIG,
  MASTODON_TOKEN,
  MASTODON_TOKEN_ORIG,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
} from "./env";

export const tmp = tmpdir();
export let tmpFileCounter = 0;

async function main() {
  const { title, titleOrig, canvas } = await makeStatus();

  const buffer = canvas.toBuffer();

  const results = await Promise.allSettled([
    twoot(
      {
        status: title,
        media: [{ buffer }],
      },
      [
        {
          type: "mastodon",
          server: MASTODON_SERVER,
          token: MASTODON_TOKEN,
        },
        {
          type: "twitter",
          apiKey: TWITTER_API_KEY,
          apiSecret: TWITTER_API_SECRET,
          accessToken: TWITTER_ACCESS_TOKEN,
          accessSecret: TWITTER_ACCESS_SECRET,
        },
      ]
    ),
    twoot(
      {
        status: titleOrig,
        media: [{ buffer }],
      },
      [
        {
          type: "mastodon",
          server: MASTODON_SERVER_ORIG,
          token: MASTODON_TOKEN_ORIG,
        },
      ]
    ),
  ]);

  const errors = results.filter((r) => r.status === "rejected");
  if (errors.length > 0) {
    throw new Error(
      `${errors.length} failure(s) when twooting:\n\n${errors
        .map((r, i) => `${i}. ${String((r as PromiseRejectedResult).reason)}`)
        .join("\n\n")}\n`
    );
  }
}

const argv = process.argv.slice(2);

if (argv.includes("local")) {
  console.log("Running locally!");
  const createAndSave = async () => {
    const { title, titleOrig, canvas } = await makeStatus();

    const filename = join(tmp, `wikibot_${tmpFileCounter++}.png`);
    const ws = createWriteStream(filename);
    canvas.createPNGStream().pipe(ws);
    await new Promise<string>((res, rej) => {
      ws.on("finish", res);
      ws.on("error", rej);
    });

    console.log(`"${title}"\n(Original: "${titleOrig}")\nfile://${filename}\n`);
    await setTimeout(1000);
    void createAndSave();
  };
  void createAndSave();
} else {
  void main()
    .then(() => process.exit(0))
    .catch((e) => captureException(e));
}
